import { useState, useCallback, useRef } from "react";
import {
  searchRecipes,
  generateRecipeFromName,
  fetchGroceryPlan,
} from "../infra/planner.api";
import type {
  GroceryPlan,
  PlannerRecipe,
  RecipeSearchResult,
} from "../model/planner.types";

export function useMealPlanner(token: string) {
  // ── Search state ──────────────────────────────────────────────────────────
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<RecipeSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Selected recipes ──────────────────────────────────────────────────────
  const [plannerRecipes, setPlannerRecipes] = useState<PlannerRecipe[]>([]);

  // ── AI generation ─────────────────────────────────────────────────────────
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");

  // ── Grocery plan ──────────────────────────────────────────────────────────
  const [groceryPlan, setGroceryPlan] = useState<GroceryPlan | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState("");

  // ── Search with debounce ──────────────────────────────────────────────────

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    setSearchError("");

    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (!value.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const results = await searchRecipes(value, token);
        setSearchResults(results);
      } catch {
        setSearchError("Failed to search recipes");
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  }, [token]);

  // ── Add from search results ───────────────────────────────────────────────

  const addRecipeFromSearch = useCallback((result: RecipeSearchResult) => {
    setPlannerRecipes((prev) => {
      if (prev.some((r) => r.recipeId === result.id)) return prev;
      return [
        ...prev,
        {
          recipeId: result.id,
          title: result.title,
          image: result.image,
          servings: result.servings,
          targetServings: result.servings ?? 4,
          isPantryReady: result.isPantryReady,
          isAiGenerated: false,
        },
      ];
    });
    setQuery("");
    setSearchResults([]);
    setGroceryPlan(null); // reset plan when recipes change
  }, []);

  // ── Generate from AI ──────────────────────────────────────────────────────

  const generateRecipe = useCallback(async (name: string, targetServings = 4) => {
    if (!name.trim()) return;
    setGenerating(true);
    setGenerateError("");

    try {
      const recipe = await generateRecipeFromName(name, targetServings, token);

      setPlannerRecipes((prev) => {
        if (prev.some((r) => r.recipeId === recipe.id)) return prev;
        return [
          ...prev,
          {
            recipeId: recipe.id,
            title: recipe.title,
            image: recipe.image,
            servings: recipe.servings,
            targetServings,
            isPantryReady: false,
            isAiGenerated: recipe.isNew,
          },
        ];
      });

      setQuery("");
      setSearchResults([]);
      setGroceryPlan(null);
    } catch {
      setGenerateError("Failed to generate recipe. Please try again.");
    } finally {
      setGenerating(false);
    }
  }, [token]);

  // ── Update servings ───────────────────────────────────────────────────────

  const updateServings = useCallback((recipeId: number, targetServings: number) => {
    setPlannerRecipes((prev) =>
      prev.map((r) =>
        r.recipeId === recipeId ? { ...r, targetServings } : r,
      ),
    );
    setGroceryPlan(null); // reset plan when servings change
  }, []);

  // ── Remove recipe ─────────────────────────────────────────────────────────

  const removeRecipe = useCallback((recipeId: number) => {
    setPlannerRecipes((prev) => prev.filter((r) => r.recipeId !== recipeId));
    setGroceryPlan(null);
  }, []);

  // ── Generate grocery plan ─────────────────────────────────────────────────

  const generatePlan = useCallback(async () => {
    if (plannerRecipes.length === 0) return;
    setPlanLoading(true);
    setPlanError("");

    try {
      const plan = await fetchGroceryPlan(
        plannerRecipes.map((r) => ({
          recipeId: r.recipeId,
          targetServings: r.targetServings,
        })),
        token,
      );
      setGroceryPlan(plan);
    } catch {
      setPlanError("Failed to generate grocery list. Please try again.");
    } finally {
      setPlanLoading(false);
    }
  }, [plannerRecipes, token]);

  // ── Reset ─────────────────────────────────────────────────────────────────

  const reset = useCallback(() => {
    setPlannerRecipes([]);
    setGroceryPlan(null);
    setQuery("");
    setSearchResults([]);
    setPlanError("");
    setGenerateError("");
  }, []);

  return {
    // Search
    query,
    searchResults,
    searching,
    searchError,
    handleQueryChange,

    // Plan
    plannerRecipes,
    addRecipeFromSearch,
    generateRecipe,
    updateServings,
    removeRecipe,
    generating,
    generateError,

    // Grocery plan
    groceryPlan,
    planLoading,
    planError,
    generatePlan,

    // Reset
    reset,
  };
}