import { useEffect, useMemo, useState } from "react";
import { getRecipeImages } from "../infra/onboarding.api";

type RecipeImage = { id: string; title: string; imageUrl: string; cuisine?: string | null };

export function useRecipePreferencePicker() {
  const [images, setImages] = useState<RecipeImage[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedAll, setSelectedAll] = useState<string[]>([]);
  const [rejectedAll, setRejectedAll] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [round, setRound] = useState(1);

  const loadImages = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getRecipeImages(6);
      setImages(Array.isArray(data?.images) ? data.images : []);
      setSelectedIds([]);
    } catch (e) {
      setError(String((e as Error).message || "Failed to load images."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadImages();
  }, []);

  const toggle = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const rejectedIds = useMemo(
    () => images.map((x) => x.id).filter((id) => !selectedIds.includes(id)),
    [images, selectedIds],
  );

  const mergeCurrentRound = () => {
    const selectedSet = new Set(selectedAll);
    const rejectedSet = new Set(rejectedAll);

    for (const id of selectedIds) {
      selectedSet.add(id);
      rejectedSet.delete(id);
    }

    for (const id of rejectedIds) {
      rejectedSet.add(id);
      selectedSet.delete(id);
    }

    return { selected: [...selectedSet], rejected: [...rejectedSet] };
  };

  const submit = async (onComplete: (payload: { selectedImageIds: string[]; rejectedImageIds: string[] }) => Promise<void>) => {
    const merged = mergeCurrentRound();
    if (merged.selected.length < 1) {
      setError("Please select at least one recipe.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await onComplete({ selectedImageIds: merged.selected, rejectedImageIds: merged.rejected });
    } catch (e) {
      setError(String((e as Error).message || "Failed to submit."));
      throw e;
    } finally {
      setSaving(false);
    }
  };

  const loadMore = () => {
    const merged = mergeCurrentRound();
    setSelectedAll(merged.selected);
    setRejectedAll(merged.rejected);
    setRound((r) => r + 1);
    void loadImages();
  };

  const selectedAcrossRounds = selectedAll.length + selectedIds.length;

  return { images, selectedIds, loading, saving, error, round, selectedAcrossRounds, toggle, submit, loadMore };
}
