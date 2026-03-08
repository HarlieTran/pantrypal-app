import { useState, useEffect, useCallback } from "react";
import { fetchPantry, addPantryItem, addPantryItemsBulk, deletePantryItem } from "../infra/pantry.api";
import type { PantryItem, PantryMeta, ParsedIngredient } from "../model/pantry.types";

export function usePantry(token: string) {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [meta, setMeta] = useState<PantryMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await fetchPantry(token);
      setItems(data.items);
      setMeta(data.meta);
    } catch (e) {
      setError(String((e as Error).message || "Failed to load pantry."));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const add = async (data: { rawName: string; quantity: number; unit: string; expiryDate?: string; notes?: string }) => {
    const item = await addPantryItem(token, data);
    setItems((prev) => [item, ...prev]);
    setMeta((prev) => (prev ? { ...prev, itemCount: prev.itemCount + 1 } : prev));
  };

  const bulkAdd = async (parsed: ParsedIngredient[]) => {
    const newItems = await addPantryItemsBulk(token, parsed);
    setItems((prev) => [...newItems, ...prev]);
    setMeta((prev) => (prev ? { ...prev, itemCount: prev.itemCount + newItems.length } : prev));
  };

  const remove = async (itemId: string) => {
    try {
      await deletePantryItem(token, itemId);
      setItems((prev) => prev.filter((i) => i.itemId !== itemId));
      setMeta((prev) => (prev ? { ...prev, itemCount: Math.max(0, prev.itemCount - 1) } : prev));
    } catch {
      setError("Failed to delete item.");
    }
  };

  const expiredCount = items.filter((i) => i.expiryStatus === "expired").length;
  const expiringSoonCount = items.filter((i) => i.expiryStatus === "expiring_soon").length;

  return { items, meta, loading, error, expiredCount, expiringSoonCount, load, add, bulkAdd, remove };
}
