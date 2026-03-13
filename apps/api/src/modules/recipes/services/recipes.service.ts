
// import { getPantryItems } from "../../pantry/index.js";
// import {
//   findRecipesByIngredients,
//   getRecipeInformation,
//   type SpoonFindByIngredientsRecipe,
// } from "./spoonacular.service.js";

// export type RecipeSuggestion = {
//   id: number;
//   title: string;
//   image: string;
//   usedIngredientCount: number;
//   missedIngredientCount: number;
//   usedIngredients: string[];
//   missedIngredients: string[];
//   expiringSoonUsedCount: number;
//   score: number;
// };

// function normName(name: string) {
//   return name.trim().toLowerCase();
// }

// export async function getRecipeSuggestionsForUser(userId: string, limit = 12): Promise<{
//   pantrySignature: string;
//   recipes: RecipeSuggestion[];
// }> {
//   const pantryItems = await getPantryItems(userId);

//   const ingredientNames = [
//     ...new Set(
//       pantryItems
//         .map((i) => i.canonicalName || i.rawName)
//         .map((x) => x.trim())
//         .filter(Boolean),
//     ),
//   ];

//   const pantrySignature = ingredientNames
//     .map((x) => normName(x))
//     .sort((a, b) => a.localeCompare(b))
//     .join("|");

//   if (ingredientNames.length === 0) {
//     return { pantrySignature, recipes: [] };
//   }

//   const expiringSoonSet = new Set(
//     pantryItems
//       .filter((i) => i.expiryStatus === "expiring_soon" || i.expiryStatus === "expired")
//       .map((i) => normName(i.canonicalName || i.rawName)),
//   );

//   const spoon = await findRecipesByIngredients(ingredientNames, limit);

//   const recipes = spoon
//     .map((r: SpoonFindByIngredientsRecipe) => {
//       const usedNames = (r.usedIngredients ?? []).map((i) => i.name).filter(Boolean);
//       const missedNames = (r.missedIngredients ?? []).map((i) => i.name).filter(Boolean);

//       const expiringSoonUsedCount = usedNames.filter((n) => expiringSoonSet.has(normName(n))).length;

//       // Basic waste-reduction score
//       const score =
//         expiringSoonUsedCount * 5 +
//         r.usedIngredientCount * 2 -
//         r.missedIngredientCount * 1.5;

//       return {
//         id: r.id,
//         title: r.title,
//         image: r.image,
//         usedIngredientCount: r.usedIngredientCount,
//         missedIngredientCount: r.missedIngredientCount,
//         usedIngredients: usedNames,
//         missedIngredients: missedNames,
//         expiringSoonUsedCount,
//         score,
//       };
//     })
//     .sort((a, b) => b.score - a.score);

//   return { pantrySignature, recipes };
// }

// export async function getRecipeDetails(recipeId: number) {
//   const d = await getRecipeInformation(recipeId);

//   const steps =
//     d.analyzedInstructions?.[0]?.steps
//       ?.map((s) => s.step?.trim())
//       .filter((s): s is string => Boolean(s)) ?? [];

//   const ingredients =
//     d.extendedIngredients
//       ?.map((i) => i.original?.trim() || i.name?.trim())
//       .filter((s): s is string => Boolean(s)) ?? [];

//   return {
//     id: d.id,
//     title: d.title,
//     image: d.image ?? "",
//     summary: d.summary ?? "",
//     readyInMinutes: d.readyInMinutes ?? 0,
//     servings: d.servings ?? 0,
//     sourceUrl: d.sourceUrl ?? "",
//     ingredients,
//     steps,
//   };
// }

import { prisma } from "../../../common/db/prisma.js";
import { getPantryItems } from "../../pantry/index.js";
import { getUserFeedPreferencesBySubject } from "../../users/index.js";
import { findRecipesFromPantry } from "./recipe-query.service.js";
import { rankRecipes, type ScoredRecipe } from "./recipe-scorer.service.js";
import { getRecipeInformation } from "./spoonacular.service.js";  // still used for details

export type RecipeSuggestion = ScoredRecipe;

export async function getRecipeSuggestionsForUser(
  userId: string,
  limit = 12,
): Promise<{
  pantrySignature: string;
  recipes: RecipeSuggestion[];
  source: string;
}> {

  // Step 1 — load pantry
  const pantryItems = await getPantryItems(userId);

  const ingredientNames = [
    ...new Set(
      pantryItems
        .map((i) => i.canonicalName || i.rawName)
        .map((x) => x.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];

  const pantrySignature = [...ingredientNames].sort().join("|");

  if (ingredientNames.length === 0) {
    return { pantrySignature, recipes: [], source: "database", };
  }

  // Step 2 — find expiring soon names for bonus scoring
  const expiringSoonNames = pantryItems
    .filter((i) => i.expiryStatus === "expiring_soon" || i.expiryStatus === "expired")
    .map((i) => (i.canonicalName || i.rawName).toLowerCase());

  // Step 3 — query recipes from your DB (no Spoonacular call)
  const candidates = await findRecipesFromPantry(ingredientNames, limit * 2);

  if (candidates.length === 0) {
    return { pantrySignature, recipes: [], source: "database", };
  }

  // Step 4 — load taste profile if available
  const preferences = await getUserFeedPreferencesBySubject(userId);

  const profile = preferences ?? {
    likes: [],
    dislikes: [],
    dietSignals: [],
    allergies: [],
  };

  // Step 5 — score and rank
  const ranked = rankRecipes(candidates, profile, expiringSoonNames, limit);

  return { pantrySignature, recipes: ranked, source: "database", };
}

// getRecipeDetails lazy caching
export async function getRecipeDetails(recipeId: number) {

  // Check your DB first
  const cached = await prisma.recipe.findUnique({
    where: { id: recipeId },
    include: { ingredients: true },
  });

  if (cached) {
    const steps = (cached.instructions as string[]) ?? [];
    const ingredients = cached.ingredients.map((i) => i.rawName).filter(Boolean);

    return {
      id: cached.id,
      title: cached.title,
      image: cached.image ?? cached.imageSourceUrl ?? "",
      summary: cached.summary ?? "",
      readyInMinutes: cached.readyMinutes ?? 0,
      servings: cached.servings ?? 0,
      sourceUrl: cached.sourceUrl ?? "",
      ingredients,
      steps,
      source: "database",
    };
  }

  // Not in DB yet — fetch from Spoonacular and cache it for next time
  const d = await getRecipeInformation(recipeId);

  // Save to DB lazily so next request is served from cache
  await prisma.recipe.upsert({
    where: { id: d.id },
    update: {},   // don't overwrite if somehow it appeared between the findUnique and here
    create: {
      id: d.id,
      title: d.title,
      imageSourceUrl: d.image ?? null,
      cuisine: d.cuisines ?? [],
      dietTags: d.diets ?? [],
      readyMinutes: d.readyInMinutes ?? null,
      servings: d.servings ?? null,
      sourceUrl: d.sourceUrl ?? null,
      summary: d.summary ?? null,
      instructions: (d.analyzedInstructions?.[0]?.steps
        ?.map((s) => s.step?.trim())
        .filter((s): s is string => Boolean(s)) ?? []) as string[],
      rawData: d as object,
    },
  });

  // Return in the same shape
  const steps = d.analyzedInstructions?.[0]?.steps
    ?.map((s) => s.step?.trim())
    .filter((s): s is string => Boolean(s)) ?? [];

  const ingredients = d.extendedIngredients
    ?.map((i) => i.original?.trim() || i.name?.trim())
    .filter((s): s is string => Boolean(s)) ?? [];

  return {
    id: d.id,
    title: d.title,
    image: d.image ?? "",
    summary: d.summary ?? "",
    readyInMinutes: d.readyInMinutes ?? 0,
    servings: d.servings ?? 0,
    sourceUrl: d.sourceUrl ?? "",
    ingredients,
    steps,
    source: "spoonacular",
  };
}