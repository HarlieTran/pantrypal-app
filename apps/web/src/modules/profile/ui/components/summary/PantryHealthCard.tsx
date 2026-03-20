import type { PantryHealthSummary } from "../../../infra/summary.api";

function StatCard({ value, label, tone }: { value: number; label: string; tone?: "success" | "warning" | "danger" }) {
  return (
    <div className="profile-summary-stat-card">
      <p className={`profile-summary-stat-value${tone ? ` is-${tone}` : ""}`}>{value}</p>
      <p className="profile-summary-stat-label">{label}</p>
    </div>
  );
}

type Props = { pantryHealth: PantryHealthSummary };

export function PantryHealthCard({ pantryHealth }: Props) {
  return (
    <>
      <div className="profile-summary-stat-grid">
        <StatCard value={pantryHealth.totalItems} label="Total items" />
        <StatCard value={pantryHealth.freshCount} label="Fresh" tone="success" />
        <StatCard value={pantryHealth.expiringCount} label="Expiring" tone="warning" />
        <StatCard value={pantryHealth.expiredCount} label="Expired" tone="danger" />
      </div>

      {pantryHealth.categoryBreakdown.filter((c) => c.count > 0).length > 0 && (
        <>
          <p className="profile-summary-section-label">
            By category
          </p>
          <div className="profile-summary-categories">
            {pantryHealth.categoryBreakdown
              .filter((c) => c.count > 0)
              .sort((a, b) => b.count - a.count)
              .map((c) => (
                <span key={c.category} className="profile-summary-category-chip">
                  {c.category} · {c.count}
                </span>
              ))}
          </div>
        </>
      )}
    </>
  );
}
