/**
 * Training-day reminders — in-app nudges (and optional browser notifications
 * while FORMA is open). No push / service-worker infra required.
 */

import { BRAND } from "./brand";
import { COACH_REMINDERS } from "./content";
import type { Workout, WorkoutSession } from "./types";

export const REMINDER_PREFS_KEY = "forma-reminders-v1";

export type ReminderWindow = "anytime" | "morning" | "afternoon" | "evening";

export type ReminderPrefs = {
  /** Master switch — default on. */
  enabled: boolean;
  /** User opted into browser Notification API while the app is open. */
  browserNotify: boolean;
  /** Preferred time-of-day window before the banner appears. */
  preferredWindow: ReminderWindow;
  /** Local YYYY-MM-DD when the in-app banner was dismissed ("later"). */
  dismissedDate?: string;
  /** Local YYYY-MM-DD when user marked today's session done without logging. */
  markedDoneDate?: string;
  /** Local YYYY-MM-DD when a browser notification already fired. */
  lastNotifiedDate?: string;
};

const DEFAULT_PREFS: ReminderPrefs = {
  enabled: true,
  browserNotify: false,
  preferredWindow: "anytime",
};

export const REMINDER_WINDOW_LABELS: Record<ReminderWindow, string> = {
  anytime: "Any time",
  morning: "Morning (from 6am)",
  afternoon: "Afternoon (from 12pm)",
  evening: "Evening (from 5pm)",
};

function localDateKey(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function windowStartHour(window: ReminderWindow): number {
  if (window === "morning") return 6;
  if (window === "afternoon") return 12;
  if (window === "evening") return 17;
  return 0;
}

export function isWithinReminderWindow(prefs: ReminderPrefs, now = new Date()): boolean {
  return now.getHours() >= windowStartHour(prefs.preferredWindow ?? "anytime");
}

export function loadReminderPrefs(): ReminderPrefs {
  if (typeof window === "undefined") return { ...DEFAULT_PREFS };
  try {
    const raw = window.localStorage.getItem(REMINDER_PREFS_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    const parsed = JSON.parse(raw) as Partial<ReminderPrefs>;
    const preferredWindow =
      parsed.preferredWindow === "morning" ||
      parsed.preferredWindow === "afternoon" ||
      parsed.preferredWindow === "evening" ||
      parsed.preferredWindow === "anytime"
        ? parsed.preferredWindow
        : "anytime";
    return {
      enabled: parsed.enabled !== false,
      browserNotify: Boolean(parsed.browserNotify),
      preferredWindow,
      dismissedDate: parsed.dismissedDate,
      markedDoneDate: parsed.markedDoneDate,
      lastNotifiedDate: parsed.lastNotifiedDate,
    };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function saveReminderPrefs(prefs: ReminderPrefs): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(REMINDER_PREFS_KEY, JSON.stringify(prefs));
}

export function weekdayName(now = new Date()): string {
  return now.toLocaleDateString("en-US", { weekday: "long" });
}

/** Exact scheduled training day — ignores pickTodaysWorkout weekday fallback. */
export function isTrainingDay(workouts: Workout[], now = new Date()): boolean {
  const today = weekdayName(now);
  return workouts.some((workout) => workout.day === today);
}

export function todaysScheduledWorkout(workouts: Workout[], now = new Date()): Workout | undefined {
  const today = weekdayName(now);
  return workouts.find((workout) => workout.day === today);
}

export function hasSessionToday(history: WorkoutSession[], now = new Date()): boolean {
  const key = now.toDateString();
  return history.some((session) => new Date(session.completedAt).toDateString() === key);
}

export function shouldShowTrainingReminder(input: {
  workouts: Workout[];
  history: WorkoutSession[];
  prefs: ReminderPrefs;
  now?: Date;
}): boolean {
  const now = input.now ?? new Date();
  if (!input.prefs.enabled) return false;
  if (!isTrainingDay(input.workouts, now)) return false;
  if (hasSessionToday(input.history, now)) return false;
  const today = localDateKey(now);
  if (input.prefs.dismissedDate === today) return false;
  if (input.prefs.markedDoneDate === today) return false;
  if (!isWithinReminderWindow(input.prefs, now)) return false;
  return true;
}

export function dismissTrainingReminderToday(prefs: ReminderPrefs, now = new Date()): ReminderPrefs {
  const next = { ...prefs, dismissedDate: localDateKey(now) };
  saveReminderPrefs(next);
  return next;
}

/** Quiet acknowledgement — hide banner for today without starting a workout. */
export function markTrainingDoneToday(prefs: ReminderPrefs, now = new Date()): ReminderPrefs {
  const next = { ...prefs, markedDoneDate: localDateKey(now), dismissedDate: localDateKey(now) };
  saveReminderPrefs(next);
  return next;
}

export function trainingReminderCopy(workout: Workout | undefined): {
  title: string;
  text: string;
  tip: { title: string; text: string; accent: string };
} {
  const tip = COACH_REMINDERS[new Date().getDay() % COACH_REMINDERS.length] ?? COACH_REMINDERS[0];
  if (!workout) {
    return {
      title: "Training day",
      text: "Your session is here whenever you’re ready.",
      tip,
    };
  }
  return {
    title: `${workout.title} today`,
    text: `About ${workout.duration} minutes · ${workout.exercises.length} movements. No rush — whenever it fits.`,
    tip,
  };
}

/** Fire at most one browser notification per day while the app is open. */
export async function maybeNotifyTrainingDay(input: {
  prefs: ReminderPrefs;
  workout: Workout | undefined;
  history: WorkoutSession[];
  workouts: Workout[];
}): Promise<ReminderPrefs> {
  if (typeof window === "undefined" || typeof Notification === "undefined") return input.prefs;
  if (!input.prefs.enabled || !input.prefs.browserNotify) return input.prefs;
  if (Notification.permission !== "granted") return input.prefs;
  if (!shouldShowTrainingReminder(input)) return input.prefs;

  const today = localDateKey();
  if (input.prefs.lastNotifiedDate === today) return input.prefs;

  const copy = trainingReminderCopy(input.workout);
  try {
    new Notification(BRAND.name, {
      body: `${copy.title}. ${copy.text}`,
      tag: `forma-training-${today}`,
      silent: true,
    });
  } catch {
    return input.prefs;
  }

  const next = { ...input.prefs, lastNotifiedDate: today };
  saveReminderPrefs(next);
  return next;
}

export async function requestBrowserNotifyPermission(): Promise<NotificationPermission | "unsupported"> {
  if (typeof window === "undefined" || typeof Notification === "undefined") return "unsupported";
  if (Notification.permission === "granted" || Notification.permission === "denied") {
    return Notification.permission;
  }
  return Notification.requestPermission();
}
