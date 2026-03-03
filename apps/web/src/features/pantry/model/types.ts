export type PantryItemCategory =
  | "produce"
  | "dairy"
  | "meat"
  | "seafood"
  | "grains"
  | "spices"
  | "condiments"
  | "frozen"
  | "beverages"
  | "snacks"
  | "other";

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
  expiryDate?: string;
  notes?: string;
  addedAt: string;
  updatedAt: string;
  expiryStatus: ExpiryStatus;
  daysUntilExpiry?: number;
}

export interface PantryMeta {
  id: string;
  userId: string;
  itemCount: number;
  expiringCount: number;
  lastUpdated: string;
}

export interface ParsedIngredient {
  rawName: string;
  quantity: number;
  unit: string;
  category: PantryItemCategory;
}

export const CATEGORY_EMOJI: Record<PantryItemCategory, string> = {
  produce: "🥦",
  dairy: "🧀",
  meat: "🥩",
  seafood: "🐟",
  grains: "🌾",
  spices: "🌶️",
  condiments: "🫙",
  frozen: "🧊",
  beverages: "🥤",
  snacks: "🍿",
  other: "📦",
};

export const UNIT_OPTIONS = [
  "pcs", "g", "kg", "oz", "lb",
  "ml", "L", "cup", "tbsp", "tsp",
];