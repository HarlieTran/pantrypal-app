import { useEffect, useState } from "react";
import { fetchWeeklyTopics } from "../infra/community.api";
import type { WeeklyTopic } from "../infra/community.api";

export function useWeeklyTopics() {
  const [topics, setTopics] = useState<WeeklyTopic[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const data = await fetchWeeklyTopics();
        setTopics(data);
      } catch {
        // Non-fatal — circles just show empty placeholders
      } finally {
        setLoading(false);
      }
    })();
  }, []); // runs once on mount

  return { topics, loading };
}