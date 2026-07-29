/**
 * InBody scan results — body composition snapshots.
 * Local: forma-inbody-v1. Cloud: nested under programme.inbody.
 *
 * Framed around strength & composition (muscle, lean mass) — not weight-loss pressure.
 */

export const INBODY_STORAGE_KEY = "forma-inbody-v1";

export type InBodyScan = {
  id: string;
  date: string; // YYYY-MM-DD
  loggedAt: string; // ISO
  weightKg: number | null;
  skeletalMuscleMassKg: number | null;
  bodyFatMassKg: number | null;
  bodyFatPercent: number | null;
  leanBodyMassKg: number | null;
  visceralFatLevel: number | null;
  bmi: number | null;
  bmrKcal: number | null;
  notes: string;
};

export type InBodyState = {
  scans: InBodyScan[];
};

export const EMPTY_INBODY: InBodyState = { scans: [] };

const uid = () => Math.random().toString(36).slice(2, 10);

export function localDateKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function optionalNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 10) / 10;
}

function byDateAsc(scans: InBodyScan[]): InBodyScan[] {
  return [...scans].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function normalizeInBody(raw: unknown): InBodyState {
  if (!raw || typeof raw !== "object") return { scans: [] };
  const data = raw as Partial<InBodyState>;
  const scans = Array.isArray(data.scans)
    ? data.scans
        .filter(
          (scan): scan is InBodyScan =>
            Boolean(scan && typeof scan === "object" && typeof scan.id === "string" && typeof scan.date === "string"),
        )
        .map((scan) => ({
          id: scan.id,
          date: scan.date.slice(0, 10),
          loggedAt: typeof scan.loggedAt === "string" ? scan.loggedAt : new Date().toISOString(),
          weightKg: optionalNumber(scan.weightKg),
          skeletalMuscleMassKg: optionalNumber(scan.skeletalMuscleMassKg),
          bodyFatMassKg: optionalNumber(scan.bodyFatMassKg),
          bodyFatPercent: optionalNumber(scan.bodyFatPercent),
          leanBodyMassKg: optionalNumber(scan.leanBodyMassKg),
          visceralFatLevel: optionalNumber(scan.visceralFatLevel),
          bmi: optionalNumber(scan.bmi),
          bmrKcal: optionalNumber(scan.bmrKcal),
          notes: typeof scan.notes === "string" ? scan.notes : "",
        }))
        .slice(-80)
    : [];
  return { scans: byDateAsc(scans) };
}

export function loadInBody(): InBodyState {
  if (typeof window === "undefined") return { scans: [] };
  try {
    const raw = window.localStorage.getItem(INBODY_STORAGE_KEY);
    return raw ? normalizeInBody(JSON.parse(raw)) : { scans: [] };
  } catch {
    return { scans: [] };
  }
}

export function saveInBody(state: InBodyState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(INBODY_STORAGE_KEY, JSON.stringify(normalizeInBody(state)));
}

export type InBodyDraft = {
  date?: string;
  weightKg?: string;
  skeletalMuscleMassKg?: string;
  bodyFatMassKg?: string;
  bodyFatPercent?: string;
  leanBodyMassKg?: string;
  visceralFatLevel?: string;
  bmi?: string;
  bmrKcal?: string;
  notes?: string;
};

export function addInBodyScan(state: InBodyState, draft: InBodyDraft): InBodyState {
  const scan: InBodyScan = {
    id: uid(),
    date: (draft.date || localDateKey()).slice(0, 10),
    loggedAt: new Date().toISOString(),
    weightKg: optionalNumber(draft.weightKg),
    skeletalMuscleMassKg: optionalNumber(draft.skeletalMuscleMassKg),
    bodyFatMassKg: optionalNumber(draft.bodyFatMassKg),
    bodyFatPercent: optionalNumber(draft.bodyFatPercent),
    leanBodyMassKg: optionalNumber(draft.leanBodyMassKg),
    visceralFatLevel: optionalNumber(draft.visceralFatLevel),
    bmi: optionalNumber(draft.bmi),
    bmrKcal: optionalNumber(draft.bmrKcal),
    notes: (draft.notes ?? "").trim(),
  };
  const hasMetric = [
    scan.weightKg,
    scan.skeletalMuscleMassKg,
    scan.bodyFatMassKg,
    scan.bodyFatPercent,
    scan.leanBodyMassKg,
    scan.visceralFatLevel,
    scan.bmi,
    scan.bmrKcal,
  ].some((value) => value !== null);
  if (!hasMetric && !scan.notes) return state;
  return normalizeInBody({ scans: [...state.scans, scan] });
}

export function removeInBodyScan(state: InBodyState, id: string): InBodyState {
  return { scans: state.scans.filter((scan) => scan.id !== id) };
}

export function latestInBodyScan(state: InBodyState): InBodyScan | null {
  return state.scans.length ? state.scans[state.scans.length - 1] : null;
}

export function previousInBodyScan(state: InBodyState): InBodyScan | null {
  return state.scans.length >= 2 ? state.scans[state.scans.length - 2] : null;
}

export function metricDelta(
  current: number | null,
  previous: number | null,
): number | null {
  if (current === null || previous === null) return null;
  return Math.round((current - previous) * 10) / 10;
}

export type InBodyMetricKey =
  | "weightKg"
  | "skeletalMuscleMassKg"
  | "bodyFatPercent"
  | "bodyFatMassKg"
  | "leanBodyMassKg"
  | "visceralFatLevel"
  | "bmi"
  | "bmrKcal";

export const INBODY_METRIC_LABELS: Record<InBodyMetricKey, string> = {
  weightKg: "Weight",
  skeletalMuscleMassKg: "Skeletal muscle",
  bodyFatPercent: "Body fat %",
  bodyFatMassKg: "Body fat mass",
  leanBodyMassKg: "Lean body mass",
  visceralFatLevel: "Visceral fat",
  bmi: "BMI",
  bmrKcal: "BMR",
};

export const INBODY_METRIC_UNITS: Record<InBodyMetricKey, string> = {
  weightKg: "kg",
  skeletalMuscleMassKg: "kg",
  bodyFatPercent: "%",
  bodyFatMassKg: "kg",
  leanBodyMassKg: "kg",
  visceralFatLevel: "",
  bmi: "",
  bmrKcal: "kcal",
};

/** Prefer rising for muscle/lean; falling for fat metrics when showing “positive” direction. */
export function metricPreferDown(key: InBodyMetricKey): boolean {
  return key === "bodyFatPercent" || key === "bodyFatMassKg" || key === "visceralFatLevel";
}

export function seriesForMetric(
  state: InBodyState,
  key: InBodyMetricKey,
): { label: string; value: number }[] {
  return state.scans
    .filter((scan) => typeof scan[key] === "number")
    .map((scan) => ({
      label: new Date(scan.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      value: scan[key] as number,
    }));
}
