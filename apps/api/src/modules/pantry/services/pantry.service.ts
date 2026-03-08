import {
  PutCommand,
  QueryCommand,
  DeleteCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { INGREDIENT_CATEGORIES } from "@pantrypal/shared-types";
import { dynamo, PANTRY_TABLE } from "../../../common/db/dynamo.js";
import { prisma } from "../../../common/db/prisma.js";
import { matchIngredient } from "../../ingredients/index.js";
import { getUserProfileIdBySubject } from "../../users/index.js";
import { randomUUID } from "node:crypto";
import type {
  PantryItem,
  PantryItemWithStatus,
  ParsedIngredient,
} from "../model/pantry.types.js";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import { s3 } from "../../../common/storage/s3.js";
import { stripCodeFence } from "../../../common/ai/bedrock.js";

//Add constants
const PANTRY_IMAGES_BUCKET = process.env.PANTRY_IMAGES_BUCKET || process.env.CURATED_RECIPES_BUCKET || "pantrypal-user-pantry-uploads";
const PANTRY_IMAGES_PREFIX = "pantry-uploads";
const BEDROCK_MODEL = process.env.BEDROCK_MODEL_ID || "amazon.nova-lite-v1:0";
const bedrockClient = new BedrockRuntimeClient({ region: process.env.AWS_REGION || "us-east-2" });
const CATEGORY_PROMPT_LIST = INGREDIENT_CATEGORIES.join("|");



// ─── Expiry helpers ───────────────────────────────────────────────────────────

function computeExpiryStatus(expiryDate?: string): {
  status: PantryItemWithStatus["expiryStatus"];
  daysUntilExpiry?: number;
} {
  if (!expiryDate) return { status: "no_date" };

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);

  const diffMs = expiry.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { status: "expired", daysUntilExpiry: diffDays };
  if (diffDays <= 3) return { status: "expiring_soon", daysUntilExpiry: diffDays };
  return { status: "fresh", daysUntilExpiry: diffDays };
}

function withExpiryStatus(item: PantryItem): PantryItemWithStatus {
  const { status, daysUntilExpiry } = computeExpiryStatus(item.expiryDate);
  return { ...item, expiryStatus: status, daysUntilExpiry };
}

// ─── Postgres meta sync ───────────────────────────────────────────────────────

async function syncPantryMeta(userId: string) {
  try {    
    const profileId = await getUserProfileIdBySubject(userId);
    if (!profileId) return;

    const result = await dynamo.send(
      new QueryCommand({
        TableName: PANTRY_TABLE,
        KeyConditionExpression: "userId = :uid",
        ExpressionAttributeValues: { ":uid": userId },
      }),
    );

    const items = (result.Items ?? []) as PantryItem[];
    const now = new Date();

    const expiringCount = items.filter((item) => {
      if (!item.expiryDate) return false;
      const expiry = new Date(item.expiryDate);
      const diff = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 3;
    }).length;

    await prisma.pantryMeta.upsert({
      where: { userId: profileId },
      update: { itemCount: items.length, expiringCount, lastUpdated: new Date() },
      create: { userId: profileId, itemCount: items.length, expiringCount, lastUpdated: new Date() },
    });
  } catch (e) {
    console.warn("pantry meta sync failed:", e);
  }
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getPantryItems(userId: string): Promise<PantryItemWithStatus[]> {
  const result = await dynamo.send(
    new QueryCommand({
      TableName: PANTRY_TABLE,
      KeyConditionExpression: "userId = :uid",
      ExpressionAttributeValues: { ":uid": userId },
    }),
  );

  const items = (result.Items ?? []) as PantryItem[];

  return items
    .map(withExpiryStatus)
    .sort((a, b) => {
      const order = { expired: 0, expiring_soon: 1, fresh: 2, no_date: 3 };
      const oa = order[a.expiryStatus];
      const ob = order[b.expiryStatus];
      if (oa !== ob) return oa - ob;
      if (a.expiryDate && b.expiryDate) return a.expiryDate.localeCompare(b.expiryDate);
      return 0;
    });
}

export async function getPantryMeta(userId: string) {
  const profileId = await getUserProfileIdBySubject(userId);
  if (!profileId) return null;
  return prisma.pantryMeta.findUnique({ where: { userId: profileId } });
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function addPantryItem(
  userId: string,
  data: {
    rawName: string;
    quantity: number;
    unit: string;
    expiryDate?: string;
    notes?: string;
  },
): Promise<PantryItemWithStatus> {
  // Run ingredient matching
  const matched = await matchIngredient({
    rawName: data.rawName,
    quantity: data.quantity,
    unit: data.unit,
    category: INGREDIENT_CATEGORIES[INGREDIENT_CATEGORIES.length - 1],
  } as ParsedIngredient);

  const now = new Date().toISOString();
  const item: PantryItem = {
    itemId: randomUUID(),
    userId,
    rawName: data.rawName,
    ingredientId: matched.ingredientId,
    canonicalName: matched.canonicalName,
    quantity: data.quantity,
    unit: data.unit,
    category: matched.category,
    expiryDate: data.expiryDate,
    notes: data.notes,
    addedAt: now,
    updatedAt: now,
  };

  await dynamo.send(new PutCommand({ TableName: PANTRY_TABLE, Item: item }));
  await syncPantryMeta(userId);

  return withExpiryStatus(item);
}

// ─── Bulk create (from image parse) ──────────────────────────────────────────

export async function addPantryItemsBulk(
  userId: string,
  items: Array<{
    rawName: string;
    quantity: number;
    unit: string;
    expiryDate?: string;
    notes?: string;
  }>,
): Promise<PantryItemWithStatus[]> {
  return Promise.all(items.map((item) => addPantryItem(userId, item)));
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updatePantryItem(
  userId: string,
  itemId: string,
  updates: Partial<{
    quantity: number;
    unit: string;
    expiryDate: string;
    notes: string;
  }>,
): Promise<PantryItemWithStatus> {
  const now = new Date().toISOString();

  const fields = Object.entries(updates).filter(([, v]) => v !== undefined);
  if (fields.length === 0) throw new Error("No updates provided");

  const setExprParts = fields.map(([k]) => `#${k} = :${k}`);
  setExprParts.push("#updatedAt = :updatedAt");

  const expressionNames: Record<string, string> = { "#updatedAt": "updatedAt" };
  const expressionValues: Record<string, unknown> = { ":updatedAt": now };

  for (const [k, v] of fields) {
    expressionNames[`#${k}`] = k;
    expressionValues[`:${k}`] = v;
  }

  const result = await dynamo.send(
    new UpdateCommand({
      TableName: PANTRY_TABLE,
      Key: { userId, itemId },
      UpdateExpression: `SET ${setExprParts.join(", ")}`,
      ExpressionAttributeNames: expressionNames,
      ExpressionAttributeValues: expressionValues,
      ReturnValues: "ALL_NEW",
    }),
  );

  await syncPantryMeta(userId);
  return withExpiryStatus(result.Attributes as PantryItem);
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deletePantryItem(userId: string, itemId: string): Promise<void> {
  await dynamo.send(
    new DeleteCommand({ TableName: PANTRY_TABLE, Key: { userId, itemId } }),
  );
  await syncPantryMeta(userId);
}

// ─── Presigned upload URL ─────────────────────────────────────────────────────

export async function getPantryImageUploadUrl(
  userId: string,
  filename: string,
  contentType: string,
): Promise<{ uploadUrl: string; imageKey: string }> {
  const ext = filename.split(".").pop() ?? "jpg";
  const imageKey = `${PANTRY_IMAGES_PREFIX}/${userId}/${randomUUID()}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: PANTRY_IMAGES_BUCKET,
    Key: imageKey,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
  return { uploadUrl, imageKey };
}

// ─── Parse image from S3 via Bedrock ─────────────────────────────────────────

export async function parseImageForIngredients(
  imageKey: string,
): Promise<ParsedIngredient[]> {
  // Fetch image bytes from S3
  const getCmd = new GetObjectCommand({
    Bucket: PANTRY_IMAGES_BUCKET,
    Key: imageKey,
  });

  const s3Res = await s3.send(getCmd);
  const chunks: Uint8Array[] = [];
  for await (const chunk of s3Res.Body as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }
  const imageBytes = Buffer.concat(chunks);
  const contentType = s3Res.ContentType ?? "image/jpeg";

  const imageFormat = contentType.includes("png")
    ? "png"
    : contentType.includes("webp")
    ? "webp"
    : "jpeg";

  const prompt = [
    "# Grocery List Extraction Expert",
    "## Task",
    "Analyze this image (receipt, grocery photo, pantry shelf, or spice rack) and extract a clean normalized grocery list in JSON format.",
    "## Output Requirements",
    "- Return ONLY valid JSON without markdown, preamble, or explanations.",
    `- Follow this schema exactly: {"items":[{"name":"string","quantity":1,"unit":"string","category":"${CATEGORY_PROMPT_LIST}"}]}`,
    "## Normalization Rules",
    "1) Include only food/grocery items. Exclude taxes, totals, store info, coupons, phone numbers.",
    '2) Clean item names. Example: "APPL GALA ORG 2.99" -> "Organic Gala Apples".',
    "3) Canonicalize to shopper-friendly form:",
    '   - "2% MLK 1GAL" -> name: "2% Milk", quantity: 1, unit: "L"',
    '   - "CHKN BRST BNLS" -> name: "Boneless Chicken Breast", quantity: 1, unit: "pcs"',
    '   - "BANANAS ORG" -> name: "Organic Bananas", quantity: 1, unit: "pcs"',
    "4) Extract accurate quantities as numbers. Use 1 if unclear.",
    "5) Use common units: pcs, g, kg, oz, lb, ml, L, cup, tbsp, tsp.",
    "6) Choose the most appropriate category for each item.",
    "7) Merge duplicate items by summing quantities.",
    "8) Include items with low confidence if they appear grocery-related.",
    "Return only the structured JSON output.",
  ].join("\n");

  const command = new ConverseCommand({
    modelId: BEDROCK_MODEL,
    messages: [
      {
        role: "user",
        content: [
          { text: prompt },
          {
            image: {
              format: imageFormat as "jpeg" | "png" | "webp",
              source: { bytes: imageBytes },
            },
          },
        ],
      },
    ],
    inferenceConfig: { temperature: 0.1, maxTokens: 1200 },
  });

  const res = await bedrockClient.send(command);
  const rawText =
    res.output?.message?.content?.find((x) => "text" in x)?.text ?? "";

  if (!rawText) return [];

  const parsed = JSON.parse(stripCodeFence(rawText)) as {
    items?: Array<{
      name?: string;
      quantity?: unknown;
      unit?: string;
      category?: string;
    }>;
  };

  const rows = parsed.items ?? [];

  return rows
    .map((item) => ({
      rawName: typeof item.name === "string" ? item.name.trim() : "",
      quantity: typeof item.quantity === "number" ? item.quantity : 1,
      unit: typeof item.unit === "string" ? item.unit.trim() : "pcs",
      category: (item.category ?? INGREDIENT_CATEGORIES[INGREDIENT_CATEGORIES.length - 1]) as ParsedIngredient["category"],
    }))
    .filter((item) => item.rawName.length > 0);
}

