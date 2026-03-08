import { useEffect, useState } from "react";
import type { OnboardingAnswerInput, OnboardingQuestion } from "@pantrypal/shared-types";
import { QUESTION_TYPES } from "@pantrypal/shared-types";
import { completeOnboarding, getOnboardingQuestions, saveAnswers } from "../infra/onboarding.api";

type AnswersState = Record<string, { optionValues: string[]; answerText: string }>;

export function useOnboardingQuestionnaire(token: string) {
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

  const mainQuestions = questions.filter((q) => q.type !== QUESTION_TYPES.FREE_TEXT || !questions.some((p) => q.key.startsWith(p.key + "_")));

  const submit = async () => {
    setSaving(true);
    setError("");
    try {
      const payload: OnboardingAnswerInput[] = questions
        .map((q) => {
          const a = answers[q.key] ?? { optionValues: [], answerText: "" };
          if (q.type === QUESTION_TYPES.FREE_TEXT) return { questionKey: q.key, answerText: a.answerText.trim() };
          return { questionKey: q.key, optionValues: a.optionValues };
        })
        .filter((item) => ("optionValues" in item ? (item.optionValues?.length ?? 0) > 0 : Boolean(item.answerText?.trim())));

      await saveAnswers(token, payload);
      await completeOnboarding(token);
    } catch (e) {
      setError(String((e as Error).message || "Failed to save."));
      throw e;
    } finally {
      setSaving(false);
    }
  };

  return { mainQuestions, answers, loading, saving, error, toggleMulti, setText, submit };
}
