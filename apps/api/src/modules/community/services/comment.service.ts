import {
  PutCommand,
  QueryCommand,
  DeleteCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "node:crypto";
import {
  dynamo,
  COMMUNITY_COMMENTS_TABLE,
  COMMUNITY_POSTS_TABLE,
} from "../../../common/db/dynamo.js";
import type { CommunityComment } from "../model/community.types.js";

async function getPostSk(postUserId: string, postId: string): Promise<string | null> {
  const result = await dynamo.send(
    new QueryCommand({
      TableName: COMMUNITY_POSTS_TABLE,
      KeyConditionExpression: "userId = :uid",
      FilterExpression: "postId = :pid",
      ExpressionAttributeValues: { ":uid": postUserId, ":pid": postId },
      Limit: 10,
    }),
  );
  return (result.Items?.[0]?.sk as string) ?? null;
}

export async function getComments(postId: string): Promise<CommunityComment[]> {
  const result = await dynamo.send(
    new QueryCommand({
      TableName: COMMUNITY_COMMENTS_TABLE,
      KeyConditionExpression: "postId = :pid",
      ExpressionAttributeValues: { ":pid": postId },
    }),
  );

  const comments = (result.Items ?? []) as CommunityComment[];

  return comments.sort((a, b) => {
    const likesDiff = (b.likeCount ?? 0) - (a.likeCount ?? 0);
    if (likesDiff !== 0) return likesDiff;
    return a.createdAt.localeCompare(b.createdAt);
  });
}

export async function addComment(input: {
  postId: string;
  postUserId: string;
  userId: string;
  displayName: string;
  content: string;
}): Promise<CommunityComment> {
  const commentId = randomUUID();
  const createdAt = new Date().toISOString();
  const sk = `${createdAt}#${commentId}`;

  const avatarLabel = input.displayName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  const comment: CommunityComment = {
    postId: input.postId,
    sk,
    commentId,
    userId: input.userId,
    displayName: input.displayName,
    avatarLabel,
    content: input.content,
    likeCount: 0,
    likedBy: [],
    createdAt,
  };

  await dynamo.send(
    new PutCommand({
      TableName: COMMUNITY_COMMENTS_TABLE,
      Item: comment,
    }),
  );

  // Increment commentCount on the post
  const postSk = await getPostSk(input.postUserId, input.postId);
  if (postSk) {
    await dynamo.send(
      new UpdateCommand({
        TableName: COMMUNITY_POSTS_TABLE,
        Key: { userId: input.postUserId, sk: postSk },
        UpdateExpression:
          "SET commentCount = if_not_exists(commentCount, :zero) + :one",
        ExpressionAttributeValues: { ":one": 1, ":zero": 0 },
      }),
    );
  }

  return comment;
}

export async function deleteComment(input: {
  postId: string;
  commentId: string;
  userId: string;
  postUserId: string;
}): Promise<void> {
  // First find the comment to get its sk and verify ownership
  const result = await dynamo.send(
    new QueryCommand({
      TableName: COMMUNITY_COMMENTS_TABLE,
      KeyConditionExpression: "postId = :pid",
      FilterExpression: "commentId = :cid",
      ExpressionAttributeValues: { ":pid": input.postId, ":cid": input.commentId },
      Limit: 10,
    }),
  );

  const comment = result.Items?.[0] as CommunityComment | undefined;
  if (!comment) throw new Error("Comment not found");
  if (comment.userId !== input.userId) throw new Error("Forbidden");

  await dynamo.send(
    new DeleteCommand({
      TableName: COMMUNITY_COMMENTS_TABLE,
      Key: { postId: input.postId, sk: comment.sk },
    }),
  );

  // Decrement commentCount on the post
  const postSk = await getPostSk(input.postUserId, input.postId);
  if (postSk) {
    await dynamo.send(
      new UpdateCommand({
        TableName: COMMUNITY_POSTS_TABLE,
        Key: { userId: input.postUserId, sk: postSk },
        UpdateExpression:
          "SET commentCount = if_not_exists(commentCount, :zero) - :one",
        ConditionExpression: "commentCount > :zero",
        ExpressionAttributeValues: { ":one": 1, ":zero": 0 },
      }),
    ).catch(() => {}); // ignore if already 0
  }
}

export async function toggleCommentLike(input: {
  postId: string;
  commentId: string;
  userId: string;
}): Promise<{ liked: boolean; likeCount: number }> {
  const result = await dynamo.send(
    new QueryCommand({
      TableName: COMMUNITY_COMMENTS_TABLE,
      KeyConditionExpression: "postId = :pid",
      FilterExpression: "commentId = :cid",
      ExpressionAttributeValues: { ":pid": input.postId, ":cid": input.commentId },
      Limit: 10,
    }),
  );

  const comment = result.Items?.[0] as CommunityComment | undefined;
  if (!comment) throw new Error("Comment not found");

  const likedBy: string[] = (comment.likedBy as string[]) ?? [];
  const alreadyLiked = likedBy.includes(input.userId);

  const newLikedBy = alreadyLiked
    ? likedBy.filter((id) => id !== input.userId)
    : [...likedBy, input.userId];

  const updated = await dynamo.send(
    new UpdateCommand({
      TableName: COMMUNITY_COMMENTS_TABLE,
      Key: { postId: input.postId, sk: comment.sk },
      UpdateExpression:
        "SET likeCount = if_not_exists(likeCount, :zero) + :delta, likedBy = :newLikedBy",
      ExpressionAttributeValues: {
        ":delta": alreadyLiked ? -1 : 1,
        ":zero": 0,
        ":newLikedBy": newLikedBy,
      },
      ReturnValues: "ALL_NEW",
    }),
  );

  return {
    liked: !alreadyLiked,
    likeCount: (updated.Attributes?.likeCount as number) ?? 0,
  };
}