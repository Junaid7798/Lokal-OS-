import { toast } from 'sonner';

export interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  onRetry?: (attempt: number, error: Error) => void;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export interface ErrorContext {
  component?: string;
  action?: string;
  userMessage?: string;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  retryDelay: 1000,
  onRetry: () => {},
  onSuccess: () => {},
  onError: () => {},
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      const result = await fn();
      if (attempt > 0) {
        opts.onSuccess();
      }
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < opts.maxRetries) {
        opts.onRetry(attempt + 1, lastError);
        await sleep(opts.retryDelay * (attempt + 1));
      }
    }
  }

  opts.onError(lastError!);
  throw lastError!;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function handleApiError(error: unknown, context?: ErrorContext): void {
  const message = context?.userMessage || 'An unexpected error occurred';

  console.error(
    `[Error] ${context?.component || 'Unknown'}:${context?.action || 'unknown'}`,
    error
  );

  if (error instanceof Error) {
    if (error.message.includes('network') || error.message.includes('fetch')) {
      toast.error('Network error. Please check your connection.');
    } else if (error.message.includes('timeout')) {
      toast.error('Request timed out. Please try again.');
    } else if (error.message.includes('unauthorized')) {
      toast.error('Session expired. Please log in again.');
    } else {
      toast.error(message);
    }
  } else {
    toast.error(message);
  }
}

export function showSuccessMessage(message: string): void {
  toast.success(message);
}

export function showErrorMessage(message: string): void {
  toast.error(message);
}

export function showWarningMessage(message: string): void {
  toast.warning(message);
}

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public context?: ErrorContext
  ) {
    super(message);
    this.name = 'AppError';
  }

  get userMessage(): string {
    return this.context?.userMessage || this.message;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function formatErrorForUser(error: unknown): string {
  if (error instanceof AppError) {
    return error.userMessage || error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
  retry: () => void;
}

export function useLoadingState(): LoadingState {
  return {
    isLoading: false,
    error: null,
    retry: () => {},
  };
}
