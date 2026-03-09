import { useEffect, useState } from "react";
import { fetchWeeklyTopics } from "../infra/community.api";
import type { WeeklyTopic } from "../model/community.types";

export function useWeeklyTopics() {
  const [topics, setTopics] = useState<WeeklyTopic[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const data = await fetchWeeklyTopics();
        // Deduplicate by date, keep first occurrence
        const seen = new Set<string>();
        const unique = data.filter(topic => {
          if (seen.has(topic.date)) return false;
          seen.add(topic.date);
          return true;
        });
        setTopics(unique);
      } catch {
        // Non-fatal — circles just show empty placeholders
      } finally {
        setLoading(false);
      }
    })();
  }, []); // runs once on mount

  return { topics, loading };
}