import { useState, useEffect } from "react";
import { togglePostLike } from "../infra/community.api";

export function usePostInteractions(
  postId: string,
  postUserId: string,
  initialLiked: boolean,
  initialLikeCount: number,
  token?: string,
) {
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [liking, setLiking] = useState(false);

  useEffect(() => {
    if (!liking) {
      setLiked(initialLiked);
      setLikeCount(initialLikeCount);
    }
  }, [initialLiked, initialLikeCount]);

  async function handleLike() {
    if (!token || liking) return;
    setLiking(true);

    const wasLiked = liked;
    const wasCount = likeCount;

    // Optimistic update
    setLiked(!wasLiked);
    setLikeCount(wasCount + (wasLiked ? -1 : 1));

    try {
      const result = await togglePostLike(token, postId, postUserId);
      setLiked(result.liked);
      setLikeCount(result.likeCount);
    } catch {
      // Revert to pre-click state
      setLiked(wasLiked);
      setLikeCount(wasCount);
    } finally {
      setLiking(false);
    }
  }

  return { liked, likeCount, liking, handleLike };
}
