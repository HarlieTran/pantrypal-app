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
    <div onClick={onClose} className="ig-modal-backdrop">
      <div onClick={(e) => e.stopPropagation()} className="ig-modal-card ig-add-modal">
        <button className="ig-modal-close" onClick={onClose} aria-label="Close add item modal">x</button>

        <h2 className="ig-modal-title">Add Pantry Item</h2>

        <label className="ig-form-label">
          <span>Item name</span>
          <input
            type="text"
            placeholder="e.g. Roma Tomato"
            value={rawName}
            onChange={(e) => setRawName(e.target.value)}
            autoFocus
          />
        </label>

        <div className="ig-form-row">
          <label className="ig-form-label">
            <span>Quantity</span>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </label>

          <label className="ig-form-label">
            <span>Unit</span>
            <select value={unit} onChange={(e) => setUnit(e.target.value)}>
              {UNIT_OPTIONS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="ig-form-label">
          <span>Expiry date (optional)</span>
          <input
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
          />
        </label>

        <label className="ig-form-label">
          <span>Notes (optional)</span>
          <input
            type="text"
            placeholder="e.g. opened, store in fridge"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>

        {error ? <p className="ig-error-note">{error}</p> : null}

        <div className="ig-modal-actions">
          <button className="btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? "Adding..." : "Add Item"}
          </button>
        </div>
      </div>
    </div>
  );
}
