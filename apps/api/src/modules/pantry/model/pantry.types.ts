import type { IngredientCategory } from "@pantrypal/shared-types";

export type PantryItemCategory = IngredientCategory;

export type ExpiryStatus = "fresh" | "expiring_soon" | "expired" | "no_date";

export interface PantryItem {
  itemId: string;
  userId: string;
  rawName: string;
  ingredientId?: string;
  canonicalName: string;
  quantity: number;
  unit: string;
  category: PantryItemCategory;
  expiryDate?: string;    // YYYY-MM-DD
  notes?: string;
  addedAt: string;        // ISO datetime
  updatedAt: string;      // ISO datetime
}

export interface PantryItemWithStatus extends PantryItem {
  expiryStatus: ExpiryStatus;
  daysUntilExpiry?: number;
}

export interface ParsedIngredient {
  rawName: string;
  quantity: number;
  unit: string;
  category: PantryItemCategory;
}

export interface MatchedIngredient extends ParsedIngredient {
  ingredientId?: string;
  canonicalName: string;
  matchConfidence: "exact" | "alias" | "ai" | "unmatched";
}
