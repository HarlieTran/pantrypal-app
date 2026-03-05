import { useState, useEffect, useCallback } from "react";
import { PantryItemList } from "../components/PantryItemList";
import { AddItemModal } from "../components/AddItemModal";
import { ImageUploadParser } from "../components/ImageUploadParser";
import {
  fetchPantry,
  addPantryItem,
  addPantryItemsBulk,
  deletePantryItem,
} from "../../infra/pantry.api";
import type { PantryItem, PantryMeta, ParsedIngredient } from "../../model/pantry.types";

interface Props {
  token: string;
  onBack: () => void;
  onGenerateRecipes: () => void;
  embedded?: boolean;
}

type Modal = "none" | "add" | "upload";

export function PantryPage({ token, onBack, onGenerateRecipes, embedded = false }: Props) {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [meta, setMeta] = useState<PantryMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState<Modal>("none");

  const loadPantry = useCallback(async () => {
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
    void loadPantry();
  }, [loadPantry]);

  const handleAdd = async (data: {
    rawName: string;
    quantity: number;
    unit: string;
    expiryDate?: string;
    notes?: string;
  }) => {
    const item = await addPantryItem(token, data);
    setItems((prev) => [item, ...prev]);
    setMeta((prev) => (prev ? { ...prev, itemCount: prev.itemCount + 1 } : prev));
  };

  const handleBulkAdd = async (parsed: ParsedIngredient[]) => {
    const newItems = await addPantryItemsBulk(token, parsed);
    setItems((prev) => [...newItems, ...prev]);
    setMeta((prev) =>
      prev
        ? { ...prev, itemCount: prev.itemCount + newItems.length }
        : prev,
    );
  };

  const handleDelete = async (itemId: string) => {
    try {
      await deletePantryItem(token, itemId);
      setItems((prev) => prev.filter((i) => i.itemId !== itemId));
      setMeta((prev) =>
        prev ? { ...prev, itemCount: Math.max(0, prev.itemCount - 1) } : prev,
      );
    } catch {
      setError("Failed to delete item.");
    }
  };

  const expiredCount = items.filter((i) => i.expiryStatus === "expired").length;
  const expiringSoonCount = items.filter((i) => i.expiryStatus === "expiring_soon").length;

  const content = (
    <>
        <header className="ig-toolbar">
          <div className="ig-toolbar-left">
            <div>
              <p><i>Hello, </i></p>
              <h1 className="ig-toolbar-title">My Pantry</h1>
              {meta ? (
                <p className="ig-toolbar-subtitle">
                  {meta.itemCount} item{meta.itemCount !== 1 ? "s" : ""}
                  {meta.expiringCount > 0 ? ` - ${meta.expiringCount} expiring soon` : ""}
                </p>
              ) : null}
            </div>
          </div>

          <div className="ig-toolbar-actions">
            {/* <button className="btn-primary" onClick={onGenerateRecipes} title="Generate recipes from pantry">Recipes</button> */}
            <button className="btn-primary" onClick={() => setModal("upload")} title="Upload image">Upload</button>
            <button className="btn-primary" onClick={() => setModal("add")} title="Add item">+ Add</button>
          </div>
        </header>

        {(expiredCount > 0 || expiringSoonCount > 0) ? (
          <div className={`ig-alert ${expiredCount > 0 ? "is-danger" : "is-warning"}`}>
            {expiredCount > 0 ? `${expiredCount} item${expiredCount !== 1 ? "s have" : " has"} expired.` : ""}
            {expiringSoonCount > 0 ? ` ${expiringSoonCount} item${expiringSoonCount !== 1 ? "s are" : " is"} expiring soon.` : ""}
          </div>
        ) : null}

        <section className="ig-card ig-pantry-content">
          {loading ? <div className="ig-page-note">Loading pantry...</div> : null}
          {!loading && error ? <div className="ig-error-note">{error}</div> : null}
          {!loading && !error ? <PantryItemList items={items} onDelete={handleDelete} /> : null}
        </section>

        {modal === "add" ? (
          <AddItemModal onAdd={handleAdd} onClose={() => setModal("none")} />
        ) : null}

        {modal === "upload" ? (
          <ImageUploadParser token={token} onComplete={loadPantry} onClose={() => setModal("none")} />
        ) : null}
    </>
  );

  if (embedded) {
    return <section className="ig-pantry-embedded">{content}</section>;
  }

  return (
    <main className="ig-screen">
      <section className="ig-page-shell ig-pantry-shell">
        {content}
      </section>
    </main>
  );
}
