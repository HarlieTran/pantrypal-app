const SPOON_BASE = "https://api.spoonacular.com";

const SPOON_KEYS = (process.env.SPOONACULAR_API_KEYS || process.env.SPOONACULAR_API_KEY || "")
  .split(",")
  .map((k) => k.trim())
  .filter(Boolean);

if (SPOON_KEYS.length === 0) {
  console.warn("SPOONACULAR_API_KEY(S) is missing");
}

export type SpoonIngredient = {
  id: number;
  name: string;
  original?: string;
  amount?: number;
  unit?: string;
};

export type SpoonFindByIngredientsRecipe = {
  id: number;
  title: string;
  image: string;
  usedIngredientCount: number;
  missedIngredientCount: number;
  usedIngredients: SpoonIngredient[];
  missedIngredients: SpoonIngredient[];
};

export type SpoonRecipeDetails = {
  id: number;
  title: string;
  image?: string;
  summary?: string;
  readyInMinutes?: number;
  servings?: number;
  sourceUrl?: string;
  cuisines?: string[];   // ← add this
  diets?: string[];      // ← add this
  extendedIngredients?: Array<{
    id?: number;
    name?: string;
    original?: string;
    amount?: number;
    unit?: string;
  }>;
  analyzedInstructions?: Array<{
    steps?: Array<{ number?: number; step?: string }>;
  }>;
};

function canRetryWithNextKey(status: number) {
  return status === 402 || status === 429;
}

async function fetchWithKeyFailover(buildUrl: (key: string) => string): Promise<Response> {
  if (SPOON_KEYS.length === 0) {
    throw new Error("SPOONACULAR_API_KEY(S) is not configured");
  }

  let lastError = "";

  for (const key of SPOON_KEYS) {
    const url = buildUrl(key);
    const res = await fetch(url);

    if (res.ok) return res;

    const txt = await res.text();
    lastError = `(${res.status}) ${txt}`;

    if (!canRetryWithNextKey(res.status)) {
      throw new Error(`Spoonacular request failed ${lastError}`);
    }
  }

  throw new Error(`All Spoonacular keys failed ${lastError}`);
}

export async function findRecipesByIngredients(
  ingredientNames: string[],
  number = 12,
): Promise<SpoonFindByIngredientsRecipe[]> {
  const unique = [...new Set(ingredientNames.map((x) => x.trim().toLowerCase()).filter(Boolean))];
  if (unique.length === 0) return [];

  const ingredientsCsv = encodeURIComponent(unique.join(","));

  const res = await fetchWithKeyFailover(
    (key) =>
      `${SPOON_BASE}/recipes/findByIngredients?ingredients=${ingredientsCsv}&number=${number}&ranking=1&ignorePantry=true&apiKey=${key}`,
  );

  return (await res.json()) as SpoonFindByIngredientsRecipe[];
}

export async function getRecipeInformation(recipeId: number): Promise<SpoonRecipeDetails> {
  const res = await fetchWithKeyFailover(
    (key) =>
      `${SPOON_BASE}/recipes/${recipeId}/information?includeNutrition=false&apiKey=${key}`,
  );

  return (await res.json()) as SpoonRecipeDetails;
}
