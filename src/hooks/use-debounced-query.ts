
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

export function useDebouncedQuery<T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  delay: number = 300,
  enabled: boolean = true
) {
  const [debouncedEnabled, setDebouncedEnabled] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setDebouncedEnabled(false);
      return;
    }

    const timer = setTimeout(() => {
      setDebouncedEnabled(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [enabled, delay]);

  return useQuery({
    queryKey,
    queryFn,
    enabled: debouncedEnabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}
