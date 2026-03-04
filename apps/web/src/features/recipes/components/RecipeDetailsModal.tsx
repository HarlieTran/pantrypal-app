import type { CookRecipeResult, RecipeDetails } from "../recipes.api";

interface Props {
  open: boolean;
  recipe: RecipeDetails | null;
  matchedIngredients: string[];
  missingIngredients: string[];
  loading: boolean;
  error: string;
  cooking: boolean;
  cookPreview: CookRecipeResult | null;
  cookError: string;
  onClose: () => void;
  onRetry: () => void;
  onCookPreview: () => void;
  onCookConfirm: () => void;
}

function stripHtml(input: string) {
  return input.replace(/<[^>]*>/g, "").trim();
}

export function RecipeDetailsModal({
  open,
  recipe,
  matchedIngredients,
  missingIngredients,
  loading,
  error,
  cooking,
  cookPreview,
  cookError,
  onClose,
  onRetry,
  onCookPreview,
  onCookConfirm,
}: Props) {
  if (!open) return null;

  return (
    <div onClick={onClose} className="ig-modal-backdrop">
      <div onClick={(e) => e.stopPropagation()} className="ig-modal-card ig-recipe-modal">
        <button className="ig-modal-close" onClick={onClose} aria-label="Close recipe details">x</button>

        {loading ? <p className="ig-page-note">Loading recipe details...</p> : null}

        {!loading && error ? (
          <div className="ig-modal-error-wrap">
            <p className="ig-error-note">{error}</p>
            <button className="btn-primary" onClick={onRetry}>Retry</button>
          </div>
        ) : null}

        {!loading && !error && recipe ? (
          <>
            <h2 className="ig-modal-title">{recipe.title}</h2>

            {recipe.image ? (
              <img src={recipe.image} alt={recipe.title} className="ig-recipe-modal-image" />
            ) : null}

            <p className="ig-modal-subtitle">
              {recipe.readyInMinutes} min - {recipe.servings} servings
            </p>

            {recipe.summary ? <p className="ig-modal-body-text">{stripHtml(recipe.summary)}</p> : null}

            <h3 className="ig-modal-section-title">Pantry Match</h3>

            <div className="ig-chip-group-wrap">
              <p className="ig-chip-title matched">Matched items</p>
              {matchedIngredients.length === 0 ? (
                <p className="ig-page-note">No matched pantry items.</p>
              ) : (
                <div className="ig-chip-group">
                  {matchedIngredients.map((name, idx) => (
                    <span key={`matched-${idx}-${name}`} className="ig-chip matched">{name}</span>
                  ))}
                </div>
              )}
            </div>

            <div className="ig-chip-group-wrap">
              <p className="ig-chip-title missing">Missing items</p>
              {missingIngredients.length === 0 ? (
                <p className="ig-page-note">No missing ingredients.</p>
              ) : (
                <div className="ig-chip-group">
                  {missingIngredients.map((name, idx) => (
                    <span key={`missing-${idx}-${name}`} className="ig-chip missing">{name}</span>
                  ))}
                </div>
              )}
            </div>

            <h3 className="ig-modal-section-title">Ingredients</h3>
            <ul className="ig-modal-list">
              {recipe.ingredients.map((x, i) => (
                <li key={`${x}-${i}`}>{x}</li>
              ))}
            </ul>

            <h3 className="ig-modal-section-title">Steps</h3>
            {recipe.steps.length === 0 ? (
              <p className="ig-page-note">No instructions provided.</p>
            ) : (
              <ol className="ig-modal-list">
                {recipe.steps.map((s, i) => (
                  <li key={`${s}-${i}`}>{s}</li>
                ))}
              </ol>
            )}

            <div className="ig-modal-actions">
              <button className="btn-primary" onClick={onCookPreview} disabled={loading || cooking}>
                {cookPreview ? "Refresh Cook Preview" : "Cook This Recipe"}
              </button>
              {cookPreview ? (
                <button className="btn-primary" onClick={onCookConfirm} disabled={cooking}>
                  {cooking ? "Applying..." : "Confirm Cook"}
                </button>
              ) : null}
            </div>

            {cookError ? <p className="ig-error-note">{cookError}</p> : null}

            {cookPreview ? (
              <div className="ig-modal-summary">
                <p>Will update: {cookPreview.updatedItems.length} item(s)</p>
                <p>Will remove: {cookPreview.removedItems.length} item(s)</p>
                <p>Unmatched: {cookPreview.unmatchedIngredients.length}</p>
              </div>
            ) : null}

            {recipe.sourceUrl ? (
              <a href={recipe.sourceUrl} target="_blank" rel="noreferrer" className="ig-plain-link">
                View source
              </a>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}

