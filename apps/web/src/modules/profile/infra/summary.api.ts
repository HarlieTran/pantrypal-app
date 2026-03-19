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

export type UserSummary = {
  pantryHealth: PantryHealthSummary;
  cookingActivity: CookingActivitySummary;
  savedRecipes: SavedRecipesSummary;
};

export async function fetchUserSummary(token: string): Promise<UserSummary> {
  const data = await apiGet<{ summary: UserSummary }>('/me/summary', token);
  return data.summary;
}