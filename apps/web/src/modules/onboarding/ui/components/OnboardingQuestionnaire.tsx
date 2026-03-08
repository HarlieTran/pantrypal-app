import { QUESTION_TYPES } from "@pantrypal/shared-types";
import { useOnboardingQuestionnaire } from "../../application/useOnboardingQuestionnaire";

type Props = {
  token: string;
  onCompleted: () => void;
  onBack: () => void;
};

export function OnboardingQuestionnaire({ token, onCompleted, onBack }: Props) {
  const { mainQuestions, answers, loading, saving, error, toggleMulti, setText, submit } = useOnboardingQuestionnaire(token);

  const onSave = async () => {
    try {
      await submit();
      onCompleted();
    } catch {
      // Error already set in hook
    }
  };

  if (loading) return <p style={{ color: "var(--muted)", fontSize: "13px" }}>Loading questions…</p>;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
        <div>
          <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--muted)", margin: 0 }}>
            Step 1 of 2
          </p>
          <h3 style={{ fontSize: "18px", fontWeight: 700, margin: "2px 0 0", letterSpacing: "-0.3px" }}>
            Your preferences
          </h3>
        </div>
      </div>

      <div style={{ display: "grid", gap: "16px", maxHeight: "60vh", overflowY: "auto", paddingRight: "4px" }}>
        {mainQuestions.map((q) => {
          const a = answers[q.key] ?? { optionValues: [], answerText: "" };
          return (
            <div key={q.id}>
              <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--ink-secondary)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {q.label}
              </p>

              {q.type === QUESTION_TYPES.FREE_TEXT && (
                <textarea
                  rows={2}
                  value={a.answerText}
                  onChange={(e) => setText(q.key, e.target.value)}
                  placeholder="Type your answer"
                  style={{ width: "100%", fontSize: "13px", resize: "none" }}
                />
              )}

              {(q.type === QUESTION_TYPES.MULTI_CHOICE || q.type === QUESTION_TYPES.SINGLE_CHOICE) && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {q.options.map((opt) => {
                    const selected = a.optionValues.includes(opt.value);
                    return (
                      <button
                        key={opt.id}
                        onClick={() => toggleMulti(q.key, opt.value)}
                        style={{
                          padding: "5px 12px",
                          borderRadius: "999px",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                          border: selected ? "1.5px solid #dc2743" : "1.5px solid var(--line)",
                          background: selected ? "#fff0f3" : "var(--panel)",
                          color: selected ? "#dc2743" : "var(--ink-secondary)",
                          transition: "all 0.15s",
                        }}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {error && <p style={{ fontSize: "12px", color: "var(--error)", marginTop: "10px" }}>{error}</p>}

      <button 
        className="btn-secondary"
        onClick={onBack} >
          ← Back
      </button>
      
      <button
        className="btn-primary"
        onClick={onSave}
        disabled={saving}
      >
        {saving ? "Saving…" : "Next →"}
      </button>
    </div>
  );
}
