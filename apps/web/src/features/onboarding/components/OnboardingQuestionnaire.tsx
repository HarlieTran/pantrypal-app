import { useEffect, useMemo, useState } from "react";
import type { OnboardingAnswerInput, OnboardingQuestion } from "@pantrypal/shared-types";
import { completeOnboarding, getOnboardingQuestions, saveAnswers } from "../api/onboarding";

type Props = {
  token: string;
  onCompleted: () => void;
};

type AnswersState = Record<string, { optionValues: string[]; answerText: string }>;

function initAnswers(questions: OnboardingQuestion[]): AnswersState {
  const state: AnswersState = {};
  for (const q of questions) {
    state[q.key] = { optionValues: [], answerText: "" };
  }
  return state;
}

export function OnboardingQuestionnaire({ token, onCompleted }: Props) {
  const [questions, setQuestions] = useState<OnboardingQuestion[]>([]);
  const [answers, setAnswers] = useState<AnswersState>({});
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const data = await getOnboardingQuestions();
        const list = Array.isArray(data?.questions) ? data.questions : [];
        if (!mounted) return;
        setQuestions(list);
        setAnswers(initAnswers(list));
      } catch (error) {
        if (!mounted) return;
        setResult(`Failed to load questions: ${String((error as Error).message || error)}`);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const requiredInvalid = useMemo(() => {
    return questions.some((q) => {
      if (!q.isRequired) return false;
      const a = answers[q.key];
      if (!a) return true;
      if (q.type === "FREE_TEXT") return !a.answerText.trim();
      return a.optionValues.length === 0;
    });
  }, [questions, answers]);

  const groupedQuestions = useMemo(() => {
    const childrenByParent = new Map<string, OnboardingQuestion[]>();
    const parentQuestions: OnboardingQuestion[] = [];

    for (const q of questions) {
      const underscoreIndex = q.key.indexOf("_");
      const maybeParentKey = underscoreIndex > 0 ? q.key.slice(0, underscoreIndex) : "";
      const isFreeTextChild =
        q.type === "FREE_TEXT" &&
        maybeParentKey.length > 0 &&
        questions.some((x) => x.key === maybeParentKey && x.type !== "FREE_TEXT");

      if (isFreeTextChild) {
        const existing = childrenByParent.get(maybeParentKey) ?? [];
        existing.push(q);
        childrenByParent.set(maybeParentKey, existing);
        continue;
      }

      parentQuestions.push(q);
    }

    for (const list of childrenByParent.values()) {
      list.sort((a, b) => a.sortOrder - b.sortOrder);
    }
    parentQuestions.sort((a, b) => a.sortOrder - b.sortOrder);

    return { parentQuestions, childrenByParent };
  }, [questions]);

  const toggleMulti = (questionKey: string, value: string) => {
    setAnswers((prev) => {
      const current = prev[questionKey] ?? { optionValues: [], answerText: "" };
      const exists = current.optionValues.includes(value);
      return {
        ...prev,
        [questionKey]: {
          ...current,
          optionValues: exists
            ? current.optionValues.filter((v) => v !== value)
            : [...current.optionValues, value],
        },
      };
    });
  };

  const setSingle = (questionKey: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionKey]: {
        ...(prev[questionKey] ?? { answerText: "", optionValues: [] }),
        optionValues: [value],
      },
    }));
  };

  const setText = (questionKey: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionKey]: {
        ...(prev[questionKey] ?? { answerText: "", optionValues: [] }),
        answerText: value,
      },
    }));
  };

  const onSaveAndContinue = async () => {
    if (requiredInvalid) {
      setResult("Please complete required questions.");
      return;
    }

    setSaving(true);
    setResult("");

    try {
      const answersPayload: OnboardingAnswerInput[] = questions
        .map((q) => {
          const a = answers[q.key] ?? { optionValues: [], answerText: "" };
          if (q.type === "FREE_TEXT") {
            return { questionKey: q.key, answerText: a.answerText.trim() };
          }
          return { questionKey: q.key, optionValues: a.optionValues };
        })
        .filter((item) => {
          if ("optionValues" in item) return Boolean(item.optionValues?.length);
          return Boolean(item.answerText?.trim());
      });

      await saveAnswers(token, answersPayload);

      await completeOnboarding(token);

      setResult("Onboarding completed.");
      onCompleted();
    } catch (error) {
      setResult(`Failed to save answers: ${String((error as Error).message || error)}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <main style={{ fontFamily: "system-ui", padding: 24 }}>Loading onboarding...</main>;
  }

  return (
    <main style={{ fontFamily: "system-ui", padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h1>Tell us about your eating habits</h1>
      <p>Answer the questions below. Required items are marked with *.</p>

      {groupedQuestions.parentQuestions.map((q) => {
        const a = answers[q.key] ?? { optionValues: [], answerText: "" };
        const childQuestions = groupedQuestions.childrenByParent.get(q.key) ?? [];
        return (
          <section
            key={q.id}
            style={{ marginTop: 20, border: "1px solid #ddd", borderRadius: 8, padding: 12 }}
          >
            <h2 style={{ margin: 0 }}>
              {q.label} {q.isRequired ? "*" : ""}
            </h2>

            {q.type === "FREE_TEXT" ? (
              <textarea
                rows={3}
                value={a.answerText}
                onChange={(e) => setText(q.key, e.target.value)}
                style={{ width: "100%", marginTop: 8 }}
                placeholder="Type your answer"
              />
            ) : null}

            {q.type === "SINGLE_CHOICE" ? (
              <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
                {q.options.map((opt) => (
                  <label key={opt.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                      type="radio"
                      name={`q-${q.key}`}
                      checked={a.optionValues[0] === opt.value}
                      onChange={() => setSingle(q.key, opt.value)}
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            ) : null}

            {q.type === "MULTI_CHOICE" ? (
              <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
                {q.options.map((opt) => (
                  <label key={opt.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                      type="checkbox"
                      checked={a.optionValues.includes(opt.value)}
                      onChange={() => toggleMulti(q.key, opt.value)}
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            ) : null}

            {childQuestions.map((child) => {
              const childAnswer = answers[child.key] ?? { optionValues: [], answerText: "" };
              return (
                <div key={child.id} style={{ marginTop: 12 }}>
                  <label style={{ display: "block", fontWeight: 600 }}>
                    {child.label} {child.isRequired ? "*" : ""}
                  </label>
                  <textarea
                    rows={3}
                    value={childAnswer.answerText}
                    onChange={(e) => setText(child.key, e.target.value)}
                    style={{ width: "100%", marginTop: 6 }}
                    placeholder="Type your answer"
                  />
                </div>
              );
            })}
          </section>
        );
      })}

      <div style={{ marginTop: 16 }}>
        <button onClick={onSaveAndContinue} disabled={saving}>
          {saving ? "Saving..." : "Save and continue"}
        </button>
      </div>

      <pre style={{ background: "#f6f6f6", padding: 12, borderRadius: 8, marginTop: 16 }}>
        {result || "Your answers will be saved to your profile."}
      </pre>
    </main>
  );
}

