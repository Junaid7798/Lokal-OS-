import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cachedClient: SupabaseClient | null = null;
let cachedConfig: { url: string; anonKey: string } | null = null;

/** In-memory store for credentials set at runtime (avoids localStorage/sessionStorage XSS risk) */
let memoryConfig: { url: string; anonKey: string } | null = null;

function getEnvConfig() {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim();
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
  if (url && anonKey) return { url, anonKey };
  return null;
}

function buildConfig() {
  return getEnvConfig() ?? memoryConfig;
}

function createSupabaseClient(config: { url: string; anonKey: string }) {
  return createClient(config.url, config.anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
  });
}

function initClient() {
  const config = buildConfig();
  if (!config) return null;
  cachedConfig = config;
  cachedClient = createSupabaseClient(config);
  return cachedClient;
}

/**
 * Supabase client instance.
 * May be null if not configured - callers MUST handle this.
 */
export const supabase = initClient();

/**
 * Reinitialize the Supabase client (e.g. after credentials change).
 * Call this after updating stored config.
 */
export function reinitializeSupabase(): SupabaseClient | null {
  cachedClient = null;
  cachedConfig = null;
  return initClient();
}

/**
 * Check if Supabase is configured (regardless of connection status).
 */
export function isSupabaseConfigured(): boolean {
  return cachedConfig !== null || buildConfig() !== null;
}

/**
 * Get current Supabase URL for display/debugging.
 */
export function getSupabaseUrl(): string | null {
  return cachedConfig?.url ?? buildConfig()?.url ?? null;
}

/**
 * Save Supabase credentials to in-memory store and reinitialize client.
 * Credentials are NOT persisted to localStorage/sessionStorage to reduce XSS blast radius.
 */
export function saveSupabaseConfig(url: string, anonKey: string): void {
  memoryConfig = { url: url.trim(), anonKey: anonKey.trim() };
  reinitializeSupabase();
}
