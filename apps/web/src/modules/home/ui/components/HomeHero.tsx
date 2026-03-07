import { useEffect, useMemo, useRef, useState } from "react";
import type { HomeSpecial } from "../../model/home.types";
import type { RightPanel } from "../../../../app/App";
import { OnboardingQuestionnaire, RecipePreferencePicker } from "../../../onboarding";
import { PantryPage } from "../../../pantry";
import { RecipesPage } from "../../../recipes";
import { ProfilePage, EditProfilePage } from "../../../profile";
import { CommunityFeed, useCommunityFeed, useWeeklyTopics, WeeklyStoryCircles, PostComposer } from "../../../community";


type ExpiringPreviewItem = {
  name: string;
  expiryDate?: string;
  daysUntilExpiry?: number;
  status: "expired" | "expiring_soon";
};

type HomeHeroProps = {
  centerView: "home" | "pantry" | "recipes" | "profile" | "edit-profile" | "community";
  heroImageSrc: string;
  special?: HomeSpecial;
  homeLoading: boolean;
  homeError: string;
  isLoggedIn: boolean;
  accountId: string;
  displayName: string;
  avatarLabel: string;
  expiringItems: ExpiringPreviewItem[];
  rightPanel: RightPanel;
  authError: string;
  authLoading: boolean;
  email: string;
  password: string;
  givenName: string;
  familyName: string;
  code: string;
  token: string;
  onboardingCompleted: boolean;
  sub?: string;
  onEmailChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onGivenNameChange: (v: string) => void;
  onFamilyNameChange: (v: string) => void;
  onCodeChange: (v: string) => void;
  onHome: () => void;
  onLogout: () => void;
  onLoginNavigate: () => void;
  onSignUpNavigate: () => void;
  onPantryNavigate: () => void;
  onLogin: () => void;
  onSignUp: () => void;
  onConfirm: () => void;
  onResend: () => void;
  onRecipesNavigate: () => void;
  onOnboardingComplete: () => void;
  onPicksComplete: (payload: { selectedImageIds: string[]; rejectedImageIds: string[] }) => Promise<void>;
  onRequestMorePicks: () => void;
  onRightPanelChange: (panel: RightPanel) => void;
  onProfileNavigate: () => void;
  onEditProfileNavigate: () => void;
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

// ─── Animated panel wrapper ───────────────────────────────────────────────────

function AnimatedPanel({ panelKey, children }: { panelKey: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.classList.remove("ig-right-panel-enter");
    void el.offsetWidth; // force reflow
    el.classList.add("ig-right-panel-enter");
  }, [panelKey]);

  return <div ref={ref}>{children}</div>;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function HomeHero({
  centerView,
  heroImageSrc,
  special,
  homeLoading,
  homeError,
  isLoggedIn,
  accountId,
  displayName,
  avatarLabel,
  expiringItems,
  rightPanel,
  authError,
  authLoading,
  email,
  password,
  givenName,
  familyName,
  code,
  token,
  onboardingCompleted,
  sub,
  onEmailChange,
  onPasswordChange,
  onGivenNameChange,
  onFamilyNameChange,
  onCodeChange,
  onHome,
  onLogout,
  onLoginNavigate,
  onSignUpNavigate,
  onPantryNavigate,
  onLogin,
  onSignUp,
  onConfirm,
  onResend,
  onRecipesNavigate,
  onOnboardingComplete,
  onPicksComplete,
  onRequestMorePicks,
  onRightPanelChange,
  onProfileNavigate,
  onEditProfileNavigate,
}: HomeHeroProps) {
  const [openRow, setOpenRow] = useState<"history" | "flavor" | "origin" | null>(null);
  const isBootstrapping = false;
  const { posts, pinnedTopic, nextCursor, loading, loadingMore, error, loadMore, refresh } =
    useCommunityFeed({ token, enabled: true });
  
  const { topics } = useWeeklyTopics();
  
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  
  const filteredPosts = selectedDate
    ? posts.filter((p) => p.createdAt.startsWith(selectedDate))
    : posts;
    const today = new Date();
    const todayIndex = today.getDay();
    const todayLabel = today.toLocaleDateString("en-US", {
      weekday: "long", month: "long", day: "numeric",
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

  const [showComposer, setShowComposer] = useState(false);

  // ─── Right panel state machine ──────────────────────────────────────────────

  function renderRightPanel() {
    switch (rightPanel) {

      case "guest":
        return (
          <AnimatedPanel panelKey="guest">
            <section className="ig-guest-box">
              <h3>Welcome to PantryPal</h3>
              <p className="ig-guest-copy">
                Make every penny count. Build a smarter pantry and never waste food again.
              </p>
              <p className="ig-steps">
                Three steps: create account → scan receipt → get recipe
              </p>
              <div style={{ display: "flex", gap: "10px", marginTop: "16px", flexWrap: "wrap" }}>
                <button className="btn-primary" onClick={onLoginNavigate}>Log in</button>
              </div>
            </section>
          </AnimatedPanel>
        );

      case "login":
        return (
          <AnimatedPanel panelKey="login">
            <section>
              <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--muted)", marginBottom: "8px" }}>
                Welcome back
              </p>
              <h3 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "20px", letterSpacing: "-0.3px" }}>
                Log in
              </h3>
              <div style={{ display: "grid", gap: "10px", marginBottom: "14px" }}>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => onEmailChange(e.target.value)}
                  autoComplete="email"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => onPasswordChange(e.target.value)}
                  autoComplete="current-password"
                  onKeyDown={(e) => { if (e.key === "Enter") onLogin(); }}
                />
              </div>
              {authError && (
                <p style={{ fontSize: "13px", color: "var(--error)", marginBottom: "10px" }}>
                  {authError}
                </p>
              )}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button
                  className="btn-primary"
                  onClick={onLogin}
                  disabled={authLoading}
                  style={{ flex: 1 }}
                >
                  {authLoading ? "Logging in…" : "Log in"}
                </button>
              </div>
              <p style={{ marginTop: "14px", fontSize: "13px", color: "var(--muted)" }}>
                Don't have an account?{" "}
                <button
                  onClick={onSignUpNavigate}
                  style={{ color: "var(--accent)", fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: "13px" }}
                >
                  Sign up
                </button>
              </p>
            </section>
          </AnimatedPanel>
        );

      case "signup":
        return (
          <AnimatedPanel panelKey="signup">
            <section>
              <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--muted)", marginBottom: "8px" }}>
                Create account
              </p>
              <h3 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "20px", letterSpacing: "-0.3px" }}>
                Sign up
              </h3>
              <div style={{ display: "grid", gap: "10px", marginBottom: "14px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <input
                    type="text"
                    placeholder="First name"
                    value={givenName}
                    onChange={(e) => onGivenNameChange(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Last name"
                    value={familyName}
                    onChange={(e) => onFamilyNameChange(e.target.value)}
                  />
                </div>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => onEmailChange(e.target.value)}
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => onPasswordChange(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Verification code (after signup)"
                  value={code}
                  onChange={(e) => onCodeChange(e.target.value)}
                />
              </div>
              {authError && (
                <p style={{ fontSize: "13px", color: "var(--error)", marginBottom: "10px" }}>
                  {authError}
                </p>
              )}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button
                  className="btn-primary"
                  onClick={onSignUp}
                  disabled={authLoading}
                  style={{ flex: 1 }}
                >
                  {authLoading ? "Creating…" : "Create account"}
                </button>
                <button className="btn-secondary" onClick={onConfirm} disabled={authLoading}>
                  Confirm code
                </button>
              </div>
              <div style={{ marginTop: "10px", display: "flex", gap: "12px", alignItems: "center" }}>
                <button
                  onClick={onResend}
                  style={{ color: "var(--muted)", fontSize: "12px", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                >
                  Resend code
                </button>
                <span style={{ color: "var(--line)" }}>·</span>
                <button
                  onClick={onLoginNavigate}
                  style={{ color: "var(--accent)", fontWeight: 600, fontSize: "13px", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                >
                  Already have an account?
                </button>
              </div>
            </section>
          </AnimatedPanel>
        );

      case "success":
        return (
          <AnimatedPanel panelKey="success">
            <section style={{ textAlign: "center", padding: "24px 0" }}>
              <div style={{
                width: "56px", height: "56px", borderRadius: "50%",
                background: "linear-gradient(45deg, #feda75, #fa7e1e, #d62976, #962fbf, #4f5bd5)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 16px", fontSize: "24px",
              }}>
                ✓
              </div>
              <h3 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>Welcome back!</h3>
              <p style={{ fontSize: "13px", color: "var(--muted)" }}>Loading your pantry…</p>
            </section>
          </AnimatedPanel>
        );

      case "user":
        return (
          <AnimatedPanel panelKey="user">
            <>
              <section className="ig-user-box" style={{ marginBottom: "20px" }}>
                <div className="ig-avatar">{avatarLabel}</div>
                <div>
                  <p className="ig-account-id">{accountId}</p>
                  <p className="ig-display-name">{displayName}</p>
                </div>
                <button
                  onClick={onLogout}
                  style={{ marginLeft: "auto", fontSize: "12px", color: "var(--muted)", background: "none", border: "none", cursor: "pointer" }}
                >
                  Log out
                </button>
              </section>

              {/* Complete Profile CTA — only shown if onboarding not done */}
              {!onboardingCompleted && (
                <button
                  onClick={() => onRightPanelChange("onboarding-q")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    width: "100%",
                    padding: "10px 12px",
                    marginBottom: "16px",
                    borderRadius: "10px",
                    border: "1px dashed #dc2743",
                    background: "#fff5f7",
                    color: "#dc2743",
                    fontWeight: 600,
                    fontSize: "13px",
                    cursor: "pointer",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#ffe0e8")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#fff5f7")}
                >
                  <span style={{ fontSize: "16px" }}>✦</span>
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
          </AnimatedPanel>
        );

      case "onboarding-q":
        return (
          <AnimatedPanel panelKey="onboarding-q">
            <OnboardingQuestionnaire
              token={token}
              onCompleted={onOnboardingComplete}
              onBack={() => onRightPanelChange("user")}
            />
          </AnimatedPanel>
        );

      case "onboarding-picks":
        return (
          <AnimatedPanel panelKey="onboarding-picks">
            <RecipePreferencePicker
              onPicksComplete={onPicksComplete}
              onRequestMore={onRequestMorePicks}
              onBack={() => onRightPanelChange("user")}
            />
          </AnimatedPanel>
        );
    }
  } // renderRightPanel ends here

  // ─── Layout ─────────────────────────────────────────────────────────────────

  return (
    <section className="ig-home">
      {/* Left sidebar */}
      <aside className="ig-left-rail">
        <div className="ig-left-logo">PantryPal</div>
        <nav className="ig-left-nav" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {/* Home — always visible */}
          <button className="ig-left-link is-active" onClick={onHome}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8.707 1.5a1 1 0 0 0-1.414 0L.646 8.146a.5.5 0 0 0 .708.708L2 8.207V13.5A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5V8.207l.646.647a.5.5 0 0 0 .708-.708L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293zM13 7.207V13.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V7.207l5-5z"/>
            </svg>
            <span className="ig-left-text">Home</span>
          </button>

          {isLoggedIn ? (
            <>
              {/* Pantry */}
              <button className="ig-left-link" onClick={onPantryNavigate}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8.354 1.146a.5.5 0 0 0-.708 0l-6 6-.354.353V14.5A1.5 1.5 0 0 0 2.5 16h11a1.5 1.5 0 0 0 1.5-1.5V7.5l-.354-.354zM11 13H9v-2H7v2H5V7.207l3-3 3 3z"/>
                </svg>
                <span className="ig-left-text">Pantry</span>
              </button>

              {/* Recipes */}
              <button className="ig-left-link" onClick={onRecipesNavigate}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M3 2a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v11.5a.5.5 0 0 1-.777.416L8 11.101l-4.223 2.815A.5.5 0 0 1 3 13.5zm1 0v10.566l3.723-2.482a.5.5 0 0 1 .554 0L12 12.566V2z"/>
                </svg>
                <span className="ig-left-text">Recipes</span>
              </button>

              {/* Search */}
              <button className="ig-left-link">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.099zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"/>
                </svg>
                <span className="ig-left-text">Search</span>
              </button>

              {/* Profile */}
              <button className="ig-left-link" onClick={onProfileNavigate}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10s-3.516.68-4.168 1.332c-.678.678-.83 1.418-.832 1.664z"/>
                </svg>
                <span className="ig-left-text">Profile</span>
              </button>

              {/* Logout — pushed to bottom */}
              <button className="ig-left-link" onClick={onLogout} style={{ marginTop: "auto" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path fillRule="evenodd" d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0z"/>
                  <path fillRule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708z"/>
                </svg>
                <span className="ig-left-text">Logout</span>
              </button>
            </>
          ) : (
            /* Guest — Login only */
            <button className="ig-left-link" onClick={onLoginNavigate}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M6 3.5a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-2a.5.5 0 0 0-1 0v2A1.5 1.5 0 0 0 6.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 2h-8A1.5 1.5 0 0 0 5 3.5v2a.5.5 0 0 0 1 0z"/>
                <path fillRule="evenodd" d="M11.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 1 0-.708.708L10.293 7.5H1.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708z"/>
              </svg>
              <span className="ig-left-text">Login</span>
            </button>
          )}
        </nav>
      </aside>

      <div className="ig-main-wrap">
        <div className="ig-content-grid">
          {/* Center column */}
          <section className="ig-center-col">
            {centerView === "pantry" ? (
              <PantryPage token={token} onBack={onHome} onGenerateRecipes={onRecipesNavigate} embedded />
            ) : centerView === "recipes" ? (
              <RecipesPage token={token} onBack={onHome} embedded />
            ) : centerView === "profile" ? (
              <ProfilePage
                token={token}
                avatarLabel={avatarLabel}
                displayName={displayName}
                accountId={accountId}
                onboardingCompleted={onboardingCompleted}
                onStartOnboarding={() => onRightPanelChange("onboarding-q")}
                onEditProfile={onEditProfileNavigate}
                embedded />
            ) : centerView === "edit-profile" ? (
              <EditProfilePage 
                token={token}
                displayName={displayName}
                onBack={onProfileNavigate} />
            ) : centerView === "community" ? (
              <>
                <WeeklyStoryCircles
                  topics={topics}
                  selectedDate={selectedDate}
                  onSelect={setSelectedDate}
                />
                <CommunityFeed
                  posts={filteredPosts}
                  pinnedTopic={selectedDate ? undefined : pinnedTopic}
                  nextCursor={nextCursor}
                  loading={loading}
                  loadingMore={loadingMore}
                  error={error}
                  isLoggedIn={isLoggedIn}
                  token={token}
                  currentUserId={isLoggedIn ? sub : undefined}
                  onLoadMore={loadMore}
                  onLoginNavigate={onLoginNavigate}
                  onCreatePost={isLoggedIn ? () => setShowComposer(true) : undefined}
                />
              </>
            ) : (
              <>
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
                      {(["history", "flavor", "origin"] as const).map((row) => (
                        <li key={row}>
                          <button className="row-toggle" onClick={() => setOpenRow(openRow === row ? null : row)}>
                            <span className="row-left" style={{ textTransform: "capitalize" }}>{row}</span>
                            <span className="row-chevron">{openRow === row ? "^" : "v"}</span>
                          </button>
                          {openRow === row && (
                            <p className="row-content">
                              {row === "history"
                                ? special?.history || "No history details yet."
                                : row === "flavor"
                                ? special?.description || "Flavor profile not available yet."
                                : special?.origin || "Origin details not available yet."}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                    <div className="panel-cta-row">
                      <button className="btn-primary" onClick={onPantryNavigate}>Manage your Pantry</button>
                      {!isLoggedIn && (
                        <button className="btn-primary" onClick={onLoginNavigate}>Log in</button>
                      )}
                    </div>
                    {homeLoading && (
                      <p style={{ fontSize: "12px", color: "var(--muted)", marginTop: "10px" }}>
                        Loading today's recipe...
                      </p>
                    )}
                    {homeError && <p className="error">{homeError}</p>}
                  </div>
                </article>
              </>
            )}
          </section>

          {/* Right column — animated panel */}
          <aside className="ig-right-col">
            {renderRightPanel()}
          </aside>
        </div>
      </div>

      {/* Post Composer Modal */}
      {showComposer && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setShowComposer(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              zIndex: 100,
            }}
          />

          {/* Modal */}
          <div style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "min(540px, 95vw)",
            maxHeight: "90vh",
            overflowY: "auto",
            background: "#fff",
            borderRadius: "16px",
            zIndex: 101,
            boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          }}>
            {/* Modal header */}
            <div style={{
              padding: "16px",
              borderBottom: "1px solid #f0f0f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              position: "sticky",
              top: 0,
              background: "#fff",
              borderRadius: "16px 16px 0 0",
              zIndex: 1,
            }}>
              <span style={{ fontWeight: 700, fontSize: "15px" }}>New Post</span>
              <button
                onClick={() => setShowComposer(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "20px",
                  cursor: "pointer",
                  color: "#999",
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>

            <PostComposer
              token={token}
              pinnedTopic={pinnedTopic}
              onPostCreated={(post) => {
                setShowComposer(false);
                refresh();
              }}
              onCancel={() => setShowComposer(false)}
            />
          </div>
        </>
      )}

    </section>
  );
}
