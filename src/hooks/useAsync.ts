import { useState, useCallback } from 'react';

/** State container for async operations */
interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

/** Options for useAsync hook */
interface UseAsyncOptions<T> {
  /** Callback invoked on successful completion */
  onSuccess?: (data: T) => void;
  /** Callback invoked on error */
  onError?: (error: Error) => void;
  /** Initial data before first execution */
  initialData?: T;
}

/**
 * Manages async operations with loading and error states.
 * Provides execute, reset, and setter methods for full control.
 * 
 * @param asyncFunction - Async function to execute
 * @param options - Configuration options
 * @returns Object with state and control methods
 * 
 * @example
 * const { data, loading, error, execute } = useAsync(fetchData);
 * <button onClick={execute} disabled={loading}>Load</button>
 */
export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  options: UseAsyncOptions<T> = {}
) {
  const [state, setState] = useState<AsyncState<T>>({
    data: options.initialData ?? null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const data = await asyncFunction();
      setState({ data, loading: false, error: null });
      options.onSuccess?.(data);
      return data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setState({ data: null, loading: false, error: err });
      options.onError?.(err);
      throw err;
    }
  }, [asyncFunction, options.onSuccess, options.onError]);

  const reset = useCallback(() => {
    setState({
      data: options.initialData ?? null,
      loading: false,
      error: null,
    });
  }, [options.initialData]);

  return {
    ...state,
    execute,
    reset,
    /** Direct setter for data without loading */
    setData: (data: T) => setState({ data, loading: false, error: null }),
    /** Direct setter for error without loading */
    setError: (error: Error) => setState({ data: null, loading: false, error }),
  };
}

/**
 * Creates a memoized async callback with state management.
 * Useful for event handlers that perform async operations.
 * 
 * @param callback - Async function to wrap
 * @param options - Configuration options
 * @returns Object with state and execute function
 * 
 * @example
 * const { execute } = useAsyncCallback(submitForm);
 * <form onSubmit={execute}>...</form>
 */
export function useAsyncCallback<T extends (...args: any[]) => Promise<any>>(
  callback: T,
  options: UseAsyncOptions<ReturnType<T>> = {}
) {
  const [state, setState] = useState<AsyncState<ReturnType<T>>>({
    data: options.initialData ?? null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args: Parameters<T>) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const data = await callback(...args);
        setState({ data, loading: false, error: null });
        options.onSuccess?.(data);
        return data;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        setState((prev) => ({ ...prev, loading: false, error: err }));
        options.onError?.(err);
        throw err;
      }
    },
    [callback, options.onSuccess, options.onError]
  );

  return { ...state, execute };
}