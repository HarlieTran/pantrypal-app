import { useEffect, useState } from "react";
import {
  cookRecipe,
  fetchRecipeDetails,
  fetchRecipeSuggestions,
  type CookRecipeResult,
  type RecipeDetails,
  type RecipeSuggestion,
} from "../recipes.api";
import { RecipeDetailsModal } from "../components/RecipeDetailsModal";

interface Props {
  token: string;
  onBack: () => void;
}

export function RecipesPage({ token, onBack }: Props) {
  const [items, setItems] = useState<RecipeSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pantrySignature, setPantrySignature] = useState("");

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeDetails | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<RecipeSuggestion | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  const [cooking, setCooking] = useState(false);
  const [cookPreview, setCookPreview] = useState<CookRecipeResult | null>(null);
  const [cookError, setCookError] = useState("");

  const loadSuggestions = async () => {
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

  const openDetails = async (id: number) => {
    try {
      setSelectedId(id);
      setSelectedSuggestion(items.find((x) => x.id === id) ?? null);
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

  const handleCookPreview = async () => {
    if (!selectedId) return;
    try {
      setCooking(true);
      setCookError("");
      const preview = await cookRecipe(token, selectedId, { servingsUsed: 1, dryRun: true });
      setCookPreview(preview);
    } catch (e) {
      setCookError(String((e as Error).message || "Failed to preview cook action"));
    } finally {
      setCooking(false);
    }
  };

  const handleCookConfirm = async () => {
    if (!selectedId) return;
    try {
      setCooking(true);
      setCookError("");
      const applied = await cookRecipe(token, selectedId, { servingsUsed: 1, dryRun: false });

      const changedCount = applied.updatedItems.length + applied.removedItems.length;
      if (changedCount === 0) {
        const unmatched = applied.unmatchedIngredients.length;
        const warningMsg = applied.warnings.length > 0 ? ` Warnings: ${applied.warnings.length}.` : "";
        alert(`No pantry quantities were deducted. Matched changes: 0. Unmatched ingredients: ${unmatched}.${warningMsg}`);
        return;
      }

      setCookPreview(null);
      setSelectedId(null);
      setSelectedRecipe(null);
      setSelectedSuggestion(null);
      alert(`Pantry updated successfully. Updated: ${applied.updatedItems.length}, Removed: ${applied.removedItems.length}.`);
      onBack();
    } catch (e) {
      setCookError(String((e as Error).message || "Failed to apply cook action"));
    } finally {
      setCooking(false);
    }
  };

  useEffect(() => {
    void loadSuggestions();
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "var(--page-bg)", padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <button onClick={onBack}>Back</button>
        <h1 style={{ margin: 0 }}>Suggested Recipes</h1>
        <button onClick={() => void loadSuggestions()}>Find Recipes</button>
      </div>

      <p style={{ color: "var(--muted)", marginTop: 0 }}>
        Pantry signature: {pantrySignature || "-"}
      </p>

      {loading && <p style={{ color: "var(--muted)" }}>Finding recipes...</p>}
      {!loading && error && <p style={{ color: "#b71c1c" }}>{error}</p>}

      {!loading && !error && items.length === 0 && (
        <p style={{ color: "var(--muted)" }}>No recipe suggestions yet. Add pantry items and retry.</p>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
        {items.map((r) => (
          <div
            key={r.id}
            style={{
              border: "1px solid var(--line)",
              borderRadius: 12,
              overflow: "hidden",
              background: "var(--panel)",
            }}
          >
            <img src={r.image} alt={r.title} style={{ width: "100%", height: 150, objectFit: "cover" }} />
            <div style={{ padding: 12 }}>
              <h3 style={{ margin: "0 0 8px", fontSize: 16 }}>{r.title}</h3>
              <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
                Used: {r.usedIngredientCount} · Missing: {r.missedIngredientCount}
              </p>
              <p style={{ margin: "6px 0 10px", fontSize: 13, color: "#e65100" }}>
                Expiring-soon matched: {r.expiringSoonUsedCount}
              </p>

              <div style={{ marginBottom: 8 }}>
                <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 600, color: "#2e7d32" }}>Matched</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {r.usedIngredients.slice(0, 6).map((name, idx) => (
                    <span
                      key={`used-${r.id}-${idx}`}
                      style={{
                        fontSize: 11,
                        padding: "2px 8px",
                        borderRadius: 999,
                        background: "#e8f5e9",
                        color: "#2e7d32",
                      }}
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 10 }}>
                <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 600, color: "#b71c1c" }}>Missing</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {r.missedIngredients.slice(0, 6).map((name, idx) => (
                    <span
                      key={`missed-${r.id}-${idx}`}
                      style={{
                        fontSize: 11,
                        padding: "2px 8px",
                        borderRadius: 999,
                        background: "#ffebee",
                        color: "#b71c1c",
                      }}
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>

              <button onClick={() => void openDetails(r.id)}>View Recipe</button>
            </div>
          </div>
        ))}
      </div>

      <RecipeDetailsModal
        open={selectedId !== null}
        recipe={selectedRecipe}
        matchedIngredients={selectedSuggestion?.usedIngredients ?? []}
        missingIngredients={selectedSuggestion?.missedIngredients ?? []}
        loading={detailsLoading}
        error={detailsError}
        cooking={cooking}
        cookPreview={cookPreview}
        cookError={cookError}
        onClose={() => {
          setSelectedId(null);
          setSelectedRecipe(null);
          setSelectedSuggestion(null);
          setCookPreview(null);
          setCookError("");
          setDetailsError("");
        }}
        onRetry={() => {
          if (selectedId) void openDetails(selectedId);
        }}
        onCookPreview={() => {
          void handleCookPreview();
        }}
        onCookConfirm={() => {
          void handleCookConfirm();
        }}
      />
    </div>
  );
}
