import type { PantryItem, PantryMeta, ParsedIngredient } from "../model/pantry.types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8788";

function authHeaders(token: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

// ─── Get all pantry items + meta ──────────────────────────────────────────────

export async function fetchPantry(token: string): Promise<{
  items: PantryItem[];
  meta: PantryMeta | null;
}> {
  const res = await fetch(`${API_BASE}/pantry`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(`Failed to fetch pantry (${res.status})`);
  return res.json();
}

// ─── Add one item manually ────────────────────────────────────────────────────

export async function addPantryItem(
  token: string,
  data: {
    rawName: string;
    quantity: number;
    unit: string;
    expiryDate?: string;
    notes?: string;
  },
): Promise<PantryItem> {
  const res = await fetch(`${API_BASE}/pantry/items`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to add item (${res.status})`);
  const json = await res.json();
  return json.item;
}

// ─── Add multiple items (from image parse) ────────────────────────────────────

export async function addPantryItemsBulk(
  token: string,
  items: Array<{
    rawName: string;
    quantity: number;
    unit: string;
    expiryDate?: string;
  }>,
): Promise<PantryItem[]> {
  const res = await fetch(`${API_BASE}/pantry/items/bulk`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ items }),
  });
  if (!res.ok) throw new Error(`Failed to bulk add items (${res.status})`);
  const json = await res.json();
  return json.items;
}

// ─── Update an item ───────────────────────────────────────────────────────────

export async function updatePantryItem(
  token: string,
  itemId: string,
  updates: Partial<{
    quantity: number;
    unit: string;
    expiryDate: string;
    notes: string;
  }>,
): Promise<PantryItem> {
  const res = await fetch(`${API_BASE}/pantry/items/${itemId}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error(`Failed to update item (${res.status})`);
  const json = await res.json();
  return json.item;
}

// ─── Delete an item ───────────────────────────────────────────────────────────

export async function deletePantryItem(
  token: string,
  itemId: string,
): Promise<void> {
  const res = await fetch(`${API_BASE}/pantry/items/${itemId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(`Failed to delete item (${res.status})`);
}

// ─── Get presigned upload URL ─────────────────────────────────────────────────

export async function getPantryUploadUrl(
  token: string,
  filename: string,
  contentType: string,
): Promise<{ uploadUrl: string; imageKey: string }> {
  const res = await fetch(`${API_BASE}/pantry/upload-url`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ filename, contentType }),
  });
  if (!res.ok) throw new Error(`Failed to get upload URL (${res.status})`);
  return res.json();
}

// ─── Parse image for ingredients ──────────────────────────────────────────────

export async function parseImageForIngredients(
  token: string,
  imageKey: string,
): Promise<ParsedIngredient[]> {
  const res = await fetch(`${API_BASE}/pantry/parse-image`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ imageKey }),
  });
  if (!res.ok) throw new Error(`Failed to parse image (${res.status})`);
  const json = await res.json();
  return json.ingredients;
}

