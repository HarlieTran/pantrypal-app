import { useState, useEffect, useCallback } from "react";
import { fetchUserSummary } from "../infra/summary.api";
import type { UserSummary } from "../infra/summary.api";

export function useSummary(token: string) {
  const [summary, setSummary] = useState<UserSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError("");
      const data = await fetchUserSummary(token);
      setSummary(data);
    } catch (e) {
      setError(String((e as Error).message || "Failed to load summary."));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  return { summary, loading, error, refresh: load };
}