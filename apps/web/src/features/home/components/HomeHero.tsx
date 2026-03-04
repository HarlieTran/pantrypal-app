import { useMemo, useState } from "react";
import type { HomeSpecial } from "../types";

type ExpiringPreviewItem = {
  name: string;
  expiryDate?: string;
  daysUntilExpiry?: number;
  status: "expired" | "expiring_soon";
};

type HomeHeroProps = {
  heroImageSrc: string;
  special?: HomeSpecial;
  homeLoading: boolean;
  homeError: string;
  isLoggedIn: boolean;
  accountId: string;
  displayName: string;
  avatarLabel: string;
  expiringItems: ExpiringPreviewItem[];
  onHome: () => void;
  onLogout: () => void;
  onLoginNavigate: () => void;
  onPantryNavigate: () => void;
};

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

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

export function HomeHero({
  heroImageSrc,
  special,
  homeLoading,
  homeError,
  isLoggedIn,
  accountId,
  displayName,
  avatarLabel,
  expiringItems,
  onHome,
  onLogout,
  onLoginNavigate,
  onPantryNavigate,
}: HomeHeroProps) {
  const [openRow, setOpenRow] = useState<"history" | "flavor" | "origin" | null>(null);
  const today = new Date();
  const todayIndex = today.getDay();
  const todayLabel = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const stories = useMemo(
    () =>
      WEEK_DAYS.map((day, index) => ({
        day,
        isToday: index === todayIndex,
        title: index === todayIndex ? special?.dishName || "Today" : "Special",
      })),
    [special?.dishName, todayIndex],
  );

  return (
    <section className="ig-home">
      <aside className="ig-left-rail">
        <div className="ig-left-logo">PantryPal</div>
        <nav className="ig-left-nav">
          <button className="ig-left-link is-active" onClick={onHome}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-house" viewBox="0 0 16 16">
              <path d="M8.707 1.5a1 1 0 0 0-1.414 0L.646 8.146a.5.5 0 0 0 .708.708L2 8.207V13.5A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5V8.207l.646.647a.5.5 0 0 0 .708-.708L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293zM13 7.207V13.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V7.207l5-5z"/>
            </svg>
            <span className="ig-left-text">Home</span>
          </button>
          <button className="ig-left-link">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-people" viewBox="0 0 16 16">
              <path d="M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1zm-7.978-1L7 12.996c.001-.264.167-1.03.76-1.72C8.312 10.629 9.282 10 11 10c1.717 0 2.687.63 3.24 1.276.593.69.758 1.457.76 1.72l-.008.002-.014.002zM11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4m3-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0M6.936 9.28a6 6 0 0 0-1.23-.247A7 7 0 0 0 5 9c-4 0-5 3-5 4q0 1 1 1h4.216A2.24 2.24 0 0 1 5 13c0-1.01.377-2.042 1.09-2.904.243-.294.526-.569.846-.816M4.92 10A5.5 5.5 0 0 0 4 13H1c0-.26.164-1.03.76-1.724.545-.636 1.492-1.256 3.16-1.275ZM1.5 5.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0m3-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4"/>
            </svg>
            <span className="ig-left-text">Community</span>
          </button>
          <button className="ig-left-link" onClick={onPantryNavigate}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-box-arrow-in-left" viewBox="0 0 16 16">
              <path fillRule="evenodd" d="M10 3.5a.5.5 0 0 0-.5-.5h-8a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5h8a.5.5 0 0 0 .5-.5v-2a.5.5 0 0 1 1 0v2A1.5 1.5 0 0 1 9.5 14h-8A1.5 1.5 0 0 1 0 12.5v-9A1.5 1.5 0 0 1 1.5 2h8A1.5 1.5 0 0 1 11 3.5v2a.5.5 0 0 1-1 0z"/>
              <path fillRule="evenodd" d="M4.146 8.354a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L5.707 7.5H14.5a.5.5 0 0 1 0 1H5.707l2.147 2.146a.5.5 0 0 1-.708.708z"/>
            </svg>
            <span className="ig-left-text">Pantry</span>
          </button>
          {isLoggedIn ? (
            <button className="ig-left-link" onClick={onLogout}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-box-arrow-in-left" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M10 3.5a.5.5 0 0 0-.5-.5h-8a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5h8a.5.5 0 0 0 .5-.5v-2a.5.5 0 0 1 1 0v2A1.5 1.5 0 0 1 9.5 14h-8A1.5 1.5 0 0 1 0 12.5v-9A1.5 1.5 0 0 1 1.5 2h8A1.5 1.5 0 0 1 11 3.5v2a.5.5 0 0 1-1 0z"/>
                <path fillRule="evenodd" d="M4.146 8.354a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L5.707 7.5H14.5a.5.5 0 0 1 0 1H5.707l2.147 2.146a.5.5 0 0 1-.708.708z"/>
              </svg>
              <span className="ig-left-text">Logout</span>
            </button>
          ) : (
            <button className="ig-left-link" onClick={onLoginNavigate}>
              <span className="ig-left-icon">-&gt;</span>
              <span className="ig-left-text">Login</span>
            </button>
          )}
        </nav>
      </aside>

      <div className="ig-main-wrap">
        <div className="ig-content-grid">
          <section className="ig-center-col">
            {/* <header className="ig-center-top">
              <p>Weekly Special Recipes</p>
            </header> */}

            <div className="ig-stories" aria-label="Weekly special recipes">
              {stories.map((story) => (
                <article key={story.day} className="ig-story-item">
                  <button className={`ig-story-ring${story.isToday ? " is-today" : ""}`}>
                    <img src={heroImageSrc} alt={`${story.day} special`} />
                  </button>
                  <span className="ig-story-day">{story.day}</span>
                </article>
              ))}
            </div>

            <article className="ig-post-card">
              <div className="ig-post-head">
                <div className="ig-avatar ig-avatar-sm">{avatarLabel}</div>
                <div>
                  <h2>{special?.dishName || "A new dish is being prepared"}</h2>
                  <p>{todayLabel}</p>
                </div>
              </div>

              <div className="ig-post-image-wrap">
                <img src={heroImageSrc} alt={special?.dishName || "Today's recipe"} className="ig-post-image" />
              </div>

              <div className="ig-post-body">
                <p className="ig-post-caption">
                  {special?.description || "A new dish is being prepared. Stay tuned for today's recipe details."}
                </p>
                <p className="ig-post-meta">
                  {`${special?.cuisine || "Global Cuisine"} - ${special?.origin || "World Kitchen"}`}
                </p>

                <ul className="special-lines">
                  <li>
                    <button
                      className="row-toggle"
                      onClick={() => setOpenRow(openRow === "history" ? null : "history")}
                    >
                      <span className="row-left">History</span>
                      <span className="row-chevron">{openRow === "history" ? "^" : "v"}</span>
                    </button>
                    {openRow === "history" ? (
                      <p className="row-content">{special?.history || "No history details yet."}</p>
                    ) : null}
                  </li>
                  <li>
                    <button
                      className="row-toggle"
                      onClick={() => setOpenRow(openRow === "flavor" ? null : "flavor")}
                    >
                      <span className="row-left">Flavor</span>
                      <span className="row-chevron">{openRow === "flavor" ? "^" : "v"}</span>
                    </button>
                    {openRow === "flavor" ? (
                      <p className="row-content">
                        {special?.description || "Flavor profile details are not available yet."}
                      </p>
                    ) : null}
                  </li>
                  <li>
                    <button
                      className="row-toggle"
                      onClick={() => setOpenRow(openRow === "origin" ? null : "origin")}
                    >
                      <span className="row-left">Origin</span>
                      <span className="row-chevron">{openRow === "origin" ? "^" : "v"}</span>
                    </button>
                    {openRow === "origin" ? (
                      <p className="row-content">{special?.origin || "Origin details are not available yet."}</p>
                    ) : null}
                  </li>
                </ul>

                <div className="panel-cta-row">
                  <button className="btn-primary" onClick={onPantryNavigate}>Manage your Pantry</button>
                  {!isLoggedIn ? (
                    <button className="panel-cta panel-cta-secondary" onClick={onLoginNavigate}>Login</button>
                  ) : null}
                </div>

                {homeLoading ? <p className="detail">Loading today's recipe...</p> : null}
                {homeError ? <p className="error">{homeError}</p> : null}
              </div>
            </article>
          </section>

          <aside className="ig-right-col">
            {isLoggedIn ? (
              <>
                <section className="ig-user-box">
                  <div className="ig-avatar">{avatarLabel}</div>
                  <div>
                    <p className="ig-account-id">{accountId}</p>
                    <p className="ig-display-name">{displayName}</p>
                  </div>
                </section>

                <section className="ig-suggest-box">
                  <div className="ig-suggest-head">
                    <h3>Upcoming Expired Items</h3>
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
                          <span className={`ig-expire-pill ${item.status}`}>{item.status === "expired" ? "Expired" : "Soon"}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="ig-guest-copy">No expiring items right now. Your pantry is in great shape.</p>
                  )}
                </section>
              </>
            ) : (
              <section className="ig-guest-box">
                <h3>Welcome to PantryPal</h3>
                <p className="ig-guest-copy">
                  Make every penny count. Let build a productive pantry with us.
                </p>
                <p className="ig-steps">
                  Three simple steps: create an account -&gt; Scan receipt -&gt; get recipe
                </p>
                <button className="btn-primary" onClick={onLoginNavigate}>Login</button>
              </section>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
}

