import { PutCommand, DeleteCommand, GetCommand, UpdateCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { dynamo, COMMUNITY_LIKES_TABLE, COMMUNITY_POSTS_TABLE } from "../../../common/db/dynamo.js";
import type { CommunityLike } from "../model/community.types.js";

async function getPostSk(userId: string, postId: string): Promise<string | null> {
  let lastKey: Record<string, unknown> | undefined;

  do {
    const result = await dynamo.send(
      new QueryCommand({
        TableName: COMMUNITY_POSTS_TABLE,
        KeyConditionExpression: "userId = :uid",
        FilterExpression: "postId = :pid",
        ExpressionAttributeValues: {
          ":uid": userId,
          ":pid": postId,
        },
        ExclusiveStartKey: lastKey,
      }),
    );

    const match = result.Items?.[0]?.sk as string | undefined;
    if (match) return match;

    lastKey = result.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (lastKey);

  return null;
}


export async function toggleLike(
  userId: string,
  postId: string,
  postUserId: string,
): Promise<{ liked: boolean; likeCount: number }> {

  // Check if like already exists
  const existing = await dynamo.send(
    new GetCommand({
      TableName: COMMUNITY_LIKES_TABLE,
      Key: { postId, userId },
    }),
  );

  const alreadyLiked = !!existing.Item;

  // Get the post's sk (createdAt#postId) needed for the update key
  const sk = await getPostSk(postUserId, postId);
  if (!sk) throw new Error("Post not found");

  if (alreadyLiked) {
    // Unlike — delete the like record
    await dynamo.send(
      new DeleteCommand({
        TableName: COMMUNITY_LIKES_TABLE,
        Key: { postId, userId },
      }),
    );

    // Decrement likeCount on the post
    const result = await dynamo.send(
      new UpdateCommand({
        TableName: COMMUNITY_POSTS_TABLE,
        Key: { userId: postUserId, sk },
        UpdateExpression: "SET likeCount = if_not_exists(likeCount, :zero) - :one",
        ExpressionAttributeValues: { ":one": 1, ":zero": 0 },
        ConditionExpression: "likeCount > :zero",
        ReturnValues: "ALL_NEW",
      }),
    );

    return {
      liked: false,
      likeCount: (result.Attributes?.likeCount as number) ?? 0,
    };
  } else {
    // Like — put the like record
    const like: CommunityLike = {
      postId,
      userId,
      createdAt: new Date().toISOString(),
    };

    await dynamo.send(
      new PutCommand({
        TableName: COMMUNITY_LIKES_TABLE,
        Item: like,
      }),
    );

    // Increment likeCount on the post
    const result = await dynamo.send(
      new UpdateCommand({
        TableName: COMMUNITY_POSTS_TABLE,
        Key: { userId: postUserId, sk },
        UpdateExpression: "SET likeCount = if_not_exists(likeCount, :zero) + :one",
        ExpressionAttributeValues: { ":one": 1, ":zero": 0 },
        ReturnValues: "ALL_NEW",
      }),
    );

    return {
      liked: true,
      likeCount: (result.Attributes?.likeCount as number) ?? 1,
    };
  }
}