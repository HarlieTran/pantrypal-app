import { PutCommand, GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { dynamo, COMMUNITY_TOPICS_TABLE } from "../../../common/db/dynamo.js";
import { randomUUID } from "node:crypto";
import type { CommunityTopic } from "../model/community.types.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildTopicSk(): string {
  return "METADATA";
}

// ─── Get topic by id ──────────────────────────────────────────────────────────

export async function getTopicById(topicId: string): Promise<CommunityTopic | null> {
  const result = await dynamo.send(
    new GetCommand({
      TableName: COMMUNITY_TOPICS_TABLE,
      Key: { topicId, sk: buildTopicSk() },
    }),
  );

  return (result.Item as CommunityTopic) ?? null;
}

// ─── Get today's pinned topic ─────────────────────────────────────────────────

export async function getTodayPinnedTopic(): Promise<CommunityTopic | null> {
  const today = new Date().toISOString().slice(0, 10);

  const result = await dynamo.send(
    new QueryCommand({
      TableName: COMMUNITY_TOPICS_TABLE,
      IndexName: "gsi1-pinned-topics",
      KeyConditionExpression:
        "isPinned = :pinned AND begins_with(createdAt, :today)",
      ExpressionAttributeValues: {
        ":pinned": "true",
        ":today": today,
      },
      Limit: 1,
    }),
  );

  const items = result.Items as CommunityTopic[];
  return items?.[0] ?? null;
}

// ─── Create pinned system topic ───────────────────────────────────────────────

export async function createPinnedSystemTopic(input: {
  dailySpecialId: string;
  dishName: string;
  imageUrl?: string | null;
  description?: string | null;
}): Promise<CommunityTopic> {
  const topicId = randomUUID();
  const now = new Date().toISOString();

  const topic: CommunityTopic = {
    topicId,
    sk: buildTopicSk(),
    type: "system",
    title: `Do you know this recipe? — ${input.dishName}`,
    dailySpecialId: input.dailySpecialId,
    isPinned: "true",
    imageUrl: input.imageUrl ?? undefined,
    description: input.description ?? undefined,
    postCount: 0,
    createdAt: now,
  };

  await dynamo.send(
    new PutCommand({
      TableName: COMMUNITY_TOPICS_TABLE,
      Item: topic,
      // Only create if it doesn't already exist
      ConditionExpression: "attribute_not_exists(topicId)",
    }),
  );

  return topic;
}

// ─── Get or create today's pinned topic from daily special ───────────────────

export async function getOrCreateTodayPinnedTopic(input: {
  dailySpecialId: string;
  dishName: string;
  imageUrl?: string | null;
  description?: string | null;
}): Promise<CommunityTopic> {
  // Check if today's pinned topic already exists
  const existing = await getTodayPinnedTopic();
  if (existing) return existing;

  // Create it from the daily special data
  try {
    return await createPinnedSystemTopic(input);
  } catch (err: unknown) {
    // Handle race condition — another request created it first
    const isConditionalCheckFailed =
      err instanceof Error &&
      err.name === "ConditionalCheckFailedException";

    if (isConditionalCheckFailed) {
      const retried = await getTodayPinnedTopic();
      if (retried) return retried;
    }
    throw err;
  }
}
