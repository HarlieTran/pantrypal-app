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

export type CookRecipeResult = {
  recipeId: number;
  dryRun: boolean;
  updatedItems: Array<{ itemId: string; name: string; beforeQty: number; afterQty: number }>;
  removedItems: Array<{ itemId: string; name: string; beforeQty: number }>;
  unmatchedIngredients: string[];
  warnings: string[];
};
