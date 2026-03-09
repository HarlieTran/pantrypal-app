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

  async function onSaveAndBack() {
    const ok = await handleSave();
    if (ok) onBack();
  }

  async function onAiAssistComplete(payload: { selectedImageIds: string[]; rejectedImageIds: string[] }) {
    await handleAiPicksComplete(payload);
  }

  return (
    <div className="edit-profile-container">
      <div className={`edit-profile-slide ${view === "form" ? "active" : "inactive"}`}>
        <div className="edit-profile-header">
          <h2 className="edit-profile-title">Edit Profile</h2>
          <button onClick={() => setView("ai-assist")} className="edit-profile-ai-btn"> ✦ AI-Assist</button>
        </div>

        {aiSuggested && (
          <div className="edit-profile-ai-banner">
            AI suggested these preferences. Review or edit before saving.
          </div>
        )}

        {loading ? (
          <div className="edit-profile-loading">Loading your profile...</div>
        ) : (
          <>
            <div className="edit-profile-field">
              <label className="edit-profile-label">Display Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="edit-profile-input" />
            </div>

            <div className="edit-profile-field">
              <label className="edit-profile-label">Diet Type</label>
              <div className="edit-profile-options">
                {DIETS.map((d) => (
                  <button
                    key={d}
                    onClick={() => toggleDiet(d)}
                    className={`edit-profile-option-btn ${dietType.includes(d) ? "is-diet-selected" : ""}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="edit-profile-field">
              <label className="edit-profile-label">Liked Ingredients</label>
              <textarea
                value={likes}
                onChange={(e) => setLikes(e.target.value)}
                placeholder="e.g. salmon, avocado, basil"
                rows={2}
                className="edit-profile-textarea"
              />
            </div>

            <div className="edit-profile-field">
              <label className="edit-profile-label">Allergies</label>
              <div className="edit-profile-options">
                {ALLERGIES.map((a) => (
                  <button
                    key={a}
                    onClick={() => toggleAllergy(a)}
                    className={`edit-profile-option-btn ${allergies.includes(a) ? "is-allergy-selected" : ""}`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            <div className="edit-profile-field">
              <label className="edit-profile-label">Disliked Ingredients</label>
              <textarea
                value={disliked}
                onChange={(e) => setDisliked(e.target.value)}
                placeholder="e.g. cilantro, blue cheese, anchovies"
                rows={2}
                className="edit-profile-textarea"
              />
            </div>

            <div className="edit-profile-field">
              <label className="edit-profile-label">Diet Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anything else we should know about your diet?"
                rows={3}
                className="edit-profile-textarea"
              />
            </div>

            {saveError && <div className="ig-error-note" style={{ marginBottom: "10px" }}>{saveError}</div>}
            <button onClick={onSaveAndBack} disabled={saving} className={`btn-primary ${saved ? "is-saved" : ""}`}>
              {saved ? "Saved" : saving ? "Saving..." : "Save Changes"}
            </button>
          </>
        )}
      </div>

      <div className={`edit-profile-slide ${view === "ai-assist" ? "active" : "inactive"}`}>
        <div className="edit-profile-ai-header">
          <button onClick={() => setView("form")} className="edit-profile-back-btn">{"<-"}</button>
          <div>
            <h2 className="edit-profile-ai-title">AI-Assist</h2>
            <p className="edit-profile-ai-subtitle">Pick recipes you like - we will suggest your preferences</p>
          </div>
        </div>

        <RecipePreferencePicker
          onPicksComplete={onAiAssistComplete}
          onRequestMore={() => undefined}
          onBack={() => setView("form")}
        />
      </div>
    </div>
  );
}
