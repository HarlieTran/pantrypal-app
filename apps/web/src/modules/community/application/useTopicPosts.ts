import { useEffect, useState } from "react";
import { fetchTopicPosts } from "../infra/community.api";
import type { CommunityPostView } from "../model/community.types";

type Params = {
  topicId: string | null;
  token?: string;
};

export function useTopicPosts({ topicId, token }: Params) {
  const [posts, setPosts] = useState<CommunityPostView[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!topicId) {
      setPosts([]);
      setLoading(false);
      setError("");
      return;
    }

    let cancelled = false;

    void (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await fetchTopicPosts(topicId, token);
        if (!cancelled) {
          setPosts(data);
        }
      } catch (e) {
        if (!cancelled) {
          setPosts([]);
          setError(String((e as Error).message || "Failed to load topic posts"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [topicId, token]);

  return { posts, loading, error };
}
