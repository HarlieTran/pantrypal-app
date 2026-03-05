import type { OnboardingAnswerInput, OnboardingQuestion } from "@pantrypal/shared-types";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const headers = (token?: string) => ({
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

export const getMe = async (token: string) =>
  fetch(`${API_BASE}/me`, { headers: headers(token) }).then((r) => r.json());

export const getOnboardingQuestions = async () =>
  fetch(`${API_BASE}/onboarding/questions`).then(
    (r) => r.json() as Promise<{ questions: OnboardingQuestion[] }>,
  );

export const saveAnswers = async (token: string, answers: OnboardingAnswerInput[]) =>
  fetch(`${API_BASE}/me/answers`, {
    method: "PUT",
    headers: headers(token),
    body: JSON.stringify({ answers }),
  }).then((r) => r.json());

export const completeOnboarding = async (token: string) =>
  fetch(`${API_BASE}/me/onboarding/complete`, {
    method: "POST",
    headers: headers(token),
  }).then((r) => r.json());

  export const getRecipeImages = async (count = 6) =>
  fetch(`${API_BASE}/onboarding/recipe-images?count=${count}`).then(
    (r) =>
      r.json() as Promise<{
        images: Array<{
          id: string;
          title: string;
          imageUrl: string;
          cuisine?: string | null;
        }>;
      }>,
  );

  export const submitRecipeSelections = async (token: string, payload: { selectedImageIds: string[]; rejectedImageIds: string[] }) => {
    const res = await fetch(`${API_BASE}/me/onboarding/recipe-selections`, {
      method: "POST",
      headers: headers(token),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
    return data;
  };

