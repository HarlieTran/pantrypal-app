import { useEffect, useState } from "react";
import { fetchRecipeSuggestions } from "../infra/recipes.api";
import type { RecipeSuggestion } from "../model/recipes.types";

export function useRecipeSuggestions(token: string) {
  const [items, setItems] = useState<RecipeSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pantrySignature, setPantrySignature] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await fetchRecipeSuggestions(token, 12);
      setItems(data.recipes);
      setPantrySignature(data.pantrySignature);
    } catch (e) {
      setError(String((e as Error).message || "Failed to load suggestions"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return { items, loading, error, pantrySignature, load };
}
