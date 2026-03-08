import type { OnboardingAnswerInput, OnboardingQuestion } from "@pantrypal/shared-types";
import { apiGet, apiPut, apiPost } from '../../../lib/api';

export const getMe = async (token: string) =>
  apiGet<any>('/me', token);

export const getOnboardingQuestions = async () =>
  apiGet<{ questions: OnboardingQuestion[] }>('/onboarding/questions');

export const saveAnswers = async (token: string, answers: OnboardingAnswerInput[]) =>
  apiPut('/me/answers', { answers }, token);

export const completeOnboarding = async (token: string) =>
  apiPost('/me/onboarding/complete', {}, token);

export const getRecipeImages = async (count = 6) =>
  apiGet<{
    images: Array<{
      id: string;
      title: string;
      imageUrl: string;
      cuisine?: string | null;
    }>;
  }>(`/onboarding/recipe-images?count=${count}`);

export const submitRecipeSelections = async (token: string, payload: { selectedImageIds: string[]; rejectedImageIds: string[] }) =>
  apiPost('/me/onboarding/recipe-selections', payload, token);

