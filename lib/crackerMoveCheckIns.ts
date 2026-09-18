/**
 * Christmas Cracker MOVE check-ins — fitness testing + InBody/measurements.
 * Browser-only persistence via localStorage (no server DB).
 *
 * Fields:
 * - fitness_initial / fitness_final
 * - inbody_initial / inbody_final
 * - measurements_initial / measurements_final
 */

export type DeadliftVariation = "barbell" | "kb_suitcase";
export type CardioMode = "ski" | "row";

export type FitnessCheckIn = {
  deadliftVariation?: DeadliftVariation;
  deadliftLoadKg?: number;
  deadliftReps?: number;
  cardio500Mode?: CardioMode;
  cardio500Seconds?: number;
  pushupReps?: number;
  situpReps?: number;
  gymConfidence?: number;
  finisherCardioMode?: CardioMode;
  finisherThrusterKg?: number;
  finisherSeconds?: number;
  loggedAt?: string;
};

export type InBodyCheckIn = {
  skeletalMuscleMassKg?: number;
  bodyFatPercent?: number;
  visceralFat?: number;
  loggedAt?: string;
};

export type MeasurementsCheckIn = {
  chestCm?: number;
  waistCm?: number;
  hipsCm?: number;
  loggedAt?: string;
};

export type CrackerMoveCheckIns = {
  fitness_initial?: FitnessCheckIn;
  fitness_final?: FitnessCheckIn;
  inbody_initial?: InBodyCheckIn;
  inbody_final?: InBodyCheckIn;
  measurements_initial?: MeasurementsCheckIn;
  measurements_final?: MeasurementsCheckIn;
};

export const MOVE_CHECKINS_STORAGE = "forma-cracker-move-checkins-v1";
const LEGACY_FITNESS_KEY = "forma-cracker-fitness-v1";

export const FITNESS_INITIAL_LABEL = "INITIAL · 10 OCTOBER 2026";
export const FITNESS_FINAL_LABEL = "FINAL · 22 NOVEMBER 2026";
export const INBODY_INITIAL_LABEL = "PRE-CHALLENGE · 5–12 OCTOBER 2026";
export const INBODY_FINAL_LABEL = "FINAL · 22–26 NOVEMBER 2026";

export const DEADLIFT_LOAD_GUIDES = {
  barbell: [30, 40, 50],
  kb_suitcase: [8, 12, 16],
} as const;

export const THRUSTER_LOAD_GUIDES = [15, 20, 30] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optNumber(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  return value;
}

function optString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function normalizeFitness(raw: unknown): FitnessCheckIn | undefined {
  if (!isRecord(raw)) return undefined;
  const variation =
    raw.deadliftVariation === "barbell" || raw.deadliftVariation === "kb_suitcase"
      ? raw.deadliftVariation
      : undefined;
  const cardio =
    raw.cardio500Mode === "ski" || raw.cardio500Mode === "row" ? raw.cardio500Mode : undefined;
  const finisherCardio =
    raw.finisherCardioMode === "ski" || raw.finisherCardioMode === "row"
      ? raw.finisherCardioMode
      : undefined;
  const next: FitnessCheckIn = {
    deadliftVariation: variation,
    deadliftLoadKg: optNumber(raw.deadliftLoadKg),
    deadliftReps: optNumber(raw.deadliftReps),
    cardio500Mode: cardio,
    cardio500Seconds: optNumber(raw.cardio500Seconds),
    pushupReps: optNumber(raw.pushupReps),
    situpReps: optNumber(raw.situpReps),
    gymConfidence: optNumber(raw.gymConfidence),
    finisherCardioMode: finisherCardio,
    finisherThrusterKg: optNumber(raw.finisherThrusterKg),
    finisherSeconds: optNumber(raw.finisherSeconds),
    loggedAt: optString(raw.loggedAt),
  };
  return Object.values(next).some((v) => v != null) ? next : undefined;
}

function normalizeInBody(raw: unknown): InBodyCheckIn | undefined {
  if (!isRecord(raw)) return undefined;
  const next: InBodyCheckIn = {
    skeletalMuscleMassKg: optNumber(raw.skeletalMuscleMassKg),
    bodyFatPercent: optNumber(raw.bodyFatPercent),
    visceralFat: optNumber(raw.visceralFat),
    loggedAt: optString(raw.loggedAt),
  };
  return Object.values(next).some((v) => v != null) ? next : undefined;
}

function normalizeMeasurements(raw: unknown): MeasurementsCheckIn | undefined {
  if (!isRecord(raw)) return undefined;
  const next: MeasurementsCheckIn = {
    chestCm: optNumber(raw.chestCm),
    waistCm: optNumber(raw.waistCm),
    hipsCm: optNumber(raw.hipsCm),
    loggedAt: optString(raw.loggedAt),
  };
  return Object.values(next).some((v) => v != null) ? next : undefined;
}

/** Migrate legacy Week1/Week6 fitness blob into initial/final shapes. */
function migrateLegacyFitness(): Pick<CrackerMoveCheckIns, "fitness_initial" | "fitness_final"> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(LEGACY_FITNESS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as {
      week1?: Record<string, unknown>;
      week6?: Record<string, unknown>;
    };
    const map = (scores?: Record<string, unknown>): FitnessCheckIn | undefined => {
      if (!scores) return undefined;
      return normalizeFitness({
        deadliftReps: scores.deadliftReps,
        cardio500Seconds: scores.ski500Seconds,
        pushupReps: scores.pushups,
        situpReps: scores.situps60,
        gymConfidence: scores.confidence,
        finisherSeconds: scores.finisherSeconds,
        loggedAt: scores.loggedAt,
      });
    };
    return {
      fitness_initial: map(parsed.week1),
      fitness_final: map(parsed.week6),
    };
  } catch {
    return {};
  }
}

export function normalizeMoveCheckIns(raw: unknown): CrackerMoveCheckIns {
  if (!isRecord(raw)) return {};
  return {
    fitness_initial: normalizeFitness(raw.fitness_initial),
    fitness_final: normalizeFitness(raw.fitness_final),
    inbody_initial: normalizeInBody(raw.inbody_initial),
    inbody_final: normalizeInBody(raw.inbody_final),
    measurements_initial: normalizeMeasurements(raw.measurements_initial),
    measurements_final: normalizeMeasurements(raw.measurements_final),
  };
}

export function loadMoveCheckIns(): CrackerMoveCheckIns {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(MOVE_CHECKINS_STORAGE);
    if (raw) return normalizeMoveCheckIns(JSON.parse(raw));
    const migrated = migrateLegacyFitness();
    if (migrated.fitness_initial || migrated.fitness_final) {
      saveMoveCheckIns(migrated);
      return migrated;
    }
    return {};
  } catch {
    return {};
  }
}

export function saveMoveCheckIns(state: CrackerMoveCheckIns): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MOVE_CHECKINS_STORAGE, JSON.stringify(normalizeMoveCheckIns(state)));
  } catch {
    /* ignore quota */
  }
}

export function formatSeconds(total?: number): string {
  if (total == null || !Number.isFinite(total)) return "—";
  const m = Math.floor(total / 60);
  const s = Math.round(total % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function parseTimeToSeconds(raw: string): number | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  if (trimmed.includes(":")) {
    const [mPart, sPart] = trimmed.split(":");
    const m = Number(mPart);
    const s = Number(sPart);
    if (!Number.isFinite(m) || !Number.isFinite(s)) return undefined;
    return m * 60 + s;
  }
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : undefined;
}

export function parseOptionalNumber(raw: string): number | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : undefined;
}

export type ChangeDirection = "up" | "down" | "same" | "none";

/** Numerical change only — never labels results as good/bad. */
export function numericalChange(
  initial?: number,
  final?: number,
  opts?: { unit?: string; invertDisplay?: boolean; asTime?: boolean },
): { text: string; direction: ChangeDirection } {
  if (initial == null || final == null) return { text: "—", direction: "none" };
  const diff = final - initial;
  if (diff === 0) return { text: "0", direction: "same" };
  const abs = Math.abs(diff);
  const formatted = opts?.asTime ? formatSeconds(abs) : opts?.unit ? `${abs}${opts.unit}` : String(abs);
  const sign = diff > 0 ? "+" : "−";
  return {
    text: `${sign}${formatted}`,
    direction: diff > 0 ? "up" : "down",
  };
}

export function hasFitnessData(entry?: FitnessCheckIn): boolean {
  if (!entry) return false;
  return (
    entry.deadliftReps != null ||
    entry.deadliftLoadKg != null ||
    entry.cardio500Seconds != null ||
    entry.pushupReps != null ||
    entry.situpReps != null ||
    entry.gymConfidence != null ||
    entry.finisherSeconds != null ||
    entry.finisherThrusterKg != null
  );
}

export function hasInBodyData(entry?: InBodyCheckIn): boolean {
  if (!entry) return false;
  return (
    entry.skeletalMuscleMassKg != null ||
    entry.bodyFatPercent != null ||
    entry.visceralFat != null
  );
}

export function hasMeasurementsData(entry?: MeasurementsCheckIn): boolean {
  if (!entry) return false;
  return entry.chestCm != null || entry.waistCm != null || entry.hipsCm != null;
}

export function stampLoggedAt<T extends { loggedAt?: string }>(entry: T): T {
  return { ...entry, loggedAt: new Date().toISOString() };
}
