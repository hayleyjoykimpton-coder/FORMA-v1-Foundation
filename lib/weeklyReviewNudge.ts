/**
 * Sunday in-app weekly review nudge — local dismiss only.
 */

export const WEEKLY_REVIEW_NUDGE_KEY = "forma-weekly-review-nudge-v1";

function localDateKey(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function isSunday(now = new Date()): boolean {
  return now.getDay() === 0;
}

export function loadWeeklyReviewDismissedDate(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(WEEKLY_REVIEW_NUDGE_KEY);
  } catch {
    return null;
  }
}

export function dismissWeeklyReviewNudge(now = new Date()): string {
  const key = localDateKey(now);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(WEEKLY_REVIEW_NUDGE_KEY, key);
  }
  return key;
}

export function shouldShowWeeklyReviewNudge(now = new Date()): boolean {
  if (!isSunday(now)) return false;
  return loadWeeklyReviewDismissedDate() !== localDateKey(now);
}
