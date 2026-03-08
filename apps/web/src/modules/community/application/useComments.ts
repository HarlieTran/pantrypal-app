import { useState, useCallback } from "react";
import {
  getComments,
  addComment,
  deleteComment,
  toggleCommentLike,
} from "../infra/community.api";
import type { CommunityComment } from "../model/community.types";

export function useComments(postId: string, postUserId: string, token?: string, isOpen?: boolean, currentUserId?: string) {
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [hasLoaded, setHasLoaded] = useState(false);

  const load = useCallback(async () => {
    if (!isOpen || hasLoaded) return;
    setIsLoading(true);
    try {
      const data = await getComments(postId, token);
      setComments(data.comments);
      setHasLoaded(true);
    } finally {
      setIsLoading(false);
    }
  }, [isOpen, hasLoaded, postId, token]);

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
    async (commentId: string, commentUserId: string) => {
      if (!token) return;
      // Optimistic removal
      setComments((prev) => prev.filter((c) => c.commentId !== commentId));
      try {
        await deleteComment(postId, commentId, commentUserId, token);
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
      if (!token || !currentUserId) return;

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
    load,
    submit,
    remove,
    likeComment,
  };
}