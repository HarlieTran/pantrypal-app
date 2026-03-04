import { useEffect, useMemo, useState } from "react";
import type { OnboardingAnswerInput, OnboardingQuestion } from "@pantrypal/shared-types";
import { completeOnboarding, getOnboardingQuestions, saveAnswers } from "../../onboarding/api/onboarding";

type Props = {
  token: string;
  onCompleted: () => void;
  onBack: () => void;
};

type AnswersState = Record<string, { optionValues: string[]; answerText: string }>;

export function OnboardingQuestionnaire({ token, onCompleted, onBack }: Props) {
  const [questions, setQuestions] = useState<OnboardingQuestion[]>([]);
  const [answers, setAnswers] = useState<AnswersState>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getOnboardingQuestions();
        const list = Array.isArray(data?.questions) ? data.questions : [];
        if (!mounted) return;
        setQuestions(list);
        const state: AnswersState = {};
        for (const q of list) state[q.key] = { optionValues: [], answerText: "" };
        setAnswers(state);
      } catch (e) {
        if (!mounted) return;
        setError(String((e as Error).message || e));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const toggleMulti = (key: string, value: string) => {
    setAnswers((prev) => {
      const cur = prev[key] ?? { optionValues: [], answerText: "" };
      const exists = cur.optionValues.includes(value);
      return { ...prev, [key]: { ...cur, optionValues: exists ? cur.optionValues.filter((v) => v !== value) : [...cur.optionValues, value] } };
    });
  };

  const setText = (key: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: { ...(prev[key] ?? { optionValues: [], answerText: "" }), answerText: value } }));
  };

  // Only show the two main multi-choice questions inline (allergies + diet)
  // Free-text children shown as compact inputs below each parent
  const mainQuestions = useMemo(
    () => questions.filter((q) => q.type !== "FREE_TEXT" || !questions.some((p) => q.key.startsWith(p.key + "_"))),
    [questions]
  );

  const onSave = async () => {
    setSaving(true);
    setError("");
    try {
      const payload: OnboardingAnswerInput[] = questions
        .map((q) => {
          const a = answers[q.key] ?? { optionValues: [], answerText: "" };
          if (q.type === "FREE_TEXT") return { questionKey: q.key, answerText: a.answerText.trim() };
          return { questionKey: q.key, optionValues: a.optionValues };
        })
        .filter((item) => ("optionValues" in item ? (item.optionValues?.length ?? 0) > 0 : Boolean(item.answerText?.trim())));

      await saveAnswers(token, payload);
      await completeOnboarding(token);
      onCompleted();
    } catch (e) {
      setError(String((e as Error).message || "Failed to save."));
    } finally {
      setSaving(false);
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

              {q.type === "FREE_TEXT" && (
                <textarea
                  rows={2}
                  value={a.answerText}
                  onChange={(e) => setText(q.key, e.target.value)}
                  placeholder="Type your answer"
                  style={{ width: "100%", fontSize: "13px", resize: "none" }}
                />
              )}

              {(q.type === "MULTI_CHOICE" || q.type === "SINGLE_CHOICE") && (
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