/**
 * Temporary Life & Soul · Cracker Challenge mode inside FORMA.
 * Same localStorage + Supabase — no separate database.
 */

import type { BrandMode } from "./brand";

const KEY = "forma-challenge-mode-v1";

export const CRACKER_WEEKS = 6;

export function loadChallengeMode(): BrandMode {
  if (typeof window === "undefined") return "forma";
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw === "cracker" ? "cracker" : "forma";
  } catch {
    return "forma";
  }
}

export function saveChallengeMode(mode: BrandMode): void {
  if (typeof window === "undefined") return;
  try {
    if (mode === "forma") window.localStorage.removeItem(KEY);
    else window.localStorage.setItem(KEY, mode);
  } catch {
    /* ignore */
  }
}

/** Display week number capped for Cracker (1–6). */
export function challengeWeekLabel(weekInCycle: number, mode: BrandMode): string {
  if (mode !== "cracker") return `Week ${weekInCycle}`;
  const week = Math.min(Math.max(1, weekInCycle), CRACKER_WEEKS);
  return `Week ${week} of ${CRACKER_WEEKS}`;
}
