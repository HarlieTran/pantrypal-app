import { getPantryItems } from "../../pantry/index.js";
import {
  findRecipesByIngredients,
  getRecipeInformation,
  type SpoonFindByIngredientsRecipe,
} from "./spoonacular.service.js";

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

function normName(name: string) {
  return name.trim().toLowerCase();
}

export async function getRecipeSuggestionsForUser(userId: string, limit = 12): Promise<{
  pantrySignature: string;
  recipes: RecipeSuggestion[];
}> {
  const pantryItems = await getPantryItems(userId);

  const ingredientNames = [
    ...new Set(
      pantryItems
        .map((i) => i.canonicalName || i.rawName)
        .map((x) => x.trim())
        .filter(Boolean),
    ),
  ];

  const pantrySignature = ingredientNames
    .map((x) => normName(x))
    .sort((a, b) => a.localeCompare(b))
    .join("|");

  if (ingredientNames.length === 0) {
    return { pantrySignature, recipes: [] };
  }

  const expiringSoonSet = new Set(
    pantryItems
      .filter((i) => i.expiryStatus === "expiring_soon" || i.expiryStatus === "expired")
      .map((i) => normName(i.canonicalName || i.rawName)),
  );

  const spoon = await findRecipesByIngredients(ingredientNames, limit);

  const recipes = spoon
    .map((r: SpoonFindByIngredientsRecipe) => {
      const usedNames = (r.usedIngredients ?? []).map((i) => i.name).filter(Boolean);
      const missedNames = (r.missedIngredients ?? []).map((i) => i.name).filter(Boolean);

      const expiringSoonUsedCount = usedNames.filter((n) => expiringSoonSet.has(normName(n))).length;

      // Basic waste-reduction score
      const score =
        expiringSoonUsedCount * 5 +
        r.usedIngredientCount * 2 -
        r.missedIngredientCount * 1.5;

      return {
        id: r.id,
        title: r.title,
        image: r.image,
        usedIngredientCount: r.usedIngredientCount,
        missedIngredientCount: r.missedIngredientCount,
        usedIngredients: usedNames,
        missedIngredients: missedNames,
        expiringSoonUsedCount,
        score,
      };
    })
    .sort((a, b) => b.score - a.score);

  return { pantrySignature, recipes };
}

export async function getRecipeDetails(recipeId: number) {
  const d = await getRecipeInformation(recipeId);

  const steps =
    d.analyzedInstructions?.[0]?.steps
      ?.map((s) => s.step?.trim())
      .filter((s): s is string => Boolean(s)) ?? [];

  const ingredients =
    d.extendedIngredients
      ?.map((i) => i.original?.trim() || i.name?.trim())
      .filter((s): s is string => Boolean(s)) ?? [];

  return {
    id: d.id,
    title: d.title,
    image: d.image ?? "",
    summary: d.summary ?? "",
    readyInMinutes: d.readyInMinutes ?? 0,
    servings: d.servings ?? 0,
    sourceUrl: d.sourceUrl ?? "",
    ingredients,
    steps,
  };
}
