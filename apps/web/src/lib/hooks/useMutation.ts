import { useState, useCallback } from 'react';

export type UseMutationState<T> = {
  data: T | null;
  loading: boolean;
  error: Error | null;
};

export type UseMutationReturn<TData, TVariables> = UseMutationState<TData> & {
  mutate: (variables: TVariables) => Promise<TData>;
  reset: () => void;
};

export function useMutation<TData, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>
): UseMutationReturn<TData, TVariables> {
  const [data, setData] = useState<TData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (variables: TVariables): Promise<TData> => {
      setLoading(true);
      setError(null);
      try {
        const result = await mutationFn(variables);
        setData(result);
        return result;
      } catch (e) {
        const err = e as Error;
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [mutationFn]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, mutate, reset };
}
