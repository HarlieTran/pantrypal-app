import type { CookingActivitySummary } from "../../../infra/summary.api";

function StatCard({ value, label, tone }: { value: number; label: string; tone?: "accent" }) {
  return (
    <div className="profile-summary-stat-card">
      <p className={`profile-summary-stat-value${tone ? ` is-${tone}` : ""}`}>{value}</p>
      <p className="profile-summary-stat-label">{label}</p>
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
      <div className="profile-summary-stat-grid">
        <StatCard value={cookingActivity.totalCooked} label="All time" />
        <StatCard value={cookingActivity.thisMonthCooked} label="This month" />
        <StatCard
          value={cookingActivity.currentStreak}
          label="Day streak"
          tone={cookingActivity.currentStreak > 0 ? "accent" : undefined}
        />
      </div>

      {cookingActivity.recentHistory.length === 0 ? (
        <p className="profile-summary-empty">
          No cooking history yet. Cook a recipe to get started!
        </p>
      ) : (
        <>
          <p className="profile-summary-section-label">
            Recent cooks
          </p>
          <div className="profile-summary-list">
            {cookingActivity.recentHistory.map((h) => (
              <div
                key={h.id}
                onClick={() => onRecipeClick?.(h.recipeId)}
                className={`profile-summary-item${onRecipeClick ? " is-clickable" : ""}`}
              >
                {h.recipeImage && (
                  <img
                    src={h.recipeImage}
                    alt={h.recipeTitle}
                    className="profile-summary-thumb"
                  />
                )}
                <div className="profile-summary-item-meta">
                  <p className="profile-summary-item-title">
                    {h.recipeTitle}
                  </p>
                  <p className="profile-summary-item-copy">
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
