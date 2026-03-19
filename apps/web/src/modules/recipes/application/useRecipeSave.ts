import { useState, useEffect, useRef } from "react";
import { toggleSaveRecipe } from "../infra/recipes.api";

export function useRecipeSave(
  recipeId: number,
  initialSaved: boolean,
  token?: string,
) {
  const [saved, setSaved] = useState(initialSaved);
  const [saving, setSaving] = useState(false);
  const hasInteracted = useRef(false);

  useEffect(() => {
    if (!hasInteracted.current && !saving) {
      setSaved(initialSaved);
    }
  }, [initialSaved]);

  async function handleSave() {
    if (!token || saving) return;

    hasInteracted.current = true;
    setSaving(true);

    const wasSaved = saved;
    setSaved(!wasSaved);

    try {
      const result = await toggleSaveRecipe(token, recipeId);
      setSaved(result.saved);
    } catch {
      setSaved(wasSaved);
    } finally {
      setSaving(false);
    }
  }

  return { saved, saving, handleSave };
}