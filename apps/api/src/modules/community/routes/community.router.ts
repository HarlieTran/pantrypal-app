import { z } from "zod";
import { requireAuth, withAuth } from "../../auth/index.js";
import {
  addComment,
  createPost,
  deleteComment,
  getComments,
  getOrCreateTodayPinnedTopic,
  getPersonalizedFeed,
  getPublicFeed,
  toggleCommentLike,
  toggleLike,
} from "../index.js";
import { getUserDisplayNameBySubject, getUserFeedPreferencesBySubject } from "../../users/index.js";
import { getOrCreateDailySpecial } from "../../home/index.js";
import { badRequest, created, handleError, ok, parseBody, serverError, type JsonResponse } from "../../../common/routing/helpers.js";

const communityUploadUrlSchema = z.object({
  filename: z.string().min(1),
  contentType: z.string().min(1),
});

const createPostSchema = z.object({
  caption: z.string().min(1).max(2000),
  tags: z.array(z.string()).optional(),
  topicId: z.string().optional(),
  imageS3Key: z.string().optional(),
});

const toggleLikeSchema = z.object({
  postId: z.string().min(1),
  postUserId: z.string().min(1),
});

export async function handleCommunityRoute(
  method: string,
  path: string,
  authHeader?: string,
  rawBody?: string,
): Promise<JsonResponse | null> {
  if (!path.startsWith("/community")) return null;

  if (method === "GET" && path === "/community/weekly-topics") {
    try {
      const { dynamo, COMMUNITY_TOPICS_TABLE } = await import("../../../common/db/dynamo.js");
      const { QueryCommand } = await import("@aws-sdk/lib-dynamodb");

      const results = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const date = d.toISOString().split("T")[0];

        const result = await dynamo.send(
          new QueryCommand({
            TableName: COMMUNITY_TOPICS_TABLE,
            IndexName: "gsi1-pinned-topics",
            KeyConditionExpression: "isPinned = :pinned AND begins_with(createdAt, :date)",
            ExpressionAttributeValues: {
              ":pinned": "true",
              ":date": date,
            },
            Limit: 1,
          }),
        );

        const topic = result.Items?.[0];
        if (topic) {
          results.push({
            topicId: topic.topicId,
            title: topic.title,
            imageUrl: topic.imageUrl ?? null,
            createdAt: topic.createdAt,
            date,
          });
        } else {
          results.push({ topicId: null, title: null, imageUrl: null, createdAt: null, date });
        }
      }

      return ok({ topics: results.reverse() });
    } catch (error) {
      return serverError("Failed to load weekly topics");
    }
  }

  if (method === "POST" && path === "/community/posts/upload-url") {
    return withAuth(authHeader, async (claims) => {
      try {
        const parsed = parseBody(rawBody, communityUploadUrlSchema);

        const { s3 } = await import("../../../common/storage/s3.js");
        const { PutObjectCommand } = await import("@aws-sdk/client-s3");
        const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
        const { randomUUID } = await import("node:crypto");

        const bucket = process.env.S3_BUCKET_COMMUNITY_POSTS || process.env.S3_BUCKET_DAILY_SPECIALS || "";
        const ext = parsed.filename.split(".").pop() ?? "jpg";
        const imageKey = `community-posts/${claims.sub}/${randomUUID()}.${ext}`;

        const command = new PutObjectCommand({
          Bucket: bucket,
          Key: imageKey,
          ContentType: parsed.contentType,
        });

        const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
        return ok({ uploadUrl, imageKey });
      } catch (error) {
        return handleError(error, "Failed to create upload URL");
      }
    });
  }

  if (method === "POST" && path === "/community/posts") {
    return withAuth(authHeader, async (claims) => {
      try {
        const parsed = parseBody(rawBody, createPostSchema);
        const displayName = (await getUserDisplayNameBySubject(claims.sub)) ?? "PantryPal User";

        const post = await createPost({
          userId: claims.sub,
          displayName,
          caption: parsed.caption,
          tags: parsed.tags ?? [],
          topicId: parsed.topicId,
          imageS3Key: parsed.imageS3Key,
        });

        return created({ post });
      } catch (error) {
        return handleError(error, "Failed to create post");
      }
    });
  }

  if (method === "GET" && path.match(/^\/community\/posts\/[^/]+\/comments$/)) {
    try {
      const postId = path.split("/")[3];
      const comments = await getComments(postId);
      return ok({ comments });
    } catch (error) {
      return serverError("Failed to fetch comments");
    }
  }

  if (method === "POST" && path.match(/^\/community\/posts\/[^/]+\/comments$/)) {
    return withAuth(authHeader, async (claims) => {
      try {
        const postId = path.split("/")[3];
        const body = rawBody ? JSON.parse(rawBody) : {};
        const content: string = body.content ?? "";
        const postUserId: string = body.postUserId ?? "";

        if (!content.trim()) {
          return badRequest("Comment cannot be empty");
        }

        const displayName = (await getUserDisplayNameBySubject(claims.sub)) ?? "PantryPal User";
        const comment = await addComment({
          postId,
          postUserId,
          userId: claims.sub,
          displayName,
          content: content.trim(),
        });

        return created({ comment });
      } catch (error) {
        return serverError("Failed to add comment");
      }
    });
  }

  if (method === "DELETE" && path.match(/^\/community\/posts\/[^/]+\/comments\/[^/]+$/)) {
    return withAuth(authHeader, async (claims) => {
      try {
        const parts = path.split("/");
        const postId = parts[3];
        const commentId = parts[5];
        const body = rawBody ? JSON.parse(rawBody) : {};
        const postUserId: string = body.postUserId ?? "";

        await deleteComment({ postId, commentId, userId: claims.sub, postUserId });
        return ok({ success: true });
      } catch (error) {
        return handleError(error, "Failed to delete comment");
      }
    });
  }

  if (method === "POST" && path.match(/^\/community\/posts\/[^/]+\/comments\/[^/]+\/like$/)) {
    return withAuth(authHeader, async (claims) => {
      try {
        const parts = path.split("/");
        const postId = parts[3];
        const commentId = parts[5];
        const result = await toggleCommentLike({ postId, commentId, userId: claims.sub });
        return ok(result);
      } catch (error) {
        return serverError("Failed to toggle like");
      }
    });
  }

  if (method === "POST" && path.match(/^\/community\/posts\/[^/]+\/like$/)) {
    return withAuth(authHeader, async (claims) => {
      try {
        const parsed = parseBody(rawBody, toggleLikeSchema);
        const result = await toggleLike(claims.sub, parsed.postId, parsed.postUserId);
        return ok(result);
      } catch (error) {
        return handleError(error, "Failed to toggle like");
      }
    });
  }

  if (method === "GET" && path.startsWith("/community")) {
    try {
      const url = new URL(`http://local${path}`);
      const cursor = url.searchParams.get("cursor") ?? undefined;

      let userId: string | null = null;
      let preferences: {
        likes: string[];
        dislikes: string[];
        dietSignals: string[];
        allergies: string[];
      } | null = null;

      if (authHeader?.startsWith("Bearer ")) {
        try {
          const claims = await requireAuth({ headers: { authorization: authHeader } });
          userId = claims.sub;
          preferences = await getUserFeedPreferencesBySubject(claims.sub);
        } catch {
          // auth optional
        }
      }

      const special = await getOrCreateDailySpecial("global");
      const pinnedTopic = special
        ? await getOrCreateTodayPinnedTopic({
            dailySpecialId: special.id,
            dishName: special.dishName,
            imageUrl: special.imageUrl ?? null,
            description: special.description ?? null,
          })
        : undefined;

      const feed =
        userId && preferences
          ? await getPersonalizedFeed(userId, preferences, cursor)
          : await getPublicFeed(cursor);

      return ok({
        ...feed,
        pinnedTopic,
      });
    } catch (error) {
      return serverError("Failed to load community feed");
    }
  }

  return null;
}
