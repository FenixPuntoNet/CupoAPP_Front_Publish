import { useState, useCallback, useRef, useEffect } from 'react';

// 🚀 Estados globales de loading para evitar múltiples spinners
const globalLoadingStates = new Map<string, boolean>();
const loadingSubscribers = new Map<string, Set<() => void>>();

// 🚀 Hook optimizado para estados de loading
export function useSmartLoading(key?: string) {
  const [localLoading, setLocalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController>();
  
  // Si se proporciona una key, usar loading global
  const globalKey = key;
  const isGlobalLoading = globalKey ? (globalLoadingStates.get(globalKey) ?? false) : false;
  const loading = globalKey ? isGlobalLoading : localLoading;

  // Subscribirse a cambios de loading global
  useEffect(() => {
    if (!globalKey) return;

    const updateState = () => {
      // Force re-render cuando cambie el estado global
    };

    if (!loadingSubscribers.has(globalKey)) {
      loadingSubscribers.set(globalKey, new Set());
    }
    loadingSubscribers.get(globalKey)!.add(updateState);

    return () => {
      loadingSubscribers.get(globalKey)?.delete(updateState);
    };
  }, [globalKey]);

  const setLoading = useCallback((newLoading: boolean) => {
    if (globalKey) {
      globalLoadingStates.set(globalKey, newLoading);
      // Notificar a todos los suscriptores
      loadingSubscribers.get(globalKey)?.forEach(callback => callback());
    } else {
      setLocalLoading(newLoading);
    }
  }, [globalKey]);

  const executeWithLoading = useCallback(async <T>(
    asyncFunction: (signal?: AbortSignal) => Promise<T>,
    options: {
      onSuccess?: (result: T) => void;
      onError?: (error: Error) => void;
      timeout?: number;
    } = {}
  ): Promise<T | null> => {
    // Abortar request anterior si existe
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    const { timeout = 15000 } = options;
    
    setLoading(true);
    setError(null);

    try {
      // Race entre la función y el timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), timeout);
      });

      const result = await Promise.race([
        asyncFunction(abortControllerRef.current.signal),
        timeoutPromise
      ]);

      options.onSuccess?.(result);
      return result;
    } catch (err) {
      if (abortControllerRef.current.signal.aborted) {
        return null; // Request cancelado, no mostrar error
      }

      const error = err instanceof Error ? err : new Error('Error desconocido');
      setError(error.message);
      options.onError?.(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [setLoading]);

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    setLoading(false);
  }, [setLoading]);

  const reset = useCallback(() => {
    setError(null);
    setLoading(false);
  }, [setLoading]);

  return {
    loading,
    error,
    setLoading,
    setError,
    executeWithLoading,
    cancel,
    reset
  };
}

// 🚀 Hook para debounce de búsquedas
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// 🚀 Hook para requests optimizados con cache
export function useOptimizedFetch<T>(
  fetcher: () => Promise<T>,
  dependencies: any[] = [],
  options: {
    cacheKey?: string;
    immediate?: boolean;
    retryCount?: number;
  } = {}
) {
  const {
    cacheKey,
    immediate = true,
    retryCount = 2
  } = options;

  const { loading, error, executeWithLoading, reset } = useSmartLoading(cacheKey);
  const [data, setData] = useState<T | null>(null);
  const retryAttemptRef = useRef(0);

  const fetchData = useCallback(async () => {
    retryAttemptRef.current = 0;
    
    const fetchWithRetry = async (): Promise<T> => {
      try {
        return await fetcher();
      } catch (error) {
        if (retryAttemptRef.current < retryCount) {
          retryAttemptRef.current++;
          // Delay exponencial: 1s, 2s, 4s...
          const delay = Math.pow(2, retryAttemptRef.current - 1) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          return fetchWithRetry();
        }
        throw error;
      }
    };

    return executeWithLoading(fetchWithRetry, {
      onSuccess: (result) => setData(result)
    });
  }, [fetcher, executeWithLoading, retryCount]);

  useEffect(() => {
    if (immediate) {
      fetchData();
    }
  }, dependencies);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch,
    reset
  };
}

// 🚀 Hook para gestión de múltiples loading states
export function useMultiLoading() {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const setLoading = useCallback((key: string, loading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: loading
    }));
  }, []);

  const isLoading = useCallback((key: string) => {
    return loadingStates[key] ?? false;
  }, [loadingStates]);

  const isAnyLoading = useCallback(() => {
    return Object.values(loadingStates).some(Boolean);
  }, [loadingStates]);

  const resetAll = useCallback(() => {
    setLoadingStates({});
  }, []);

  return {
    setLoading,
    isLoading,
    isAnyLoading,
    resetAll,
    loadingStates
  };
}
