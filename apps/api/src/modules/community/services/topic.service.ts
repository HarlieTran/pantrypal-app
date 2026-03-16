import { PutCommand, GetCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { dynamo, COMMUNITY_TOPICS_TABLE } from "../../../common/db/dynamo.js";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";
import type { CommunityTopic } from "../model/community.types.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TOPIC_SK = "METADATA";
const s3 = new S3Client({ region: process.env.AWS_REGION || "us-east-2" });
const DAILY_SPECIALS_BUCKET = process.env.S3_BUCKET_DAILY_SPECIALS || "";

async function getFreshImageUrl(topic: Record<string, unknown>): Promise<{ url: string | null; resolvedKey: string | null }> {
  let s3Key = topic.imageS3Key as string | undefined;
  let extractedKey: string | null = null;

  if (!s3Key) {
    const storedUrl = topic.imageUrl as string | undefined;
    if (storedUrl) {
      const match = storedUrl.match(/\.amazonaws\.com\/(.+?)(?:\?|$)/)?.[1];
      if (match) {
        s3Key = decodeURIComponent(match);
        extractedKey = s3Key;
      }
    }
  }

  if (s3Key && DAILY_SPECIALS_BUCKET) {
    try {
      const command = new GetObjectCommand({
        Bucket: DAILY_SPECIALS_BUCKET,
        Key: s3Key,
      });
      const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
      return { url, resolvedKey: extractedKey };
    } catch (err) {
      console.warn(`[topic] Failed to sign S3 URL for key "${s3Key}":`, err);
    }
  }

  return { url: null, resolvedKey: null };
}

async function healTopicImageKey(topicId: string, s3Key: string): Promise<void> {
  try {
    await dynamo.send(
      new UpdateCommand({
        TableName: COMMUNITY_TOPICS_TABLE,
        Key: { topicId, sk: TOPIC_SK },
        UpdateExpression: "SET imageS3Key = :key",
        ConditionExpression: "attribute_not_exists(imageS3Key)",
        ExpressionAttributeValues: { ":key": s3Key },
      }),
    );
  } catch {
    // ConditionalCheckFailedException = already set, that's fine
  }
}

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

  const item = result.Items?.[0];
  if (!item) return null;

  const { url: freshImageUrl, resolvedKey } = await getFreshImageUrl(item);
  if (resolvedKey) {
    healTopicImageKey(item.topicId as string, resolvedKey).catch(() => {});
  }
  return { ...(item as CommunityTopic), imageUrl: freshImageUrl ?? undefined };
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

  const imageS3Key = input.imageUrl
    ?.match(/\.s3\.[^.]+\.amazonaws\.com\/(.+?)(?:\?|$)/)?.[1]
    ?? null;

  const topic: CommunityTopic = {
    topicId,
    sk: TOPIC_SK,
    type: "system",
    title: `Do you know this recipe? — ${input.dishName}`,
    dailySpecialId: input.dailySpecialId,
    isPinned: "true",
    imageUrl: input.imageUrl ?? undefined,
    imageS3Key: imageS3Key ?? undefined,
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
      // Generate a fresh signed URL instead of returning the stored (expired) one
      const { url: freshImageUrl, resolvedKey } = await getFreshImageUrl(topic);

      if (resolvedKey) {
        healTopicImageKey(topic.topicId as string, resolvedKey).catch(() => {});
      }

      results.push({
        topicId: topic.topicId as string,
        title: topic.title as string,
        imageUrl: freshImageUrl,
        createdAt: topic.createdAt as string,
        date,
      });
    } else {
      results.push({ topicId: null, title: null, imageUrl: null, createdAt: null, date });
    }
  }

  return results.reverse();
}