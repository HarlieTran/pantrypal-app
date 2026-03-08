import type { PantryItem, PantryMeta, ParsedIngredient } from "../model/pantry.types";
import { apiGet, apiPost, apiPatch, apiDelete } from '../../../lib/api';

export async function fetchPantry(token: string): Promise<{
  items: PantryItem[];
  meta: PantryMeta | null;
}> {
  return apiGet('/pantry', token);
}

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
  const json = await apiPost<{ item: PantryItem }>('/pantry/items', data, token);
  return json.item;
}

export async function addPantryItemsBulk(
  token: string,
  items: Array<{
    rawName: string;
    quantity: number;
    unit: string;
    expiryDate?: string;
  }>,
): Promise<PantryItem[]> {
  const json = await apiPost<{ items: PantryItem[] }>('/pantry/items/bulk', { items }, token);
  return json.items;
}

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
  const json = await apiPatch<{ item: PantryItem }>(`/pantry/items/${itemId}`, updates, token);
  return json.item;
}

export async function deletePantryItem(
  token: string,
  itemId: string,
): Promise<void> {
  await apiDelete(`/pantry/items/${itemId}`, token);
}

export async function getPantryUploadUrl(
  token: string,
  filename: string,
  contentType: string,
): Promise<{ uploadUrl: string; imageKey: string }> {
  return apiPost('/pantry/upload-url', { filename, contentType }, token);
}

export async function parseImageForIngredients(
  token: string,
  imageKey: string,
): Promise<ParsedIngredient[]> {
  const json = await apiPost<{ ingredients: ParsedIngredient[] }>('/pantry/parse-image', { imageKey }, token);
  return json.ingredients;
}
