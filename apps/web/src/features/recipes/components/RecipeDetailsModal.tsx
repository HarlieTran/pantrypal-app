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
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1200,
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 760,
          maxHeight: "90vh",
          overflowY: "auto",
          background: "var(--panel)",
          borderRadius: 16,
          border: "1px solid var(--line)",
          padding: 20,
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            right: 12,
            top: 10,
            border: "none",
            background: "transparent",
            fontSize: 20,
            cursor: "pointer",
            color: "var(--muted)",
          }}
        >
          x
        </button>

        {loading && <p style={{ color: "var(--muted)" }}>Loading recipe details...</p>}

        {!loading && error && (
          <div>
            <p style={{ color: "#b71c1c" }}>{error}</p>
            <button onClick={onRetry}>Retry</button>
          </div>
        )}

        {!loading && !error && recipe && (
          <>
            <h2 style={{ marginTop: 0 }}>{recipe.title}</h2>

            {recipe.image && (
              <img
                src={recipe.image}
                alt={recipe.title}
                style={{ width: "100%", borderRadius: 12, marginBottom: 12 }}
              />
            )}

            <p style={{ color: "var(--muted)", marginTop: 0 }}>
              {recipe.readyInMinutes} min · {recipe.servings} servings
            </p>

            {recipe.summary && <p>{stripHtml(recipe.summary)}</p>}

            <h3>Pantry Match</h3>
            <div style={{ marginBottom: 12 }}>
              <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 600, color: "#2e7d32" }}>
                Matched items
              </p>
              {matchedIngredients.length === 0 ? (
                <p style={{ margin: 0, color: "var(--muted)" }}>No matched pantry items.</p>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {matchedIngredients.map((name, idx) => (
                    <span
                      key={`matched-${idx}-${name}`}
                      style={{
                        fontSize: 12,
                        padding: "3px 8px",
                        borderRadius: 999,
                        background: "#e8f5e9",
                        color: "#2e7d32",
                      }}
                    >
                      {name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginBottom: 12 }}>
              <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 600, color: "#b71c1c" }}>
                Missing items
              </p>
              {missingIngredients.length === 0 ? (
                <p style={{ margin: 0, color: "var(--muted)" }}>No missing ingredients.</p>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {missingIngredients.map((name, idx) => (
                    <span
                      key={`missing-${idx}-${name}`}
                      style={{
                        fontSize: 12,
                        padding: "3px 8px",
                        borderRadius: 999,
                        background: "#ffebee",
                        color: "#b71c1c",
                      }}
                    >
                      {name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <h3>Ingredients</h3>
            <ul>
              {recipe.ingredients.map((x, i) => (
                <li key={`${x}-${i}`}>{x}</li>
              ))}
            </ul>

            <h3>Steps</h3>
            {recipe.steps.length === 0 ? (
              <p style={{ color: "var(--muted)" }}>No instructions provided.</p>
            ) : (
              <ol>
                {recipe.steps.map((s, i) => (
                  <li key={`${s}-${i}`} style={{ marginBottom: 8 }}>
                    {s}
                  </li>
                ))}
              </ol>
            )}

            <div style={{ display: "flex", gap: 8, marginTop: 12, marginBottom: 10 }}>
              <button onClick={onCookPreview} disabled={loading || cooking}>
                {cookPreview ? "Refresh Cook Preview" : "Cook This Recipe"}
              </button>
              {cookPreview && (
                <button onClick={onCookConfirm} disabled={cooking}>
                  {cooking ? "Applying..." : "Confirm Cook"}
                </button>
              )}
            </div>

            {cookError && <p style={{ color: "#b71c1c", marginTop: 0 }}>{cookError}</p>}

            {cookPreview && (
              <div style={{ marginBottom: 12, fontSize: 13, color: "var(--muted)" }}>
                <p style={{ margin: "4px 0" }}>Will update: {cookPreview.updatedItems.length} item(s)</p>
                <p style={{ margin: "4px 0" }}>Will remove: {cookPreview.removedItems.length} item(s)</p>
                <p style={{ margin: "4px 0" }}>Unmatched: {cookPreview.unmatchedIngredients.length}</p>
              </div>
            )}

            {recipe.sourceUrl && (
              <a href={recipe.sourceUrl} target="_blank" rel="noreferrer">
                View source
              </a>
            )}
          </>
        )}
      </div>
    </div>
  );
}
