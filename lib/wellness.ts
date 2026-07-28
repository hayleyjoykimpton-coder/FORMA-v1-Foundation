/**
 * Daily gratitude, breathwork, sleep/steps, and readiness foundations.
 * Local cache: forma-wellness-v1. Cloud: nested under programme.wellness.
 */

import type { ReadinessInput } from "./coach";

export const WELLNESS_STORAGE_KEY = "forma-wellness-v1";

export type BreathworkLogEntry = {
  date: string;
  protocolId: string;
  completedAt: string;
};

export type DailyLog = {
  sleepHours?: number;
  steps?: number;
};

export type ReadinessLogEntry = {
  date: string;
  score: number;
  completedAt: string;
  input?: ReadinessInput;
};

export type WellnessState = {
  gratitude: Record<string, string[]>;
  breathwork: BreathworkLogEntry[];
  /** Calendar-day sleep hours + step count (not profile averages). */
  daily: Record<string, DailyLog>;
  /** Standalone readiness check-ins (outside a workout). */
  readinessLogs: ReadinessLogEntry[];
};

export type BreathPhase = {
  label: string;
  seconds: number;
  /** true = inhale / expand, false = exhale / settle, null = hold */
  inhale: boolean | null;
};

export type BreathProtocol = {
  id: string;
  name: string;
  blurb: string;
  cycles: number;
  phases: BreathPhase[];
};

export const EMPTY_WELLNESS: WellnessState = {
  gratitude: {},
  breathwork: [],
  daily: {},
  readinessLogs: [],
};

export const GRATITUDE_SLOTS = 3;

/** Soft rotating prompts — one per gratitude line. */
export const GRATITUDE_PROMPTS = [
  "Something that felt good in your body today",
  "A person, place, or moment you appreciated",
  "One small win — even if it was quiet",
] as const;

export const BREATHWORK_PROTOCOLS: BreathProtocol[] = [
  {
    id: "physiological_sigh",
    name: "Physiological sigh",
    blurb: "Two inhales, one long exhale — quick nervous-system reset.",
    cycles: 6,
    phases: [
      { label: "Inhale", seconds: 2, inhale: true },
      { label: "Top-up", seconds: 1, inhale: true },
      { label: "Long exhale", seconds: 6, inhale: false },
    ],
  },
  {
    id: "box",
    name: "Box breath",
    blurb: "Even sides for focus and calm — classic 4-count.",
    cycles: 4,
    phases: [
      { label: "Inhale", seconds: 4, inhale: true },
      { label: "Hold", seconds: 4, inhale: null },
      { label: "Exhale", seconds: 4, inhale: false },
      { label: "Hold", seconds: 4, inhale: null },
    ],
  },
  {
    id: "calm_478",
    name: "4–7–8 calm",
    blurb: "Longer exhale to wind down before sleep or Align rest.",
    cycles: 4,
    phases: [
      { label: "Inhale", seconds: 4, inhale: true },
      { label: "Hold", seconds: 7, inhale: null },
      { label: "Exhale", seconds: 8, inhale: false },
    ],
  },
];

export function localDateKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function emptyState(): WellnessState {
  return { gratitude: {}, breathwork: [], daily: {}, readinessLogs: [] };
}

function clampNumber(value: unknown, min: number, max: number): number | undefined {
  if (value == null || value === "") return undefined;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return undefined;
  return Math.min(max, Math.max(min, n));
}

export function normalizeWellness(raw: unknown): WellnessState {
  if (!raw || typeof raw !== "object") return emptyState();
  const data = raw as Partial<WellnessState>;
  const gratitude: Record<string, string[]> = {};
  if (data.gratitude && typeof data.gratitude === "object") {
    for (const [key, value] of Object.entries(data.gratitude)) {
      if (Array.isArray(value)) {
        gratitude[key] = value.map((entry) => String(entry ?? "")).slice(0, GRATITUDE_SLOTS);
      }
    }
  }
  const breathwork = Array.isArray(data.breathwork)
    ? data.breathwork
        .filter(
          (entry): entry is BreathworkLogEntry =>
            Boolean(entry && typeof entry === "object" && typeof entry.date === "string" && typeof entry.protocolId === "string"),
        )
        .map((entry) => ({
          date: entry.date,
          protocolId: entry.protocolId,
          completedAt: typeof entry.completedAt === "string" ? entry.completedAt : new Date().toISOString(),
        }))
        .slice(-60)
    : [];

  const daily: Record<string, DailyLog> = {};
  if (data.daily && typeof data.daily === "object") {
    for (const [key, value] of Object.entries(data.daily)) {
      if (!value || typeof value !== "object") continue;
      const sleepHours = clampNumber((value as DailyLog).sleepHours, 0, 24);
      const steps = clampNumber((value as DailyLog).steps, 0, 100_000);
      if (sleepHours == null && steps == null) continue;
      daily[key] = {
        ...(sleepHours != null ? { sleepHours } : {}),
        ...(steps != null ? { steps: Math.round(steps) } : {}),
      };
    }
  }

  const readinessLogs = Array.isArray(data.readinessLogs)
    ? data.readinessLogs
        .filter(
          (entry): entry is ReadinessLogEntry =>
            Boolean(
              entry &&
                typeof entry === "object" &&
                typeof entry.date === "string" &&
                typeof entry.score === "number",
            ),
        )
        .map((entry) => ({
          date: entry.date,
          score: Math.round(Math.min(100, Math.max(0, entry.score))),
          completedAt: typeof entry.completedAt === "string" ? entry.completedAt : new Date().toISOString(),
          ...(entry.input ? { input: entry.input } : {}),
        }))
        .slice(-90)
    : [];

  return { gratitude, breathwork, daily, readinessLogs };
}

export function loadWellness(): WellnessState {
  if (typeof window === "undefined") return emptyState();
  try {
    const raw = window.localStorage.getItem(WELLNESS_STORAGE_KEY);
    return raw ? normalizeWellness(JSON.parse(raw)) : emptyState();
  } catch {
    return emptyState();
  }
}

export function saveWellness(state: WellnessState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(WELLNESS_STORAGE_KEY, JSON.stringify(normalizeWellness(state)));
}

export function gratitudeForDay(state: WellnessState, day = localDateKey()): string[] {
  const entries = state.gratitude[day] ?? [];
  const padded = [...entries];
  while (padded.length < GRATITUDE_SLOTS) padded.push("");
  return padded.slice(0, GRATITUDE_SLOTS);
}

export function setGratitudeLine(
  state: WellnessState,
  index: number,
  value: string,
  day = localDateKey(),
): WellnessState {
  const lines = gratitudeForDay(state, day);
  lines[index] = value;
  const trimmed = lines.map((line) => line.trimEnd());
  const hasContent = trimmed.some((line) => line.trim().length > 0);
  const nextGratitude = { ...state.gratitude };
  if (hasContent) nextGratitude[day] = trimmed;
  else delete nextGratitude[day];
  return { ...state, gratitude: nextGratitude };
}

export function gratitudeFilledCount(state: WellnessState, day = localDateKey()): number {
  return gratitudeForDay(state, day).filter((line) => line.trim().length > 0).length;
}

export function breathworkDoneToday(state: WellnessState, day = localDateKey()): boolean {
  return state.breathwork.some((entry) => entry.date === day);
}

export function protocolById(id: string): BreathProtocol | undefined {
  return BREATHWORK_PROTOCOLS.find((protocol) => protocol.id === id);
}

export function protocolDurationSeconds(protocol: BreathProtocol): number {
  const cycle = protocol.phases.reduce((sum, phase) => sum + phase.seconds, 0);
  return cycle * protocol.cycles;
}

export function logBreathwork(
  state: WellnessState,
  protocolId: string,
  day = localDateKey(),
): WellnessState {
  const entry: BreathworkLogEntry = {
    date: day,
    protocolId,
    completedAt: new Date().toISOString(),
  };
  const withoutToday = state.breathwork.filter((item) => item.date !== day);
  return {
    ...state,
    breathwork: [...withoutToday, entry].slice(-60),
  };
}

/** Recent gratitude lines for Recovery history (newest first, skip empty days). */
export function recentGratitudeDays(
  state: WellnessState,
  limit = 5,
): { date: string; lines: string[] }[] {
  return Object.entries(state.gratitude)
    .map(([date, lines]) => ({
      date,
      lines: lines.filter((line) => line.trim().length > 0),
    }))
    .filter((entry) => entry.lines.length > 0)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);
}

export function dailyForDay(state: WellnessState, day = localDateKey()): DailyLog {
  return state.daily[day] ?? {};
}

export function setDailyLog(
  state: WellnessState,
  patch: Partial<DailyLog>,
  day = localDateKey(),
): WellnessState {
  const current = dailyForDay(state, day);
  const next: DailyLog = { ...current };

  if ("sleepHours" in patch) {
    const sleepHours = clampNumber(patch.sleepHours, 0, 24);
    if (sleepHours == null) delete next.sleepHours;
    else next.sleepHours = Math.round(sleepHours * 10) / 10;
  }
  if ("steps" in patch) {
    const steps = clampNumber(patch.steps, 0, 100_000);
    if (steps == null) delete next.steps;
    else next.steps = Math.round(steps);
  }

  const nextDaily = { ...state.daily };
  if (next.sleepHours == null && next.steps == null) delete nextDaily[day];
  else nextDaily[day] = next;
  return { ...state, daily: nextDaily };
}

/** Map last night's hours (roughly) onto the 1–5 readiness sleep scale. */
export function sleepHoursToReadinessScale(hours: number | undefined): number | undefined {
  if (hours == null || !Number.isFinite(hours)) return undefined;
  if (hours >= 8) return 5;
  if (hours >= 7) return 4;
  if (hours >= 6) return 3;
  if (hours >= 5) return 2;
  return 1;
}

export function logReadinessCheckIn(
  state: WellnessState,
  score: number,
  input?: ReadinessInput,
  day = localDateKey(),
): WellnessState {
  const entry: ReadinessLogEntry = {
    date: day,
    score: Math.round(Math.min(100, Math.max(0, score))),
    completedAt: new Date().toISOString(),
    ...(input ? { input } : {}),
  };
  const withoutToday = state.readinessLogs.filter((item) => item.date !== day);
  return {
    ...state,
    readinessLogs: [...withoutToday, entry].slice(-90),
  };
}

export function readinessDoneToday(state: WellnessState, day = localDateKey()): boolean {
  return state.readinessLogs.some((entry) => entry.date === day);
}

export function readinessScoreToday(state: WellnessState, day = localDateKey()): number | null {
  const entry = state.readinessLogs.find((item) => item.date === day);
  return entry ? entry.score : null;
}

/**
 * Combine workout-session readiness with standalone logs for Recovery / coach.
 * Prefers the latest value per calendar day.
 */
export function recentReadinessScores(
  history: { completedAt: string; readiness?: number }[],
  wellness: WellnessState,
  withinDays = 7,
): number[] {
  const cutoff = Date.now() - withinDays * 86_400_000;
  const byDay = new Map<string, { at: number; score: number }>();

  for (const session of history) {
    if (typeof session.readiness !== "number") continue;
    const at = new Date(session.completedAt).getTime();
    if (!Number.isFinite(at) || at < cutoff) continue;
    const day = session.completedAt.slice(0, 10);
    const prev = byDay.get(day);
    if (!prev || at >= prev.at) byDay.set(day, { at, score: session.readiness });
  }

  for (const entry of wellness.readinessLogs) {
    const at = new Date(entry.completedAt).getTime();
    if (!Number.isFinite(at) || at < cutoff) continue;
    const prev = byDay.get(entry.date);
    if (!prev || at >= prev.at) byDay.set(entry.date, { at, score: entry.score });
  }

  return [...byDay.values()].map((item) => item.score);
}

export function averageReadinessScore(
  history: { completedAt: string; readiness?: number }[],
  wellness: WellnessState,
  withinDays = 7,
): number | null {
  const values = recentReadinessScores(history, wellness, withinDays);
  if (!values.length) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}
