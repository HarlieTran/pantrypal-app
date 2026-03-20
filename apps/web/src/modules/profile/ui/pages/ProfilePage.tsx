import type { ReactNode } from "react";
import { buildProfileViewModel } from "../../application/profileViewModel";
import { useProfilePageData } from "../../application/useProfilePageData";
import "../../styles/profile.css";

function ConfidenceBar({ value, label }: { value: number; label: string }) {
  const pct = Math.round(value * 100);
  const colorClass = pct >= 70 ? "high" : pct >= 40 ? "medium" : "low";

  return (
    <div className="profile-confidence-bar">
      <div className="profile-confidence-bar-header">
        <span className="profile-confidence-bar-label">{label}</span>
        <span className={`profile-confidence-bar-value ${colorClass}`}>{pct}%</span>
      </div>
      <div className="profile-confidence-bar-track">
        <div className={`profile-confidence-bar-fill ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function TagPill({ label, variant }: { label: string; variant: "like" | "dislike" | "diet" }) {
  return <span className={`profile-tag is-${variant}`}>{label}</span>;
}

function SectionCard({ title, icon, children }: { title: string; icon: string; children: ReactNode }) {
  return (
    <div className="profile-section-card">
      <div className="profile-section-header">
        <span className="profile-section-icon">{icon}</span>
        <h3 className="profile-section-title">{title}</h3>
      </div>
      <div className="profile-section-body">{children}</div>
    </div>
  );
}

function EmptyState({ message, cta, onCta }: { message: string; cta?: string; onCta?: () => void }) {
  return (
    <div className="profile-empty-state">
      <p className="profile-empty-text">{message}</p>
      {cta && onCta && (
        <button className="btn-primary" onClick={onCta}>{cta}</button>
      )}
    </div>
  );
}

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

  const { pref, memberSince, allergyAnswers, dietAnswers, dislikedText, dietNotesText, allergiesOther } = buildProfileViewModel(profile);

  const content = (
    <div className="profile-page-grid">
      <div className="profile-header">
        <div className="profile-avatar-large">{avatarLabel}</div>
        <div className="profile-info">
          <h1 className="profile-name">{effectiveDisplayName}</h1>
          <p className="profile-username">{accountId}</p>
          {memberSince && <p className="profile-member-since">Member since {memberSince}</p>}
        </div>
        <div className="profile-actions">
          {/* <span className={`profile-status-badge ${onboardingCompleted ? "is-complete" : "is-incomplete"}`}>
            {onboardingCompleted ? "✓ Profile complete" : "⚠ Profile incomplete"}
          </span> */}
        </div>
        <button onClick={onEditProfile} className="btn-primary">✎ Edit Profile</button>
      </div>

      {loading ? (
        <div className="profile-loading">Loading your profile…</div>
      ) : error ? (
        <div className="ig-error-note">{error}</div>
      ) : (
        <>
          <SectionCard title="Your Taste Profile" icon="✦">
            {!pref ? (
              <EmptyState message="Complete onboarding to generate your AI taste profile." cta="Complete profile →" onCta={onStartOnboarding} />
            ) : (
              <div className="profile-tags-section">
                <div className="profile-tags-subsection">
                  <p className="profile-confidence-label">Prediction Confidence</p>
                  <ConfidenceBar value={pref.confidence.overall} label="Overall" />
                  <ConfidenceBar value={pref.confidence.likes} label="Taste Likes" />
                  <ConfidenceBar value={pref.confidence.dislikes} label="Taste Dislikes" />
                </div>

                {pref.likes.length > 0 && (
                  <div className="profile-tags-subsection">
                    <p className="profile-tags-label is-like">♥ You tend to enjoy</p>
                    <div className="profile-tags">
                      {pref.likes.map((like) => (
                        <TagPill key={like} label={like} variant="like" />
                      ))}
                    </div>
                  </div>
                )}

                {pref.dislikes.length > 0 && (
                  <div className="profile-tags-subsection">
                    <p className="profile-tags-label is-dislike">✕ You tend to avoid</p>
                    <div className="profile-tags">
                      {pref.dislikes.map((dislike) => (
                        <TagPill key={dislike} label={dislike} variant="dislike" />
                      ))}
                    </div>
                  </div>
                )}

                {pref.dietSignals.length > 0 && (
                  <div className="profile-tags-subsection">
                    <p className="profile-tags-label is-diet">◈ Diet signals</p>
                    <div className="profile-tags">
                      {pref.dietSignals.map((signal) => (
                        <TagPill key={signal} label={signal} variant="diet" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Dietary Preferences" icon="🥗">
            {dietAnswers.length === 0 && allergyAnswers.length === 0 && !dislikedText && !dietNotesText && !allergiesOther ? (
              <EmptyState message="No dietary preferences saved yet." cta="Add preferences →" onCta={onStartOnboarding} />
            ) : (
              <div className="profile-details-grid">
                {dietAnswers.length > 0 && (
                  <div className="profile-tags-subsection">
                    <p className="profile-diet-label">Diet Type</p>
                    <div className="profile-diet-tags">
                      {dietAnswers.map((d) => (
                        <span key={d} className="profile-diet-tag">{d}</span>
                      ))}
                    </div>
                  </div>
                )}

                {allergyAnswers.length > 0 && (
                  <div className="profile-tags-subsection">
                    <p className="profile-diet-label">Allergies</p>
                    <div className="profile-diet-tags">
                      {allergyAnswers.map((a) => (
                        <span key={a} className="profile-allergy-tag">⚠ {a}</span>
                      ))}
                    </div>
                  </div>
                )}

                {allergiesOther && (
                  <div className="profile-tags-subsection">
                    <p className="profile-diet-label">Other Allergies</p>
                    <p className="profile-text-answer">{allergiesOther}</p>
                  </div>
                )}

                {dislikedText && (
                  <div className="profile-tags-subsection">
                    <p className="profile-diet-label">Disliked Ingredients</p>
                    <p className="profile-text-answer">{dislikedText}</p>
                  </div>
                )}

                {dietNotesText && (
                  <div className="profile-tags-subsection">
                    <p className="profile-diet-label">Diet Notes</p>
                    <p className="profile-text-answer">{dietNotesText}</p>
                  </div>
                )}
              </div>
            )}
          </SectionCard>

          {!onboardingCompleted && (
            <div className="profile-cta-banner">
              <div>
                <p className="profile-cta-text-title">✦ Complete your taste profile</p>
                <p className="profile-cta-text-subtitle">Answer a few questions to unlock AI-powered recipe suggestions.</p>
              </div>
              <button className="btn-primary profile-cta-button" onClick={onStartOnboarding}>
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
      <section className="ig-page-shell">{content}</section>
    </main>
  );
}
