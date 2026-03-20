import { apiGet } from '../../../lib/api';

export type PantryHealthSummary = {
  totalItems: number;
  freshCount: number;
  expiringCount: number;
  expiredCount: number;
  noDateCount: number;
  categoryBreakdown: { category: string; count: number }[];
};

export type CookingActivitySummary = {
  totalCooked: number;
  thisMonthCooked: number;
  currentStreak: number;
  recentHistory: {
    id: string;
    recipeId: number;
    recipeTitle: string;
    recipeImage: string | null;
    cookedAt: string;
  }[];
};

export type SavedRecipesSummary = {
  total: number;
  recipes: {
    recipeId: number;
    title: string;
    image: string | null;
    readyMinutes: number | null;
    cuisine: string[];
    savedAt: string;
  }[];
};

export type SummarySnapshot = {
  totalPantryItems: number;
  expiringSoonCount: number;
  expiredCount: number;
  savedRecipesCount: number;
  totalCooked: number;
  thisMonthCooked: number;
  currentStreak: number;
};

export type SummaryPrediction = {
  type: "expiry_risk" | "cooking_pattern" | "planning_opportunity" | "shopping_pattern";
  title: string;
  detail: string;
  confidence: "high" | "medium" | "low";
};

export type SummarySuggestion = {
  type: "cook_now" | "plan_meals" | "use_saved_recipe" | "review_pantry";
  title: string;
  detail: string;
  priority: "high" | "medium" | "low";
  cta: "find_recipes" | "open_planner" | "view_pantry" | "view_saved_recipes";
};

export type SummaryIntelligence = {
  headline: string;
  narrative: string;
  predictions: SummaryPrediction[];
  suggestions: SummarySuggestion[];
};

export type UserSummary = {
  snapshot: SummarySnapshot;
  pantryHealth: PantryHealthSummary;
  cookingActivity: CookingActivitySummary;
  savedRecipes: SavedRecipesSummary;
  intelligence: SummaryIntelligence;
};

export async function fetchUserSummary(token: string): Promise<UserSummary> {
  const data = await apiGet<{ summary: UserSummary }>('/me/summary', token);
  return data.summary;
}
