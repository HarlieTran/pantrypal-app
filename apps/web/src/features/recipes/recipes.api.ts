const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8788";

function authHeaders(token: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export type RecipeSuggestion = {
  id: number;
  title: string;
  image: string;
  usedIngredientCount: number;
  missedIngredientCount: number;
  usedIngredients: string[];
  missedIngredients: string[];
  expiringSoonUsedCount: number;
  score: number;
};

export type RecipeDetails = {
  id: number;
  title: string;
  image: string;
  summary: string;
  readyInMinutes: number;
  servings: number;
  sourceUrl: string;
  ingredients: string[];
  steps: string[];
};

export async function fetchRecipeSuggestions(token: string, limit = 12): Promise<{
  pantrySignature: string;
  recipes: RecipeSuggestion[];
}> {
  const res = await fetch(`${API_BASE}/recipes/suggestions`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ limit }),
  });
  if (!res.ok) throw new Error(`Failed to fetch recipe suggestions (${res.status})`);
  return res.json();
}

export async function fetchRecipeDetails(token: string, recipeId: number): Promise<RecipeDetails> {
  const res = await fetch(`${API_BASE}/recipes/${recipeId}`, {
    method: "GET",
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(`Failed to fetch recipe details (${res.status})`);
  const json = await res.json();
  return json.recipe as RecipeDetails;
}

export type CookRecipeResult = {
  recipeId: number;
  dryRun: boolean;
  updatedItems: Array<{ itemId: string; name: string; beforeQty: number; afterQty: number }>;
  removedItems: Array<{ itemId: string; name: string; beforeQty: number }>;
  unmatchedIngredients: string[];
  warnings: string[];
};


export async function cookRecipe(
  token: string,
  recipeId: number,
  options: { servingsUsed?: number; dryRun?: boolean } = {},
): Promise<CookRecipeResult> {
  const res = await fetch(`${API_BASE}/recipes/${recipeId}/cook`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(options),
  });
  if (!res.ok) throw new Error(`Failed to cook recipe (${res.status})`);
  return res.json();
}

