import type { PlannerRecipe } from "../../model/planner.types";

type Props = {
  recipes: PlannerRecipe[];
  onUpdateServings: (recipeId: number, servings: number) => void;
  onRemove: (recipeId: number) => void;
};

export function PlannerRecipeList({ recipes, onUpdateServings, onRemove }: Props) {
  if (recipes.length === 0) {
    return (
      <p className="ig-planner-recipes-empty">
        No recipes added yet. Search above to add recipes to your plan.
      </p>
    );
  }

  return (
    <div className="ig-planner-recipes-list">
      {recipes.map((r) => (
        <div key={r.recipeId} className="ig-planner-recipe-card">
          {/* Image */}
          {r.image && (
            <img
              src={r.image}
              alt={r.title}
              className="ig-planner-recipe-thumb"
            />
          )}

          {/* Info */}
          <div className="ig-planner-recipe-meta">
            <p className="ig-planner-recipe-title">
              {r.title}
              {r.isAiGenerated && (
                <span className="ig-planner-recipe-ai">
                  AI
                </span>
              )}
            </p>
            <p className="ig-planner-recipe-status">
              {r.isPantryReady ? "✅ Pantry ready" : "⭕ Missing ingredients"}
            </p>
          </div>

          {/* Servings control */}
          <div className="ig-planner-servings">
            <span className="ig-planner-servings-label">Servings</span>
            <button
              onClick={() => onUpdateServings(r.recipeId, Math.max(1, r.targetServings - 1))}
              className="ig-planner-servings-button"
            >
              −
            </button>
            <span className="ig-planner-servings-count">
              {r.targetServings}
            </span>
            <button
              onClick={() => onUpdateServings(r.recipeId, Math.min(20, r.targetServings + 1))}
              className="ig-planner-servings-button"
            >
              +
            </button>
          </div>

          {/* Remove */}
          <button
            onClick={() => onRemove(r.recipeId)}
            className="ig-planner-remove-recipe"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
