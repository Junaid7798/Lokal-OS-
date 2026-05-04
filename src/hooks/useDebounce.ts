import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Debounces a value, delaying updates until after the specified delay.
 * Useful for search inputs to prevent excessive API calls.
 * 
 * @param value - Value to debounce
 * @param delay - Milliseconds to wait before updating (default: 300)
 * @returns Debounced value that updates after delay
 * 
 * @example
 * const debouncedSearch = useDebounce(searchTerm, 500);
 * useEffect(() => { searchApi(debouncedSearch) }, [debouncedSearch]);
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
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

/**
 * Creates a debounced version of a callback function.
 * Delays execution until after the specified delay from last call.
 * 
 * @param callback - Function to debounce
 * @param delay - Milliseconds to wait (default: 300)
 * @returns Debounced callback function
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number = 300
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  ) as T;

  return debouncedCallback;
}

/**
 * Throttles a value, updating at most once per interval.
 * Unlike debounce, throttle ensures regular updates.
 * 
 * @param value - Value to throttle
 * @param interval - Minimum milliseconds between updates (default: 300)
 * @returns Throttled value
 */
export function useThrottle<T>(value: T, interval: number = 300): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastUpdated = useRef<number>(Date.now());

  useEffect(() => {
    const now = Date.now();
    if (now - lastUpdated.current >= interval) {
      lastUpdated.current = now;
      setThrottledValue(value);
    } else {
      const timer = setTimeout(
        () => {
          lastUpdated.current = Date.now();
          setThrottledValue(value);
        },
        interval - (now - lastUpdated.current)
      );
      return () => clearTimeout(timer);
    }
  }, [value, interval]);

  return throttledValue;
}

/**
 * Detects when an element enters the viewport using Intersection Observer.
 * 
 * @param callback - Function to call when element enters viewport
 * @param options - IntersectionObserver options
 * @returns Ref to attach to target element
 * 
 * @example
 * const ref = useIntersectionObserver(() => loadMore());
 * return <div ref={ref}>Content</div>;
 */
export function useIntersectionObserver(
  callback: () => void,
  options: IntersectionObserverInit = { root: null, threshold: 0.1 }
) {
  const targetRef = useRef<HTMLElement | null>(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            callbackRef.current();
          }
        });
      },
      options
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [options]);

  return targetRef;
}

/**
 * Syncs state with localStorage, persisting across sessions.
 * 
 * @param key - localStorage key
 * @param initialValue - Default value if key doesn't exist
 * @returns [stored value, setter function]
 * 
 * @example
 * const [theme, setTheme] = useLocalStorage('theme', 'dark');
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue];
}

/**
 * Returns the previous value of a state during render.
 * Useful for detecting value changes.
 * 
 * @param value - Current value
 * @returns Previous value (undefined on first render)
 * 
 * @example
 * const [count, setCount] = useState(0);
 * const prevCount = usePrevious(count);
 * // count=1, prevCount=0 on first update
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>(undefined);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}

/**
 * Detects clicks outside specified elements.
 * Useful for closing dropdowns, modals on outside click.
 * 
 * @param callback - Function to call on outside click
 * @param refs - References to check against
 * 
 * @example
 * useClickOutside(() => setOpen(false), [menuRef, buttonRef]);
 */
export function useClickOutside(
  callback: () => void,
  refs: React.RefObject<HTMLElement>[]
) {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const isOutside = refs.every(
        (ref) => ref.current && !ref.current.contains(event.target as Node)
      );
      if (isOutside) {
        callback();
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [callback, refs]);
}

/**
 * Returns current window dimensions.
 * Updates on window resize.
 * 
 * @returns Object with width and height
 */
export function useWindowSize() {
  const [size, setSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}

/**
 * Matches a media query, updating on change.
 * 
 * @param query - Media query string
 * @returns true if query matches
 * 
 * @example
 * const isDark = useMediaQuery('(prefers-color-scheme: dark)');
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => setMatches(event.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

/**
 * Returns true if viewport width is mobile size.
 * 
 * @param breakpoint - Max width in pixels (default: 768)
 * @returns true if mobile width
 */
export function useIsMobile(breakpoint: number = 768): boolean {
  return useMediaQuery(`(max-width: ${breakpoint - 1}px)`);
}

/**
 * Returns true if viewport width is tablet size.
 * 
 * @param breakpoint - Max width in pixels (default: 1024)
 * @returns true if tablet width
 */
export function useIsTablet(breakpoint: number = 1024): boolean {
  return useMediaQuery(`(max-width: ${breakpoint - 1}px)`);
}

/**
 * Memoizes async factory function with loading and error states.
 * 
 * @param factory - Async function returning T
 * @param deps - Dependencies that trigger re-fetch
 * @param initialValue - Initial value before loading
 * @returns Object with value, loading, error, reload
 */
export function useAsyncMemo<T>(
  factory: () => Promise<T>,
  deps: React.DependencyList,
  initialValue?: T
): {
  value: T | typeof initialValue;
  loading: boolean;
  error: Error | null;
  reload: () => void;
} {
  const [value, setValue] = useState<T | typeof initialValue>(initialValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    factory()
      .then((result) => {
        if (!cancelled) {
          setValue(result);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [...deps, reloadCount]);

  const reload = useCallback(() => setReloadCount((c) => c + 1), []);

  return { value, loading, error, reload };
}

/**
 * Provides pagination controls for an array.
 * 
 * @param items - Array to paginate
 * @param pageSize - Items per page (default: 20)
 * @returns Object with currentPage, paginatedItems, navigation
 */
export function usePagination<T>(
  items: T[],
  pageSize: number = 20
): {
  currentPage: number;
  totalPages: number;
  paginatedItems: T[];
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;
  hasNext: boolean;
  hasPrev: boolean;
} {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(items.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedItems = items.slice(startIndex, startIndex + pageSize);

  const nextPage = useCallback(() => {
    setCurrentPage((p) => Math.min(p + 1, totalPages));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setCurrentPage((p) => Math.max(p - 1, 1));
  }, []);

  const goToPage = useCallback(
    (page: number) => {
      setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    },
    [totalPages]
  );

  return {
    currentPage,
    totalPages,
    paginatedItems,
    nextPage,
    prevPage,
    goToPage,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
  };
}