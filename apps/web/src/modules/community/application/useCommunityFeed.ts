import { useEffect, useRef, useState } from "react";
import { fetchCommunityFeed } from "../infra/community.api";
import type { CommunityFeedResponse, CommunityPostView, CommunityTopic } from "../infra/community.api";

type Params = {
  token: string;     // empty string = guest
  enabled: boolean;  // false during bootstrap — prevents premature fetch
};

export function useCommunityFeed({ token, enabled }: Params) {
  const [posts, setPosts] = useState<CommunityPostView[]>([]);
  const [pinnedTopic, setPinnedTopic] = useState<CommunityTopic | undefined>(undefined);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const prevTokenRef = useRef<string>(token);

  const load = async (cursor?: string) => {
    const isLoadMore = Boolean(cursor);
    if (isLoadMore) setLoadingMore(true);
    else setLoading(true);
    setError("");

    try {
      const data: CommunityFeedResponse = await fetchCommunityFeed(
        token || undefined,
        cursor,
      );
      if (isLoadMore) {
        setPosts((prev) => [...prev, ...data.posts]);
      } else {
        setPosts(data.posts);
        setPinnedTopic(data.pinnedTopic);
      }
      setNextCursor(data.nextCursor ?? null);
    } catch (e) {
      setError(String((e as Error).message || "Failed to load feed"));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Re-fetch when auth changes (guest → authenticated) or on first load
  useEffect(() => {
    if (!enabled) return;
    const tokenChanged = prevTokenRef.current !== token;
    prevTokenRef.current = token;
    if (tokenChanged || posts.length === 0) {
      void load();
    }
  }, [enabled, token]);

  const loadMore = () => {
    if (nextCursor && !loadingMore) void load(nextCursor);
  };

  const refresh = () => void load();

  return {
    posts,
    pinnedTopic,
    nextCursor,
    loading,
    loadingMore,
    error,
    loadMore,
    refresh,
  };
}