import type { SummaryIntelligence, SummarySnapshot } from "../../../infra/summary.api";

type Props = {
  snapshot: SummarySnapshot;
  intelligence: SummaryIntelligence;
};

const SNAPSHOT_ITEMS: Array<{
  key: keyof SummarySnapshot;
  label: string;
}> = [
  { key: "totalPantryItems", label: "Pantry items" },
  { key: "expiringSoonCount", label: "Expiring soon" },
  { key: "savedRecipesCount", label: "Saved recipes" },
  { key: "currentStreak", label: "Cook streak" },
];

function getHealthSegments(snapshot: SummarySnapshot) {
  const total = Math.max(snapshot.totalPantryItems, 1);
  const stableCount = Math.max(
    snapshot.totalPantryItems - snapshot.expiringSoonCount - snapshot.expiredCount,
    0,
  );

  return [
    {
      label: "Stable",
      value: stableCount,
      className: "profile-intelligence-meter-fill is-stable",
    },
    {
      label: "Expiring soon",
      value: snapshot.expiringSoonCount,
      className: "profile-intelligence-meter-fill is-warning",
    },
    {
      label: "Expired",
      value: snapshot.expiredCount,
      className: "profile-intelligence-meter-fill is-danger",
    },
  ].filter((segment) => segment.value > 0).map((segment) => ({
    ...segment,
    width: `${(segment.value / total) * 100}%`,
  }));
}

export function WeeklyIntelligenceHero({ snapshot, intelligence }: Props) {
  const segments = getHealthSegments(snapshot);

  return (
    <section className="profile-intelligence-hero">
      <div className="profile-intelligence-copy">
        <p className="profile-intelligence-kicker">Weekly Intelligence</p>
        <h2 className="profile-intelligence-title">{intelligence.headline}</h2>
        <p className="profile-intelligence-body">{intelligence.narrative}</p>
      </div>

      <div className="profile-intelligence-snapshot">
        <div className="profile-intelligence-meter" aria-hidden="true">
          {segments.map((segment) => (
            <span
              key={segment.label}
              className={segment.className}
              style={{ width: segment.width }}
            />
          ))}
        </div>

        <div className="profile-intelligence-legend">
          {segments.map((segment) => (
            <span key={segment.label} className="profile-intelligence-legend-item">
              <span className={segment.className.replace("fill", "dot")} />
              {segment.label}
            </span>
          ))}
        </div>

        <div className="profile-intelligence-stats">
          {SNAPSHOT_ITEMS.map((item) => (
            <div key={item.key} className="profile-intelligence-stat">
              <p className="profile-intelligence-stat-value">{snapshot[item.key]}</p>
              <p className="profile-intelligence-stat-label">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
