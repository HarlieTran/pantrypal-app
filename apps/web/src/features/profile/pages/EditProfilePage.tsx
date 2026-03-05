import { useState, useEffect } from "react";
import { RecipePreferencePicker } from "../../onboarding/components/RecipePreferencePicker";

type EditProfilePageProps = {
  token: string;
  displayName: string;
  onBack: () => void;
};

export function EditProfilePage({ token, displayName, onBack }: EditProfilePageProps) {
  const [name, setName] = useState(displayName);
  const [dietType, setDietType] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [disliked, setDisliked] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [view, setView] = useState<"form" | "ai-assist">("form");
  const [aiSuggested, setAiSuggested] = useState(false);
  const [loading, setLoading] = useState(true);

  const DIETS = ["Omnivore", "Vegetarian", "Vegan", "Pescatarian", "Halal", "Kosher", "Keto"];
  const ALLERGIES = ["Peanuts", "Tree Nuts", "Dairy", "Eggs", "Gluten", "Shellfish", "Soy"];

  const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8788";

  // ─── Load existing profile on mount ────────────────────────────────────────

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch(`${API_BASE}/me/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (data.displayName) setName(data.displayName);
        if (Array.isArray(data.dietType)) setDietType(data.dietType);
        if (Array.isArray(data.allergies)) setAllergies(data.allergies);
        if (data.disliked) setDisliked(data.disliked);
        if (data.notes) setNotes(data.notes);
      } catch {
        // silently fail — form starts with defaults
      } finally {
        setLoading(false);
      }
    }

    void loadProfile();
  }, [token]);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  function toggleDiet(value: string) {
    setDietType((prev) =>
      prev.includes(value) ? prev.filter((d) => d !== value) : [...prev, value]
    );
  }

  function toggleAllergy(value: string) {
    setAllergies((prev) =>
      prev.includes(value) ? prev.filter((a) => a !== value) : [...prev, value]
    );
  }

  async function handleSave() {
    setSaving(true);
    try {
      await fetch(`${API_BASE}/me/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ displayName: name, dietType, allergies, disliked, notes }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  async function handleAiPicksComplete({
    selectedImageIds,
    rejectedImageIds,
  }: {
    selectedImageIds: string[];
    rejectedImageIds: string[];
  }) {
    const res = await fetch(`${API_BASE}/me/onboarding/recipe-selections`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ selectedImageIds, rejectedImageIds }),
    });

    const data = await res.json();
    const profile = data?.preferenceProfile;

    if (profile) {
      if (Array.isArray(profile.dietSignals) && profile.dietSignals.length > 0) {
        setDietType(profile.dietSignals);
      }
      if (Array.isArray(profile.dislikes) && profile.dislikes.length > 0) {
        setDisliked(profile.dislikes.join(", "));
      }
    }

    setAiSuggested(true);
    setView("form");
  }

  // ─── Slide animation ────────────────────────────────────────────────────────

  const slideStyle = (active: boolean): React.CSSProperties => ({
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

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ position: "relative", overflow: "hidden", minHeight: "100%" }}>

      {/* ── Form view ── */}
      <div style={slideStyle(view === "form")}>
        <div style={{ maxWidth: "560px", margin: "0 auto", padding: "24px 16px" }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "28px" }}>
            <h2 style={{ fontWeight: 700, fontSize: "20px", flex: 1, margin: 0 }}>
              Edit Profile
            </h2>
            <button
              onClick={() => setView("ai-assist")}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "7px 14px", borderRadius: "20px",
                border: "1px solid #bc1888", background: "transparent",
                color: "#bc1888", fontWeight: 600, fontSize: "13px", cursor: "pointer",
              }}
            >
              ✦ AI-Assist
            </button>
          </div>

          {/* AI suggested banner */}
          {aiSuggested && (
            <div style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "10px 14px", borderRadius: "10px", marginBottom: "20px",
              background: "linear-gradient(135deg, rgba(220,39,67,0.08), rgba(188,24,136,0.08))",
              border: "1px solid rgba(188,24,136,0.2)",
              fontSize: "13px", color: "#bc1888", fontWeight: 500,
            }}>
              <span style={{ fontSize: "16px" }}>✦</span>
              AI suggested these preferences — review and save when ready.
            </div>
          )}

          {/* Loading state */}
          {loading ? (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              minHeight: "200px", color: "var(--muted)", fontSize: "14px",
            }}>
              Loading your profile…
            </div>
          ) : (
            <>
              {/* Display name */}
              <div style={{ marginBottom: "24px" }}>
                <label style={{
                  fontSize: "11px", fontWeight: 700, letterSpacing: "1px",
                  textTransform: "uppercase", color: "var(--muted)",
                  display: "block", marginBottom: "8px",
                }}>
                  Display Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ width: "100%", boxSizing: "border-box" }}
                />
              </div>

              {/* Diet type */}
              <div style={{ marginBottom: "24px" }}>
                <label style={{
                  fontSize: "11px", fontWeight: 700, letterSpacing: "1px",
                  textTransform: "uppercase", color: "var(--muted)",
                  display: "block", marginBottom: "8px",
                }}>
                  Diet Type
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {DIETS.map((d) => (
                    <button
                      key={d}
                      onClick={() => toggleDiet(d)}
                      style={{
                        padding: "6px 14px", borderRadius: "20px", fontSize: "13px",
                        fontWeight: 500, cursor: "pointer", border: "1px solid",
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

              {/* Allergies */}
              <div style={{ marginBottom: "24px" }}>
                <label style={{
                  fontSize: "11px", fontWeight: 700, letterSpacing: "1px",
                  textTransform: "uppercase", color: "var(--muted)",
                  display: "block", marginBottom: "8px",
                }}>
                  Allergies
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {ALLERGIES.map((a) => (
                    <button
                      key={a}
                      onClick={() => toggleAllergy(a)}
                      style={{
                        padding: "6px 14px", borderRadius: "20px", fontSize: "13px",
                        fontWeight: 500, cursor: "pointer", border: "1px solid",
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

              {/* Disliked ingredients */}
              <div style={{ marginBottom: "24px" }}>
                <label style={{
                  fontSize: "11px", fontWeight: 700, letterSpacing: "1px",
                  textTransform: "uppercase", color: "var(--muted)",
                  display: "block", marginBottom: "8px",
                }}>
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

              {/* Diet notes */}
              <div style={{ marginBottom: "32px" }}>
                <label style={{
                  fontSize: "11px", fontWeight: 700, letterSpacing: "1px",
                  textTransform: "uppercase", color: "var(--muted)",
                  display: "block", marginBottom: "8px",
                }}>
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

              {/* Save button */}
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  width: "100%", padding: "12px",
                  borderRadius: "12px", border: "none",
                  background: saved
                    ? "#2e7d32"
                    : "linear-gradient(135deg, #dc2743, #bc1888)",
                  color: "#fff", fontWeight: 700, fontSize: "15px",
                  cursor: saving ? "not-allowed" : "pointer",
                  transition: "background 0.3s",
                }}
              >
                {saved ? "✓ Saved" : saving ? "Saving…" : "Save Changes"}
              </button>
            </>
          )}

        </div>
      </div>

      {/* ── AI-Assist view ── */}
      <div style={slideStyle(view === "ai-assist")}>
        <div style={{ maxWidth: "560px", margin: "0 auto", padding: "24px 16px" }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
            <button
              onClick={() => setView("form")}
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: "20px", color: "var(--muted)", padding: "4px",
              }}
            >
              ←
            </button>
            <div>
              <h2 style={{ fontWeight: 700, fontSize: "20px", margin: 0 }}>AI-Assist</h2>
              <p style={{ fontSize: "12px", color: "var(--muted)", margin: 0 }}>
                Pick recipes you like — we'll suggest your preferences
              </p>
            </div>
          </div>

          {/* Recipe picker */}
          <RecipePreferencePicker
            onPicksComplete={handleAiPicksComplete}
            onRequestMore={() => undefined}
            onBack={() => setView("form")}
          />

        </div>
      </div>

    </div>
  );
}
