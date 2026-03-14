import { useRecipeSuggestions } from "../../application/useRecipeSuggestions";
import { useRecipeDetails } from "../../application/useRecipeDetails";
import { RecipeDetailsModal } from "../components/RecipeDetailsModal";
import "../../styles/recipes.css";
import { CookResultModal } from "../components/CookResultModal";
import { useState } from "react";
import type { CookRecipeResult } from "../../model/recipes.types";

interface Props {
  token: string;
  onBack: () => void;
  onPantryNavigate: () => void;
  embedded?: boolean;
}

export function RecipesPage({ token, onBack, onPantryNavigate, embedded = false }: Props) {
  const { items, loading, error, pantrySignature, load } = useRecipeSuggestions(token);
  const {
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
  } = useRecipeDetails(token, items);

  const [cookResult, setCookResult] = useState<{ result: CookRecipeResult; title: string; noOp?: boolean } | null>(null);

  const handleCookConfirm = async () => {
    try {
      const applied = await confirm();
      if (applied) {
        const isNoOp = (applied as any).noOp === true;
        if (isNoOp) {
          const a = applied as any;
          setCookResult({
            result: { ...applied, updatedItems: [], removedItems: [], unmatchedIngredients: Array(a.unmatchedCount).fill("?"), warnings: [] },
            title: items.find((r) => r.id === selectedId)?.title ?? "Recipe",
            noOp: true,
          });
          close();
          return;
        }
        close();
        const title = items.find((r) => r.id === selectedId)?.title ?? "Recipe";
        setCookResult({ result: applied, title });
      }
    } catch {
      // error already set in hook
    }
  };

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
            <button className="btn-primary" onClick={() => void load()}>Find Recipes</button>
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
                  <p>Used: {r.matchedCount ?? r.usedIngredientCount ?? 0} · Missing: {r.missedCount ?? r.missedIngredientCount ?? 0}</p>
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
                  <button className="btn-primary" onClick={() => void open(r.id)}>View Recipe</button>
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
          onClose={close}
          onRetry={retry}
          onCookPreview={() => void preview()}
          onCookConfirm={() => void handleCookConfirm()}
        />

        {cookResult && (
          <CookResultModal
            result={cookResult.result}
            recipeTitle={cookResult.title}
            noOp={cookResult.noOp ?? false}
            onClose={() => setCookResult(null)}
            onGoToPantry={() => { setCookResult(null); onPantryNavigate(); }}
          />
        )}
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
