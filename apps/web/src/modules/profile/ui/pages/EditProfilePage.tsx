import type { CSSProperties } from "react";
import { RecipePreferencePicker } from "../../../onboarding";
import { useEditProfileForm } from "../../application/useEditProfileForm";
import { ALLERGIES, DIETS } from "../../model/profile.constants";

type EditProfilePageProps = {
  token: string;
  displayName: string;
  onBack: () => void;
};

export function EditProfilePage({ token, displayName, onBack }: EditProfilePageProps) {
  const {
    name,
    setName,
    likes,
    setLikes,
    dietType,
    allergies,
    disliked,
    setDisliked,
    notes,
    setNotes,
    saving,
    saved,
    view,
    setView,
    aiSuggested,
    loading,
    saveError,
    toggleDiet,
    toggleAllergy,
    handleSave,
    handleAiPicksComplete,
  } = useEditProfileForm({ token, displayName });

  const slideStyle = (active: boolean): CSSProperties => ({
    position: active ? "relative" : "absolute",
    top: 0,
    left: 0,
    width: "100%",
    transition: "transform 0.35s ease, opacity 0.35s ease",
    transform: active ? "translateX(0)" : "translateX(8%)",
    opacity: active ? 1 : 0,
    visibility: active ? "visible" : "hidden",
    pointerEvents: active ? "auto" : "none",
  });

  async function onSaveAndBack() {
    const ok = await handleSave();
    if (ok) onBack();
  }

  async function onAiAssistComplete(payload: { selectedImageIds: string[]; rejectedImageIds: string[] }) {
    await handleAiPicksComplete(payload);
  }

  return (
    <div style={{ position: "relative", overflow: "hidden", minHeight: "100%" }}>
      <div style={slideStyle(view === "form")}>
        <div style={{ maxWidth: "560px", margin: "0 auto", padding: "24px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "28px" }}>
            <h2 style={{ fontWeight: 700, fontSize: "20px", flex: 1, margin: 0 }}>Edit Profile</h2>
            <button
              onClick={() => setView("ai-assist")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "7px 14px",
                borderRadius: "20px",
                border: "1px solid #bc1888",
                background: "transparent",
                color: "#bc1888",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              AI-Assist
            </button>
          </div>

          {aiSuggested ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 14px",
                borderRadius: "10px",
                marginBottom: "16px",
                background: "linear-gradient(135deg, rgba(220,39,67,0.08), rgba(188,24,136,0.08))",
                border: "1px solid rgba(188,24,136,0.2)",
                fontSize: "13px",
                color: "#bc1888",
                fontWeight: 500,
              }}
            >
              AI suggested these preferences. Review or edit before saving.
            </div>
          ) : null}

          {loading ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "200px",
                color: "var(--muted)",
                fontSize: "14px",
              }}
            >
              Loading your profile...
            </div>
          ) : (
            <>
              <div style={{ marginBottom: "24px" }}>
                <label
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                    color: "var(--muted)",
                    display: "block",
                    marginBottom: "8px",
                  }}
                >
                  Display Name
                </label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} style={{ width: "100%", boxSizing: "border-box" }} />
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                    color: "var(--muted)",
                    display: "block",
                    marginBottom: "8px",
                  }}
                >
                  Diet Type
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {DIETS.map((d) => (
                    <button
                      key={d}
                      onClick={() => toggleDiet(d)}
                      style={{
                        padding: "6px 14px",
                        borderRadius: "20px",
                        fontSize: "13px",
                        fontWeight: 500,
                        cursor: "pointer",
                        border: "1px solid",
                        borderColor: dietType.includes(d) ? "#dc2743" : "var(--line)",
                        background: dietType.includes(d) ? "#dc2743" : "transparent",
                        color: dietType.includes(d) ? "#fff" : "var(--ink)",
                        transition: "all 0.15s",
                      }}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                    color: "var(--muted)",
                    display: "block",
                    marginBottom: "8px",
                  }}
                >
                  Liked Ingredients
                </label>
                <textarea
                  value={likes}
                  onChange={(e) => setLikes(e.target.value)}
                  placeholder="e.g. salmon, avocado, basil"
                  rows={2}
                  style={{ width: "100%", boxSizing: "border-box", resize: "vertical" }}
                />
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                    color: "var(--muted)",
                    display: "block",
                    marginBottom: "8px",
                  }}
                >
                  Allergies
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {ALLERGIES.map((a) => (
                    <button
                      key={a}
                      onClick={() => toggleAllergy(a)}
                      style={{
                        padding: "6px 14px",
                        borderRadius: "20px",
                        fontSize: "13px",
                        fontWeight: 500,
                        cursor: "pointer",
                        border: "1px solid",
                        borderColor: allergies.includes(a) ? "#e65100" : "var(--line)",
                        background: allergies.includes(a) ? "#e65100" : "transparent",
                        color: allergies.includes(a) ? "#fff" : "var(--ink)",
                        transition: "all 0.15s",
                      }}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                    color: "var(--muted)",
                    display: "block",
                    marginBottom: "8px",
                  }}
                >
                  Disliked Ingredients
                </label>
                <textarea
                  value={disliked}
                  onChange={(e) => setDisliked(e.target.value)}
                  placeholder="e.g. cilantro, blue cheese, anchovies"
                  rows={2}
                  style={{ width: "100%", boxSizing: "border-box", resize: "vertical" }}
                />
              </div>

              <div style={{ marginBottom: "32px" }}>
                <label
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                    color: "var(--muted)",
                    display: "block",
                    marginBottom: "8px",
                  }}
                >
                  Diet Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Anything else we should know about your diet?"
                  rows={3}
                  style={{ width: "100%", boxSizing: "border-box", resize: "vertical" }}
                />
              </div>

              {saveError ? <div className="ig-error-note" style={{ marginBottom: "10px" }}>{saveError}</div> : null}
              <button
                onClick={onSaveAndBack}
                disabled={saving}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "12px",
                  border: "none",
                  background: saved ? "#2e7d32" : "linear-gradient(135deg, #dc2743, #bc1888)",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "15px",
                  cursor: saving ? "not-allowed" : "pointer",
                  transition: "background 0.3s",
                }}
              >
                {saved ? "Saved" : saving ? "Saving..." : "Save Changes"}
              </button>
            </>
          )}
        </div>
      </div>

      <div style={slideStyle(view === "ai-assist")}>
        <div style={{ maxWidth: "560px", margin: "0 auto", padding: "24px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
            <button
              onClick={() => setView("form")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "20px",
                color: "var(--muted)",
                padding: "4px",
              }}
            >
              {"<-"}
            </button>
            <div>
              <h2 style={{ fontWeight: 700, fontSize: "20px", margin: 0 }}>AI-Assist</h2>
              <p style={{ fontSize: "12px", color: "var(--muted)", margin: 0 }}>
                Pick recipes you like - we will suggest your preferences
              </p>
            </div>
          </div>

          <RecipePreferencePicker
            onPicksComplete={onAiAssistComplete}
            onRequestMore={() => undefined}
            onBack={() => setView("form")}
          />
        </div>
      </div>
    </div>
  );
}
