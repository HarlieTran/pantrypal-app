import { useRef, useState } from "react";
import { useCreatePost } from "../application/useCreatePost";
import type { CommunityPostView, CommunityTopic } from "../infra/community.api";

type Props = {
  token: string;
  pinnedTopic?: CommunityTopic;
  onPostCreated: (post: CommunityPostView) => void;
  onCancel?: () => void;
};

export function PostComposer({ token, pinnedTopic, onPostCreated, onCancel }: Props) {
  const [caption, setCaption] = useState("");
  const [tags, setTags] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [replyToTopic, setReplyToTopic] = useState(!!pinnedTopic);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { submit, loading, error } = useCreatePost(token);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function removeImage() {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit() {
    if (!caption.trim()) return;

    const parsedTags = tags
      .split(",")
      .map((t) => t.trim().toLowerCase().replace(/^#/, ""))
      .filter(Boolean);

    const post = await submit({
      caption: caption.trim(),
      tags: parsedTags,
      topicId: replyToTopic && pinnedTopic ? pinnedTopic.topicId : undefined,
      imageFile: imageFile ?? undefined,
    });

    onPostCreated(post);
    setCaption("");
    setTags("");
    setImageFile(null);
    setImagePreview(null);
  }

  return (
    <div style={{
      borderBottom: "1px solid #f0f0f0",
      padding: "16px",
      background: "#fff",
    }}>
      {/* Topic reply toggle */}
      {pinnedTopic && (
        <button
          onClick={() => setReplyToTopic((v) => !v)}
          style={{
            marginBottom: "12px",
            fontSize: "13px",
            color: replyToTopic ? "#e53935" : "#999",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          {replyToTopic ? "✦ Replying to today's topic" : "› Reply to today's topic"}
        </button>
      )}

      {/* Caption */}
      <textarea
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder="Share something from your kitchen..."
        rows={3}
        style={{
          width: "100%",
          border: "none",
          outline: "none",
          resize: "none",
          fontSize: "15px",
          fontFamily: "inherit",
          color: "#1a1a1a",
          lineHeight: "1.5",
          boxSizing: "border-box",
        }}
      />

      {/* Image preview */}
      {imagePreview && (
        <div style={{ position: "relative", marginTop: "10px", display: "inline-block" }}>
          <img
            src={imagePreview}
            alt="preview"
            style={{
              width: "100%",
              maxHeight: "280px",
              objectFit: "cover",
              borderRadius: "12px",
            }}
          />
          <button
            onClick={removeImage}
            style={{
              position: "absolute",
              top: "8px",
              right: "8px",
              background: "rgba(0,0,0,0.5)",
              color: "#fff",
              border: "none",
              borderRadius: "50%",
              width: "28px",
              height: "28px",
              cursor: "pointer",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Tags */}
      <input
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        placeholder="Add tags — garlic, pasta, vegan"
        style={{
          marginTop: "10px",
          width: "100%",
          border: "none",
          outline: "none",
          fontSize: "13px",
          color: "#888",
          fontFamily: "inherit",
          boxSizing: "border-box",
        }}
      />

      {/* Actions row */}
      <div style={{
        marginTop: "12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {/* Image attach */}
          <label
            style={{
              cursor: "pointer",
              fontSize: "13px",
              color: "#888",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "6px 10px",
              border: "1px solid #e8e8e8",
              borderRadius: "8px",
            }}
          >
            📷 Photo
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: "none" }}
            />
          </label>

          {onCancel && (
            <button
              onClick={onCancel}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "13px",
                color: "#aaa",
              }}
            >
              Cancel
            </button>
          )}
        </div>

        {error && (
          <span style={{ fontSize: "12px", color: "#e53935" }}>{error}</span>
        )}

        {/* Post button */}
        <button
          onClick={handleSubmit}
          disabled={loading || !caption.trim()}
          style={{
            background: caption.trim() ? "#e53935" : "#f5f5f5",
            color: caption.trim() ? "#fff" : "#ccc",
            border: "none",
            borderRadius: "20px",
            padding: "8px 20px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: caption.trim() ? "pointer" : "default",
            transition: "background 0.15s",
          }}
        >
          {loading ? "Posting..." : "Post"}
        </button>
      </div>
    </div>
  );
}