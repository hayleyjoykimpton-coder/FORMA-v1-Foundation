/**
 * Sync confidence helpers — emptiness checks, friendly auth errors, password reset.
 */

import type { CloudState } from "./sync";
import { getSupabase, isSupabaseConfigured } from "./supabase";

export type SyncPhase = "idle" | "pending" | "saved" | "error";

export type SyncStatus = {
  phase: SyncPhase;
  message: string | null;
  lastSyncedAt: string | null;
  authEmail: string | null;
};

export const EMPTY_SYNC_STATUS: SyncStatus = {
  phase: "idle",
  message: null,
  lastSyncedAt: null,
  authEmail: null,
};

/** Cloud account exists but has almost no training data (typical after fresh signup). */
export function cloudLooksEmpty(cloud: CloudState): boolean {
  const mealCount = cloud.meals?.entries?.length ?? 0;
  const inbodyCount = cloud.inbody?.scans?.length ?? 0;
  return (
    cloud.history.length === 0 &&
    cloud.progress.length === 0 &&
    mealCount === 0 &&
    inbodyCount === 0 &&
    cloud.photos.length === 0
  );
}

/** This device has meaningful progress worth protecting. */
export function localLooksRich(input: {
  historyLength: number;
  progressLength: number;
  mealCount: number;
  inbodyCount: number;
  photoCount: number;
}): boolean {
  return (
    input.historyLength > 0 ||
    input.progressLength > 0 ||
    input.mealCount > 0 ||
    input.inbodyCount > 0 ||
    input.photoCount > 0
  );
}

/** Map raw Supabase auth messages into calm, actionable copy. */
export function friendlyAuthError(raw: string | null | undefined): string {
  if (!raw) return "Something went wrong — try again.";
  const lower = raw.toLowerCase();
  if (lower.includes("invalid login") || lower.includes("invalid credentials")) {
    return "That email or password doesn’t match. Try again, or reset your password.";
  }
  if (lower.includes("email not confirmed") || lower.includes("not confirmed")) {
    return "Confirm your email from the link we sent, then sign in.";
  }
  if (lower.includes("user already registered") || lower.includes("already been registered")) {
    return "An account with that email already exists — sign in instead.";
  }
  if (lower.includes("rate limit") || lower.includes("too many")) {
    return "Too many attempts — wait a minute and try again.";
  }
  if (lower.includes("network") || lower.includes("fetch") || lower.includes("failed to fetch")) {
    return "Network issue — check your connection and retry.";
  }
  if (lower.includes("password")) {
    return raw;
  }
  return raw;
}

export async function resetPassword(email: string): Promise<{ error?: string }> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured()) {
    return { error: "Cloud sync is not configured." };
  }
  const redirectTo =
    typeof window !== "undefined" ? `${window.location.origin}/` : undefined;
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    ...(redirectTo ? { redirectTo } : {}),
  });
  return error ? { error: friendlyAuthError(error.message) } : {};
}

export async function getSessionEmail(): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user.email ?? null;
}

export function formatSyncTime(iso: string | null): string {
  if (!iso) return "Not synced yet";
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "Not synced yet";
  const seconds = Math.round((Date.now() - then) / 1000);
  if (seconds < 20) return "Just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
