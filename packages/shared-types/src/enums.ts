export const INGREDIENT_CATEGORIES = [
  "produce",
  "dairy",
  "meat",
  "seafood",
  "grains",
  "spices",
  "condiments",
  "frozen",
  "beverages",
  "snacks",
  "other",
] as const;

export type IngredientCategory = (typeof INGREDIENT_CATEGORIES)[number];

export const QUESTION_TYPES = {
  SINGLE_CHOICE: "SINGLE_CHOICE",
  MULTI_CHOICE: "MULTI_CHOICE",
  FREE_TEXT: "FREE_TEXT",
} as const;

export type QuestionType = (typeof QUESTION_TYPES)[keyof typeof QUESTION_TYPES];
