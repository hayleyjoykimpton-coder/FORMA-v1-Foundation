/**
 * Temporary Life & Soul · Cracker Challenge mode inside FORMA.
 * Same localStorage + Supabase — no separate database.
 *
 * Seasonal lock: while CRACKER_SEASON_ACTIVE is true, FORMA programmes are
 * disabled — only Christmas Cracker workouts are generated and shown.
 */

import type { BrandMode } from "./brand";

const KEY = "forma-challenge-mode-v1";

/** Flip to false after the Christmas Cracker season to restore FORMA programmes. */
export const CRACKER_SEASON_ACTIVE = true;

export const CRACKER_WEEKS = 6;

export function loadChallengeMode(): BrandMode {
  if (CRACKER_SEASON_ACTIVE) return "cracker";
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
    // Seasonal lock: keep storage on cracker so a stale "forma" preference cannot reopen FORMA programmes.
    if (CRACKER_SEASON_ACTIVE) {
      window.localStorage.setItem(KEY, "cracker");
      return;
    }
    if (mode === "forma") window.localStorage.removeItem(KEY);
    else window.localStorage.setItem(KEY, mode);
  } catch {
    /* ignore */
  }
}

/** Clamp to Cracker weeks 1–6. */
export function crackerWeek(week: number): number {
  const n = Math.max(1, Math.floor(week) || 1);
  return Math.min(n, CRACKER_WEEKS);
}

/** Display week number capped for Cracker (1–6). */
export function challengeWeekLabel(weekInCycle: number, mode: BrandMode): string {
  if (mode !== "cracker") return `Week ${weekInCycle}`;
  const week = crackerWeek(weekInCycle);
  return `Week ${week} of ${CRACKER_WEEKS}`;
}

/** Advance within the 6-week Cracker block (rolls to week 1 after 6). */
export function nextCrackerWeek(week: number): { week: number; rolled: boolean } {
  const current = crackerWeek(week);
  if (current >= CRACKER_WEEKS) return { week: 1, rolled: true };
  return { week: current + 1, rolled: false };
}

export function isCrackerFitnessTestWeek(week: number): boolean {
  const w = crackerWeek(week);
  return w === 1 || w === 6;
}
