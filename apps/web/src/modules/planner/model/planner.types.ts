export type RecipeSearchResult = {
  id: number;
  title: string;
  image: string | null;
  cuisine: string[];
  dietTags: string[];
  readyMinutes: number | null;
  servings: number | null;
  isSaved: boolean;
  matchedIngredientCount: number;
  totalIngredientCount: number;
  isPantryReady: boolean;
};

export type PlannerRecipe = {
  recipeId: number;
  title: string;
  image: string | null;
  servings: number | null;       // default servings from DB
  targetServings: number;        // what user selected
  isPantryReady: boolean;
  isAiGenerated: boolean;
};

export type GroceryItem = {
  name: string;
  quantity: number;
  unit: string;
  neededFor: string[];
};

export type PantryItem = {
  name: string;
  pantryQuantity: number;
  unit: string;
  neededFor: string[];
};

export type AllergenWarning = {
  name: string;
  foundIn: string[];
  allergen: string;
};

export type DislikeWarning = {
  name: string;
  foundIn: string[];
  dislike: string;
};

export type GroceryPlan = {
  toBuy: GroceryItem[];
  alreadyHave: PantryItem[];
  allergenWarnings: AllergenWarning[];
  dislikeWarnings: DislikeWarning[];
  recipeCount: number;
  totalIngredients: number;
};