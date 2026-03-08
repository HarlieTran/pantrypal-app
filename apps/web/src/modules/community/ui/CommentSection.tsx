import { useEffect } from "react";
import { useComments } from "../application/useComments";

interface Props {
  postId: string;
  postUserId: string;
  token?: string;
  currentUserId?: string;
  isOpen: boolean;
  onToggle: () => void;
  onCountChange?: (count: number) => void;
  // We let the parent control open/toggle so the 💬 button in PostCard can trigger it
}

export function CommentSection({
  postId,
  postUserId,
  token,
  currentUserId,
  isOpen,
  onToggle,
  onCountChange,
}: Props) {
  const {
    comments,
    isExpanded,
    setIsExpanded,
    isLoading,
    isSubmitting,
    newComment,
    setNewComment,
    load,
    submit,
    remove,
    likeComment,
  } = useComments(postId, postUserId, token, isOpen, currentUserId);

  useEffect(() => {
    if (isOpen) load();
  }, [isOpen, load]);

  useEffect(() => {
    onCountChange?.(comments.length);
  }, [comments.length, onCountChange]);

  const preview = comments.slice(0, 2);
  const visible = isExpanded ? comments : preview;
  const hiddenCount = comments.length - 2;

  if (!isOpen) return null;

  return (
    <div style={{ paddingLeft: 52, paddingBottom: 12 }}>
      {isLoading ? (
        <p style={{ fontSize: 13, color: "#999" }}>Loading comments...</p>
      ) : (
        <>
          {visible.map((comment) => {
            const isOwner = currentUserId === comment.userId;
            const hasLiked = currentUserId
              ? (comment.likedBy ?? []).includes(currentUserId)
              : false;

            return (
              <div
                key={comment.commentId}
                style={{
                  display: "flex",
                  gap: 8,
                  marginBottom: 10,
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "#e0e0e0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#555",
                    flexShrink: 0,
                  }}
                >
                  {comment.avatarLabel}
                </div>

                {/* Comment body */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, lineHeight: 1.4 }}>
                    <span style={{ fontWeight: 600, marginRight: 6 }}>
                      {comment.displayName}
                    </span>
                    {comment.content}
                  </div>

                  {/* Actions row */}
                  <div
                    style={{
                      display: "flex",
                      gap: 12,
                      marginTop: 4,
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontSize: 11, color: "#999" }}>
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>

                    {/* Like button */}
                    <button
                      onClick={() => likeComment(comment.commentId)}
                      disabled={!token}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: token ? "pointer" : "default",
                        padding: 0,
                        fontSize: 12,
                        color: hasLiked ? "#e0245e" : "#999",
                        display: "flex",
                        alignItems: "center",
                        gap: 3,
                      }}
                    >
                      
                      {hasLiked ? "♥" : "♡"}
                      {comment.likeCount > 0 && (
                        <span>{comment.likeCount}</span>
                      )}
                    </button>

                    {/* Delete — own comments only */}
                    {isOwner && (
                      <button
                        onClick={() => remove(comment.commentId, comment.userId)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 0,
                          fontSize: 12,
                          color: "#999",
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Expand / collapse */}
          {!isExpanded && hiddenCount > 0 && (
            <button
              onClick={() => setIsExpanded(true)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                color: "#999",
                padding: "4px 0",
              }}
            >
              View {hiddenCount} more comment{hiddenCount !== 1 ? "s" : ""}
            </button>
          )}

          {/* Add comment input — auth only */}
          {token && (
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="Add a comment..."
                style={{
                  flex: 1,
                  border: "none",
                  borderBottom: "1px solid #efefef",
                  outline: "none",
                  fontSize: 13,
                  padding: "4px 0",
                  background: "transparent",
                }}
              />
              <button
                onClick={submit}
                disabled={isSubmitting || !newComment.trim()}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  color: newComment.trim() ? "#0095f6" : "#b2dffc",
                  fontWeight: 600,
                  padding: 0,
                }}
              >
                {isSubmitting ? "..." : "Post"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
