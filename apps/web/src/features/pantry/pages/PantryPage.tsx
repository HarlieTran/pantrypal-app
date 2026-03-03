import { useState, useEffect, useCallback } from "react";
import { PantryItemList } from "../components/PantryItemList";
import { AddItemModal } from "../components/AddItemModal";
import { ImageUploadParser } from "../components/ImageUploadParser";
import {
  fetchPantry,
  addPantryItem,
  addPantryItemsBulk,
  deletePantryItem,
} from "../api/pantry.api";
import type { PantryItem, PantryMeta, ParsedIngredient } from "../model/types";

interface Props {
  token: string;
  onBack: () => void;
  onGenerateRecipes: () => void;
}

type Modal = "none" | "add" | "upload";

export function PantryPage({ token, onBack, onGenerateRecipes }: Props) {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [meta, setMeta] = useState<PantryMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState<Modal>("none");

  // ─── Fetch pantry ───────────────────────────────────────────────────────────

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

  // ─── Add single item ────────────────────────────────────────────────────────

  const handleAdd = async (data: {
    rawName: string;
    quantity: number;
    unit: string;
    expiryDate?: string;
    notes?: string;
  }) => {
    const item = await addPantryItem(token, data);
    setItems((prev) => [item, ...prev]);
    setMeta((prev) =>
      prev ? { ...prev, itemCount: prev.itemCount + 1 } : prev,
    );
  };

  // ─── Bulk add from image ────────────────────────────────────────────────────

  const handleBulkAdd = async (parsed: ParsedIngredient[]) => {
    const newItems = await addPantryItemsBulk(token, parsed);
    setItems((prev) => [...newItems, ...prev]);
    setMeta((prev) =>
      prev
        ? { ...prev, itemCount: prev.itemCount + newItems.length }
        : prev,
    );
  };

  // ─── Delete item ────────────────────────────────────────────────────────────

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

  // ─── Expiry summary ─────────────────────────────────────────────────────────

  const expiredCount = items.filter((i) => i.expiryStatus === "expired").length;
  const expiringSoonCount = items.filter(
    (i) => i.expiryStatus === "expiring_soon",
  ).length;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--page-bg)",
        paddingBottom: "40px",
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          background: "var(--panel)",
          borderBottom: "1px solid var(--line)",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={onBack}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "20px",
              padding: "4px",
              color: "var(--ink)",
            }}
          >
            ←
          </button>
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "22px",
                fontFamily: "Georgia, serif",
                color: "var(--ink)",
              }}
            >
              My Pantry
            </h1>
            {meta && (
              <p style={{ margin: 0, fontSize: "12px", color: "var(--muted)" }}>
                {meta.itemCount} item{meta.itemCount !== 1 ? "s" : ""}
                {meta.expiringCount > 0 && (
                  <span style={{ color: "#e65100" }}>
                    {" "}· {meta.expiringCount} expiring soon
                  </span>
                )}
              </p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={onGenerateRecipes}
            title="Generate recipes from pantry"
            style={{
              ...actionBtnStyle,
              background: "#2e7d32",
              color: "#fff",
              border: "none",
            }}
          >
            Recipes
          </button>
          <button
            onClick={() => setModal("upload")}
            title="Upload image"
            style={actionBtnStyle}
          >
            📷
          </button>
          <button
            onClick={() => setModal("add")}
            title="Add item"
            style={{
              ...actionBtnStyle,
              background: "var(--accent)",
              color: "#fff",
              border: "none",
            }}
          >
            + Add
          </button>
        </div>
      </div>

      {/* ── Expiry alert banner ── */}
      {(expiredCount > 0 || expiringSoonCount > 0) && (
        <div
          style={{
            margin: "16px 24px 0",
            padding: "12px 16px",
            borderRadius: "12px",
            background: expiredCount > 0 ? "#fce4ec" : "#fff3e0",
            color: expiredCount > 0 ? "#b71c1c" : "#e65100",
            fontSize: "13px",
            fontWeight: 500,
          }}
        >
          {expiredCount > 0 && (
            <span>⚠️ {expiredCount} item{expiredCount !== 1 ? "s have" : " has"} expired. </span>
          )}
          {expiringSoonCount > 0 && (
            <span>🕐 {expiringSoonCount} item{expiringSoonCount !== 1 ? "s are" : " is"} expiring soon.</span>
          )}
        </div>
      )}

      {/* ── Content ── */}
      <div
        style={{
          margin: "16px 24px 0",
          background: "var(--panel)",
          borderRadius: "16px",
          border: "1px solid var(--line)",
          overflow: "hidden",
        }}
      >
        {loading ? (
          <div
            style={{
              textAlign: "center",
              padding: "48px",
              color: "var(--muted)",
            }}
          >
            Loading pantry…
          </div>
        ) : error ? (
          <div
            style={{
              textAlign: "center",
              padding: "48px",
              color: "#b71c1c",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        ) : (
          <PantryItemList items={items} onDelete={handleDelete} />
        )}
      </div>

      {/* ── Modals ── */}
      {modal === "add" && (
        <AddItemModal
          onAdd={handleAdd}
          onClose={() => setModal("none")}
        />
      )}

      {modal === "upload" && (
        <ImageUploadParser
          token={token}
          onComplete={loadPantry}
          onClose={() => setModal("none")}
        />
      )}
    </div>
  );
}

const actionBtnStyle: React.CSSProperties = {
  padding: "8px 16px",
  borderRadius: "10px",
  border: "1px solid var(--line)",
  background: "var(--panel)",
  fontSize: "14px",
  cursor: "pointer",
  fontWeight: 500,
  color: "var(--ink)",
};
