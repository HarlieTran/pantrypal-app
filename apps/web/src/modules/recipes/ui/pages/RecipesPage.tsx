import { useRecipeSuggestions } from "../../application/useRecipeSuggestions";
import { useRecipeDetails } from "../../application/useRecipeDetails";
import { RecipeDetailsModal } from "../components/RecipeDetailsModal";
import "../../styles/recipes.css";
import { CookResultModal } from "../components/CookResultModal";
import { useState } from "react";
import type { CookRecipeResult } from "../../model/recipes.types";
import { useRecipeSave } from "../../application/useRecipeSave";

interface Props {
  token: string;
  onBack: () => void;
  onPantryNavigate: () => void;
  embedded?: boolean;
}

function SaveButton({ recipeId, token }: { recipeId: number; token: string }) {
  const { saved, saving, handleSave } = useRecipeSave(recipeId, false, token);

  return (
    <button
      onClick={() => void handleSave()}
      disabled={saving}
      title={saved ? "Unsave recipe" : "Save recipe"}
      style={{
        position: "absolute",
        top: 8,
        right: 8,
        background: "rgba(255,255,255,0.85)",
        border: "none",
        borderRadius: 6,
        padding: 4,
        cursor: saving ? "default" : "pointer",
        color: saved ? "#dc2743" : "#a8a8a8",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {saved ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
          <path d="M2 2v13.5a.5.5 0 0 0 .74.439L8 13.069l5.26 2.87A.5.5 0 0 0 14 15.5V2a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2"/>
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
          <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13.5a.5.5 0 0 1-.777.416L8 13.101l-5.223 3.815A.5.5 0 0 1 2 16.5zm2-1a1 1 0 0 0-1 1v12.566l4.723-3.482a.5.5 0 0 1 .554 0L13 14.566V2a1 1 0 0 0-1-1z"/>
        </svg>
      )}
    </button>
  );
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
            <article key={r.id} className="ig-recipe-card" style={{ position: "relative" }}>
              <SaveButton recipeId={r.id} token={token} />
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
