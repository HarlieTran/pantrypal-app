import type { CookingActivitySummary } from "../../../infra/summary.api";

function StatCard({ value, label, color }: { value: number; label: string; color?: string }) {
  return (
    <div style={{
      flex: 1, textAlign: "center", padding: "16px 8px",
      borderRadius: 10, background: "#fafafa", border: "1px solid #efefef",
    }}>
      <p style={{ margin: 0, fontSize: 28, fontWeight: 700, color: color ?? "#262626" }}>{value}</p>
      <p style={{ margin: "4px 0 0", fontSize: 12, color: "#737373" }}>{label}</p>
    </div>
  );
}

type Props = {
  cookingActivity: CookingActivitySummary;
  onRecipeClick?: (recipeId: number) => void;
};

export function CookingActivityCard({ cookingActivity, onRecipeClick }: Props) {
  return (
    <>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <StatCard value={cookingActivity.totalCooked} label="All time" />
        <StatCard value={cookingActivity.thisMonthCooked} label="This month" />
        <StatCard
          value={cookingActivity.currentStreak}
          label="Day streak"
          color={cookingActivity.currentStreak > 0 ? "#dc2743" : undefined}
        />
      </div>

      {cookingActivity.recentHistory.length === 0 ? (
        <p style={{ fontSize: 13, color: "#737373", textAlign: "center", padding: "12px 0" }}>
          No cooking history yet. Cook a recipe to get started!
        </p>
      ) : (
        <>
          <p style={{
            fontSize: 11, fontWeight: 700, letterSpacing: 1,
            textTransform: "uppercase", color: "#737373", marginBottom: 10,
          }}>
            Recent cooks
          </p>
          <div style={{ display: "grid", gap: 8 }}>
            {cookingActivity.recentHistory.map((h) => (
              <div
                key={h.id}
                onClick={() => onRecipeClick?.(h.recipeId)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 10px", borderRadius: 8,
                  background: "#fafafa", border: "1px solid #efefef",
                  cursor: onRecipeClick ? "pointer" : "default",
                }}
              >
                {h.recipeImage && (
                  <img
                    src={h.recipeImage}
                    alt={h.recipeTitle}
                    style={{ width: 40, height: 40, borderRadius: 6, objectFit: "cover", flexShrink: 0 }}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#262626" }}>
                    {h.recipeTitle}
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: "#737373" }}>
                    {new Date(h.cookedAt).toLocaleDateString("en-US", {
                      month: "short", day: "numeric", year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}