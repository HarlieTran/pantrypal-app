import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const region = process.env.AWS_REGION || "us-east-2";

const raw = new DynamoDBClient({ region });

export const dynamo = DynamoDBDocumentClient.from(raw, {
  marshallOptions: { removeUndefinedValues: true },
});

export const PANTRY_TABLE = process.env.PANTRY_TABLE || "pantrypal-pantry-items";
export const COMMUNITY_POSTS_TABLE = process.env.COMMUNITY_POSTS_TABLE || "pantrypal-community-posts";
export const COMMUNITY_LIKES_TABLE = process.env.COMMUNITY_LIKES_TABLE || "pantrypal-community-likes";
export const COMMUNITY_COMMENTS_TABLE = process.env.COMMUNITY_COMMENTS_TABLE || "pantrypal-community-comments";
export const COMMUNITY_TOPICS_TABLE = process.env.COMMUNITY_TOPICS_TABLE || "pantrypal-community-topics";