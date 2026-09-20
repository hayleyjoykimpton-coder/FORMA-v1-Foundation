/**
 * Browser Supabase client.
 * Prefers NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (new Supabase keys),
 * falls back to NEXT_PUBLIC_SUPABASE_ANON_KEY (legacy JWT anon key).
 *
 * Staging / production expects:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY  (or NEXT_PUBLIC_SUPABASE_ANON_KEY)
 *
 * Never hardcode secrets. Never expose service_role in the browser.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function getSupabaseUrl(): string | undefined {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  return url || undefined;
}

export function getSupabaseKey(): string | undefined {
  const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return publishable || anon || undefined;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseKey());
}

/** Dev/staging diagnostics — never returns secret values. */
export function supabaseConfigDiagnostics(): {
  configured: boolean;
  hasUrl: boolean;
  hasPublishableKey: boolean;
  hasAnonKey: boolean;
  missing: string[];
} {
  const hasUrl = Boolean(getSupabaseUrl());
  const hasPublishableKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim());
  const hasAnonKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim());
  const missing: string[] = [];
  if (!hasUrl) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!hasPublishableKey && !hasAnonKey) {
    missing.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)");
  }
  return {
    configured: isSupabaseConfigured(),
    hasUrl,
    hasPublishableKey,
    hasAnonKey,
    missing,
  };
}

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (client) return client;
  client = createClient(getSupabaseUrl()!, getSupabaseKey()!, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return client;
}
