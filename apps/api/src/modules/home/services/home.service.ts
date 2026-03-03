import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import { Prisma } from "@prisma/client";
import { prisma } from "../../../common/db/prisma.js";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const BEDROCK_REGION = process.env.BEDROCK_REGION || process.env.AWS_REGION || "us-east-1";
const BEDROCK_MODEL_ID =
  process.env.BEDROCK_MODEL_ID || "anthropic.claude-3-5-sonnet-20240620-v1:0";

const bedrock = new BedrockRuntimeClient({ region: BEDROCK_REGION });

const s3 = new S3Client({ region: process.env.AWS_REGION || "us-east-2" });
const bucket = process.env.S3_BUCKET_DAILY_SPECIALS || "";

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

async function callBedrock(dateIso: string, locale: string): Promise<GeneratedSpecial> {
  const prompt = `
Return ONLY valid JSON with keys:
dishName, cuisine, origin, description, history, culturalMeaning, inspiredBy, funFact, ingredients, instructions, imageUrl.

Context:
- Date: ${dateIso}
- Locale: ${locale}
- Pick one culturally significant dish from anywhere in the world.
- Keep text concise.
- ingredients: array of {name, qty}
- instructions: array of {step, text}
- imageUrl: null if unavailable.
`.trim();

  const res = await bedrock.send(
    new ConverseCommand({
      modelId: BEDROCK_MODEL_ID,
      messages: [{ role: "user", content: [{ text: prompt }] }],
      inferenceConfig: { temperature: 0.7, maxTokens: 900 },
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

  const query = encodeURIComponent(`${dishName} ${cuisine ?? ""} food`.trim());
  const url = `https://api.unsplash.com/photos/random?query=${query}&orientation=landscape&content_filter=high`;

  const res = await fetch(url, {
    headers: { Authorization: `Client-ID ${key}` },
  });

  if (!res.ok) {
    console.warn("Unsplash fetch failed:", res.status, res.statusText);
    return null;
  }

  const data = (await res.json()) as { urls?: { regular?: string } };
  return data.urls?.regular ?? null;
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
      // Repair old/incomplete rows so later requests always get an image.
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

  const generated = await callBedrock(dateIso, locale);

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
  return hydrateSignedImage(saved);
}

