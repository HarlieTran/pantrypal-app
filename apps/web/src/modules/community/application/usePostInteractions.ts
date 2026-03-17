import { useState, useEffect, useRef } from "react";
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

  // Track whether the user has interacted with this post.
  // Once they have, we own the like state and stop syncing from props —
  // this prevents a feed refresh from overwriting the confirmed like state.
  const hasInteracted = useRef(false);

  useEffect(() => {
    // Only sync from props if the user has never clicked like on this post,
    // AND we're not currently mid-flight. This handles the case where the
    // feed loads fresh data (e.g. auth change) and we need to reflect the
    // server's isLikedByCurrentUser value.
    if (!hasInteracted.current && !liking) {
      setLiked(initialLiked);
      setLikeCount(initialLikeCount);
    }
  }, [initialLiked, initialLikeCount]);
  // Note: liking intentionally not in deps — we only want this to fire
  // when the server sends new prop values, not on every liking toggle.

  async function handleLike() {
    if (!token || liking) return;

    // Mark as interacted — from this point on, props no longer override state
    hasInteracted.current = true;
    setLiking(true);

    const wasLiked = liked;
    const wasCount = likeCount;

    // Optimistic update
    setLiked(!wasLiked);
    setLikeCount(wasCount + (wasLiked ? -1 : 1));

    try {
      const result = await togglePostLike(token, postId, postUserId);
      // Apply confirmed server state
      setLiked(result.liked);
      setLikeCount(result.likeCount);
    } catch {
      // Revert to pre-click snapshot on failure
      setLiked(wasLiked);
      setLikeCount(wasCount);
    } finally {
      setLiking(false);
    }
  }

  return { liked, likeCount, liking, handleLike };
}