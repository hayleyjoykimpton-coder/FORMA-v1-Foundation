/**
 * Format-specific WOD result models for Christmas Cracker.
 * Separate from strength SetResult (weight / reps / RPE).
 */

export type WodKind =
  | "amrap"
  | "for_time"
  | "emom"
  | "death_by"
  | "tabata"
  | "interval"
  | "ladder"
  | "unknown";

export type WodLoad = {
  label: string;
  kg?: number;
};

export type AmrapResult = {
  kind: "amrap";
  rounds?: number;
  extraReps?: number;
  durationSeconds?: number;
  loads: WodLoad[];
  completedAt?: string;
};

export type ForTimeResult = {
  kind: "for_time";
  completionSeconds?: number;
  loads: WodLoad[];
  scaled?: boolean;
  completedAt?: string;
};

export type EmomResult = {
  kind: "emom";
  totalDurationSeconds?: number;
  roundsCompleted?: number;
  loads: WodLoad[];
  completed?: boolean;
  notes?: string;
  completedAt?: string;
};

export type DeathByResult = {
  kind: "death_by";
  lastCompletedMinute?: number;
  repsInIncompleteRound?: number;
  loads: WodLoad[];
  completedAt?: string;
};

export type TabataResult = {
  kind: "tabata";
  completed?: boolean;
  score?: number;
  loads: WodLoad[];
  completedAt?: string;
};

export type IntervalResult = {
  kind: "interval";
  /** Per-set times in seconds (Every X minutes). */
  setTimesSeconds: number[];
  loads: WodLoad[];
  completedAt?: string;
};

export type LadderResult = {
  kind: "ladder";
  completionSeconds?: number;
  loads: WodLoad[];
  completed?: boolean;
  completedAt?: string;
};

export type UnknownWodResult = {
  kind: "unknown";
  notes?: string;
  loads: WodLoad[];
  completed?: boolean;
  completedAt?: string;
};

export type WodResult =
  | AmrapResult
  | ForTimeResult
  | EmomResult
  | DeathByResult
  | TabataResult
  | IntervalResult
  | LadderResult
  | UnknownWodResult;

export function isWodExerciseName(name: string): boolean {
  return /^WOD\b/i.test(name.trim());
}

/** Strip `WOD · ` prefix to get the format string. */
export function wodFormatFromName(name: string): string {
  return name.replace(/^WOD\s*·\s*/i, "").trim();
}

export function parseWodKind(formatOrName: string): WodKind {
  const f = wodFormatFromName(formatOrName).toLowerCase();
  if (f.includes("amrap")) return "amrap";
  if (f.includes("death by")) return "death_by";
  if (f.includes("tabata")) return "tabata";
  if (f.includes("every") && f.includes("min")) return "interval";
  if (f.includes("1 set every")) return "interval";
  if (f.includes("emom")) return "emom";
  if (f.includes("for time") || f.includes("rounds for time")) return "for_time";
  if (f.includes("ladder")) return "ladder";
  return "unknown";
}

/** Guess duration (seconds) from format text e.g. "15 min AMRAP". */
export function parseDurationSeconds(formatOrName: string): number | undefined {
  const f = wodFormatFromName(formatOrName);
  const m = f.match(/(\d+)\s*min/i);
  if (m) return Number(m[1]) * 60;
  return undefined;
}

/** Number of interval sets from "1 set every 5 min × 5". */
export function parseIntervalSetCount(formatOrName: string): number {
  const f = wodFormatFromName(formatOrName);
  const m = f.match(/×\s*(\d+)/i) || f.match(/x\s*(\d+)/i);
  return m ? Math.max(1, Number(m[1])) : 5;
}

/** Suggest load labels from WOD notes (first work line). */
export function suggestLoadLabels(notes?: string): string[] {
  if (!notes?.trim()) return ["Working load"];
  const workLine = notes.split("\n")[0] || "";
  const labels: string[] = [];
  const patterns = [
    /DB Deadlift/i,
    /Barbell Deadlift/i,
    /KB Deadlift/i,
    /DB Push Press/i,
    /Push Press/i,
    /Thruster/i,
    /Goblet Squat/i,
    /Front Squat/i,
    /Wall Ball/i,
    /DB Snatch/i,
  ];
  for (const re of patterns) {
    const match = workLine.match(re);
    if (match) labels.push(match[0]);
  }
  if (labels.length === 0 && /DB|KB|Barbell|kg/i.test(workLine)) {
    labels.push("Working load");
  }
  return labels.length ? labels : ["Working load"];
}

export function emptyWodResult(kind: WodKind, formatOrName: string, notes?: string): WodResult {
  const loads: WodLoad[] = suggestLoadLabels(notes).map((label) => ({ label }));
  const duration = parseDurationSeconds(formatOrName);
  switch (kind) {
    case "amrap":
      return { kind: "amrap", rounds: undefined, extraReps: undefined, durationSeconds: duration, loads };
    case "for_time":
      return { kind: "for_time", completionSeconds: undefined, loads };
    case "emom":
      return {
        kind: "emom",
        totalDurationSeconds: duration,
        roundsCompleted: undefined,
        loads,
        completed: false,
      };
    case "death_by":
      return { kind: "death_by", lastCompletedMinute: undefined, loads };
    case "tabata":
      return { kind: "tabata", completed: false, loads };
    case "interval": {
      const n = parseIntervalSetCount(formatOrName);
      return { kind: "interval", setTimesSeconds: Array.from({ length: n }, () => 0), loads };
    }
    case "ladder":
      return { kind: "ladder", completionSeconds: undefined, loads, completed: false };
    default:
      return { kind: "unknown", loads, completed: false };
  }
}

export function ensureWodResult(
  existing: WodResult | undefined,
  formatOrName: string,
  notes?: string,
): WodResult {
  const kind = parseWodKind(formatOrName);
  if (existing && existing.kind === kind) return existing;
  return emptyWodResult(kind, formatOrName, notes);
}

export function isWodResultComplete(result: WodResult | undefined): boolean {
  if (!result) return false;
  switch (result.kind) {
    case "amrap":
      return result.rounds != null && result.rounds >= 0 && Boolean(result.completedAt);
    case "for_time":
      return result.completionSeconds != null && result.completionSeconds > 0 && Boolean(result.completedAt);
    case "emom":
      return Boolean(result.completed && result.completedAt);
    case "death_by":
      return result.lastCompletedMinute != null && result.lastCompletedMinute > 0 && Boolean(result.completedAt);
    case "tabata":
      return Boolean(result.completed && result.completedAt);
    case "interval":
      return (
        result.setTimesSeconds.length > 0 &&
        result.setTimesSeconds.every((s) => s > 0) &&
        Boolean(result.completedAt)
      );
    case "ladder":
      return Boolean(result.completed && result.completedAt);
    case "unknown":
      return Boolean(result.completed && result.completedAt);
  }
}

export function formatWodScore(result: WodResult | undefined): string {
  if (!result) return "—";
  switch (result.kind) {
    case "amrap": {
      const rounds = result.rounds ?? 0;
      const extra = result.extraReps ?? 0;
      return extra > 0 ? `${rounds} rounds + ${extra} reps` : `${rounds} rounds`;
    }
    case "for_time":
    case "ladder":
      return result.completionSeconds != null ? formatMmSs(result.completionSeconds) : "—";
    case "emom":
      return result.completed
        ? result.roundsCompleted != null
          ? `Completed · ${result.roundsCompleted} rounds`
          : "Completed"
        : "Not completed";
    case "death_by":
      return result.lastCompletedMinute != null
        ? `Minute ${result.lastCompletedMinute} completed`
        : "—";
    case "tabata":
      if (!result.completed) return "Not completed";
      return result.score != null ? `Completed · score ${result.score}` : "Completed";
    case "interval": {
      const times = result.setTimesSeconds.filter((s) => s > 0).map(formatMmSs);
      return times.length ? times.map((t, i) => `Set ${i + 1} — ${t}`).join(" · ") : "—";
    }
    case "unknown":
      return result.completed ? "Completed" : "—";
  }
}

export function formatMmSs(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

export function parseMmSs(raw: string): number | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  if (trimmed.includes(":")) {
    const [a, b] = trimmed.split(":");
    const m = Number(a);
    const s = Number(b);
    if (!Number.isFinite(m) || !Number.isFinite(s)) return undefined;
    return m * 60 + s;
  }
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : undefined;
}

/** Persistable WOD log metadata for history / cloud. */
export type WodSessionMeta = {
  userId?: string;
  crackerLevel?: "beginner" | "intermediate";
  week?: number;
  session?: string;
  wodType: WodKind;
  result: WodResult;
  completedAt: string;
};
