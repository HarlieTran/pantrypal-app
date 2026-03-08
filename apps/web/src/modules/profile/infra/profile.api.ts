import type { RecipeSelectionInput, UpdateProfileInput, UserProfile } from "../model/profile.types";
import { apiGet, apiPatch, apiPost } from '../../../lib/api';

export async function fetchProfile(token: string): Promise<UserProfile> {
  const data = await apiGet<{ profile: UserProfile }>('/me/profile', token);
  return data.profile;
}

export async function saveProfile(token: string, payload: UpdateProfileInput) {
  await apiPatch('/me/profile', payload, token);
}

export async function submitProfileRecipeSelections(token: string, payload: RecipeSelectionInput) {
  return apiPost<{ preferenceProfile?: { likes?: string[]; dislikes?: string[]; dietSignals?: string[] } }>(
    '/me/onboarding/recipe-selections',
    payload,
    token
  );
}
