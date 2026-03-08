import { PutCommand, GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { dynamo, COMMUNITY_TOPICS_TABLE } from "../../../common/db/dynamo.js";
import { randomUUID } from "node:crypto";
import type { CommunityTopic } from "../model/community.types.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TOPIC_SK = "METADATA";

// ─── Get topic by id ──────────────────────────────────────────────────────────

export async function getTopicById(topicId: string): Promise<CommunityTopic | null> {
  const result = await dynamo.send(
    new GetCommand({
      TableName: COMMUNITY_TOPICS_TABLE,
      Key: { topicId, sk: TOPIC_SK },
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
    sk: TOPIC_SK,
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

export async function getWeeklyTopics(): Promise<
  Array<{
    topicId: string | null;
    title: string | null;
    imageUrl: string | null;
    createdAt: string | null;
    date: string;
  }>
> {
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
        topicId: topic.topicId as string,
        title: topic.title as string,
        imageUrl: (topic.imageUrl as string) ?? null,
        createdAt: topic.createdAt as string,
        date,
      });
    } else {
      results.push({ topicId: null, title: null, imageUrl: null, createdAt: null, date });
    }
  }

  return results.reverse();
}