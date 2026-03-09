import { useRef, useState } from "react";
import { useCreatePost } from "../application/useCreatePost";
import type { CommunityPostView, CommunityTopic } from "../model/community.types";

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
    <div className="post-composer">
      {/* Topic reply toggle */}
      {pinnedTopic && (
        <button
          onClick={() => setReplyToTopic((v) => !v)}
          className={`post-composer-topic-toggle ${replyToTopic ? 'is-active' : ''}`}
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
        className="post-composer-textarea"
      />

      {/* Image preview */}
      {imagePreview && (
        <div className="post-composer-image-preview">
          <img src={imagePreview} alt="preview" className="post-composer-image" />
          <button onClick={removeImage} className="post-composer-image-remove">✕</button>
        </div>
      )}

      {/* Tags */}
      <input
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        placeholder="Add tags — garlic, pasta, vegan"
        className="post-composer-tags-input"
      />

      {/* Actions row */}
      <div className="post-composer-actions">
        <div className="post-composer-actions-left">
          {/* Image attach */}
          <label className="post-composer-attach-label">
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
            <button onClick={onCancel} className="post-composer-cancel">Cancel</button>
          )}
        </div>

        {error && <span className="post-composer-error">{error}</span>}

        {/* Post button */}
        <button
          onClick={handleSubmit}
          disabled={loading || !caption.trim()}
          className={`post-composer-submit ${caption.trim() ? 'is-active' : ''}`}
        >
          {loading ? "Posting..." : "Post"}
        </button>
      </div>
    </div>
  );
}