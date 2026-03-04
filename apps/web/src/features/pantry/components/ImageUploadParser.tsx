import { useState, useRef } from "react";
import { getPantryUploadUrl, parseImageForIngredients, addPantryItemsBulk } from "../api/pantry.api";
import { UNIT_OPTIONS } from "../model/types";
import type { ParsedIngredient } from "../model/types";

interface Props {
  token: string;
  onComplete: () => Promise<void>;
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (!picked) return;

    const url = URL.createObjectURL(picked);
    setFile(picked);
    setPreviewUrl(url);
    setError("");
    setStep("preview");
  };

  const handleUseImage = async () => {
    if (!file) return;
    setStep("processing");
    setError("");

    try {
      setProgress(10);
      setProgressLabel("Resizing image...");
      const resized = await resizeImage(file);
      const resizedFile = new File([resized], file.name, { type: file.type });

      setProgress(25);
      setProgressLabel("Preparing upload...");
      const { uploadUrl, imageKey } = await getPantryUploadUrl(
        token,
        resizedFile.name,
        resizedFile.type || "image/jpeg",
      );

      setProgress(50);
      setProgressLabel("Uploading image...");
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": resizedFile.type || "image/jpeg" },
        body: resized,
      });

      if (!uploadRes.ok) throw new Error("Image upload to S3 failed.");

      setProgress(75);
      setProgressLabel("Analyzing ingredients...");
      const ingredients = await parseImageForIngredients(token, imageKey);

      if (ingredients.length === 0) {
        setError("No ingredients found. Try a clearer photo.");
        setStep("preview");
        setProgress(0);
        return;
      }

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

  const toggleItem = (id: string) => {
    setReviewItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item)),
    );
  };

  const updateItem = (id: string, field: keyof ReviewItem, value: string | number) => {
    setReviewItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
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
      await onComplete();
      onClose();
    } catch (e) {
      setError(String((e as Error).message || "Failed to save items."));
      setStep("review");
    }
  };

  const selectedCount = reviewItems.filter((i) => i.selected).length;

  return (
    <div onClick={onClose} className="ig-modal-backdrop">
      <div onClick={(e) => e.stopPropagation()} className="ig-modal-card ig-upload-modal">
        {(step !== "processing" && step !== "saving") ? (
          <button className="ig-modal-close" onClick={onClose} aria-label="Close upload parser">x</button>
        ) : null}

        <h2 className="ig-modal-title">Scan Image</h2>
        <p className="ig-modal-subtitle">Upload a receipt, ingredient photo, or spice rack.</p>

        {step === "pick" ? (
          <>
            <div className="ig-upload-drop" onClick={() => fileRef.current?.click()}>
              <div className="ig-upload-icon">+</div>
              <p className="ig-upload-title">Click to choose a photo</p>
              <p className="ig-upload-help">JPG, PNG, WEBP up to 10MB</p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="ig-hidden-input"
              onChange={handleFileChange}
            />
          </>
        ) : null}

        {(step === "preview" && previewUrl) ? (
          <>
            <div className="ig-upload-preview-wrap">
              <img src={previewUrl} alt="Preview" className="ig-upload-preview" />
            </div>

            <p className="ig-upload-filename">{file?.name}</p>
            {error ? <p className="ig-error-note">{error}</p> : null}

            <div className="ig-modal-actions">
              <button
                className="btn-primary"
                onClick={() => {
                  setStep("pick");
                  setFile(null);
                  setPreviewUrl(null);
                  setError("");
                  if (fileRef.current) fileRef.current.value = "";
                }}
              >
                Choose different
              </button>
              <button className="btn-primary" onClick={handleUseImage}>Use this image</button>
            </div>
          </>
        ) : null}

        {step === "processing" ? (
          <div className="ig-upload-processing">
            <div className="ig-upload-preview-wrap">
              <img src={previewUrl ?? ""} alt="Processing" className="ig-upload-preview is-processing" />
            </div>

            <div className="ig-upload-progress-head">
              <span>{progressLabel}</span>
              <span>{progress}%</span>
            </div>
            <div className="ig-upload-progress-track">
              <div className="ig-upload-progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        ) : null}

        {(step === "review" || step === "saving") ? (
          <>
            <p className="ig-upload-review-note">
              Found {reviewItems.length} item{reviewItems.length !== 1 ? "s" : ""}. Uncheck any you do not want.
            </p>

            <div className="ig-upload-review-head">
              <span />
              <span>Name</span>
              <span>Qty</span>
              <span>Unit</span>
              <span>Expiry</span>
              <span />
            </div>

            <ul className="ig-upload-review-list">
              {reviewItems.map((item) => (
                <li key={item.id} className={`ig-upload-review-row${item.selected ? "" : " is-muted"}`}>
                  <input type="checkbox" checked={item.selected} onChange={() => toggleItem(item.id)} />
                  <input type="text" value={item.rawName} onChange={(e) => updateItem(item.id, "rawName", e.target.value)} />
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, "quantity", Number(e.target.value))}
                  />
                  <select value={item.unit} onChange={(e) => updateItem(item.id, "unit", e.target.value)}>
                    {UNIT_OPTIONS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={item.expiryDate}
                    onChange={(e) => updateItem(item.id, "expiryDate", e.target.value)}
                  />
                  <button
                    className="ig-row-remove"
                    onClick={() => setReviewItems((prev) => prev.filter((i) => i.id !== item.id))}
                    title="Remove row"
                  >
                    x
                  </button>
                </li>
              ))}
            </ul>

            {error ? <p className="ig-error-note">{error}</p> : null}

            <div className="ig-modal-actions">
              <button className="btn-primary" onClick={onClose} disabled={step === "saving"}>Cancel</button>
              <button className="btn-primary" onClick={handleConfirm} disabled={step === "saving" || selectedCount === 0}>
                {step === "saving" ? "Saving..." : `Add ${selectedCount} item${selectedCount !== 1 ? "s" : ""}`}
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

