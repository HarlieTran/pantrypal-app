import { apiGet, apiPost } from "../../../lib/api";
import type { GroceryPlan, RecipeSearchResult } from "../model/planner.types";

export async function searchRecipes(
  query: string,
  token: string,
): Promise<RecipeSearchResult[]> {
  const data = await apiGet<{ recipes: RecipeSearchResult[] }>(
    `/recipes/search?q=${encodeURIComponent(query)}`,
    token,
  );
  return data.recipes;
}

export async function generateRecipeFromName(
  name: string,
  targetServings: number,
  token: string,
): Promise<{
  id: number;
  title: string;
  image: string | null;
  cuisine: string[];
  dietTags: string[];
  readyMinutes: number | null;
  servings: number | null;
  isNew: boolean;
}> {
  const data = await apiPost<{ recipe: {
    id: number;
    title: string;
    image: string | null;
    cuisine: string[];
    dietTags: string[];
    readyMinutes: number | null;
    servings: number | null;
    isNew: boolean;
  }}>(
    "/recipes/from-name",
    { name, targetServings },
    token,
  );
  return data.recipe;
}

export async function fetchGroceryPlan(
  recipes: { recipeId: number; targetServings: number }[],
  token: string,
): Promise<GroceryPlan> {
  const data = await apiPost<{ plan: GroceryPlan }>(
    "/me/planner/grocery-list",
    { recipes },
    token,
  );
  return data.plan;
}