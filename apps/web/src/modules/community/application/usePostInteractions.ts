import { useState } from "react";
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

  async function handleLike() {
    if (!token || liking) return;
    setLiking(true);

    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((c) => c + (wasLiked ? -1 : 1));

    try {
      const result = await togglePostLike(token, postId, postUserId);
      setLiked(result.liked);
      setLikeCount(result.likeCount);
    } catch {
      setLiked(wasLiked);
      setLikeCount((c) => c + (wasLiked ? 1 : -1));
    } finally {
      setLiking(false);
    }
  }

  return { liked, likeCount, liking, handleLike };
}
