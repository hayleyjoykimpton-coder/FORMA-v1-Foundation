/**
 * Temporary Life & Soul · Cracker Challenge mode inside FORMA.
 * Same localStorage + Supabase — no separate database.
 *
 * Seasonal lock: while CRACKER_SEASON_ACTIVE is true, FORMA programmes are
 * disabled — only Christmas Cracker workouts are generated and shown.
 */

import type { BrandMode } from "./brand";
import { CRACKER_SEASON_WINDOW_LABEL } from "./challengeDates";

export {
  CRACKER_CHALLENGE_MILESTONES,
  CRACKER_SEASON_WINDOW_LABEL as CRACKER_DATES_LABEL,
} from "./challengeDates";
export type { ChallengeMilestone } from "./challengeDates";

const KEY = "forma-challenge-mode-v1";

/** Flip to false after the Christmas Cracker season to restore FORMA programmes. */
export const CRACKER_SEASON_ACTIVE = true;

export const CRACKER_WEEKS = 6;

/** Official Christmas Cracker 2026 challenge window (local calendar dates). */
export const CRACKER_START_ISO = "2026-10-12";
export const CRACKER_END_ISO = "2026-11-22";

/** @deprecated Prefer importing CRACKER_DATES_LABEL from the re-export above. */
void CRACKER_SEASON_WINDOW_LABEL;

function parseLocalISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Calendar week 1–6 from the official start date (Mon 12 Oct 2026). */
export function crackerCalendarWeek(now = new Date()): number {
  const start = parseLocalISO(CRACKER_START_ISO);
  const end = parseLocalISO(CRACKER_END_ISO);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (today < start) return 1;
  if (today > end) return CRACKER_WEEKS;
  const diffDays = Math.floor((today.getTime() - start.getTime()) / 86_400_000);
  return crackerWeek(Math.floor(diffDays / 7) + 1);
}

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

/**
 * True when Auth created a stub `profiles` row (handle_new_user) but the member
 * has not finished club + level onboarding or logged any Cracker data yet.
 * Must run before we auto-generate and push workouts, or Home skips onboarding.
 */
export function cloudMemberNeedsCrackerOnboarding(cloud: {
  history: unknown[];
  workouts: unknown[];
  progress: unknown[];
  sessionDraft: unknown;
  crackerMoveCheckIns: Record<string, unknown>;
}): boolean {
  if (!CRACKER_SEASON_ACTIVE) return false;
  const hasCheckIns = Object.values(cloud.crackerMoveCheckIns || {}).some(
    (entry) => entry && typeof entry === "object" && Object.keys(entry as object).length > 0,
  );
  return (
    cloud.history.length === 0 &&
    cloud.workouts.length === 0 &&
    cloud.progress.length === 0 &&
    !cloud.sessionDraft &&
    !hasCheckIns
  );
}
