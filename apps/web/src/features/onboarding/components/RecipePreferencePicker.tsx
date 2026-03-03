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
    return <main style={{ padding: 24, fontFamily: "system-ui" }}>Loading recipe images...</main>;
  }

  return (
    <main style={{ padding: 24, maxWidth: 1000, margin: "0 auto", fontFamily: "system-ui" }}>
      <h1>Pick your favorite recipes</h1>
      <p>Select the recipes you would most likely cook or eat.</p>

      <div
        style={{
          marginTop: 16,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 12,
        }}
      >
        {images.map((img) => {
          const active = selectedIds.includes(img.id);
          return (
            <button
              key={img.id}
              type="button"
              onClick={() => toggleSelect(img.id)}
              style={{
                border: active ? "3px solid #0d6efd" : "1px solid #ddd",
                borderRadius: 10,
                padding: 8,
                textAlign: "left",
                background: "#fff",
                cursor: "pointer",
              }}
            >
              <img
                src={img.imageUrl}
                alt={img.title}
                style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: 8 }}
              />
              <div style={{ marginTop: 8, fontWeight: 600 }}>{img.title}</div>
              <div style={{ fontSize: 13, color: "#555" }}>{img.cuisine ?? "Unknown cuisine"}</div>
              <div style={{ marginTop: 6, fontSize: 12 }}>
                {active ? "Selected" : "Tap to select"}
              </div>
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 16 }}>
        <p>
          Selected: <strong>{selectedIds.length}</strong> / {images.length}
        </p>
        <button onClick={onContinue} disabled={saving || !canSubmit}>
          {saving ? "Submitting..." : "Continue"}
        </button>
      </div>

      <pre style={{ background: "#f6f6f6", padding: 12, borderRadius: 8, marginTop: 16 }}>
        {result || "Select at least 2 images and continue."}
      </pre>
    </main>
  );
}

