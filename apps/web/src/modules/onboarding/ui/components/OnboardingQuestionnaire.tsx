import { QUESTION_TYPES } from "@pantrypal/shared-types";
import { useOnboardingQuestionnaire } from "../../application/useOnboardingQuestionnaire";
import "../../styles/onboarding.css";

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

  if (loading) return <p className="onboarding-loading">Loading questions…</p>;

  return (
    <div>
      {/* Header */}
      <div className="onboarding-header">
        <div>
          <p className="onboarding-step-label">Step 1 of 2</p>
          <h3 className="onboarding-title">Your preferences</h3>
        </div>
      </div>

      <div className="onboarding-questions">
        {mainQuestions.map((q) => {
          const a = answers[q.key] ?? { optionValues: [], answerText: "" };
          return (
            <div key={q.id}>
              <p className="onboarding-question-label">{q.label}</p>

              {q.type === QUESTION_TYPES.FREE_TEXT && (
                <textarea
                  rows={2}
                  value={a.answerText}
                  onChange={(e) => setText(q.key, e.target.value)}
                  placeholder="Type your answer"
                  className="onboarding-textarea"
                />
              )}

              {(q.type === QUESTION_TYPES.MULTI_CHOICE || q.type === QUESTION_TYPES.SINGLE_CHOICE) && (
                <div className="onboarding-options">
                  {q.options.map((opt) => {
                    const selected = a.optionValues.includes(opt.value);
                    return (
                      <button
                        key={opt.id}
                        onClick={() => toggleMulti(q.key, opt.value)}
                        className={`onboarding-option-btn ${selected ? 'is-selected' : ''}`}
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

      {error && <p className="onboarding-error">{error}</p>}

      <button className="btn-secondary" onClick={onBack}>← Back</button>
      <button className="btn-primary" onClick={onSave} disabled={saving}>
        {saving ? "Saving…" : "Next →"}
      </button>
    </div>
  );
}
