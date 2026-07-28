/**
 * Daily gratitude + guided breathwork foundations.
 * Local cache: forma-wellness-v1. Cloud: nested under programme.wellness.
 */

export const WELLNESS_STORAGE_KEY = "forma-wellness-v1";

export type BreathworkLogEntry = {
  date: string;
  protocolId: string;
  completedAt: string;
};

export type WellnessState = {
  gratitude: Record<string, string[]>;
  breathwork: BreathworkLogEntry[];
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

export function normalizeWellness(raw: unknown): WellnessState {
  if (!raw || typeof raw !== "object") return { ...EMPTY_WELLNESS, gratitude: {}, breathwork: [] };
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
  return { gratitude, breathwork };
}

export function loadWellness(): WellnessState {
  if (typeof window === "undefined") return { ...EMPTY_WELLNESS, gratitude: {}, breathwork: [] };
  try {
    const raw = window.localStorage.getItem(WELLNESS_STORAGE_KEY);
    return raw ? normalizeWellness(JSON.parse(raw)) : { ...EMPTY_WELLNESS, gratitude: {}, breathwork: [] };
  } catch {
    return { ...EMPTY_WELLNESS, gratitude: {}, breathwork: [] };
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
