import { useEffect, useMemo, useState } from "react";
import { getRecipeImages } from "../api/onboarding";

type RecipeImage = {
  id: string;
  title: string;
  imageUrl: string;
  cuisine?: string | null;
};

type Props = {
  onSubmitSelection: (payload: {
    selectedImageIds: string[];
    rejectedImageIds: string[];
  }) => Promise<void> | void;
};

export function RecipePreferencePicker({ onSubmitSelection }: Props) {
  const [images, setImages] = useState<RecipeImage[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState("");

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const data = await getRecipeImages(6);
        if (!mounted) return;
        setImages(Array.isArray(data?.images) ? data.images : []);
      } catch (error) {
        if (!mounted) return;
        setResult(`Failed to load images: ${String((error as Error).message || error)}`);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const rejectedIds = useMemo(
    () => images.map((x) => x.id).filter((id) => !selectedIds.includes(id)),
    [images, selectedIds],
  );

  const canSubmit = selectedIds.length >= 2; // minimum signal quality

  const onContinue = async () => {
    if (!canSubmit) {
      setResult("Please select at least 2 recipes.");
      return;
    }

    setSaving(true);
    setResult("");

    try {
      await onSubmitSelection({
        selectedImageIds: selectedIds,
        rejectedImageIds: rejectedIds,
      });
      setResult("Selection submitted.");
    } catch (error) {
      setResult(`Failed to submit selection: ${String((error as Error).message || error)}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <main className="ig-screen"><div className="ig-page-note">Loading recipe images...</div></main>;
  }

  return (
    <main className="ig-screen">
      <section className="ig-page-shell ig-onboarding-shell">
        <header className="ig-page-header">
          <h1>Pick your favorite recipes</h1>
          <p>Select the recipes you would most likely cook or eat.</p>
        </header>

        <div className="ig-recipe-picker-grid">
          {images.map((img) => {
            const active = selectedIds.includes(img.id);
            return (
              <button
                key={img.id}
                type="button"
                onClick={() => toggleSelect(img.id)}
                className={`ig-recipe-pick-card${active ? " is-active" : ""}`}
              >
                <img src={img.imageUrl} alt={img.title} className="ig-recipe-pick-image" />
                <div className="ig-recipe-pick-title">{img.title}</div>
                <div className="ig-recipe-pick-cuisine">{img.cuisine ?? "Unknown cuisine"}</div>
                <div className="ig-recipe-pick-state">{active ? "Selected" : "Tap to select"}</div>
              </button>
            );
          })}
        </div>

        <div className="ig-page-actions ig-picker-actions">
          <p>
            Selected: <strong>{selectedIds.length}</strong> / {images.length}
          </p>
          <button className="btn-primary" onClick={onContinue} disabled={saving || !canSubmit}>
            {saving ? "Submitting..." : "Continue"}
          </button>
        </div>

        <pre className="ig-page-result">
          {result || "Select at least 2 images and continue."}
        </pre>
      </section>
    </main>
  );
}

