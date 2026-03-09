import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import { Prisma } from "@prisma/client";
import { prisma } from "../../../common/db/prisma.js";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3 } from "../../../common/storage/s3.js";
import { getOrCreateTodayPinnedTopic } from "../../community/index.js";
import { createPantryPalSystemPost } from "../../community/services/system.post.service.js";

const BEDROCK_REGION = process.env.BEDROCK_REGION || process.env.AWS_REGION || "us-east-2";
const BEDROCK_MODEL_ID =
  process.env.BEDROCK_MODEL_ID || "anthropic.claude-3-5-sonnet-20240620-v1:0";

const bedrock = new BedrockRuntimeClient({ region: BEDROCK_REGION });

const bucket = process.env.S3_BUCKET_DAILY_SPECIALS || "";

// Rotates through world regions by day-of-year so each day has a different emphasis
const REGIONS = [
  "West Africa", "East Africa", "North Africa",
  "Middle East", "South Asia", "Southeast Asia", "East Asia", "Central Asia",
  "Eastern Europe", "Western Europe", "Scandinavia", "Mediterranean",
  "Latin America", "Caribbean", "North America", "Oceania",
];

type GeneratedSpecial = {
  dishName: string;
  cuisine?: string;
  origin?: string;
  description?: string;
  history?: string;
  culturalMeaning?: string;
  inspiredBy?: string;
  funFact?: string;
  ingredients?: Array<{ name: string; qty?: string }>;
  instructions?: Array<{ step: number; text: string }>;
  imageUrl?: string | null;
};

type DailySpecialResponse = Awaited<ReturnType<typeof prisma.dailySpecial.findUnique>> & {
  imageUrl?: string | null;
};

function getTodayUtcDateOnly(): Date {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function toInputJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function extractJson(raw: string): GeneratedSpecial {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```json\s*([\s\S]*?)\s*```/i)?.[1];
  const candidate = fenced ?? trimmed;
  return JSON.parse(candidate) as GeneratedSpecial;
}

function isHttpUrl(value: string | null | undefined): value is string {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

// Returns the day-of-year (1-366) for a given ISO date string
function getDayOfYear(dateIso: string): number {
  const date = new Date(dateIso);
  const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 0));
  return Math.floor((date.getTime() - start.getTime()) / 86400000);
}

// Fetches the last N dish names from DB so we can tell Bedrock to avoid them
async function getRecentDishNames(locale: string, days = 14): Promise<string[]> {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - days);

  const rows = await prisma.dailySpecial.findMany({
    where: { locale, specialDate: { gte: since } },
    select: { dishName: true },
    orderBy: { specialDate: "desc" },
  });

  return rows.map((r) => r.dishName);
}

async function callBedrock(
  dateIso: string,
  locale: string,
  recentDishes: string[]
): Promise<GeneratedSpecial> {
  const dayOfYear = getDayOfYear(dateIso);
  const todayRegion = REGIONS[dayOfYear % REGIONS.length];

  const excludeClause =
    recentDishes.length > 0
      ? `- Do NOT pick any of these recently featured dishes: ${recentDishes.join(", ")}.`
      : "";

  const prompt = `
Return ONLY valid JSON. No markdown, no code fences, no explanation — just the raw JSON object.
Required keys: dishName, cuisine, origin, description, history, culturalMeaning, inspiredBy, funFact, ingredients, instructions, imageUrl.

Rules:
- Date: ${dateIso}
- Today's featured region: ${todayRegion} — pick a dish from this region.
- Pick a specific traditional or lesser-known dish. Avoid globally dominant dishes like sushi, pizza, pasta, burger, or fried chicken.
- The dish must be genuinely from the region's culinary heritage.
${excludeClause}
- Keep all text concise (1-2 sentences per field).
- ingredients: array of {name, qty}
- instructions: array of {step, text} with 4-6 steps
- imageUrl: null
`.trim();

  const res = await bedrock.send(
    new ConverseCommand({
      modelId: BEDROCK_MODEL_ID,
      messages: [{ role: "user", content: [{ text: prompt }] }],
      // Higher temperature = more creative variety. 1.0 is the max for Nova models.
      inferenceConfig: { temperature: 1.0, maxTokens: 1000 },
    })
  );

  const text = (res.output?.message?.content ?? [])
    .map((block) => ("text" in block ? block.text : ""))
    .join("\n")
    .trim();

  if (!text) throw new Error("Empty Bedrock response");

  const parsed = extractJson(text);
  if (!parsed.dishName) throw new Error("Bedrock response missing dishName");

  return parsed;
}

async function fetchDishImageUrl(dishName: string, cuisine?: string): Promise<string | null> {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return null;

  const queries = [
    `${dishName} food`,                          // specific: "Knafeh food"
    cuisine ? `${cuisine} food` : null,          // cuisine: "Middle Eastern food"
    "world cuisine traditional dish",            // generic fallback
  ].filter(Boolean) as string[];

  for (const q of queries) {
    const url = `https://api.unsplash.com/photos/random?query=${encodeURIComponent(q)}&orientation=landscape&content_filter=high`;
    const res = await fetch(url, {
      headers: { Authorization: `Client-ID ${key}` },
    });

    if (!res.ok) {
      console.warn(`Unsplash fetch failed for "${q}": ${res.status}`);
      continue;
    }

    const data = (await res.json()) as { urls?: { regular?: string } };
    if (data.urls?.regular) {
      console.log(`[home] Unsplash image found for query: "${q}"`);
      return data.urls.regular;
    }
  }

  console.warn("[home] Unsplash returned no images for any query");
  return null;
}

async function getFromDB(specialDate: Date, locale: string) {
  return prisma.dailySpecial.findUnique({
    where: { specialDate_locale: { specialDate, locale } },
  });
}

async function uploadDishImageToS3(imageUrl: string, dateIso: string, locale: string) {
  if (!bucket) throw new Error("Missing S3_BUCKET_DAILY_SPECIALS");

  const res = await fetch(imageUrl);
  if (!res.ok) throw new Error("Failed to download source image");

  const contentType = res.headers.get("content-type") || "image/jpeg";
  const bytes = Buffer.from(await res.arrayBuffer());
  const key = `daily-specials/${locale}/${dateIso}.jpg`;

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: bytes,
      ContentType: contentType,
    })
  );

  return key;
}

async function tryUploadDishImageToS3(imageUrl: string, dateIso: string, locale: string) {
  try {
    if (!isHttpUrl(imageUrl)) return null;
    return await uploadDishImageToS3(imageUrl, dateIso, locale);
  } catch (error) {
    console.error("S3 upload failed:", error);
    return null;
  }
}

async function getSignedImageUrl(key: string) {
  if (!bucket) return null;

  return getSignedUrl(s3, new GetObjectCommand({ Bucket: bucket, Key: key }), {
    expiresIn: 3600,
  });
}

async function hydrateSignedImage(record: DailySpecialResponse): Promise<DailySpecialResponse> {
  if (!record) return record;
  if (!record.imageS3Key) return record;

  const signed = await getSignedImageUrl(record.imageS3Key);
  return {
    ...record,
    imageUrl: signed,
  };
}

async function saveToDB(
  specialDate: Date,
  locale: string,
  generated: GeneratedSpecial,
  imageS3Key: string | null
) {
  return prisma.dailySpecial.create({
    data: {
      specialDate,
      locale,
      dishName: generated.dishName,
      cuisine: generated.cuisine ?? null,
      origin: generated.origin ?? null,
      description: generated.description ?? null,
      history: generated.history ?? null,
      culturalMeaning: generated.culturalMeaning ?? null,
      inspiredBy: generated.inspiredBy ?? null,
      funFact: generated.funFact ?? null,
      ingredients: generated.ingredients ? toInputJson(generated.ingredients) : Prisma.DbNull,
      instructions: generated.instructions ? toInputJson(generated.instructions) : Prisma.DbNull,
      imageUrl: null,
      imageS3Key,
      sourceModel: BEDROCK_MODEL_ID,
      rawPayload: toInputJson(generated),
    },
  });
}

export async function getOrCreateDailySpecial(locale = "global") {
  const specialDate = getTodayUtcDateOnly();
  const dateIso = specialDate.toISOString().slice(0, 10);

  const cached = await getFromDB(specialDate, locale);
  if (cached) {
    if (!cached.imageS3Key) {
      // Repair old/incomplete rows so later requests always get an image
      const unsplashImage = await fetchDishImageUrl(cached.dishName, cached.cuisine ?? undefined);
      const defaultImage = process.env.DEFAULT_DISH_IMAGE_URL ?? null;
      const sourceImageUrl = unsplashImage ?? (isHttpUrl(defaultImage) ? defaultImage : null);

      if (sourceImageUrl) {
        const repairedKey = await tryUploadDishImageToS3(sourceImageUrl, dateIso, locale);
        if (repairedKey) {
          const repaired = await prisma.dailySpecial.update({
            where: { id: cached.id },
            data: { imageS3Key: repairedKey },
          });
          return hydrateSignedImage(repaired);
        }
      }
    }

    return hydrateSignedImage(cached);
  }

  // Fetch last 14 days of dishes so Bedrock knows what to avoid
  const recentDishes = await getRecentDishNames(locale, 14);
  console.log(`[home] Generating dish for ${dateIso}, avoiding: ${recentDishes.join(", ") || "none"}`);

  const generated = await callBedrock(dateIso, locale, recentDishes);
  console.log(`[home] Bedrock selected: ${generated.dishName}`);

  const bedrockImage = isHttpUrl(generated.imageUrl) ? generated.imageUrl : null;
  const unsplashImage = await fetchDishImageUrl(generated.dishName, generated.cuisine);
  const defaultImage = process.env.DEFAULT_DISH_IMAGE_URL ?? null;
  const sourceImageUrl =
    bedrockImage ??
    unsplashImage ??
    (isHttpUrl(defaultImage) ? defaultImage : null) ??
    null;

  let imageS3Key: string | null = null;
  if (sourceImageUrl) {
    imageS3Key = await tryUploadDishImageToS3(sourceImageUrl, dateIso, locale);
  }

  const saved = await saveToDB(specialDate, locale, generated, imageS3Key);
  const hydrated = await hydrateSignedImage(saved);

  // Auto-create today's pinned community topic from the daily special
  try {
    const topic = await getOrCreateTodayPinnedTopic({
      dailySpecialId: saved.id,
      dishName: saved.dishName,
      imageUrl: hydrated?.imageUrl ?? null,
      description: saved.description ?? null,
    });

    await createPantryPalSystemPost({
      topicId: topic.topicId,
      dishName: saved.dishName,
      description: saved.description ?? null,
      imageUrl: hydrated?.imageUrl ?? null,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn("Failed to create pinned community topic or system post:", err);
  }

  return hydrated;
}