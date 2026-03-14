import { useState } from "react";
import { fetchRecipeDetails, cookRecipe } from "../infra/recipes.api";
import type { RecipeDetails, RecipeSuggestion, CookRecipeResult } from "../model/recipes.types";

export type CookNoOpReason = { unmatchedCount: number; warningCount: number };

export function useRecipeDetails(token: string, suggestions: RecipeSuggestion[]) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeDetails | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<RecipeSuggestion | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");
  const [cooking, setCooking] = useState(false);
  const [cookPreview, setCookPreview] = useState<CookRecipeResult | null>(null);
  const [cookError, setCookError] = useState("");

  const open = async (id: number) => {
    try {
      setSelectedId(id);
      setSelectedSuggestion(suggestions.find((x) => x.id === id) ?? null);
      setCookPreview(null);
      setCookError("");
      setDetailsLoading(true);
      setDetailsError("");
      const details = await fetchRecipeDetails(token, id);
      setSelectedRecipe(details);
    } catch (e) {
      setDetailsError(String((e as Error).message || "Failed to load recipe details"));
    } finally {
      setDetailsLoading(false);
    }
  };

  const preview = async () => {
    if (!selectedId) return;
    try {
      setCooking(true);
      setCookError("");
      const result = await cookRecipe(token, selectedId, { servingsUsed: 1, dryRun: true });
      setCookPreview(result);
    } catch (e) {
      setCookError(String((e as Error).message || "Failed to preview cook action"));
    } finally {
      setCooking(false);
    }
  };

  const confirm = async () => {
    if (!selectedId) return;
    try {
      setCooking(true);
      setCookError("");
      const applied = await cookRecipe(token, selectedId, { servingsUsed: 1, dryRun: false });

      const changedCount = applied.updatedItems.length + applied.removedItems.length;
      if (changedCount === 0) {
        return { noOp: true, unmatchedCount: applied.unmatchedIngredients.length, warningCount: applied.warnings.length } as unknown as CookRecipeResult;
      }

      return applied;
    } catch (e) {
      setCookError(String((e as Error).message || "Failed to apply cook action"));
      throw e;
    } finally {
      setCooking(false);
    }
  };

  const close = () => {
    setSelectedId(null);
    setSelectedRecipe(null);
    setSelectedSuggestion(null);
    setCookPreview(null);
    setCookError("");
    setDetailsError("");
  };

  const retry = () => {
    if (selectedId) void open(selectedId);
  };

  return {
    selectedId,
    selectedRecipe,
    selectedSuggestion,
    detailsLoading,
    detailsError,
    cooking,
    cookPreview,
    cookError,
    open,
    preview,
    confirm,
    close,
    retry,
  };
}
