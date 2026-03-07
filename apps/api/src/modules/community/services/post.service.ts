import { QueryCommand, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { dynamo, COMMUNITY_POSTS_TABLE, COMMUNITY_LIKES_TABLE } from "../../../common/db/dynamo.js";
import type {
  CommunityPost,
  CommunityPostView,
  CommunityFeedResponse,
} from "../model/community.types.js";
import { randomUUID } from "crypto";
import { s3 } from "../../../common/storage/s3.js";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const FEED_PAGE_SIZE = 20;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const COMMUNITY_IMAGES_BUCKET =
  process.env.S3_BUCKET_COMMUNITY_POSTS ||
  process.env.S3_BUCKET_DAILY_SPECIALS ||
  process.env.CURATED_RECIPES_BUCKET ||
  "";

async function resolveImageUrl(post: CommunityPost): Promise<string | undefined> {
  if (!post.imageS3Key) return undefined;
  try {
    const command = new GetObjectCommand({
      Bucket: COMMUNITY_IMAGES_BUCKET,
      Key: post.imageS3Key,
    });
    return await getSignedUrl(s3, command, { expiresIn: 3600 });
  } catch {
    return undefined;
  }
}

function toPostView(post: CommunityPost): CommunityPostView {
  const { gsi1pk: _gsi1pk, gsi1sk: _gsi1sk, sk: _sk, ...rest } = post;
  return rest;
}

// ─── Score post for guest feed (recency + popularity) ────────────────────────

function scorePostForGuest(post: CommunityPost): number {
  const now = Date.now();
  const createdAt = new Date(post.createdAt).getTime();
  const ageHours = (now - createdAt) / (1000 * 60 * 60);

  // Decay recency over 48 hours
  const recencyScore = Math.max(0, 1 - ageHours / 48);
  const popularityScore = post.likeCount * 0.4 + post.commentCount * 0.2;

  return recencyScore * 0.6 + popularityScore * 0.4;
}

// ─── Check if user liked a post ───────────────────────────────────────────────

async function hasUserLikedPost(userId: string, postId: string): Promise<boolean> {
  try {
    const result = await dynamo.send(
      new GetCommand({
        TableName: COMMUNITY_LIKES_TABLE,
        Key: { postId, userId },
      }),
    );
    return !!result.Item;
  } catch {
    return false;
  }
}

// ─── Fetch global feed ────────────────────────────────────────────────────────

async function fetchGlobalFeed(cursor?: string): Promise<{
  posts: CommunityPost[];
  lastEvaluatedKey?: Record<string, unknown>;
}> {
  const result = await dynamo.send(
    new QueryCommand({
      TableName: COMMUNITY_POSTS_TABLE,
      IndexName: "gsi1-global-feed",
      KeyConditionExpression: "gsi1pk = :all",
      ExpressionAttributeValues: { ":all": "ALL" },
      ScanIndexForward: false,         // newest first
      Limit: FEED_PAGE_SIZE * 2,       // fetch extra for scoring headroom
      ...(cursor
        ? { ExclusiveStartKey: JSON.parse(Buffer.from(cursor, "base64").toString()) }
        : {}),
    }),
  );

  return {
    posts: (result.Items ?? []) as CommunityPost[],
    lastEvaluatedKey: result.LastEvaluatedKey as Record<string, unknown> | undefined,
  };
}

// ─── Get public feed (guest) ──────────────────────────────────────────────────

export async function getPublicFeed(cursor?: string): Promise<CommunityFeedResponse> {
  const { posts, lastEvaluatedKey } = await fetchGlobalFeed(cursor);

  // Resolve image URLs and score
  const scored = await Promise.all(
    posts.map(async (post) => {
      const resolvedUrl = await resolveImageUrl(post);
      return {
        post: { ...post, imageUrl: resolvedUrl ?? post.imageUrl },
        score: scorePostForGuest(post),
      };
    }),
  );

  // Sort by score
  scored.sort((a, b) => b.score - a.score);

  const postViews = scored
    .slice(0, FEED_PAGE_SIZE)
    .map(({ post }) => toPostView(post));

  const nextCursor = lastEvaluatedKey
    ? Buffer.from(JSON.stringify(lastEvaluatedKey)).toString("base64")
    : undefined;

  return {
    posts: postViews,
    nextCursor,
  };
}

// ─── Get personalized feed (authenticated) ────────────────────────────────────

export async function getPersonalizedFeed(
  userId: string,
  preferences: {
    likes: string[];
    dislikes: string[];
    dietSignals: string[];
    allergies: string[];
  },
  cursor?: string,
): Promise<CommunityFeedResponse> {
  const { posts, lastEvaluatedKey } = await fetchGlobalFeed(cursor);

  // Resolve image URLs, score, and check likes
  const scored = await Promise.all(
    posts.map(async (post) => {
      const [resolvedUrl, isLiked] = await Promise.all([
        resolveImageUrl(post),
        hasUserLikedPost(userId, post.postId),
      ]);

      // Relevance scoring
      const tags = [
        ...(post.tags?.ingredients ?? []),
        ...(post.tags?.dietTags ?? []),
        post.tags?.cuisine ?? "",
      ].map((t) => t.toLowerCase());

      const likeOverlap = preferences.likes.filter((l) =>
        tags.some((t) => t.includes(l.toLowerCase())),
      ).length;

      const dislikeOverlap = preferences.dislikes.filter((d) =>
        tags.some((t) => t.includes(d.toLowerCase())),
      ).length;

      const allergyOverlap = preferences.allergies.filter((a) =>
        tags.some((t) => t.includes(a.toLowerCase())),
      ).length;

      const now = Date.now();
      const ageHours =
        (now - new Date(post.createdAt).getTime()) / (1000 * 60 * 60);
      const recencyScore = Math.max(0, 1 - ageHours / 48);

      const score =
        recencyScore * 0.3 +
        likeOverlap * 0.4 -
        dislikeOverlap * 0.2 -
        allergyOverlap * 0.5 +
        post.likeCount * 0.1;

      return {
        post: { ...post, imageUrl: resolvedUrl ?? post.imageUrl, isLikedByCurrentUser: isLiked },
        score,
      };
    }),
  );

  scored.sort((a, b) => b.score - a.score);

  const postViews = scored
    .slice(0, FEED_PAGE_SIZE)
    .map(({ post }) => toPostView(post));

  const nextCursor = lastEvaluatedKey
    ? Buffer.from(JSON.stringify(lastEvaluatedKey)).toString("base64")
    : undefined;

  return {
    posts: postViews,
    nextCursor,
  };
}

export async function createPost(input: {
  userId: string;
  displayName: string;
  caption: string;
  tags: string[];
  topicId?: string;
  imageS3Key?: string;
}): Promise<CommunityPostView> {
  const postId = randomUUID();
  const createdAt = new Date().toISOString();
  const sk = `${createdAt}#${postId}`;

  const item: CommunityPost = {
    userId: input.userId,
    sk,
    gsi1pk: "ALL",
    gsi1sk: sk,
    postId,
    postType: input.topicId ? "topic_reply" : "free",
    caption: input.caption,
    imageS3Key: input.imageS3Key,
    tags: {
      ingredients: input.tags,
    },
    likeCount: 0,
    commentCount: 0,
    authorDisplayName: input.displayName,
    authorAvatarLabel: input.displayName
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join(""),
    createdAt,
    updatedAt: createdAt,
    ...(input.topicId
      ? {
          topicId: input.topicId,
          gsi2pk: input.topicId,
          gsi2sk: createdAt,
        }
      : {}),
  };

  await dynamo.send(
    new PutCommand({
      TableName: COMMUNITY_POSTS_TABLE,
      Item: item,
    }),
  );

  return toPostView(item);
}