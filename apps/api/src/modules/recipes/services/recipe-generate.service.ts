import { prisma } from "../../../common/db/prisma.js";
import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { stripCodeFence } from "../../../common/ai/bedrock.js";

const BEDROCK_REGION = process.env.BEDROCK_REGION || process.env.AWS_REGION || "us-east-2";
const BEDROCK_MODEL_ID = process.env.BEDROCK_MODEL_ID || "amazon.nova-lite-v1:0";
const RECIPE_IMAGES_BUCKET = process.env.S3_BUCKET_RECIPE_CACHE || "";
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || "";

const bedrock = new BedrockRuntimeClient({ region: BEDROCK_REGION });
const s3 = new S3Client({ region: process.env.AWS_REGION || "us-east-2" });

function generateAiRecipeId(): number {
  return 1_500_000_000 + Math.floor(Math.random() * 600_000_000);
}

// ─── Types ────────────────────────────────────────────────────────────────────

type GeneratedRecipe = {
  title: string;
  cuisine: string[];
  dietTags: string[];
  readyMinutes: number;
  servings: number;
  summary: string;
  instructions: string[];
  ingredients: Array<{
    canonicalName: string;
    rawName: string;
    amount: number;
    unit: string;
  }>;
};

// ─── Bedrock ──────────────────────────────────────────────────────────────────

async function generateRecipeWithBedrock(
  name: string,
  targetServings: number,
): Promise<GeneratedRecipe> {
  const prompt = `
Generate a recipe for "${name}" for ${targetServings} servings.
Return ONLY valid JSON with no markdown, no code fences, no explanation.
Required schema:
{
  "title": "string — proper recipe name",
  "cuisine": ["string"] — e.g. ["italian"], ["thai"],
  "dietTags": ["string"] — e.g. ["vegetarian"], ["gluten-free"], [],
  "readyMinutes": number,
  "servings": ${targetServings},
  "summary": "string — 1-2 sentence description",
  "instructions": ["string"] — 4-8 steps,
  "ingredients": [
    {
      "canonicalName": "string — simple normalized name e.g. chicken breast",
      "rawName": "string — as it appears in recipe e.g. boneless chicken breast",
      "amount": number,
      "unit": "string — g, kg, ml, l, tsp, tbsp, cup, pcs"
    }
  ]
}
Rules:
- canonicalName must be lowercase simple English
- Keep instructions concise (1-2 sentences each)
- Scale all ingredient amounts for exactly ${targetServings} servings
- Return only the JSON object, nothing else
`.trim();

  const res = await bedrock.send(
    new ConverseCommand({
      modelId: BEDROCK_MODEL_ID,
      messages: [{ role: "user", content: [{ text: prompt }] }],
      inferenceConfig: { temperature: 0.3, maxTokens: 1500 },
    }),
  );

  const text = (res.output?.message?.content ?? [])
    .map((block) => ("text" in block ? block.text : ""))
    .join("")
    .trim();

  if (!text) throw new Error("Bedrock returned empty response");

  const parsed = JSON.parse(stripCodeFence(text)) as GeneratedRecipe;
  if (!parsed.title) throw new Error("Bedrock response missing title");

  return parsed;
}

// ─── Unsplash ─────────────────────────────────────────────────────────────────

async function fetchRecipeImageUrl(
  title: string,
  cuisine: string[],
): Promise<string | null> {
  if (!UNSPLASH_ACCESS_KEY) return null;

  const queries = [
    `${title} food dish`,
    cuisine.length > 0 ? `${cuisine[0]} food` : null,
    "food dish recipe",
  ].filter(Boolean) as string[];

  for (const q of queries) {
    try {
      const res = await fetch(
        `https://api.unsplash.com/photos/random?query=${encodeURIComponent(q)}&orientation=landscape&content_filter=high`,
        { headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` } },
      );
      if (!res.ok) continue;
      const data = await res.json() as { urls?: { regular?: string } };
      if (data.urls?.regular) return data.urls.regular;
    } catch {
      continue;
    }
  }

  return null;
}

// ─── S3 ───────────────────────────────────────────────────────────────────────

async function uploadImageToS3(
  imageUrl: string,
  recipeId: number,
): Promise<string | null> {
  if (!RECIPE_IMAGES_BUCKET) return null;

  try {
    const res = await fetch(imageUrl);
    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") || "image/jpeg";
    const bytes = Buffer.from(await res.arrayBuffer());
    const ext = imageUrl.split(".").pop()?.split("?")[0] ?? "jpg";
    const key = `recipe-images/${recipeId}.${ext}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: RECIPE_IMAGES_BUCKET,
        Key: key,
        Body: bytes,
        ContentType: contentType,
      }),
    );

    return key;
  } catch {
    return null;
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────


export async function generateAndSaveRecipe(
  name: string,
  targetServings = 4,
): Promise<{
  id: number;
  title: string;
  image: string | null;
  imageSourceUrl: string | null;
  cuisine: string[];
  dietTags: string[];
  readyMinutes: number | null;
  servings: number | null;
  isNew: boolean;
}> {
  // Step 1 — check DB first before calling Bedrock
  const existing = await prisma.recipe.findFirst({
    where: { title: { equals: name.trim(), mode: "insensitive" } },
    select: { id: true, title: true, image: true, imageSourceUrl: true, cuisine: true, dietTags: true, readyMinutes: true, servings: true },
  });

  if (existing) {
    return { ...existing, isNew: false };
  }

  // Step 2 — generate with Bedrock
  const generated = await generateRecipeWithBedrock(name, targetServings);

  // Step 3 — fetch image from Unsplash
  const unsplashUrl = await fetchRecipeImageUrl(generated.title, generated.cuisine);

  // Step 4 — we need a temporary ID to upload image
  // Create the recipe first without image, then update
  const saved = await prisma.recipe.create({
    data: {
      id: generateAiRecipeId(),
      title: generated.title,
      cuisine: generated.cuisine,
      dietTags: generated.dietTags,
      readyMinutes: generated.readyMinutes,
      servings: generated.servings,
      summary: generated.summary,
      instructions: generated.instructions,
      imageSourceUrl: unsplashUrl,
      rawData: generated as object,
    },
  });

  // Step 5 — upload image to S3
  let imageS3Key: string | null = null;
  if (unsplashUrl) {
    imageS3Key = await uploadImageToS3(unsplashUrl, saved.id);
    if (imageS3Key) {
      await prisma.recipe.update({
        where: { id: saved.id },
        data: { image: imageS3Key },
      });
    }
  }

  // Step 6 — save ingredients
  if (generated.ingredients.length > 0) {
    await prisma.recipeIngredient.createMany({
      data: generated.ingredients.map((ing) => ({
        recipeId: saved.id,
        canonicalName: ing.canonicalName.trim().toLowerCase(),
        rawName: ing.rawName,
        amount: ing.amount,
        unit: ing.unit,
      })),
    });
  }

  return {
    id: saved.id,
    title: saved.title,
    image: imageS3Key,
    imageSourceUrl: unsplashUrl,
    cuisine: saved.cuisine,
    dietTags: saved.dietTags,
    readyMinutes: saved.readyMinutes,
    servings: saved.servings,
    isNew: true,
  };
}