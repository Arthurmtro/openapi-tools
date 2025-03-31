import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for making API requests with loading, error, and retry functionality
 * 
 * @param apiFn - The API function to call
 * @param deps - Dependencies array to control when the API call is made
 * @returns The result of the API call with loading, error, and retry functionality
 */
export function useApi<T>(
  apiFn: () => Promise<T>,
  deps: any[] = []
): {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await apiFn();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [apiFn]);

  // Refetch function to manually trigger a new API call
  const refetch = useCallback(() => {
    setRefreshCounter(count => count + 1);
  }, []);

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, refreshCounter]);

  return { data, isLoading, error, refetch };
}