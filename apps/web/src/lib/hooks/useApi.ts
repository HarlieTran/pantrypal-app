import { useState, useCallback, useEffect } from 'react';

export type UseApiState<T> = {
  data: T | null;
  loading: boolean;
  error: Error | null;
};

export type UseApiReturn<T> = UseApiState<T> & {
  execute: () => Promise<void>;
  reset: () => void;
};

export function useApi<T>(
  fetcher: () => Promise<T>,
  options: { immediate?: boolean } = {}
): UseApiReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      setData(result);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, [fetcher]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (options.immediate) {
      execute();
    }
  }, [execute, options.immediate]);

  return { data, loading, error, execute, reset };
}
