/**
 * Life & Soul 6-week Cracker Challenge window.
 * Fixed programme upload comes next — dates are canonical here.
 */

export const CRACKER_CHALLENGE = {
  name: "Cracker Challenge",
  shortName: "Cracker",
  /** Inclusive — first day members train on the challenge plan */
  startDate: "2026-10-12",
  /** Inclusive — last day of the challenge */
  endDate: "2026-11-22",
  weeks: 6,
} as const;

/** Local calendar date as YYYY-MM-DD (challenge dates are WA-friendly wall dates). */
export function localDateISO(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function daysBetween(startIso: string, endIso: string): number {
  const start = parseDate(startIso);
  const end = parseDate(endIso);
  const ms = end.getTime() - start.getTime();
  return Math.floor(ms / (24 * 60 * 60 * 1000));
}

export type ChallengePhase = "upcoming" | "active" | "complete";

export function challengePhase(today = localDateISO()): ChallengePhase {
  if (today < CRACKER_CHALLENGE.startDate) return "upcoming";
  if (today > CRACKER_CHALLENGE.endDate) return "complete";
  return "active";
}

export function isChallengeActive(today = localDateISO()): boolean {
  return challengePhase(today) === "active";
}

/** 1–6 while active; null before start or after end */
export function challengeWeek(today = localDateISO()): number | null {
  const phase = challengePhase(today);
  if (phase !== "active") return null;
  const dayIndex = daysBetween(CRACKER_CHALLENGE.startDate, today);
  return Math.min(CRACKER_CHALLENGE.weeks, Math.floor(dayIndex / 7) + 1);
}

export function challengeDaysRemaining(today = localDateISO()): number | null {
  if (challengePhase(today) !== "active") return null;
  return Math.max(0, daysBetween(today, CRACKER_CHALLENGE.endDate) + 1);
}

export function formatChallengeRange(): string {
  const start = parseDate(CRACKER_CHALLENGE.startDate).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const end = parseDate(CRACKER_CHALLENGE.endDate).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `${start} – ${end}`;
}

/** Short label for Home / Board / Progress chips */
export function challengeStatusLabel(today = localDateISO()): string {
  const phase = challengePhase(today);
  if (phase === "upcoming") {
    return `${CRACKER_CHALLENGE.name} starts ${parseDate(CRACKER_CHALLENGE.startDate).toLocaleDateString(undefined, { day: "numeric", month: "short" })}`;
  }
  if (phase === "complete") {
    return `${CRACKER_CHALLENGE.name} complete`;
  }
  const week = challengeWeek(today);
  const left = challengeDaysRemaining(today);
  return `${CRACKER_CHALLENGE.name} · Week ${week} of ${CRACKER_CHALLENGE.weeks}${left != null ? ` · ${left} days left` : ""}`;
}
