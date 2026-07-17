/**
 * FORMA progress & body-transformation tracking.
 *
 * Time-series journey data kept in its own versioned storage, separate from
 * profile (`forma-profile-v1`), workouts (`forma-workouts-v12`) and history
 * (`forma-history-v12`):
 *   - body metrics (weight + measurements) → `forma-progress-v1`
 *   - progress photos                        → `forma-photos-v1`
 *
 * FORMA frames progress around strength, body composition, performance and
 * consistency — never weight loss, appearance pressure or "fixing" the body.
 */

import type { UserProfile } from "./user";

export const PROGRESS_STORAGE = "forma-progress-v1";
export const PHOTOS_STORAGE = "forma-photos-v1";

export type MeasurementKey = "waist" | "hips" | "glutes" | "thigh" | "arm" | "chest";

export const MEASUREMENT_KEYS: MeasurementKey[] = ["waist", "hips", "glutes", "thigh", "arm", "chest"];

export const MEASUREMENT_LABELS: Record<MeasurementKey, string> = {
  waist: "Waist",
  hips: "Hips",
  glutes: "Glutes",
  thigh: "Thigh",
  arm: "Arm",
  chest: "Chest",
};

export type Measurements = Partial<Record<MeasurementKey, number>>;

export type ProgressEntry = {
  id: string;
  date: string; // ISO
  weight: number | null;
  measurements: Measurements;
  notes: string;
};

export type PhotoCategory = "front" | "side" | "back";

export const PHOTO_CATEGORIES: PhotoCategory[] = ["front", "side", "back"];

export const PHOTO_LABELS: Record<PhotoCategory, string> = {
  front: "Front",
  side: "Side",
  back: "Back",
};

export type ProgressPhoto = {
  id: string;
  date: string; // ISO
  image: string; // data URL
  category: PhotoCategory;
  notes: string;
};

export const uid = () => Math.random().toString(36).slice(2, 10);

// --------------------------------------------------------------------------
// Storage (versioned, fault-tolerant)
// --------------------------------------------------------------------------

function byDateAsc<T extends { date: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function loadProgress(): ProgressEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PROGRESS_STORAGE);
    return raw ? byDateAsc(JSON.parse(raw) as ProgressEntry[]) : [];
  } catch {
    return [];
  }
}

export function saveProgress(entries: ProgressEntry[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PROGRESS_STORAGE, JSON.stringify(byDateAsc(entries)));
}

export function loadPhotos(): ProgressPhoto[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PHOTOS_STORAGE);
    return raw ? byDateAsc(JSON.parse(raw) as ProgressPhoto[]) : [];
  } catch {
    return [];
  }
}

export function savePhotos(photos: ProgressPhoto[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PHOTOS_STORAGE, JSON.stringify(byDateAsc(photos)));
}

// --------------------------------------------------------------------------
// Derived metrics
// --------------------------------------------------------------------------

export function latestEntry(entries: ProgressEntry[]): ProgressEntry | null {
  return entries.length ? entries[entries.length - 1] : null;
}

export function firstEntry(entries: ProgressEntry[]): ProgressEntry | null {
  return entries.length ? entries[0] : null;
}

/** Most recent known body weight (log first, then profile fallback). */
export function currentWeight(entries: ProgressEntry[], profile: UserProfile | null): number | null {
  for (let i = entries.length - 1; i >= 0; i -= 1) {
    if (typeof entries[i].weight === "number") return entries[i].weight;
  }
  return profile?.weight ?? null;
}

export function startingWeight(entries: ProgressEntry[], profile: UserProfile | null): number | null {
  for (const entry of entries) {
    if (typeof entry.weight === "number") return entry.weight;
  }
  return profile?.weight ?? null;
}

export function weightChange(entries: ProgressEntry[], profile: UserProfile | null): number | null {
  const current = currentWeight(entries, profile);
  const start = startingWeight(entries, profile);
  if (current === null || start === null) return null;
  return Math.round((current - start) * 10) / 10;
}

function measurementAt(entries: ProgressEntry[], key: MeasurementKey, fromStart: boolean): number | null {
  const ordered = fromStart ? entries : [...entries].reverse();
  for (const entry of ordered) {
    const value = entry.measurements[key];
    if (typeof value === "number") return value;
  }
  return null;
}

export function latestMeasurement(entries: ProgressEntry[], key: MeasurementKey): number | null {
  return measurementAt(entries, key, false);
}

export function firstMeasurement(entries: ProgressEntry[], key: MeasurementKey): number | null {
  return measurementAt(entries, key, true);
}

export function measurementDelta(entries: ProgressEntry[], key: MeasurementKey): number | null {
  const latest = latestMeasurement(entries, key);
  const first = firstMeasurement(entries, key);
  if (latest === null || first === null) return null;
  return Math.round((latest - first) * 10) / 10;
}

export type WeightPoint = { date: string; value: number };

export function weightSeries(entries: ProgressEntry[]): WeightPoint[] {
  return entries
    .filter((entry): entry is ProgressEntry & { weight: number } => typeof entry.weight === "number")
    .map((entry) => ({ date: entry.date, value: entry.weight }));
}

/** Whole weeks between the first entry (or profile creation) and now. */
export function weeksTracked(entries: ProgressEntry[], profile: UserProfile | null): number {
  const startIso = firstEntry(entries)?.date ?? profile?.createdAt;
  if (!startIso) return 0;
  const days = (Date.now() - new Date(startIso).getTime()) / 86_400_000;
  return Math.max(0, Math.floor(days / 7));
}
