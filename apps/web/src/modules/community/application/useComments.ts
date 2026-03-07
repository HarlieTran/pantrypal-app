import { useState, useCallback, useEffect } from "react";
import {
  getComments,
  addComment,
  deleteComment,
  toggleCommentLike,
  type CommunityComment,
} from "../infra/community.api";

export function useComments(postId: string, postUserId: string, token?: string, isOpen?: boolean, currentUserId?: string,) {
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newComment, setNewComment] = useState("");

  // Fetch comments — only called when user opens the section
  useEffect(() => {
    if (!isOpen) return;
    if (comments.length > 0) return; // already loaded
    setIsLoading(true);
    getComments(postId, token)
      .then((data) => setComments(data.comments))
      .finally(() => setIsLoading(false));
  }, [isOpen, postId, token]);

  const submit = useCallback(async () => {
    if (!token || !newComment.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const data = await addComment(postId, postUserId, newComment.trim(), token);
      setComments((prev) => [...prev, data.comment]);
      setNewComment("");
    } finally {
      setIsSubmitting(false);
    }
  }, [token, newComment, isSubmitting, postId, postUserId]);

  const remove = useCallback(
    async (commentId: string) => {
      if (!token) return;
      // Optimistic removal
      setComments((prev) => prev.filter((c) => c.commentId !== commentId));
      try {
        await deleteComment(postId, commentId, postUserId, token);
      } catch {
        // Revert on failure by re-fetching
        const data = await getComments(postId, token);
        setComments(data.comments);
      }
    },
    [token, postId, postUserId],
  );

  const likeComment = useCallback(
  async (commentId: string) => {
    console.log("likeComment called", { token: !!token, currentUserId });
    if (!token || !currentUserId) return;

    // Optimistic update
    setComments((prev) =>
      prev.map((c) => {
        if (c.commentId !== commentId) return c;
        const alreadyLiked = (c.likedBy ?? []).includes(currentUserId);
        const newLikedBy = alreadyLiked
          ? (c.likedBy ?? []).filter((id) => id !== currentUserId)
          : [...(c.likedBy ?? []), currentUserId];
        return {
          ...c,
          likeCount: alreadyLiked ? c.likeCount - 1 : c.likeCount + 1,
          likedBy: newLikedBy,
        };
      }),
    );

    try {
      const result = await toggleCommentLike(postId, commentId, token);
      setComments((prev) =>
        prev.map((c) => {
          if (c.commentId !== commentId) return c;
          const newLikedBy = result.liked
            ? [...(c.likedBy ?? []), currentUserId]
            : (c.likedBy ?? []).filter((id) => id !== currentUserId);
          return { ...c, likeCount: result.likeCount, likedBy: newLikedBy };
        }),
      );
    } catch {
      const data = await getComments(postId, token);
      setComments(data.comments);
    }
  },
  [token, postId, currentUserId], 
);

  // The top 2 by likeCount (already sorted by backend)
  const preview = comments.slice(0, 2);
  const visible = isExpanded ? comments : preview;
  const hiddenCount = comments.length - 2;

  return {
    comments,
    visible,
    hiddenCount,
    isOpen,
    isExpanded,
    setIsExpanded,
    isLoading,
    isSubmitting,
    newComment,
    setNewComment,
    open,
    submit,
    remove,
    likeComment,
  };
}