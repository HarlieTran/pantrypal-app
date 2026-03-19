import type { SavedRecipesSummary } from "../../../infra/summary.api";
import "../../../../recipes/styles/recipes.css";

type Props = {
  savedRecipes: SavedRecipesSummary;
  onRecipeClick?: (recipeId: number) => void;
};

export function SavedRecipesCard({ savedRecipes, onRecipeClick }: Props) {
  if (savedRecipes.total === 0) {
    return (
      <p style={{ fontSize: 13, color: "#737373", textAlign: "center", padding: "12px 0" }}>
        No saved recipes yet. Bookmark a recipe to see it here!
      </p>
    );
  }

  return (
    <>
      <p style={{ fontSize: 13, color: "#737373", marginBottom: 12 }}>
        {savedRecipes.total} saved recipe{savedRecipes.total !== 1 ? "s" : ""}
      </p>
      <div className="ig-recipes-grid">
        {savedRecipes.recipes.map((r) => (
          <article
            key={r.recipeId}
            className="ig-recipe-card"
            onClick={() => onRecipeClick?.(r.recipeId)}
            style={{ cursor: onRecipeClick ? "pointer" : "default" }}
          >
            {r.image && (
              <img src={r.image} alt={r.title} className="ig-recipe-card-image" />
            )}
            <div className="ig-recipe-card-body">
              <div className="ig-recipe-card-body-content">
                <h3>{r.title}</h3>
                {r.readyMinutes && <p>{r.readyMinutes} min</p>}
                {r.cuisine.length > 0 && <p>{r.cuisine.join(", ")}</p>}
              </div>
              <p style={{ fontSize: 11, color: "#a8a8a8", marginTop: 6 }}>
                Saved {new Date(r.savedAt).toLocaleDateString("en-US", {
                  month: "short", day: "numeric",
                })}
              </p>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}