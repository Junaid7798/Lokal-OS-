import { createClient } from '@supabase/supabase-js';

/**
 * Supabase client configuration.
 * Reads from environment variables OR localStorage.
 */
function getSupabaseConfig() {
  // Try environment variables first
  let url = import.meta.env.VITE_SUPABASE_URL;
  let anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  // Try localStorage as fallback
  if (!url) {
    url = localStorage.getItem('supabase_url') || undefined;
  }
  if (!anonKey) {
    anonKey = localStorage.getItem('supabase_anon_key') || undefined;
  }

  // Trim values if they exist
  if (url) url = url.trim();
  if (anonKey) anonKey = anonKey.trim();

  // Both must be present to create client
  if (url && anonKey && url.length > 0 && anonKey.length > 0) {
    return { url, anonKey };
  }

  return null;
}

const config = getSupabaseConfig();

/**
 * Supabase client instance.
 * May be null if not configured - callers must handle this.
 */
export const supabase = config 
  ? createClient(config.url, config.anonKey)
  : null;

/**
 * Check if Supabase is configured (regardless of connection status).
 */
export function isSupabaseConfigured(): boolean {
  return config !== null;
}

/**
 * Get current Supabase URL for display/debugging.
 */
export function getSupabaseUrl(): string | null {
  return config?.url ?? null;
}