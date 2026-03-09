import type { ExpiringPreviewItem } from "../../model/home.shared.types";

type UserPanelProps = {
  avatarLabel: string;
  accountId: string;
  displayName: string;
  onboardingCompleted: boolean;
  expiringItems: ExpiringPreviewItem[];
  onLogout: () => void;
  onStartOnboarding: () => void;
  onPantryNavigate: () => void;
};

function getExpiryLabel(item: ExpiringPreviewItem) {
  if (item.status === "expired") return "Expired";
  if (typeof item.daysUntilExpiry === "number") {
    if (item.daysUntilExpiry <= 0) return "Today";
    if (item.daysUntilExpiry === 1) return "Tomorrow";
    return `In ${item.daysUntilExpiry} days`;
  }
  if (item.expiryDate) return `By ${item.expiryDate}`;
  return "Expiring soon";
}

export function UserPanel({
  avatarLabel,
  accountId,
  displayName,
  onboardingCompleted,
  expiringItems,
  onLogout,
  onStartOnboarding,
  onPantryNavigate,
}: UserPanelProps) {
  return (
    <>
      <section className="ig-user-box">
        <div className="ig-avatar">{avatarLabel}</div>
        <div>
          <p className="ig-account-id">{accountId}</p>
          <p className="ig-display-name">{displayName}</p>
        </div>
        <button onClick={onLogout} className="user-panel-logout">Log out</button>
      </section>

      {!onboardingCompleted && (
        <button onClick={onStartOnboarding} className="onboarding-cta">
          <span className="onboarding-cta-icon">✦</span>
          Complete your profile
        </button>
      )}

      <section className="ig-suggest-box">
        <div className="ig-suggest-head">
          <h3>Expiring Soon</h3>
          <button className="ig-plain-link" onClick={onPantryNavigate}>See all</button>
        </div>
        {expiringItems.length ? (
          <ul className="ig-expire-list">
            {expiringItems.map((item) => (
              <li key={`${item.name}-${item.expiryDate ?? "na"}`}>
                <div>
                  <p className="ig-expire-name">{item.name}</p>
                  <p className="ig-expire-meta">{getExpiryLabel(item)}</p>
                </div>
                <span className={`ig-expire-pill ${item.status}`}>
                  {item.status === "expired" ? "Expired" : "Soon"}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="ig-guest-copy">No expiring items. Your pantry looks great!</p>
        )}
      </section>
    </>
  );
}
