import type { ReactNode } from "react";
import { buildProfileViewModel } from "../../application/profileViewModel";
import { useProfilePageData } from "../../application/useProfilePageData";
import "../../styles/profile.css";

// ─── Sub-components ───────────────────────────────────────────────────────────

function ConfidenceBar({ value, label }: { value: number; label: string }) {
  const pct = Math.round(value * 100);
  const color =
    pct >= 70 ? "#2e7d32" : pct >= 40 ? "#e65100" : "#b71c1c";

  return (
    <div style={{ marginBottom: "10px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
        <span style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: "12px", fontWeight: 700, color }}>{pct}%</span>
      </div>
      <div style={{
        height: "5px",
        background: "var(--line)",
        borderRadius: "99px",
        overflow: "hidden",
      }}>
        <div style={{
          height: "100%",
          width: `${pct}%`,
          background: color,
          borderRadius: "99px",
          transition: "width 0.8s cubic-bezier(0.22,1,0.36,1)",
        }} />
      </div>
    </div>
  );
}

function TagPill({ label, variant }: { label: string; variant: "like" | "dislike" | "diet" }) {
  const styles = {
    like: { background: "#e8f5e9", color: "#2e7d32", border: "1px solid #c8e6c9" },
    dislike: { background: "#ffebee", color: "#b71c1c", border: "1px solid #ffcdd2" },
    diet: { background: "#e3f2fd", color: "#1565c0", border: "1px solid #bbdefb" },
  }[variant];

  return (
    <span style={{
      ...styles,
      display: "inline-flex",
      alignItems: "center",
      padding: "4px 11px",
      borderRadius: "999px",
      fontSize: "12px",
      fontWeight: 600,
      whiteSpace: "nowrap",
    }}>
      {label}
    </span>
  );
}

function SectionCard({ title, icon, children }: { title: string; icon: string; children: ReactNode }) {
  return (
    <div style={{
      background: "#fff",
      border: "1px solid var(--line)",
      borderRadius: "12px",
      overflow: "hidden",
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "14px 18px",
        borderBottom: "1px solid var(--line-light)",
        background: "#fafafa",
      }}>
        <span style={{ fontSize: "18px" }}>{icon}</span>
        <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 700, letterSpacing: "0.3px", color: "var(--ink-secondary)" }}>
          {title}
        </h3>
      </div>
      <div style={{ padding: "18px" }}>
        {children}
      </div>
    </div>
  );
}

function EmptyState({ message, cta, onCta }: { message: string; cta?: string; onCta?: () => void }) {
  return (
    <div style={{ textAlign: "center", padding: "20px 0" }}>
      <p style={{ color: "var(--muted)", fontSize: "13px", marginBottom: cta ? "12px" : 0 }}>
        {message}
      </p>
      {cta && onCta && (
        <button className="btn-primary" onClick={onCta} style={{ fontSize: "13px" }}>
          {cta}
        </button>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  token: string;
  avatarLabel: string;
  displayName: string;
  accountId: string;
  onboardingCompleted: boolean;
  onStartOnboarding: () => void;
  onEditProfile?: () => void;
  embedded?: boolean;
}

export function ProfilePage({
  token,
  avatarLabel,
  displayName,
  accountId,
  onboardingCompleted,
  onStartOnboarding,
  onEditProfile,
  embedded = false,
}: Props) {
  const { profile, loading, error } = useProfilePageData(token);
  const effectiveDisplayName = profile?.displayName?.trim() || displayName;

  const {
    pref,
    memberSince,
    allergyAnswers,
    dietAnswers,
    dislikedText,
    dietNotesText,
    allergiesOther,
  } = buildProfileViewModel(profile);

  const content = (
    <div style={{ display: "grid", gap: "16px" }}>

      {/* ── Header / Identity ── */}
      <div style={{
        background: "#fff",
        // border: "1px solid var(--line)",
        // borderRadius: "12px",
        padding: "24px 20px",
        display: "flex",
        alignItems: "center",
        gap: "20px",
        flexWrap: "wrap",
      }}>
        <div style={{
          width: "72px",
          height: "72px",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(45deg, #feda75, #fa7e1e, #d62976, #962fbf, #4f5bd5)",
          color: "#fff",
          fontSize: "26px",
          fontWeight: 700,
          flexShrink: 0,
        }}>
          {avatarLabel}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{
            margin: "0 0 2px",
            fontSize: "22px",
            fontWeight: 700,
            letterSpacing: "-0.3px",
            color: "var(--ink)",
          }}>
            {effectiveDisplayName}
          </h1>
          <p style={{ margin: 0, fontSize: "13px", color: "var(--muted)" }}>
            {accountId}
          </p>
          {memberSince && (
            <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--muted-light)" }}>
              Member since {memberSince}
            </p>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-end" }}>
          <span style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "4px 12px",
            borderRadius: "999px",
            fontSize: "12px",
            fontWeight: 700,
            background: onboardingCompleted ? "#e8f5e9" : "#fff3e0",
            color: onboardingCompleted ? "#2e7d32" : "#e65100",
          }}>
            {onboardingCompleted ? "✓ Profile complete" : "⚠ Profile incomplete"}
          </span>
        </div>
        <button
          onClick={onEditProfile}
          className="btn-primary"
        >
          ✎ Edit Profile
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "var(--muted)", fontSize: "13px" }}>
          Loading your profile…
        </div>
      ) : error ? (
        <div className="ig-error-note">{error}</div>
      ) : (
        <>
          {/* ── AI Preference Profile ── */}
          <SectionCard title="Your Taste Profile" icon="✦">
            {!pref ? (
              <EmptyState
                message="Complete onboarding to generate your AI taste profile."
                cta="Complete profile →"
                onCta={onStartOnboarding}
              />
            ) : (
              <div style={{ display: "grid", gap: "20px" }}>

                {/* Confidence bars */}
                <div>
                  <p style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                    color: "var(--muted)",
                    marginBottom: "12px",
                  }}>
                    Prediction Confidence
                  </p>
                  <ConfidenceBar value={pref.confidence.overall} label="Overall" />
                  <ConfidenceBar value={pref.confidence.likes} label="Taste Likes" />
                  <ConfidenceBar value={pref.confidence.dislikes} label="Taste Dislikes" />
                </div>

                {/* Likes */}
                {pref.likes.length > 0 && (
                  <div>
                    <p style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      letterSpacing: "1px",
                      textTransform: "uppercase",
                      color: "#2e7d32",
                      marginBottom: "8px",
                    }}>
                      ♥ You tend to enjoy
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {pref.likes.map((like) => (
                        <TagPill key={like} label={like} variant="like" />
                      ))}
                    </div>
                  </div>
                )}

                {/* Dislikes */}
                {pref.dislikes.length > 0 && (
                  <div>
                    <p style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      letterSpacing: "1px",
                      textTransform: "uppercase",
                      color: "#b71c1c",
                      marginBottom: "8px",
                    }}>
                      ✕ You tend to avoid
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {pref.dislikes.map((dislike) => (
                        <TagPill key={dislike} label={dislike} variant="dislike" />
                      ))}
                    </div>
                  </div>
                )}

                {/* Diet Signals */}
                {pref.dietSignals.length > 0 && (
                  <div>
                    <p style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      letterSpacing: "1px",
                      textTransform: "uppercase",
                      color: "#1565c0",
                      marginBottom: "8px",
                    }}>
                      ◈ Diet signals
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {pref.dietSignals.map((signal) => (
                        <TagPill key={signal} label={signal} variant="diet" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </SectionCard>

          {/* ── Dietary Preferences (from questionnaire) ── */}
          <SectionCard title="Dietary Preferences" icon="🥗">
            {(dietAnswers.length === 0 && allergyAnswers.length === 0 && !dislikedText && !dietNotesText && !allergiesOther) ? (
              <EmptyState
                message="No dietary preferences saved yet."
                cta="Add preferences →"
                onCta={onStartOnboarding}
              />
            ) : (
              <div style={{ display: "grid", gap: "14px" }}>
                {dietAnswers.length > 0 && (
                  <div>
                    <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
                      Diet Type
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {dietAnswers.map((d) => (
                        <span key={d} style={{
                          padding: "4px 12px",
                          borderRadius: "999px",
                          fontSize: "12px",
                          fontWeight: 600,
                          background: "var(--line-light)",
                          color: "var(--ink-secondary)",
                          border: "1px solid var(--line)",
                          textTransform: "capitalize",
                        }}>
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {allergyAnswers.length > 0 && (
                  <div>
                    <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
                      Allergies
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {allergyAnswers.map((a) => (
                        <span key={a} style={{
                          padding: "4px 12px",
                          borderRadius: "999px",
                          fontSize: "12px",
                          fontWeight: 600,
                          background: "#fff3e0",
                          color: "#e65100",
                          border: "1px solid #ffe0b2",
                          textTransform: "capitalize",
                        }}>
                          ⚠ {a}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {allergiesOther && (
                  <div>
                    <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
                      Other Allergies
                    </p>
                    <p style={{ fontSize: "13px", color: "var(--ink-secondary)", lineHeight: 1.5 }}>{allergiesOther}</p>
                  </div>
                )}

                {dislikedText && (
                  <div>
                    <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
                      Disliked Ingredients
                    </p>
                    <p style={{ fontSize: "13px", color: "var(--ink-secondary)", lineHeight: 1.5 }}>{dislikedText}</p>
                  </div>
                )}

                {dietNotesText && (
                  <div>
                    <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
                      Diet Notes
                    </p>
                    <p style={{ fontSize: "13px", color: "var(--ink-secondary)", lineHeight: 1.5 }}>{dietNotesText}</p>
                  </div>
                )}
              </div>
            )}
          </SectionCard>

          {/* ── Update Profile CTA ── */}
          {!onboardingCompleted && (
            <div style={{
              padding: "16px 18px",
              background: "#fff5f7",
              border: "1px dashed #dc2743",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              flexWrap: "wrap",
            }}>
              <div>
                <p style={{ fontWeight: 700, fontSize: "13px", color: "#dc2743", margin: "0 0 2px" }}>
                  ✦ Complete your taste profile
                </p>
                <p style={{ fontSize: "12px", color: "var(--muted)", margin: 0 }}>
                  Answer a few questions to unlock AI-powered recipe suggestions.
                </p>
              </div>
              <button className="btn-primary" onClick={onStartOnboarding} style={{ fontSize: "13px", flexShrink: 0 }}>
                Get started →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );

  if (embedded) {
    return <section className="ig-profile-embedded">{content}</section>;
  }

  return (
    <main className="ig-screen">
      <section className="ig-page-shell">
        {content}
      </section>
    </main>
  );
}



