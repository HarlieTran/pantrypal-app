import { useState, useRef } from "react";
import { getPantryUploadUrl, parseImageForIngredients, addPantryItemsBulk } from "../api/pantry.api";
import { UNIT_OPTIONS } from "../model/types";
import type { ParsedIngredient } from "../model/types";

interface Props {
  token: string;
  onComplete: () => Promise<void>; // refreshes pantry list
  onClose: () => void;
}

type Step = "pick" | "preview" | "processing" | "review" | "saving";

interface ReviewItem extends ParsedIngredient {
  id: string;
  expiryDate: string;
  selected: boolean;
}

export function ImageUploadParser({ token, onComplete, onClose }: Props) {
  const [step, setStep] = useState<Step>("pick");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // ─── Image resize ───────────────────────────────────────────────────────────

  const resizeImage = (file: File, maxDimension = 1500): Promise<Blob> =>
    new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();

      img.onload = () => {
        const { naturalWidth: w, naturalHeight: h } = img;
        const largest = Math.max(w, h);

        if (largest <= maxDimension) {
          URL.revokeObjectURL(url);
          resolve(file);
          return;
        }

        const scale = maxDimension / largest;
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(w * scale);
        canvas.height = Math.round(h * scale);

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error("Could not resize image."));
          return;
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);

        canvas.toBlob(
          (blob) => {
            if (!blob) reject(new Error("Could not resize image."));
            else resolve(blob);
          },
          file.type || "image/jpeg",
          0.9,
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Could not load image."));
      };

      img.src = url;
    });

  // ─── File pick ──────────────────────────────────────────────────────────────

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (!picked) return;

    const url = URL.createObjectURL(picked);
    setFile(picked);
    setPreviewUrl(url);
    setError("");
    setStep("preview");
  };

  // ─── Main processing flow ───────────────────────────────────────────────────

  const handleUseImage = async () => {
    if (!file) return;
    setStep("processing");
    setError("");

    try {
      // Resize
      setProgress(10);
      setProgressLabel("Resizing image…");
      const resized = await resizeImage(file);
      const resizedFile = new File([resized], file.name, { type: file.type });

      // Get presigned URL
      setProgress(25);
      setProgressLabel("Preparing upload…");
      const { uploadUrl, imageKey } = await getPantryUploadUrl(
        token,
        resizedFile.name,
        resizedFile.type || "image/jpeg",
      );

      // Upload to S3
      setProgress(50);
      setProgressLabel("Uploading image…");
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": resizedFile.type || "image/jpeg" },
        body: resized,
      });

      if (!uploadRes.ok) throw new Error("Image upload to S3 failed.");

      // Parse with Bedrock
      setProgress(75);
      setProgressLabel("Analysing ingredients…");
      const ingredients = await parseImageForIngredients(token, imageKey);

      if (ingredients.length === 0) {
        setError("No ingredients found. Try a clearer photo.");
        setStep("preview");
        setProgress(0);
        return;
      }

      // Build review list
      const defaultExpiry = new Date();
      defaultExpiry.setDate(defaultExpiry.getDate() + 5);
      const defaultExpiryStr = defaultExpiry.toISOString().split("T")[0];

      setReviewItems(
        ingredients.map((ing, i) => ({
          ...ing,
          id: `${i}-${Date.now()}`,
          expiryDate: defaultExpiryStr,
          selected: true,
        })),
      );

      setProgress(100);
      setProgressLabel("Done!");
      setStep("review");
    } catch (e) {
      setError(String((e as Error).message || "Something went wrong."));
      setStep("preview");
      setProgress(0);
    }
  };

  // ─── Review actions ─────────────────────────────────────────────────────────

  const toggleItem = (id: string) => {
    setReviewItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, selected: !item.selected } : item,
      ),
    );
  };

  const updateItem = (id: string, field: keyof ReviewItem, value: string | number) => {
    setReviewItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );
  };

  const handleConfirm = async () => {
    const toAdd = reviewItems.filter((i) => i.selected);
    if (toAdd.length === 0) {
      setError("Please select at least one item.");
      return;
    }

    setError("");
    setStep("saving");

    try {
      await addPantryItemsBulk(
        token,
        toAdd.map((i) => ({
          rawName: i.rawName,
          quantity: i.quantity,
          unit: i.unit,
          expiryDate: i.expiryDate || undefined,
        })),
      );
      await onComplete(); // refresh pantry list
      onClose();
    } catch (e) {
      setError(String((e as Error).message || "Failed to save items."));
      setStep("review");
    }
  };

  const selectedCount = reviewItems.filter((i) => i.selected).length;

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: "24px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--panel)",
          borderRadius: "20px",
          padding: "28px",
          width: "100%",
          maxWidth: "560px",
          maxHeight: "88vh",
          overflowY: "auto",
          boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
        }}
      >
        {/* Header */}
        <h2 style={{
          margin: "0 0 4px",
          fontSize: "20px",
          fontFamily: "Georgia, serif",
          color: "var(--ink)",
        }}>
          Scan Image
        </h2>
        <p style={{ margin: "0 0 20px", fontSize: "13px", color: "var(--muted)" }}>
          Upload a receipt, ingredient photo, or spice rack.
        </p>

        {/* ── Step: Pick ── */}
        {step === "pick" && (
          <>
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                border: "2px dashed var(--line)",
                borderRadius: "14px",
                padding: "48px 24px",
                textAlign: "center",
                cursor: "pointer",
                transition: "border-color 0.2s, background 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--accent)";
                e.currentTarget.style.background = "rgba(216,106,85,0.03)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--line)";
                e.currentTarget.style.background = "transparent";
              }}
            >
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>📷</div>
              <p style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: "var(--ink)" }}>
                Click to choose a photo
              </p>
              <p style={{ margin: "6px 0 0", fontSize: "12px", color: "var(--muted)" }}>
                JPG, PNG, WEBP up to 10MB
              </p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
          </>
        )}

        {/* ── Step: Preview ── */}
        {step === "preview" && previewUrl && (
          <>
            <div style={{
              borderRadius: "12px",
              overflow: "hidden",
              marginBottom: "16px",
              border: "1px solid var(--line)",
            }}>
              <img
                src={previewUrl}
                alt="Preview"
                style={{
                  width: "100%",
                  height: "auto",
                  display: "block",
                }}
              />
            </div>

            <p style={{
              margin: "0 0 16px",
              fontSize: "13px",
              color: "var(--muted)",
              textAlign: "center",
            }}>
              {file?.name}
            </p>

            {error && (
              <p style={{ color: "#b71c1c", fontSize: "13px", margin: "0 0 12px" }}>
                {error}
              </p>
            )}

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => {
                  setStep("pick");
                  setFile(null);
                  setPreviewUrl(null);
                  setError("");
                  if (fileRef.current) fileRef.current.value = "";
                }}
                style={cancelBtnStyle}
              >
                Choose different
              </button>
              <button
                onClick={handleUseImage}
                style={{ ...primaryBtnStyle, flex: 1 }}
              >
                Use this image
              </button>
            </div>
          </>
        )}

        {/* ── Step: Processing ── */}
        {step === "processing" && (
          <div style={{ padding: "8px 0" }}>
            <div style={{
              borderRadius: "12px",
              overflow: "hidden",
              marginBottom: "20px",
              border: "1px solid var(--line)",
            }}>
              <img
                src={previewUrl ?? ""}
                alt="Processing"
                style={{
                  width: "100%",
                  height: "auto",
                  display: "block",
                  opacity: 0.7,
                }}
              />
            </div>
              
            {/* Progress bar */}
            <div style={{ marginBottom: "8px", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "13px", color: "var(--ink)", fontWeight: 500 }}>
                {progressLabel}
              </span>
              <span style={{ fontSize: "13px", color: "var(--muted)" }}>
                {progress}%
              </span>
            </div>
            <div style={{
              height: "6px",
              background: "var(--line)",
              borderRadius: "99px",
              overflow: "hidden",
            }}>
              <div style={{
                height: "100%",
                width: `${progress}%`,
                background: "var(--accent)",
                borderRadius: "99px",
                transition: "width 0.4s ease",
              }} />
            </div>
          </div>
        )}

        {/* ── Step: Review ── */}
        {(step === "review" || step === "saving") && (
          <>
            <p style={{ margin: "0 0 12px", fontSize: "13px", color: "var(--muted)" }}>
              Found {reviewItems.length} item{reviewItems.length !== 1 ? "s" : ""}.
              Uncheck any you don't want. You can edit names, quantities and expiry dates.
            </p>

            {/* Column headers */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "20px 1fr 64px 72px 96px 28px",
              gap: "6px",
              padding: "0 4px 6px",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.5px",
              textTransform: "uppercase",
              color: "var(--muted)",
            }}>
              <span />
              <span>Name</span>
              <span>Qty</span>
              <span>Unit</span>
              <span>Expiry</span>
              <span />
            </div>

            <ul style={{ listStyle: "none", margin: "0 0 16px", padding: 0 }}>
              {reviewItems.map((item) => (
                <li
                  key={item.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "20px 1fr 64px 72px 96px 28px",
                    gap: "6px",
                    alignItems: "center",
                    padding: "7px 4px",
                    borderBottom: "1px solid var(--line)",
                    opacity: item.selected ? 1 : 0.35,
                    transition: "opacity 0.15s",
                  }}
                >
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={item.selected}
                    onChange={() => toggleItem(item.id)}
                    style={{ width: "15px", height: "15px", cursor: "pointer" }}
                  />

                  {/* Name */}
                  <input
                    type="text"
                    value={item.rawName}
                    onChange={(e) => updateItem(item.id, "rawName", e.target.value)}
                    style={reviewInputStyle}
                  />

                  {/* Quantity */}
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, "quantity", Number(e.target.value))}
                    style={reviewInputStyle}
                  />

                  {/* Unit */}
                  <select
                    value={item.unit}
                    onChange={(e) => updateItem(item.id, "unit", e.target.value)}
                    style={reviewInputStyle}
                  >
                    {UNIT_OPTIONS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>

                  {/* Expiry date */}
                  <input
                    type="date"
                    value={item.expiryDate}
                    onChange={(e) => updateItem(item.id, "expiryDate", e.target.value)}
                    style={reviewInputStyle}
                  />

                  {/* Remove row */}
                  <button
                    onClick={() =>
                      setReviewItems((prev) => prev.filter((i) => i.id !== item.id))
                    }
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--muted)",
                      fontSize: "14px",
                      padding: "2px",
                      borderRadius: "4px",
                    }}
                    title="Remove row"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>

            {error && (
              <p style={{ color: "#b71c1c", fontSize: "13px", margin: "0 0 12px" }}>
                {error}
              </p>
            )}

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={onClose}
                disabled={step === "saving"}
                style={cancelBtnStyle}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={step === "saving" || selectedCount === 0}
                style={primaryBtnStyle}
              >
                {step === "saving"
                  ? "Saving…"
                  : `Add ${selectedCount} item${selectedCount !== 1 ? "s" : ""}`}
              </button>
            </div>
          </>
        )}

        {/* Close button — always visible except during processing */}
        {step !== "processing" && step !== "saving" && (
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              background: "none",
              border: "none",
              fontSize: "20px",
              cursor: "pointer",
              color: "var(--muted)",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const cancelBtnStyle: React.CSSProperties = {
  padding: "10px 20px",
  borderRadius: "10px",
  border: "1px solid var(--line)",
  background: "transparent",
  fontSize: "14px",
  cursor: "pointer",
  color: "var(--muted)",
};

const primaryBtnStyle: React.CSSProperties = {
  padding: "10px 24px",
  borderRadius: "10px",
  border: "none",
  background: "var(--accent)",
  color: "#fff",
  fontSize: "14px",
  fontWeight: 600,
  cursor: "pointer",
};

const reviewInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "5px 8px",
  borderRadius: "7px",
  border: "1px solid var(--line)",
  fontSize: "12px",
  fontFamily: "inherit",
  background: "#fff",
  color: "var(--ink)",
};
