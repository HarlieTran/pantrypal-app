import type { PantryHealthSummary } from "../../../infra/summary.api";

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

type Props = { pantryHealth: PantryHealthSummary };

export function PantryHealthCard({ pantryHealth }: Props) {
  return (
    <>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <StatCard value={pantryHealth.totalItems} label="Total items" />
        <StatCard value={pantryHealth.freshCount} label="Fresh" color="#2e7d32" />
        <StatCard value={pantryHealth.expiringCount} label="Expiring" color="#e65100" />
        <StatCard value={pantryHealth.expiredCount} label="Expired" color="#b71c1c" />
      </div>

      {pantryHealth.categoryBreakdown.filter((c) => c.count > 0).length > 0 && (
        <>
          <p style={{
            fontSize: 11, fontWeight: 700, letterSpacing: 1,
            textTransform: "uppercase", color: "#737373", marginBottom: 10,
          }}>
            By category
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {pantryHealth.categoryBreakdown
              .filter((c) => c.count > 0)
              .sort((a, b) => b.count - a.count)
              .map((c) => (
                <span key={c.category} style={{
                  fontSize: 12, padding: "3px 10px", borderRadius: 999,
                  background: "#f0f0f0", color: "#262626", fontWeight: 600,
                }}>
                  {c.category} · {c.count}
                </span>
              ))}
          </div>
        </>
      )}
    </>
  );
}