/**
 * PantryPal — Community Feed Seed Script
 * Run from repo root:
 *   npx tsx apps/api/scripts/seed-community.ts
 *
 * Requires AWS credentials in env (same as your API).
 * Reads COMMUNITY_POSTS_TABLE from env or falls back to "pantrypal-community-posts".
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";

// ─── Config ────────────────────────────────────────────────────────────────

const REGION = process.env.AWS_REGION ?? "us-east-2";
const POSTS_TABLE = process.env.COMMUNITY_POSTS_TABLE ?? "pantrypal-community-posts";
const TOPICS_TABLE = process.env.COMMUNITY_TOPICS_TABLE ?? "pantrypal-community-topics";

const client = new DynamoDBClient({ region: REGION });
const dynamo = DynamoDBDocumentClient.from(client);

// ─── Fake Users ─────────────────────────────────────────────────────────────

const FAKE_USERS = [
  { userId: "seed-user-001", displayName: "Sofia M.",      avatarUrl: null },
  { userId: "seed-user-002", displayName: "James K.",      avatarUrl: null },
  { userId: "seed-user-003", displayName: "Priya R.",      avatarUrl: null },
  { userId: "seed-user-004", displayName: "Luca B.",       avatarUrl: null },
  { userId: "seed-user-005", displayName: "Aisha T.",      avatarUrl: null },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  // Slightly randomize the time so posts aren't all at midnight
  d.setHours(Math.floor(Math.random() * 22) + 1);
  d.setMinutes(Math.floor(Math.random() * 59));
  return d.toISOString();
}

function makePost(opts: {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  caption: string;
  tags: string[];
  ingredients: string[];
  likeCount: number;
  commentCount: number;
  createdAt: string;
  topicId?: string;
  imageUrl?: string;
}) {
  const postId = randomUUID();
  const sk = `${opts.createdAt}#${postId}`;

  return {
    // Primary key
    userId: opts.userId,
    sk,
    // GSI1 — global feed
    gsi1pk: "ALL",
    gsi1sk: sk,
    // Fields
    postId,
    displayName: opts.displayName,
    avatarUrl: opts.avatarUrl,
    caption: opts.caption,
    imageUrl: opts.imageUrl ?? null,
    tags: opts.tags,
    ingredients: opts.ingredients,
    likeCount: opts.likeCount,
    commentCount: opts.commentCount,
    createdAt: opts.createdAt,
    // Optional topic link
    ...(opts.topicId
      ? {
          topicId: opts.topicId,
          // GSI2 — posts by topic
          gsi2pk: opts.topicId,
          gsi2sk: opts.createdAt,
        }
      : {}),
  };
}

// ─── Find today's pinned topic ───────────────────────────────────────────────

async function getTodayPinnedTopic(): Promise<{ topicId: string; imageUrl: string | null; title: string } | null> {
  const today = new Date().toISOString().split("T")[0];

  const result = await dynamo.send(
    new QueryCommand({
      TableName: TOPICS_TABLE,
      IndexName: "gsi1-pinned-topics",
      KeyConditionExpression: "isPinned = :pinned AND begins_with(createdAt, :today)",
      ExpressionAttributeValues: {
        ":pinned": "true",
        ":today": today,
      },
      Limit: 1,
    }),
  );

  const topic = result.Items?.[0];
  if (!topic) {
    console.warn("⚠️  No pinned topic found for today.");
    return null;
  }

  console.log(`✅ Found today's pinned topic: ${topic.topicId} — "${topic.title}"`);
  return {
    topicId: topic.topicId as string,
    imageUrl: (topic.imageUrl as string) ?? null,
    title: topic.title as string,
  };
}

// ─── Post Definitions ────────────────────────────────────────────────────────

function buildPosts(pinnedTopicId: string | null) {
  const u = FAKE_USERS;

  return [
    // ── Standalone posts ────────────────────────────────────────────────────
    makePost({
      userId: u[0].userId,
      displayName: u[0].displayName,
      avatarUrl: u[0].avatarUrl,
      caption: "Made a quick garlic butter pasta with whatever was left in the pantry. Sometimes simple is best 🧄🍝",
      tags: ["pasta", "quick", "garlic", "butter", "weeknight"],
      ingredients: ["pasta", "garlic", "butter", "parmesan", "parsley"],
      likeCount: 24,
      commentCount: 5,
      createdAt: daysAgo(1),
    }),

    makePost({
      userId: u[1].userId,
      displayName: u[1].displayName,
      avatarUrl: u[1].avatarUrl,
      caption: "Spicy chickpea curry — vegan, filling, and done in 30 minutes. Recipe in the comments!",
      tags: ["vegan", "curry", "chickpea", "spicy", "quick"],
      ingredients: ["chickpeas", "tomatoes", "coconut milk", "cumin", "chili", "garlic", "onion"],
      likeCount: 41,
      commentCount: 12,
      createdAt: daysAgo(2),
    }),

    makePost({
      userId: u[2].userId,
      displayName: u[2].displayName,
      avatarUrl: u[2].avatarUrl,
      caption: "Homemade sourdough finally turned out right after 6 failed attempts 😅 the crust is perfect",
      tags: ["baking", "sourdough", "bread", "glutenfree"],
      ingredients: ["flour", "water", "salt", "sourdough starter"],
      likeCount: 88,
      commentCount: 19,
      createdAt: daysAgo(3),
    }),

    makePost({
      userId: u[3].userId,
      displayName: u[3].displayName,
      avatarUrl: u[3].avatarUrl,
      caption: "Sheet pan salmon with roasted asparagus — healthy, zero cleanup. 425°F for 15 mins.",
      tags: ["salmon", "healthy", "sheetpan", "keto", "seafood"],
      ingredients: ["salmon", "asparagus", "lemon", "olive oil", "dill", "garlic"],
      likeCount: 33,
      commentCount: 7,
      createdAt: daysAgo(4),
    }),

    makePost({
      userId: u[4].userId,
      displayName: u[4].displayName,
      avatarUrl: u[4].avatarUrl,
      caption: "Greek salad with extra feta because I deserve it. Cherry tomatoes from my garden 🍅",
      tags: ["salad", "greek", "feta", "vegetarian", "summer"],
      ingredients: ["cucumber", "tomatoes", "red onion", "kalamata olives", "feta", "olive oil"],
      likeCount: 17,
      commentCount: 3,
      createdAt: daysAgo(5),
    }),

    makePost({
      userId: u[0].userId,
      displayName: u[0].displayName,
      avatarUrl: u[0].avatarUrl,
      caption: "Banana oat pancakes — 3 ingredients, no flour needed. Great for using up overripe bananas 🍌",
      tags: ["breakfast", "pancakes", "banana", "healthy", "glutenfree"],
      ingredients: ["banana", "oats", "eggs"],
      likeCount: 56,
      commentCount: 9,
      createdAt: daysAgo(6),
    }),

    makePost({
      userId: u[2].userId,
      displayName: u[2].displayName,
      avatarUrl: u[2].avatarUrl,
      caption: "Leftover rice? Make fried rice. Leftover fried rice? Make it again but better 🍳",
      tags: ["friedrice", "leftovers", "rice", "asian", "eggfree"],
      ingredients: ["rice", "soy sauce", "sesame oil", "green onion", "egg", "peas", "carrots"],
      likeCount: 29,
      commentCount: 6,
      createdAt: daysAgo(7),
    }),

    // ── Replies to today's pinned topic ─────────────────────────────────────
    ...(pinnedTopicId
      ? [
          makePost({
            userId: u[1].userId,
            displayName: u[1].displayName,
            avatarUrl: u[1].avatarUrl,
            caption: "Oh I know this one! My grandmother makes it every Sunday — the secret is low and slow heat 🔥",
            tags: ["family", "traditional", "slow-cook"],
            ingredients: [],
            likeCount: 14,
            commentCount: 2,
            createdAt: daysAgo(0),
            topicId: pinnedTopicId,
          }),

          makePost({
            userId: u[3].userId,
            displayName: u[3].displayName,
            avatarUrl: u[3].avatarUrl,
            caption: "I tried making this last week! Used chicken thighs instead of breast — much juicier result 👌",
            tags: ["chicken", "variation", "tips"],
            ingredients: ["chicken thighs", "herbs"],
            likeCount: 8,
            commentCount: 1,
            createdAt: daysAgo(0),
            topicId: pinnedTopicId,
          }),

          makePost({
            userId: u[4].userId,
            displayName: u[4].displayName,
            avatarUrl: u[4].avatarUrl,
            caption: "Never had this before but it looks amazing. Adding the ingredients to my shopping list right now!",
            tags: ["newrecipe", "inspired"],
            ingredients: [],
            likeCount: 5,
            commentCount: 0,
            createdAt: daysAgo(0),
            topicId: pinnedTopicId,
          }),
        ]
      : []),
  ];
}

async function seedSystemPost(pinnedTopicId: string, imageUrl: string | null) {
  const postId = randomUUID();
  const d = new Date();
  d.setHours(0, 1, 0, 0);
  const createdAt = d.toISOString();
  const sk = `${createdAt}#${postId}`;

  await dynamo.send(
    new PutCommand({
      TableName: POSTS_TABLE,
      Item: {
        userId: "pantrypal-system",
        sk,
        gsi1pk: "ALL",
        gsi1sk: sk,
        postId,
        displayName: "PantryPal",
        avatarUrl: null,
        caption: "Today's special is live! What do you know about this dish? Share your thoughts 🍽️",
        imageUrl: imageUrl,
        tags: ["daily-special"],
        ingredients: [],
        likeCount: 0,
        commentCount: 0,
        createdAt,
        topicId: pinnedTopicId,
        gsi2pk: pinnedTopicId,
        gsi2sk: createdAt,
        isSystemPost: true,
      },
    }),
  );

  console.log("  ✅ [PantryPal] System post seeded for today's topic");
  return postId;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🌱 PantryPal Community Seed Script`);
  console.log(`   Table : ${POSTS_TABLE}`);
  console.log(`   Region: ${REGION}\n`);

  const topic = await getTodayPinnedTopic();

  if (topic) {
    await seedSystemPost(topic.topicId, topic.imageUrl);
  }

  const posts = buildPosts(topic?.topicId ?? null);
  console.log(`📦 Seeding ${posts.length} posts...\n`);

  let success = 0;
  let failed = 0;

  for (const post of posts) {
    try {
      await dynamo.send(
        new PutCommand({
          TableName: POSTS_TABLE,
          Item: post,
        }),
      );
      console.log(`  ✅ [${post.displayName}] ${post.caption.slice(0, 60)}...`);
      success++;
    } catch (err) {
      console.error(`  ❌ Failed to seed post:`, err);
      failed++;
    }
  }

  console.log(`\n🏁 Done — ${success} seeded, ${failed} failed.\n`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});