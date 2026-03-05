import type { RecipeSelectionInput, UpdateProfileInput, UserProfile } from "../model/profile.types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8788";

function authHeaders(token: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function fetchProfile(token: string): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/me/profile`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(`Failed to load profile (${res.status})`);
  const data = (await res.json()) as { profile: UserProfile };
  return data.profile;
}

export async function saveProfile(token: string, payload: UpdateProfileInput) {
  const res = await fetch(`${API_BASE}/me/profile`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Failed to save profile (${res.status}) ${txt}`);
  }
}

export async function submitProfileRecipeSelections(token: string, payload: RecipeSelectionInput) {
  const res = await fetch(`${API_BASE}/me/onboarding/recipe-selections`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
  return data as { preferenceProfile?: { likes?: string[]; dislikes?: string[]; dietSignals?: string[] } };
}
