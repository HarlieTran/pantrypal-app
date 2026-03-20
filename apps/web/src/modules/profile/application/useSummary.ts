import { useState, useEffect, useCallback } from "react";
import { fetchUserSummary } from "../infra/summary.api";
import type { UserSummary } from "../infra/summary.api";

const summaryCache = new Map<string, UserSummary>();
const inFlightRequests = new Map<string, Promise<UserSummary>>();

async function fetchAndCacheSummary(token: string): Promise<UserSummary> {
  const existing = inFlightRequests.get(token);
  if (existing) return existing;

  const request = fetchUserSummary(token)
    .then((data) => {
      summaryCache.set(token, data);
      return data;
    })
    .finally(() => {
      inFlightRequests.delete(token);
    });

  inFlightRequests.set(token, request);
  return request;
}

export function getCachedSummary(token: string) {
  return summaryCache.get(token) ?? null;
}

export function invalidateSummaryCache(token?: string) {
  if (!token) {
    summaryCache.clear();
    inFlightRequests.clear();
    return;
  }

  summaryCache.delete(token);
  inFlightRequests.delete(token);
}

export async function prefetchSummary(token: string) {
  if (!token) return null;
  if (summaryCache.has(token)) return summaryCache.get(token) ?? null;
  return fetchAndCacheSummary(token);
}

export function useSummary(token: string) {
  const [summary, setSummary] = useState<UserSummary | null>(() => getCachedSummary(token));
  const [loading, setLoading] = useState(() => Boolean(token) && !getCachedSummary(token));
  const [error, setError] = useState("");

  const load = useCallback(async (force = false) => {
    if (!token) return;
    try {
      if (force) {
        invalidateSummaryCache(token);
      }

      const cached = getCachedSummary(token);
      if (cached && !force) {
        setSummary(cached);
        setLoading(false);
        setError("");
        return;
      }

      setLoading(true);
      setError("");
      const data = await fetchAndCacheSummary(token);
      setSummary(data);
    } catch (e) {
      setError(String((e as Error).message || "Failed to load summary."));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    setSummary(getCachedSummary(token));
    setLoading(Boolean(token) && !getCachedSummary(token));
    void load();
  }, [load]);

  const refresh = useCallback(async () => {
    await load(true);
  }, [load]);

  return { summary, loading, error, refresh };
}
