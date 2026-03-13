/**
 * recipe-scorer.service.ts
 *
 * Scores recipe candidates against the user's taste profile.
 * Runs entirely in memory after recipe-query.service.ts returns candidates.
 */

import type { RecipeMatch } from "./recipe-query.service.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export type TasteProfile = {
  likes: string[];           // e.g. ["italian", "chicken", "creamy"]
  dislikes: string[];        // e.g. ["spicy", "lamb"]
  dietSignals: string[];     // e.g. ["vegetarian", "gluten-free"]
  allergies: string[];       // e.g. ["peanuts", "shellfish"]
};

export type ScoredRecipe = RecipeMatch & {
  score: number;
  expiringSoonUsedCount: number;
};

// ─── Normalize helper ─────────────────────────────────────────────────────────

function normalize(name: string): string {
  return name.trim().toLowerCase();
}

function containsAny(haystack: string[], needles: string[]): boolean {
  const normalizedHaystack = haystack.map(normalize);
  return needles.some((needle) =>
    normalizedHaystack.some((h) => h.includes(normalize(needle))),
  );
}

// ─── Scorer ───────────────────────────────────────────────────────────────────
//
// Scoring weights — tweak these to adjust recommendation behavior:
//
// PANTRY_MATCH      — reward using more pantry ingredients (core signal)
// EXPIRING_BONUS    — strongly reward using expiring ingredients (waste reduction)
// LIKE_BONUS        — reward matching user's taste preferences
// DISLIKE_PENALTY   — penalize matching user's dislikes
// ALLERGY_PENALTY   — heavily penalize allergy conflicts (safety)
// MISSED_PENALTY    — mild penalty for requiring many ingredients not in pantry
// DIET_BONUS        — reward matching user's diet signals

const WEIGHTS = {
  PANTRY_MATCH:   3,
  EXPIRING_BONUS: 5,
  LIKE_BONUS:     2,
  DISLIKE_PENALTY: -4,
  ALLERGY_PENALTY: -20,
  MISSED_PENALTY: -0.5,
  DIET_BONUS:     3,
};

export function scoreRecipe(
  recipe: RecipeMatch,
  profile: TasteProfile,
  expiringSoonNames: string[],  // canonical names of pantry items expiring soon
): ScoredRecipe {

  let score = 0;

  // ── Pantry coverage ───────────────────────────────────────────────────────
  // Base score — more matched ingredients = better
  score += recipe.matchedCount * WEIGHTS.PANTRY_MATCH;

  // Mild penalty for many missed ingredients
  score += recipe.missedCount * WEIGHTS.MISSED_PENALTY;

  // ── Expiring soon bonus ───────────────────────────────────────────────────
  // Strongly reward recipes that use ingredients about to expire
  const expiringSet = new Set(expiringSoonNames.map(normalize));
  const expiringSoonUsedCount = recipe.matchedIngredients.filter((i) =>
    expiringSet.has(normalize(i)),
  ).length;
  score += expiringSoonUsedCount * WEIGHTS.EXPIRING_BONUS;

  // ── Taste profile — likes ─────────────────────────────────────────────────
  // Check if recipe cuisine or dietTags overlap with what the user likes
  const recipeSignals = [
    ...recipe.cuisine,
    ...recipe.dietTags,
    ...recipe.matchedIngredients,
  ];

  const likeMatches = profile.likes.filter((like) =>
    containsAny(recipeSignals, [like]),
  ).length;
  score += likeMatches * WEIGHTS.LIKE_BONUS;

  // ── Taste profile — dislikes ──────────────────────────────────────────────
  const dislikeMatches = profile.dislikes.filter((dislike) =>
    containsAny(recipeSignals, [dislike]),
  ).length;
  score += dislikeMatches * WEIGHTS.DISLIKE_PENALTY;

  // ── Diet signals ──────────────────────────────────────────────────────────
  // Reward recipes that match the user's diet style
  const dietMatches = profile.dietSignals.filter((signal) =>
    containsAny(recipe.dietTags, [signal]),
  ).length;
  score += dietMatches * WEIGHTS.DIET_BONUS;

  // ── Allergy safety ────────────────────────────────────────────────────────
  // Heavy penalty if any recipe ingredient matches a user allergy
  // We check both matched and missed ingredients for safety
  const allIngredients = [
    ...recipe.matchedIngredients,
    ...recipe.missedIngredients,
  ];
  const allergyConflicts = profile.allergies.filter((allergy) =>
    containsAny(allIngredients, [allergy]),
  ).length;
  score += allergyConflicts * WEIGHTS.ALLERGY_PENALTY;

  return {
    ...recipe,
    score,
    expiringSoonUsedCount,
  };
}

// ─── Score and rank a list of candidates ─────────────────────────────────────

export function rankRecipes(
  candidates: RecipeMatch[],
  profile: TasteProfile,
  expiringSoonNames: string[],
  limit: number,
): ScoredRecipe[] {
  return candidates
    .map((recipe) => scoreRecipe(recipe, profile, expiringSoonNames))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}