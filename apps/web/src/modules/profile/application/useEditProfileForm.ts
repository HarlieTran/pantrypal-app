import { useEffect, useState } from "react";
import { fetchProfile, saveProfile, submitProfileRecipeSelections } from "../infra/profile.api";
import type { RecipeSelectionInput } from "../model/profile.types";
import { ALLERGIES, DIETS } from "../model/profile.constants";

type EditProfileFormParams = {
  token: string;
  displayName: string;
};

export function useEditProfileForm({ token, displayName }: EditProfileFormParams) {
  const [name, setName] = useState(displayName);
  const [likes, setLikes] = useState("");
  const [dietType, setDietType] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [disliked, setDisliked] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [view, setView] = useState<"form" | "ai-assist">("form");
  const [aiSuggested, setAiSuggested] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState("");

  const normalize = (value: string) => value.trim().toLowerCase().replace(/\s+/g, "_");
  const byNormalized = (items: string[]) =>
    new Map(items.map((item) => [normalize(item), item]));
  const dietsByValue = byNormalized(DIETS);
  const allergiesByValue = byNormalized(ALLERGIES);

  function matchesQuestion(
    q: { key: string; label: string },
    keys: string[],
    labelIncludes: string[],
  ) {
    const key = q.key.toLowerCase();
    const label = q.label.toLowerCase();
    return keys.some((k) => k === key) || labelIncludes.some((term) => label.includes(term));
  }

  useEffect(() => {
    void (async () => {
      try {
        const profile = await fetchProfile(token);
        if (profile.displayName) setName(profile.displayName);
        if (profile.preferenceProfile?.likes?.length) {
          setLikes(profile.preferenceProfile.likes.join(", "));
        }

        const answers = profile.answers ?? [];

        const prefilledDiets = answers
          .filter((a) => matchesQuestion(a.question, ["diet"], ["diet"]) && a.option?.value)
          .map((a) => dietsByValue.get(normalize(a.option!.value)) ?? a.option!.label)
          .filter(Boolean);
        if (prefilledDiets.length) setDietType(prefilledDiets);

        const prefilledAllergies = answers
          .filter((a) => matchesQuestion(a.question, ["allergies"], ["allerg"]) && a.option?.value)
          .map((a) => allergiesByValue.get(normalize(a.option!.value)) ?? a.option!.label)
          .filter(Boolean);
        if (prefilledAllergies.length) setAllergies(prefilledAllergies);

        const dislikedAnswer = answers.find((a) =>
          matchesQuestion(a.question, ["disliked_ingredients"], ["disliked"]),
        )?.answerText;
        if (dislikedAnswer) setDisliked(dislikedAnswer);

        const notesAnswer = answers.find((a) =>
          matchesQuestion(a.question, ["diet_notes"], ["diet notes"]),
        )?.answerText;
        if (notesAnswer) setNotes(notesAnswer);
      } catch {
        // Keep defaults when load fails in editor flow.
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  function toggleDiet(value: string) {
    setDietType((prev) => (prev.includes(value) ? prev.filter((d) => d !== value) : [...prev, value]));
  }

  function toggleAllergy(value: string) {
    setAllergies((prev) => (prev.includes(value) ? prev.filter((a) => a !== value) : [...prev, value]));
  }

  async function handleSave() {
    setSaving(true);
    setSaveError("");
    try {
      await saveProfile(token, {
        displayName: name,
        likes,
        dietType,
        allergies,
        disliked,
        notes,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      return true;
    } catch (e) {
      setSaveError(String((e as Error).message || "Failed to save profile"));
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleAiPicksComplete(payload: RecipeSelectionInput) {
    const data = await submitProfileRecipeSelections(token, payload);
    const profile = data?.preferenceProfile;

    if (Array.isArray(profile?.dietSignals) && profile.dietSignals.length > 0) {
      setDietType(profile.dietSignals);
    }
    if (Array.isArray(profile?.likes) && profile.likes.length > 0) {
      setLikes(profile.likes.join(", "));
    }
    if (Array.isArray(profile?.dislikes) && profile.dislikes.length > 0) {
      setDisliked(profile.dislikes.join(", "));
    }

    setAiSuggested(true);
    setView("form");
  }

  return {
    name,
    setName,
    likes,
    setLikes,
    dietType,
    allergies,
    disliked,
    setDisliked,
    notes,
    setNotes,
    saving,
    saved,
    view,
    setView,
    aiSuggested,
    loading,
    saveError,
    toggleDiet,
    toggleAllergy,
    handleSave,
    handleAiPicksComplete,
  };
}
