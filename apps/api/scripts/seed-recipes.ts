/**
 * PantryPal — Recipe Seed Script
 *
 * Fetches recipes from Spoonacular in batches by category and stores them
 * in your Postgres DB with normalized ingredients.
 *
 * Run from repo root:
 *   npx tsx apps/api/scripts/seed-recipes.ts
 *
 * Requires .env with DATABASE_URL and SPOONACULAR_API_KEY
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─── Config ──────────────────────────────────────────────────────────────────

const SPOON_BASE = "https://api.spoonacular.com";

// Comma-separated keys supported, same as your existing spoonacular.service.ts
const SPOON_KEYS = (process.env.SPOONACULAR_API_KEYS || process.env.SPOONACULAR_API_KEY || "")
  .split(",")
  .map((k) => k.trim())
  .filter(Boolean);

// How many recipes to fetch per batch call (Spoonacular max is 100)
const BATCH_SIZE = 10;

// Delay between API calls in ms — prevents hammering the API and burning points
const DELAY_MS = 1200;

// ─── Seed batches ─────────────────────────────────────────────────────────────
//
// Each entry defines one "batch" to fetch.
// count     — how many recipes to fetch for this category
// params    — Spoonacular complexSearch query params
//
// Total here = 1,000 recipes across diverse categories.
// Adjust counts up/down based on your Spoonacular plan's daily point budget.
// Free plan (150 pts/day): set count to 70 per run, run daily for ~14 days.
// Cook plan (1500 pts/day): you can run everything in one go.

type SeedBatch = {
  count: number;
  params: Record<string, string | number>;
};

const SEED_BATCHES: SeedBatch[] = [
  // Diet-based
  { count: 120, params: { diet: "vegetarian" } },
  { count: 80,  params: { diet: "vegan" } },
  { count: 80,  params: { diet: "gluten free" } },
  { count: 60,  params: { diet: "ketogenic" } },

  // Cuisine-based
  { count: 100, params: { cuisine: "asian" } },
  { count: 100, params: { cuisine: "italian" } },
  { count: 80,  params: { cuisine: "mexican" } },
  { count: 80,  params: { cuisine: "mediterranean" } },
  { count: 60,  params: { cuisine: "indian" } },
  { count: 60,  params: { cuisine: "middle eastern" } },

  // Quick meals (useful for "what can I cook tonight")
  { count: 80,  params: { maxReadyTime: 30 } },

  // High protein
  { count: 100, params: { minProtein: 30 } },
];

// ─── Spoonacular types ────────────────────────────────────────────────────────

type SpoonSearchResult = {
  id: number;
  title: string;
  image?: string;
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
  extendedIngredients?: SpoonIngredient[];  // ← use the named type here
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Rotates through your API keys — same pattern as your spoonacular.service.ts
async function spoonFetch(path: string): Promise<Response> {
  if (SPOON_KEYS.length === 0) {
    throw new Error("No SPOONACULAR_API_KEY found in environment");
  }

  for (const key of SPOON_KEYS) {
    const url = `${SPOON_BASE}${path}&apiKey=${key}`;
    const res = await fetch(url);

    if (res.ok) return res;

    // 402 = quota exceeded, 429 = rate limited — try next key
    if (res.status === 402 || res.status === 429) continue;

    throw new Error(`Spoonacular error ${res.status} for ${path}`);
  }

  throw new Error("All Spoonacular API keys exhausted");
}

// ─── Step 1: Search for recipe IDs ───────────────────────────────────────────
//
// complexSearch returns lightweight results (id + title + image).
// We fetch IDs here, then get full details in step 2.
// offset lets us paginate — if we want 100 recipes we call with offset 0,
// then offset 10, then offset 20, etc.

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

// ─── Step 2: Fetch full recipe details ───────────────────────────────────────
//
// This gives us ingredients, instructions, diet tags, etc.
// Costs 1 point per recipe.

async function fetchRecipeDetail(id: number): Promise<SpoonRecipeDetail> {
  const res = await spoonFetch(
    `/recipes/${id}/information?includeNutrition=false&`,
  );
  return res.json() as Promise<SpoonRecipeDetail>;
}

// ─── Step 3: Normalize ingredient name ───────────────────────────────────────
//
// Spoonacular gives us nameClean (e.g. "boneless skinless chicken breast")
// and name (e.g. "chicken breasts"). We prefer nameClean, fall back to name,
// then trim and lowercase for consistency with your ingredients table.

type SpoonIngredient = {
  nameClean?: string;
  name?: string;
  original?: string;
  amount?: number;
  unit?: string;
};

function normalizeIngredientName(ingredient: SpoonIngredient): string {
  const raw = ingredient.nameClean || ingredient.name || ingredient.original || "";
  return raw.trim().toLowerCase();
}

// ─── Step 4: Save to DB ───────────────────────────────────────────────────────
//
// We upsert the recipe so re-running the script is safe — it won't
// create duplicates, it'll just update existing rows.

async function saveRecipe(detail: SpoonRecipeDetail): Promise<void> {
  const steps = (
      detail.analyzedInstructions?.[0]?.steps
        ?.map((s) => s.step?.trim())
        .filter((s): s is string => Boolean(s)) ?? []
    );

  const ingredients = (detail.extendedIngredients ?? []).filter(
    (i) => normalizeIngredientName(i).length > 0,
  );

  // Upsert the recipe row
  await prisma.recipe.upsert({
    where: { id: detail.id },
    update: {
      title: detail.title,
      imageSourceUrl: detail.image ?? null,
      cuisine: detail.cuisines ?? [],
      dietTags: detail.diets ?? [],
      readyMinutes: detail.readyInMinutes ?? null,
      servings: detail.servings ?? null,
      sourceUrl: detail.sourceUrl ?? null,
      summary: detail.summary ?? null,
      instructions: steps,
      rawData: detail as object,
      updatedAt: new Date(),
    },
    create: {
      id: detail.id,
      title: detail.title,
      imageSourceUrl: detail.image ?? null,
      cuisine: detail.cuisines ?? [],
      dietTags: detail.diets ?? [],
      readyMinutes: detail.readyInMinutes ?? null,
      servings: detail.servings ?? null,
      sourceUrl: detail.sourceUrl ?? null,
      summary: detail.summary ?? null,
      instructions: steps,
      rawData: detail as object,
    },
  });

  // Delete old ingredients for this recipe (clean re-seed)
  await prisma.recipeIngredient.deleteMany({
    where: { recipeId: detail.id },
  });

  // Insert fresh ingredients
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

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🌱 PantryPal Recipe Seed Script");
  console.log(`   Spoonacular keys loaded: ${SPOON_KEYS.length}`);
  console.log(`   Batch delay: ${DELAY_MS}ms\n`);

  if (SPOON_KEYS.length === 0) {
    console.error("❌ No Spoonacular API key found. Add SPOONACULAR_API_KEY to your .env");
    process.exit(1);
  }

  let totalSaved = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  for (const batch of SEED_BATCHES) {
    const label = JSON.stringify(batch.params);
    console.log(`\n📦 Batch: ${label} — target ${batch.count} recipes`);

    let fetched = 0;
    let offset = 0;

    while (fetched < batch.count) {
      const toFetch = Math.min(BATCH_SIZE, batch.count - fetched);

      // Search for recipe IDs
      let searchResults: SpoonSearchResult[];
      try {
        searchResults = await searchRecipes(batch.params, offset, toFetch);
        await sleep(DELAY_MS);
      } catch (err) {
        console.error(`  ❌ Search failed at offset ${offset}:`, err);
        break;
      }

      if (searchResults.length === 0) {
        console.log(`  ℹ️  No more results for ${label}`);
        break;
      }

      // For each result, fetch full details and save
      for (const result of searchResults) {
        // Skip if already in DB — avoids wasting points on re-fetching
        const existing = await prisma.recipe.findUnique({
          where: { id: result.id },
          select: { id: true },
        });

        if (existing) {
          totalSkipped++;
          process.stdout.write("·"); // dot for skipped
          continue;
        }

        try {
          const detail = await fetchRecipeDetail(result.id);
          await sleep(DELAY_MS);

          await saveRecipe(detail);
          totalSaved++;
          process.stdout.write("✓"); // checkmark for saved
        } catch (err) {
          totalFailed++;
          process.stdout.write("✗"); // x for failed
          console.error(`\n  ❌ Failed to fetch/save recipe ${result.id}:`, err);
        }
      }

      fetched += searchResults.length;
      offset += searchResults.length;
      console.log(`\n  Progress: ${fetched}/${batch.count}`);
    }
  }

  console.log("\n\n============================================================");
  console.log(`✅ Seed complete`);
  console.log(`   Saved  : ${totalSaved}`);
  console.log(`   Skipped: ${totalSkipped} (already in DB)`);
  console.log(`   Failed : ${totalFailed}`);
  console.log("============================================================\n");
}

main()
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());