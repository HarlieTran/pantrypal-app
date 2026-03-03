import { useState } from "react";
import { UNIT_OPTIONS } from "../model/types";

interface Props {
  onAdd: (data: {
    rawName: string;
    quantity: number;
    unit: string;
    expiryDate?: string;
    notes?: string;
  }) => Promise<void>;
  onClose: () => void;
}

export function AddItemModal({ onAdd, onClose }: Props) {
  const [rawName, setRawName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("pcs");
  const [expiryDate, setExpiryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!rawName.trim()) {
      setError("Item name is required.");
      return;
    }
    if (!quantity || Number(quantity) <= 0) {
      setError("Quantity must be greater than 0.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await onAdd({
        rawName: rawName.trim(),
        quantity: Number(quantity),
        unit,
        expiryDate: expiryDate || undefined,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (e) {
      setError(String((e as Error).message || "Failed to add item."));
    } finally {
      setLoading(false);
    }
  };

  return (
    // Backdrop
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: "24px",
      }}
    >
      {/* Modal card */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--panel)",
          borderRadius: "20px",
          padding: "28px",
          width: "100%",
          maxWidth: "440px",
          boxShadow: "0 16px 40px rgba(0,0,0,0.18)",
        }}
      >
        <h2
          style={{
            margin: "0 0 20px",
            fontSize: "20px",
            fontFamily: "Georgia, serif",
            color: "var(--ink)",
          }}
        >
          Add Pantry Item
        </h2>

        {/* Item name */}
        <label style={labelStyle}>
          Item name
          <input
            type="text"
            placeholder="e.g. Roma Tomato"
            value={rawName}
            onChange={(e) => setRawName(e.target.value)}
            style={inputStyle}
            autoFocus
          />
        </label>

        {/* Quantity + Unit row */}
        <div style={{ display: "flex", gap: "12px" }}>
          <label style={{ ...labelStyle, flex: 1 }}>
            Quantity
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              style={inputStyle}
            />
          </label>

          <label style={{ ...labelStyle, flex: 1 }}>
            Unit
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              style={inputStyle}
            >
              {UNIT_OPTIONS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Expiry date */}
        <label style={labelStyle}>
          Expiry date <span style={{ color: "var(--muted)", fontWeight: 400 }}>(optional)</span>
          <input
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            style={inputStyle}
          />
        </label>

        {/* Notes */}
        <label style={labelStyle}>
          Notes <span style={{ color: "var(--muted)", fontWeight: 400 }}>(optional)</span>
          <input
            type="text"
            placeholder="e.g. opened, store in fridge"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={inputStyle}
          />
        </label>

        {/* Error */}
        {error && (
          <p style={{ color: "#b71c1c", fontSize: "13px", margin: "8px 0 0" }}>
            {error}
          </p>
        )}

        {/* Actions */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginTop: "24px",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onClose}
            disabled={loading}
            style={cancelBtnStyle}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={submitBtnStyle}
          >
            {loading ? "Adding…" : "Add Item"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  fontSize: "13px",
  fontWeight: 600,
  color: "var(--ink)",
  marginBottom: "14px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "10px",
  border: "1px solid var(--line)",
  background: "#fff",
  fontSize: "14px",
  color: "var(--ink)",
  fontFamily: "inherit",
};

const cancelBtnStyle: React.CSSProperties = {
  padding: "10px 20px",
  borderRadius: "10px",
  border: "1px solid var(--line)",
  background: "transparent",
  fontSize: "14px",
  cursor: "pointer",
  color: "var(--muted)",
};

const submitBtnStyle: React.CSSProperties = {
  padding: "10px 24px",
  borderRadius: "10px",
  border: "none",
  background: "var(--accent)",
  color: "#fff",
  fontSize: "14px",
  fontWeight: 600,
  cursor: "pointer",
};
