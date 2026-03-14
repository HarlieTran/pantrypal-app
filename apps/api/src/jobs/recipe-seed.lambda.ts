if (process.env.NODE_ENV !== "production") {
  const { config } = await import("dotenv");
  config();
}

import { PrismaClient } from "@prisma/client";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const prisma = new PrismaClient();

const SPOON_BASE = "https://api.spoonacular.com";

const SPOON_KEYS = (process.env.SPOONACULAR_API_KEYS || process.env.SPOONACULAR_API_KEY || "")
  .split(",")
  .map((k) => k.trim())
  .filter(Boolean);

const DELAY_MS = 1200;

const s3 = new S3Client({ region: process.env.AWS_REGION || "us-east-2" });
const RECIPE_IMAGES_BUCKET = process.env.S3_BUCKET_RECIPE_CACHE || "";

// ─── How many recipes per nightly run ────────────────────────────────────────
//
// Free plan:  keep total across all batches under 70
// Cook plan:  can go up to 700 per night
// Adjust counts here based on your plan

type SeedBatch = {
  count: number;
  params: Record<string, string | number>;
};

const SEED_BATCHES: SeedBatch[] = [
  { count: 10, params: { diet: "vegetarian" } },
  { count: 10, params: { diet: "vegan" } },
  { count: 10, params: { diet: "gluten free" } },
  { count: 10, params: { cuisine: "asian" } },
  { count: 10, params: { cuisine: "italian" } },
  { count: 10, params: { cuisine: "mexican" } },
  { count: 10, params: { maxReadyTime: 30 } },
];

// ─── Types ────────────────────────────────────────────────────────────────────

type SpoonSearchResult = {
  id: number;
  title: string;
  image?: string;
};

type SpoonIngredient = {
  nameClean?: string;
  name?: string;
  original?: string;
  amount?: number;
  unit?: string;
};

type SpoonRecipeDetail = {
  id: number;
  title: string;
  image?: string;
  cuisines?: string[];
  diets?: string[];
  readyInMinutes?: number;
  servings?: number;
  sourceUrl?: string;
  summary?: string;
  analyzedInstructions?: Array<{
    steps?: Array<{ step?: string }>;
  }>;
  extendedIngredients?: SpoonIngredient[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function spoonFetch(path: string): Promise<Response> {
  if (SPOON_KEYS.length === 0) throw new Error("No SPOONACULAR_API_KEY found");

  for (const key of SPOON_KEYS) {
    const url = `${SPOON_BASE}${path}&apiKey=${key}`;
    const res = await fetch(url);
    if (res.ok) return res;
    if (res.status === 402 || res.status === 429) continue;
    throw new Error(`Spoonacular error ${res.status}`);
  }

  throw new Error("All Spoonacular keys exhausted");
}

async function searchRecipes(
  params: Record<string, string | number>,
  offset: number,
  number: number,
): Promise<SpoonSearchResult[]> {
  const query = new URLSearchParams({
    number: String(number),
    offset: String(offset),
    addRecipeInformation: "false",
    ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
  });

  const res = await spoonFetch(`/recipes/complexSearch?${query.toString()}`);
  const data = await res.json() as { results?: SpoonSearchResult[] };
  return data.results ?? [];
}

async function fetchRecipeDetail(id: number): Promise<SpoonRecipeDetail> {
  const res = await spoonFetch(`/recipes/${id}/information?includeNutrition=false&`);
  return res.json() as Promise<SpoonRecipeDetail>;
}

function normalizeIngredientName(ingredient: SpoonIngredient): string {
  const raw = ingredient.nameClean || ingredient.name || ingredient.original || "";
  return raw.trim().toLowerCase();
}

async function saveRecipe(detail: SpoonRecipeDetail): Promise<void> {
  const steps = (
    detail.analyzedInstructions?.[0]?.steps
      ?.map((s) => s.step?.trim())
      .filter((s): s is string => Boolean(s)) ?? []
  );

  function isValidIngredient(name: string): boolean {
    if (!name || name.length < 2) return false;
    if (name.length > 50) return false;           
    if (name.includes("you can")) return false;   
    if (name.includes(" or ")) return false;      
    return true;
  }

  const ingredients = (detail.extendedIngredients ?? []).filter((i) => {
    const name = normalizeIngredientName(i);
    return name.length > 0 && isValidIngredient(name);
  });

  // ── Upload image to S3 ──────────────────────────────────────────────────
  // Download from Spoonacular CDN and store in your own S3 bucket.
  let imageS3Key: string | null = null;
  if (detail.image) {
    imageS3Key = await uploadRecipeImageToS3(detail.image, detail.id);
    await sleep(200); // small delay to avoid hammering S3
  }

  await prisma.recipe.upsert({
    where: { id: detail.id },
    update: {
      title: detail.title,
      image: imageS3Key,
      imageSourceUrl: detail.image ?? null,
      cuisine: detail.cuisines ?? [],
      dietTags: detail.diets ?? [],
      readyMinutes: detail.readyInMinutes ?? null,
      servings: detail.servings ?? null,
      sourceUrl: detail.sourceUrl ?? null,
      summary: detail.summary ?? null,
      instructions: steps as string[],
      rawData: detail as object,
      updatedAt: new Date(),
    },
    create: {
      id: detail.id,
      title: detail.title,
      image: imageS3Key,
      imageSourceUrl: detail.image ?? null,
      cuisine: detail.cuisines ?? [],
      dietTags: detail.diets ?? [],
      readyMinutes: detail.readyInMinutes ?? null,
      servings: detail.servings ?? null,
      sourceUrl: detail.sourceUrl ?? null,
      summary: detail.summary ?? null,
      instructions: steps as string[],
      rawData: detail as object,
    },
  });

  await prisma.recipeIngredient.deleteMany({ where: { recipeId: detail.id } });

  if (ingredients.length > 0) {
    await prisma.recipeIngredient.createMany({
      data: ingredients.map((ing) => ({
        recipeId: detail.id,
        canonicalName: normalizeIngredientName(ing),
        rawName: ing.original ?? ing.name ?? "",
        amount: typeof ing.amount === "number" ? ing.amount : null,
        unit: ing.unit ?? null,
      })),
    });
  }
}

// Downloads image from Spoonacular CDN and uploads to your S3.
// Returns the S3 key on success, null on failure.
// Same pattern as home.service.ts tryUploadDishImageToS3.

async function uploadRecipeImageToS3(
  imageUrl: string,
  recipeId: number,
): Promise<string | null> {
  if (!RECIPE_IMAGES_BUCKET) {
    console.warn("[recipe-seed] S3_BUCKET_RECIPE_IMAGES not set, skipping image upload");
    return null;
  }

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
  } catch (err) {
    console.warn(`[recipe-seed] Image upload failed for recipe ${recipeId}:`, err);
    return null;
  }
}

// ─── Helper for offset persistence (implement according to your DB) ──────────
const seedOffsets = new Map<string, number>();

async function loadOffset(batchKey: string): Promise<number> {
  const record = await prisma.seedOffset.findUnique({
    where: { key: batchKey },
  });
  return record?.offset ?? 0;
}

async function saveOffset(batchKey: string, offset: number): Promise<void> {
  await prisma.seedOffset.upsert({
    where: { key: batchKey },
    update: { offset },
    create: { key: batchKey, offset },
  });
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function handler() {
  console.log("[recipe-seed] Starting nightly recipe seed");

  let totalSaved = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  try {
    for (const batch of SEED_BATCHES) {
      const batchKey = JSON.stringify(batch.params);
      console.log(`[recipe-seed] Batch: ${batchKey}`);

      // Load the last offset for this batch (start from where we left off)
      let offset = await loadOffset(batchKey);
      // Alternative quick start: use count of existing matching recipes
      // offset = await prisma.recipe.count({ where: buildWhere(batch.params) });

      const batchSize = 10;
      let newInBatch = 0;               // how many new recipes we've saved in this batch
      const seenInBatch = new Set<number>(); // avoid duplicates within the same batch

      while (newInBatch < batch.count) {
        const toFetch = Math.min(batchSize, batch.count - newInBatch);

        let searchResults: SpoonSearchResult[] = [];
        try {
          searchResults = await searchRecipes(batch.params, offset, toFetch);
          await sleep(DELAY_MS);
        } catch (err) {
          console.error(`[recipe-seed] Search failed at offset ${offset}:`, err);
          break;
        }

        if (searchResults.length === 0) {
          console.log(`[recipe-seed] No more results for ${batchKey} at offset ${offset}`);
          break; // no more recipes from Spoonacular for this query
        }

        // ─── ALWAYS advance offset by the number of results we fetched ───
        offset += searchResults.length;
        // Save progress after each page (in case of interruption)
        await saveOffset(batchKey, offset);

        let foundInPage = 0; // new recipes found in this page

        for (const result of searchResults) {
          // Skip if we've already seen this ID in the current batch
          if (seenInBatch.has(result.id)) {
            console.log(`[recipe-seed] Skipping duplicate in batch: ${result.id}`);
            continue;
          }
          seenInBatch.add(result.id);

          const existing = await prisma.recipe.findUnique({
            where: { id: result.id },
            select: { id: true, image: true, imageSourceUrl: true },
          });

          // Case 1: Fully seeded recipe – skip detail fetch
          if (existing && existing.image) {
            totalSkipped++;
            continue;
          }

          // Case 2: Partial recipe – backfill image only
          if (existing && !existing.image && existing.imageSourceUrl) {
            const imageS3Key = await uploadRecipeImageToS3(existing.imageSourceUrl, existing.id);
            if (imageS3Key) {
              await prisma.recipe.update({
                where: { id: existing.id },
                data: { image: imageS3Key },
              });
            }
            totalSkipped++;
            await sleep(DELAY_MS);
            continue;
          }

          // Case 3: Brand new recipe – fetch full details
          try {
            const detail = await fetchRecipeDetail(result.id);
            await sleep(DELAY_MS);
            await saveRecipe(detail);
            totalSaved++;
            newInBatch++;      // count toward batch target
            foundInPage++;
            console.log(`[recipe-seed] ✓ ${detail.title}`);
          } catch (err) {
            totalFailed++;
            console.error(`[recipe-seed] ✗ Failed recipe ${result.id}:`, err);
          }
        }

        // If a whole page returned zero new recipes, we're scanning already‑seen territory.
        // That's okay – we keep advancing offset. Log a warning for visibility.
        if (foundInPage === 0) {
          console.log(`[recipe-seed] Page at offset ${offset - searchResults.length} had 0 new recipes for ${batchKey}`);
        }
      }

      console.log(`[recipe-seed] Batch ${batchKey} complete: ${newInBatch}/${batch.count} new recipes`);
    }

    console.log(`[recipe-seed] Done — saved: ${totalSaved}, skipped: ${totalSkipped}, failed: ${totalFailed}`);

    return {
      statusCode: 200,
      body: { success: true, totalSaved, totalSkipped, totalFailed },
    };
  } catch (error) {
    console.error("[recipe-seed] Fatal error:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

