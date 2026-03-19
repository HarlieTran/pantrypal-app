import { prisma } from "../../../common/db/prisma.js";
import { getUserProfileIdBySubject, getUserFeedPreferencesBySubject } from "../../users/index.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export type GroceryItem = {
  name: string;
  quantity: number;
  unit: string;
  neededFor: string[]; // recipe titles
};

export type PantryItem = {
  name: string;
  pantryQuantity: number;
  unit: string;
  neededFor: string[];
};

export type AllergenWarning = {
  name: string;
  foundIn: string[]; // recipe titles
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalize(name: string): string {
  return name.trim().toLowerCase();
}

function normalizeUnit(unit: string): string {
  const map: Record<string, string> = {
    g: "g", gram: "g", grams: "g",
    kg: "kg", kilogram: "kg", kilograms: "kg",
    ml: "ml", milliliter: "ml", milliliters: "ml",
    l: "l", liter: "l", liters: "l",
    tsp: "tsp", teaspoon: "tsp", teaspoons: "tsp",
    tbsp: "tbsp", tablespoon: "tbsp", tablespoons: "tbsp",
    cup: "cup", cups: "cup",
    pcs: "pcs", piece: "pcs", pieces: "pcs",
    oz: "oz", ounce: "oz", ounces: "oz",
    lb: "lb", lbs: "lb", pound: "lb", pounds: "lb",
  };
  return map[unit.trim().toLowerCase()] ?? unit.trim().toLowerCase();
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function generateGroceryPlan(
  userId: string,
  recipeServings: { recipeId: number; targetServings: number }[],
): Promise<GroceryPlan> {
  const profileId = await getUserProfileIdBySubject(userId);
  if (!profileId) throw new Error("User not found");

  if (recipeServings.length === 0) {
    return {
      toBuy: [],
      alreadyHave: [],
      allergenWarnings: [],
      dislikeWarnings: [],
      recipeCount: 0,
      totalIngredients: 0,
    };
  }

  const recipeIds = recipeServings.map((r) => r.recipeId);

  // ── Load recipes with ingredients ─────────────────────────────────────────
  const recipes = await prisma.recipe.findMany({
    where: { id: { in: recipeIds } },
    include: {
      ingredients: {
        select: {
          canonicalName: true,
          rawName: true,
          amount: true,
          unit: true,
        },
      },
    },
  });

  const recipeMap = new Map(recipes.map((r) => [r.id, r]));
  const servingsMap = new Map(
    recipeServings.map((r) => [r.recipeId, r.targetServings]),
  );

  // ── Load pantry items ──────────────────────────────────────────────────────
  const pantryItems = await prisma.pantryItem.findMany({
    where: { userProfileId: profileId },
    select: { canonicalName: true, quantity: true, unit: true },
  });

  const pantryMap = new Map(
    pantryItems.map((i) => [
      normalize(i.canonicalName),
      { quantity: i.quantity, unit: i.unit },
    ]),
  );

  // ── Load user preferences ──────────────────────────────────────────────────
  const preferences = await getUserFeedPreferencesBySubject(userId);
  const allergySet = new Set(
    (preferences?.allergies ?? []).map(normalize),
  );
  const dislikeSet = new Set(
    (preferences?.dislikes ?? []).map(normalize),
  );

  // ── Aggregate ingredients across all recipes ───────────────────────────────
  // key = canonicalName + unit
  type AggregatedIngredient = {
    canonicalName: string;
    rawName: string;
    totalAmount: number;
    unit: string;
    neededFor: string[];
  };

  const aggregated = new Map<string, AggregatedIngredient>();

  for (const { recipeId, targetServings } of recipeServings) {
    const recipe = recipeMap.get(recipeId);
    if (!recipe) continue;

    const defaultServings = recipe.servings ?? 4;
    const scaleFactor = targetServings / defaultServings;

    for (const ing of recipe.ingredients) {
      const key = `${normalize(ing.canonicalName)}::${normalizeUnit(ing.unit ?? "pcs")}`;
      const scaledAmount = (ing.amount ?? 1) * scaleFactor;

      if (aggregated.has(key)) {
        const existing = aggregated.get(key)!;
        existing.totalAmount += scaledAmount;
        if (!existing.neededFor.includes(recipe.title)) {
          existing.neededFor.push(recipe.title);
        }
      } else {
        aggregated.set(key, {
          canonicalName: normalize(ing.canonicalName),
          rawName: ing.rawName,
          totalAmount: scaledAmount,
          unit: normalizeUnit(ing.unit ?? "pcs"),
          neededFor: [recipe.title],
        });
      }
    }
  }

  // ── Classify into buckets ──────────────────────────────────────────────────
  const toBuy: GroceryItem[] = [];
  const alreadyHave: PantryItem[] = [];
  const allergenWarnings: AllergenWarning[] = [];
  const dislikeWarnings: DislikeWarning[] = [];

  for (const [, ing] of aggregated) {
    const inPantry = pantryMap.get(ing.canonicalName);

    // Check allergen
    const matchedAllergen = [...allergySet].find((a) =>
      ing.canonicalName.includes(a) || a.includes(ing.canonicalName),
    );
    if (matchedAllergen) {
      allergenWarnings.push({
        name: ing.rawName,
        foundIn: ing.neededFor,
        allergen: matchedAllergen,
      });
      continue; // still add to toBuy below — user should decide
    }

    // Check dislike
    const matchedDislike = [...dislikeSet].find((d) =>
      ing.canonicalName.includes(d) || d.includes(ing.canonicalName),
    );
    if (matchedDislike) {
      dislikeWarnings.push({
        name: ing.rawName,
        foundIn: ing.neededFor,
        dislike: matchedDislike,
      });
      // don't skip — add to toBuy, user still needs it
    }

    if (inPantry) {
      alreadyHave.push({
        name: ing.rawName,
        pantryQuantity: inPantry.quantity,
        unit: inPantry.unit,
        neededFor: ing.neededFor,
      });
    } else {
      toBuy.push({
        name: ing.rawName,
        quantity: Math.ceil(ing.totalAmount * 10) / 10, // round to 1 decimal
        unit: ing.unit,
        neededFor: ing.neededFor,
      });
    }
  }

  // Sort toBuy — items needed for more recipes come first
  toBuy.sort((a, b) => b.neededFor.length - a.neededFor.length);

  return {
    toBuy,
    alreadyHave,
    allergenWarnings,
    dislikeWarnings,
    recipeCount: recipeServings.length,
    totalIngredients: aggregated.size,
  };
}