/**
 * recipe-query.service.ts
 *
 * Queries recipes from your own DB instead of calling Spoonacular at runtime.
 * Replaces findRecipesByIngredients() from spoonacular.service.ts.
 */

import { prisma } from "../../../common/db/prisma.js";
import { s3 } from "../../../common/storage/s3.js";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// ─── Types ────────────────────────────────────────────────────────────────────

export type RecipeMatch = {
  id: number;
  title: string;
  image: string | null;
  imageSourceUrl: string | null;
  cuisine: string[];
  dietTags: string[];
  readyMinutes: number | null;
  servings: number | null;
  matchedIngredients: string[];      // pantry ingredients this recipe uses
  missedIngredients: string[];       // recipe ingredients not in pantry
  matchedCount: number;
  missedCount: number;
  totalIngredientCount: number;
};

// ─── Normalize helper ─────────────────────────────────────────────────────────
//
// Converts ingredient names to lowercase trimmed strings for comparison.
// Must match the normalization used in seed-recipes.lambda.ts.

function normalize(name: string): string {
  return name.trim().toLowerCase();
}

const RECIPE_CACHE_BUCKET = process.env.S3_BUCKET_RECIPE_CACHE || "";

async function getRecipeImageUrl(s3Key: string | null, fallbackUrl: string | null): Promise<string | null> {
  // If we have an S3 key, generate a signed URL
  if (s3Key && RECIPE_CACHE_BUCKET) {
    try {
      const command = new GetObjectCommand({
        Bucket: RECIPE_CACHE_BUCKET,
        Key: s3Key,
      });
      return await getSignedUrl(s3, command, { expiresIn: 3600 });
    } catch {
      // Fall through to fallback
    }
  }

  // Fall back to Spoonacular CDN URL
  return fallbackUrl ?? null;
}

// ─── Main query ───────────────────────────────────────────────────────────────
//
// Strategy:
// 1. Normalize all pantry ingredient names
// 2. Find all recipe_ingredients rows where canonicalName matches any pantry item
// 3. Group by recipe — count how many pantry items each recipe uses
// 4. Only return recipes where at least MIN_MATCH ingredients are covered
// 5. For each matched recipe, also compute missedIngredients

const MIN_MATCH = 2;  // recipe must use at least 2 of your pantry items to show up

export async function findRecipesFromPantry(
  pantryIngredientNames: string[],
  limit = 20,
): Promise<RecipeMatch[]> {

  if (pantryIngredientNames.length === 0) return [];

  const normalized = pantryIngredientNames.map(normalize);

  // Step 1 — find all recipe_ingredients that overlap with the pantry
  // We do this in a single DB query rather than loading all recipes
  const matched = await prisma.recipeIngredient.findMany({
    where: {
      canonicalName: {
        in: normalized,
      },
    },
    select: {
      recipeId: true,
      canonicalName: true,
    },
  });

  if (matched.length === 0) return [];

  // Step 2 — group by recipeId, count how many pantry ingredients each recipe uses
  const recipeMatchMap = new Map<number, Set<string>>();

  for (const row of matched) {
    if (!recipeMatchMap.has(row.recipeId)) {
      recipeMatchMap.set(row.recipeId, new Set());
    }
    recipeMatchMap.get(row.recipeId)!.add(row.canonicalName);
  }

  // Step 3 — filter recipes that don't meet the minimum match threshold
  const qualifyingRecipeIds = [...recipeMatchMap.entries()]
    .filter(([, ingredients]) => ingredients.size >= MIN_MATCH)
    .sort((a, b) => b[1].size - a[1].size)   // sort by most matched first
    .slice(0, limit * 2)                       // fetch extra for scoring headroom
    .map(([recipeId]) => recipeId);

  if (qualifyingRecipeIds.length === 0) return [];

  // Step 4 — load full recipe rows + all their ingredients
  const recipes = await prisma.recipe.findMany({
    where: {
      id: { in: qualifyingRecipeIds },
    },
    include: {
      ingredients: {
        select: {
          canonicalName: true,
        },
      },
    },
  });

  // Step 5 — build the RecipeMatch result for each recipe
  const pantrySet = new Set(normalized);

  const results: RecipeMatch[] = await Promise.all(
    recipes.map(async (recipe) => {
      const allIngredients = recipe.ingredients.map((i) => i.canonicalName);
      const matchedIngredients = allIngredients.filter((i) => pantrySet.has(i));
      const missedIngredients = allIngredients.filter((i) => !pantrySet.has(i));

      const imageUrl = await getRecipeImageUrl(recipe.image, recipe.imageSourceUrl);

    return {
      id: recipe.id,
      title: recipe.title,
      image: imageUrl,
      imageSourceUrl: recipe.imageSourceUrl,
      cuisine: recipe.cuisine,
      dietTags: recipe.dietTags,
      readyMinutes: recipe.readyMinutes,
      servings: recipe.servings,
      matchedIngredients,
      missedIngredients,
      usedIngredients: matchedIngredients,
      matchedCount: matchedIngredients.length,
      missedCount: missedIngredients.length,
      totalIngredientCount: allIngredients.length,
    };
  }),
);
  // Sort by matched count descending before returning
  return results
    .sort((a, b) => b.matchedCount - a.matchedCount)
    .slice(0, limit);
}