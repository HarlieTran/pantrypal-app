import { deletePantryItem, getPantryItems, updatePantryItem } from "../../pantry/index.js";
import { getRecipeInformation } from "./spoonacular.service.js";
import { prisma } from "../../../common/db/prisma.js";
import { recordCookingHistory } from "./recipe-history.service.js";

type CookOptions = {
  servingsUsed?: number;
  dryRun?: boolean;
};

type CookResult = {
  recipeId: number;
  dryRun: boolean;
  updatedItems: Array<{ itemId: string; name: string; beforeQty: number; afterQty: number }>;
  removedItems: Array<{ itemId: string; name: string; beforeQty: number }>;
  unmatchedIngredients: string[];
  warnings: string[];
};

function normText(v: string) {
  return v.trim().toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ");
}

const NAME_STOPWORDS = new Set([
  "fresh",
  "chopped",
  "diced",
  "minced",
  "ground",
  "extra",
  "virgin",
  "organic",
  "large",
  "small",
  "medium",
  "boneless",
  "skinless",
  "unsalted",
  "salted",
  "reduced",
  "low",
  "fat",
  "to",
  "taste",
]);

function tokenizeName(v: string): string[] {
  return normText(v)
    .split(" ")
    .map((x) => x.trim())
    .filter((x) => x.length > 1 && !NAME_STOPWORDS.has(x));
}

function scoreNameMatch(ingredientName: string, pantryName: string): number {
  const a = normText(ingredientName);
  const b = normText(pantryName);
  if (!a || !b) return 0;
  if (a === b) return 100;
  if (a.includes(b) || b.includes(a)) return 70;

  const ta = tokenizeName(a);
  const tb = tokenizeName(b);
  if (ta.length === 0 || tb.length === 0) return 0;

  let overlap = 0;
  for (const token of ta) {
    if (tb.includes(token)) overlap += 1;
  }
  const ratio = overlap / Math.max(ta.length, tb.length);
  return Math.round(ratio * 60);
}

function normUnit(u?: string) {
  const x = (u ?? "").trim().toLowerCase();
  const map: Record<string, string> = {
    g: "g", gram: "g", grams: "g",
    kg: "kg", kilogram: "kg", kilograms: "kg",
    ml: "ml", milliliter: "ml", milliliters: "ml",
    l: "l", liter: "l", liters: "l",
    oz: "oz", ounce: "oz", ounces: "oz",
    lb: "lb", lbs: "lb", pound: "lb", pounds: "lb",
    tsp: "tsp", teaspoon: "tsp", teaspoons: "tsp",
    tbsp: "tbsp", tablespoon: "tbsp", tablespoons: "tbsp",
    cup: "cup", cups: "cup",
    pcs: "pcs", piece: "pcs", pieces: "pcs",
  };
  return map[x] ?? x;
}

function convertQty(qty: number, from: string, to: string): number | null {
  if (from === to) return qty;

  const mass: Record<string, number> = { g: 1, kg: 1000, oz: 28.3495, lb: 453.592 };
  const vol: Record<string, number> = { ml: 1, l: 1000, tsp: 4.92892, tbsp: 14.7868, cup: 236.588 };

  if (from in mass && to in mass) return (qty * mass[from]) / mass[to];
  if (from in vol && to in vol) return (qty * vol[from]) / vol[to];
  return null;
}

export async function cookRecipeForUser(
  userId: string,
  recipeId: number,
  options: CookOptions = {},
): Promise<CookResult> {
  const dryRun = options.dryRun ?? false;
  const servingsUsed = options.servingsUsed ?? 1;

  const pantry = await getPantryItems(userId);
  const recipe = await getRecipeInformation(recipeId);

  const recipeExists = await prisma.recipe.findUnique({ 
    where: { id: recipeId }, 
    select: { id: true } 
  });
  if (!recipeExists) throw new Error("Recipe not found");

  const factor =
    recipe.servings && recipe.servings > 0 ? servingsUsed / recipe.servings : servingsUsed;

  const remaining = new Map(pantry.map((p) => [p.itemId, p.quantity]));
  const pantryById = new Map(pantry.map((p) => [p.itemId, p]));
  const deductions = new Map<string, number>();

  const unmatchedIngredients: string[] = [];
  const warnings: string[] = [];

  const ingredients = recipe.extendedIngredients ?? [];
  for (const ing of ingredients) {
    const ingName = normText(ing.name ?? ing.original ?? "");
    if (!ingName) continue;

    const reqQtyRaw = (ing.amount ?? 1) * factor;
    const reqUnit = normUnit(ing.unit);
    const candidates = pantry
      .map((p) => {
        const pantryName = p.canonicalName || p.rawName;
        return { p, score: scoreNameMatch(ingName, pantryName) };
      })
      .filter((x) => x.score >= 30)
      .sort((x, y) => y.score - x.score)
      .map((x) => x.p);

    if (candidates.length === 0) {
      unmatchedIngredients.push(ing.name ?? ing.original ?? "unknown");
      continue;
    }

    let matched = false;
    for (const c of candidates) {
      const pantryUnit = normUnit(c.unit);
      const available = remaining.get(c.itemId) ?? 0;
      if (available <= 0) continue;

      let needed = reqQtyRaw;
      if (reqUnit && pantryUnit && reqUnit !== pantryUnit) {
        const conv = convertQty(reqQtyRaw, reqUnit, pantryUnit);
        if (conv == null) {
          // Permit pragmatic fallback for piece-based pantry units.
          if (pantryUnit === "pcs" && reqQtyRaw > 0) {
            needed = Math.max(1, Math.round(reqQtyRaw));
          } else {
            continue;
          }
        } else {
          needed = conv;
        }
      }

      const deduct = Math.min(available, needed);
      if (deduct <= 0) continue;

      remaining.set(c.itemId, available - deduct);
      deductions.set(c.itemId, (deductions.get(c.itemId) ?? 0) + deduct);
      matched = true;

      if (deduct < needed) {
        warnings.push(`Partial pantry coverage for "${ing.name ?? ing.original}".`);
      }
      break;
    }

    if (!matched) {
      unmatchedIngredients.push(ing.name ?? ing.original ?? "unknown");
    }
  }

  const updatedItems: CookResult["updatedItems"] = [];
  const removedItems: CookResult["removedItems"] = [];

  for (const [itemId] of deductions) {
    const p = pantryById.get(itemId);
    if (!p) continue;

    const beforeQty = p.quantity;
    const afterQty = remaining.get(itemId) ?? beforeQty;

    if (afterQty <= 0) {
      removedItems.push({ itemId, name: p.canonicalName || p.rawName, beforeQty });
      if (!dryRun) await deletePantryItem(userId, itemId);
    } else {
      updatedItems.push({ itemId, name: p.canonicalName || p.rawName, beforeQty, afterQty });
      if (!dryRun) await updatePantryItem(userId, itemId, { quantity: afterQty });
    }
  }

  // Record cooking history for real cooks only
  if (!dryRun) {
    await recordCookingHistory(userId, recipeId);
  }

  return {
    recipeId,
    dryRun,
    updatedItems,
    removedItems,
    unmatchedIngredients,
    warnings,
  };
}
