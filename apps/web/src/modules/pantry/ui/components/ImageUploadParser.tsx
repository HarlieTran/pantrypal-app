import { useRef } from "react";
import { useImageUploadParser } from "../../application/useImageUploadParser";
import { UNIT_OPTIONS } from "../../model/pantry.types";

interface Props {
  token: string;
  onComplete: () => Promise<void>;
  onClose: () => void;
}

export function ImageUploadParser({ token, onComplete, onClose }: Props) {
  const {
    step,
    file,
    previewUrl,
    progress,
    progressLabel,
    reviewItems,
    error,
    selectedCount,
    selectFile,
    processImage,
    toggleItem,
    updateItem,
    removeItem,
    reset,
    submit,
  } = useImageUploadParser(token);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (picked) selectFile(picked);
  };

  const handleConfirm = async () => {
    try {
      await submit();
      await onComplete();
      onClose();
    } catch {
      // Error already set in hook
    }
  };

  const handleReset = () => {
    reset();
    if (fileRef.current) fileRef.current.value = "";
  };

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
                onClick={handleReset}
              >
                Choose different
              </button>
              <button className="btn-primary" onClick={processImage}>Use this image</button>
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
                    onClick={() => removeItem(item.id)}
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

