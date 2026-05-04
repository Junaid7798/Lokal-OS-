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