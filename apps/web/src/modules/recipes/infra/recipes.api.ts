import type { CookRecipeResult, RecipeDetails, RecipeSuggestion } from "../model/recipes.types";
import { apiGet, apiPost } from '../../../lib/api';

export async function fetchRecipeSuggestions(token: string, limit = 12): Promise<{
  pantrySignature: string;
  recipes: RecipeSuggestion[];
}> {
  return apiPost('/recipes/suggestions', { limit }, token);
}

export async function fetchRecipeDetails(token: string, recipeId: number): Promise<RecipeDetails> {
  const json = await apiGet<{ recipe: RecipeDetails }>(`/recipes/${recipeId}`, token);
  return json.recipe;
}

export async function cookRecipe(
  token: string,
  recipeId: number,
  options: { servingsUsed?: number; dryRun?: boolean } = {},
): Promise<CookRecipeResult> {
  return apiPost(`/recipes/${recipeId}/cook`, options, token);
}

export async function toggleSaveRecipe(
  token: string,
  recipeId: number,
): Promise<{ saved: boolean }> {
  return apiPost(`/recipes/${recipeId}/save`, {}, token);
}