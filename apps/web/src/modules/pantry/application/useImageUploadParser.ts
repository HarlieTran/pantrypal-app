import { useState } from "react";
import { getPantryUploadUrl, parseImageForIngredients, addPantryItemsBulk } from "../infra/pantry.api";
import type { ParsedIngredient } from "../model/pantry.types";

type Step = "pick" | "preview" | "processing" | "review" | "saving";

interface ReviewItem extends ParsedIngredient {
  id: string;
  expiryDate: string;
  selected: boolean;
}

export function useImageUploadParser(token: string) {
  const [step, setStep] = useState<Step>("pick");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [error, setError] = useState("");

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

        canvas.toBlob((blob) => {
          if (!blob) reject(new Error("Could not resize image."));
          else resolve(blob);
        }, file.type || "image/jpeg", 0.9);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Could not load image."));
      };

      img.src = url;
    });

  const selectFile = (picked: File) => {
    const url = URL.createObjectURL(picked);
    setFile(picked);
    setPreviewUrl(url);
    setError("");
    setStep("preview");
  };

  const processImage = async () => {
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
      const { uploadUrl, imageKey } = await getPantryUploadUrl(token, resizedFile.name, resizedFile.type || "image/jpeg");

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
    setReviewItems((prev) => prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item)));
  };

  const updateItem = (id: string, field: keyof ReviewItem, value: string | number) => {
    setReviewItems((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const removeItem = (id: string) => {
    setReviewItems((prev) => prev.filter((i) => i.id !== id));
  };

  const reset = () => {
    setStep("pick");
    setFile(null);
    setPreviewUrl(null);
    setError("");
  };

  const submit = async () => {
    const toAdd = reviewItems.filter((i) => i.selected);
    if (toAdd.length === 0) {
      setError("Please select at least one item.");
      throw new Error("No items selected");
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
    } catch (e) {
      setError(String((e as Error).message || "Failed to save items."));
      setStep("review");
      throw e;
    }
  };

  const selectedCount = reviewItems.filter((i) => i.selected).length;

  return {
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
  };
}
