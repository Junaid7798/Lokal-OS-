import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function that merges classNames using tailwind-merge.
 * Handles conflicting Tailwind classes by preferring the last one.
 *
 * @param inputs - ClassValue arguments (strings, arrays, objects)
 * @returns Merged className string
 *
 * @example
 * cn('px-4 py-2', 'px-2') // returns 'px-2 py-2'
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Recharts tooltip style configurations for consistent charting.
 */
export const chartTooltipStyles = {
  /** Custom content class for tooltip container */
  contentClassName: 'rounded-lg border-none shadow-lg bg-background',
  /** Fill color for bar chart cursor */
  barCursor: { fill: 'rgba(var(--primary), 0.05)' },
  /** Stroke color for line chart cursor */
  lineCursor: { stroke: 'rgba(0,0,0,0.05)', strokeWidth: 2 },
};

/**
 * Safely parse a date string or value, returning null if invalid.
 * Prevents Invalid Date objects from propagating through the app.
 *
 * @param value - A date string, Date object, or unknown value
 * @returns A valid Date, or null if parsing fails
 */
export function safeDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === 'number') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/**
 * Format a date value safely. Returns a fallback string if the date is invalid.
 *
 * @param value - Date input
 * @param formatFn - Formatter function (e.g. from date-fns)
 * @param fallback - String to return if date is invalid
 * @returns Formatted date string or fallback
 */
export function formatSafe(
  value: unknown,
  formatFn: (date: Date) => string,
  fallback = '—'
): string {
  const d = safeDate(value);
  return d ? formatFn(d) : fallback;
}

/**
 * Generate a cryptographically safe unique ID when available,
 * falling back to a timestamp + random string.
 */
export function generateSafeId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Create an index Map from an array by a key extractor.
 * Useful for optimizing O(n×m) lookups to O(1).
 */
export function indexBy<T, K extends string | number>(
  array: T[],
  keyFn: (item: T) => K
): Map<K, T> {
  const map = new Map<K, T>();
  for (const item of array) {
    map.set(keyFn(item), item);
  }
  return map;
}

/**
 * Group an array by a key extractor.
 */
export function groupBy<T, K extends string | number>(
  array: T[],
  keyFn: (item: T) => K
): Map<K, T[]> {
  const map = new Map<K, T[]>();
  for (const item of array) {
    const key = keyFn(item);
    const existing = map.get(key);
    if (existing) {
      existing.push(item);
    } else {
      map.set(key, [item]);
    }
  }
  return map;
}
