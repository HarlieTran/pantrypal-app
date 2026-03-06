import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { dynamo, COMMUNITY_POSTS_TABLE } from "../../../common/db/dynamo.js";
import { randomUUID } from "crypto";

type CreateSystemPostInput = {
  topicId: string;
  dishName: string;
  description: string | null;
  imageUrl: string | null;
  createdAt: string; // ISO string
};

export async function createPantryPalSystemPost(input: CreateSystemPostInput) {

  const postId = randomUUID();
  const sk = `${input.createdAt}#${postId}`;

  const caption = input.description
    ? `${input.dishName} — ${input.description}`
    : `Today's special: ${input.dishName}`;

  await dynamo.send(
    new PutCommand({
      TableName: COMMUNITY_POSTS_TABLE,
      ConditionExpression: "attribute_not_exists(userId) AND attribute_not_exists(sk)",
      Item: {
        userId: "pantrypal-system",
        sk,
        gsi1pk: "ALL",
        gsi1sk: sk,
        postId,
        displayName: "PantryPal",
        avatarUrl: null,
        caption,
        imageUrl: input.imageUrl,
        tags: ["daily-special"],
        ingredients: [],
        likeCount: 0,
        commentCount: 0,
        createdAt: input.createdAt,
        topicId: input.topicId,
        gsi2pk: input.topicId,
        gsi2sk: input.createdAt,
        isSystemPost: true,
      },
    }),
  );

  return postId;
}