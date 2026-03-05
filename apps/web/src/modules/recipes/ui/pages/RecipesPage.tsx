import { useEffect, useState } from "react";
import {
  cookRecipe,
  fetchRecipeDetails,
  fetchRecipeSuggestions,
} from "../../infra/recipes.api";
import type { CookRecipeResult, RecipeDetails, RecipeSuggestion } from "../../model/recipes.types";
import { RecipeDetailsModal } from "../components/RecipeDetailsModal";

interface Props {
  token: string;
  onBack: () => void;
  embedded?: boolean;
}

export function RecipesPage({ token, onBack, embedded = false }: Props) {
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

  const content = (
    <>
        <header className="ig-toolbar">
          <div className="ig-toolbar-left">
            <div>
              <p><i>Hello, </i></p>
              <h1 className="ig-toolbar-title">Suggested Recipes</h1>
              {/* <p className="ig-toolbar-subtitle">Pantry signature: {pantrySignature || "-"}</p> */}
            </div>
          </div>
          <div className="ig-toolbar-actions">
            <button className="btn-primary" onClick={() => void loadSuggestions()}>Find Recipes</button>
          </div>
        </header>

        {loading ? <p className="ig-page-note">Finding recipes...</p> : null}
        {!loading && error ? <p className="ig-error-note">{error}</p> : null}
        {!loading && !error && items.length === 0 ? (
          <p className="ig-page-note">No recipe suggestions yet. Add pantry items and retry.</p>
        ) : null}

        <div className="ig-recipes-grid">
          {items.map((r) => (
            <article key={r.id} className="ig-recipe-card">
              <img src={r.image} alt={r.title} className="ig-recipe-card-image" />
              <div className="ig-recipe-card-body">
                <div className="ig-recipe-card-body-content">
                  <h3>{r.title}</h3>
                  <p>Used: {r.usedIngredientCount} - Missing: {r.missedIngredientCount}</p>
                  <p className="ig-recipe-expire">Expiring-soon matched: {r.expiringSoonUsedCount}</p>

                  <div className="ig-chip-group-wrap">
                    <p className="ig-chip-title matched">Matched</p>
                    <div className="ig-chip-group">
                      {r.usedIngredients.slice(0, 6).map((name, idx) => (
                        <span key={`used-${r.id}-${idx}`} className="ig-chip matched">{name}</span>
                      ))}
                    </div>
                  </div>

                  <div className="ig-chip-group-wrap">
                    <p className="ig-chip-title missing">Missing</p>
                    <div className="ig-chip-group">
                      {r.missedIngredients.slice(0, 6).map((name, idx) => (
                        <span key={`missed-${r.id}-${idx}`} className="ig-chip missing">{name}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="ig-recipe-card-body-footer">
                  <button className="btn-primary" onClick={() => void openDetails(r.id)}>View Recipe</button>
                </div>
              </div>
            </article>
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
    </>
  );

  if (embedded) {
    return <section className="ig-recipes-embedded">{content}</section>;
  }

  return (
    <main className="ig-screen">
      <section className="ig-page-shell ig-recipes-shell">
        {content}
      </section>
    </main>
  );
}
