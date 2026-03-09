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
    <div className="comment-section">
      {isLoading ? (
        <p className="comment-section-loading">Loading comments...</p>
      ) : (
        <>
          {visible.map((comment) => {
            const isOwner = currentUserId === comment.userId;
            const hasLiked = currentUserId
              ? (comment.likedBy ?? []).includes(currentUserId)
              : false;

            return (
              <div key={comment.commentId} className="comment-item">
                {/* Avatar */}
                <div className="comment-avatar">{comment.avatarLabel}</div>

                {/* Comment body */}
                <div className="comment-body">
                  <div className="comment-content">
                    <span className="comment-author">{comment.displayName}</span>
                    {comment.content}
                  </div>

                  {/* Actions row */}
                  <div className="comment-actions">
                    <span className="comment-date">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>

                    {/* Like button */}
                    <button
                      onClick={() => likeComment(comment.commentId)}
                      disabled={!token}
                      className={`comment-like-btn ${hasLiked ? 'is-liked' : ''}`}
                    >
                      {hasLiked ? "♥" : "♡"}
                      {comment.likeCount > 0 && <span>{comment.likeCount}</span>}
                    </button>

                    {/* Delete — own comments only */}
                    {isOwner && (
                      <button
                        onClick={() => remove(comment.commentId, comment.userId)}
                        className="comment-delete-btn"
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
            <button onClick={() => setIsExpanded(true)} className="comment-expand-btn">
              View {hiddenCount} more comment{hiddenCount !== 1 ? "s" : ""}
            </button>
          )}

          {/* Add comment input — auth only */}
          {token && (
            <div className="comment-input-wrap">
              <input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="Add a comment..."
                className="comment-input"
              />
              <button
                onClick={submit}
                disabled={isSubmitting || !newComment.trim()}
                className={`comment-submit-btn ${newComment.trim() ? 'is-active' : ''}`}
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
