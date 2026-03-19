import type { PlannerRecipe } from "../../model/planner.types";

type Props = {
  recipes: PlannerRecipe[];
  onUpdateServings: (recipeId: number, servings: number) => void;
  onRemove: (recipeId: number) => void;
};

export function PlannerRecipeList({ recipes, onUpdateServings, onRemove }: Props) {
  if (recipes.length === 0) {
    return (
      <p style={{ fontSize: 13, color: "#737373", textAlign: "center", padding: "20px 0" }}>
        No recipes added yet. Search above to add recipes to your plan.
      </p>
    );
  }

  return (
    <div style={{ display: "grid", gap: 8 }}>
      {recipes.map((r) => (
        <div
          key={r.recipeId}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid #efefef",
            background: "#fafafa",
          }}
        >
          {/* Image */}
          {r.image && (
            <img
              src={r.image}
              alt={r.title}
              style={{ width: 44, height: 44, borderRadius: 6, objectFit: "cover", flexShrink: 0 }}
            />
          )}

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#262626" }}>
              {r.title}
              {r.isAiGenerated && (
                <span style={{ marginLeft: 6, fontSize: 10, color: "#dc2743", fontWeight: 700 }}>
                  AI
                </span>
              )}
            </p>
            <p style={{ margin: 0, fontSize: 11, color: "#737373" }}>
              {r.isPantryReady ? "✅ Pantry ready" : "⭕ Missing ingredients"}
            </p>
          </div>

          {/* Servings control */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <span style={{ fontSize: 11, color: "#737373" }}>Servings</span>
            <button
              onClick={() => onUpdateServings(r.recipeId, Math.max(1, r.targetServings - 1))}
              style={{
                width: 24, height: 24, borderRadius: 6,
                border: "1px solid #dbdbdb", background: "#fff",
                cursor: "pointer", fontSize: 14, display: "flex",
                alignItems: "center", justifyContent: "center",
              }}
            >
              −
            </button>
            <span style={{ fontSize: 13, fontWeight: 600, minWidth: 20, textAlign: "center" }}>
              {r.targetServings}
            </span>
            <button
              onClick={() => onUpdateServings(r.recipeId, Math.min(20, r.targetServings + 1))}
              style={{
                width: 24, height: 24, borderRadius: 6,
                border: "1px solid #dbdbdb", background: "#fff",
                cursor: "pointer", fontSize: 14, display: "flex",
                alignItems: "center", justifyContent: "center",
              }}
            >
              +
            </button>
          </div>

          {/* Remove */}
          <button
            onClick={() => onRemove(r.recipeId)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 16, color: "#a8a8a8", padding: 4, flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}