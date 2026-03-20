import type { SavedRecipesSummary } from "../../../infra/summary.api";
import "../../../../recipes/styles/recipes.css";

type Props = {
  savedRecipes: SavedRecipesSummary;
  onRecipeClick?: (recipeId: number) => void;
};

export function SavedRecipesCard({ savedRecipes, onRecipeClick }: Props) {
  if (savedRecipes.total === 0) {
    return (
      <p className="profile-saved-empty">
        No saved recipes yet. Bookmark a recipe to see it here!
      </p>
    );
  }

  return (
    <>
      <p className="profile-saved-copy">
        {savedRecipes.total} saved recipe{savedRecipes.total !== 1 ? "s" : ""}
      </p>
      <div className="ig-recipes-grid">
        {savedRecipes.recipes.map((r) => (
          <article
            key={r.recipeId}
            className={`ig-recipe-card profile-saved-card${onRecipeClick ? " is-clickable" : ""}`}
            onClick={() => onRecipeClick?.(r.recipeId)}
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
              <p className="profile-saved-meta">
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
