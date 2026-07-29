/**
 * Progress CSV export — sessions, body metrics, InBody scans.
 */

import type { WorkoutSession } from "./types";
import type { ProgressEntry } from "./progress";
import type { InBodyState } from "./inbody";

function csvEscape(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function sessionVolume(session: WorkoutSession): number {
  return session.exercises.reduce(
    (sum, exercise) =>
      sum +
      exercise.sets.reduce(
        (setSum, set) => (set.complete ? setSum + set.reps * set.weight : setSum),
        0,
      ),
    0,
  );
}

export function buildSessionsCsv(history: WorkoutSession[]): string {
  const header = ["completedAt", "workoutTitle", "season", "week", "readiness", "volume", "notes"];
  const rows = [...history]
    .sort((a, b) => a.completedAt.localeCompare(b.completedAt))
    .map((session) => [
      session.completedAt,
      session.workoutTitle,
      session.season,
      session.week ?? "",
      session.readiness ?? "",
      Math.round(sessionVolume(session)),
      session.notes ?? "",
    ]);
  return [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
}

export function buildWeightCsv(entries: ProgressEntry[]): string {
  const header = [
    "date",
    "weight",
    "waist",
    "hips",
    "glutes",
    "thigh",
    "arm",
    "chest",
    "notes",
  ];
  const rows = [...entries]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((entry) => [
      entry.date.slice(0, 10),
      entry.weight ?? "",
      entry.measurements.waist ?? "",
      entry.measurements.hips ?? "",
      entry.measurements.glutes ?? "",
      entry.measurements.thigh ?? "",
      entry.measurements.arm ?? "",
      entry.measurements.chest ?? "",
      entry.notes ?? "",
    ]);
  return [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
}

export function buildInBodyCsv(state: InBodyState): string {
  const header = [
    "date",
    "weightKg",
    "skeletalMuscleMassKg",
    "bodyFatPercent",
    "bodyFatMassKg",
    "leanBodyMassKg",
    "visceralFatLevel",
    "bmi",
    "bmrKcal",
    "notes",
  ];
  const rows = state.scans.map((scan) => [
    scan.date,
    scan.weightKg ?? "",
    scan.skeletalMuscleMassKg ?? "",
    scan.bodyFatPercent ?? "",
    scan.bodyFatMassKg ?? "",
    scan.leanBodyMassKg ?? "",
    scan.visceralFatLevel ?? "",
    scan.bmi ?? "",
    scan.bmrKcal ?? "",
    scan.notes ?? "",
  ]);
  return [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
}

export function downloadCsv(filename: string, content: string): void {
  if (typeof window === "undefined") return;
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function exportProgressBundle(input: {
  history: WorkoutSession[];
  progress: ProgressEntry[];
  inbody: InBodyState;
}): void {
  const stamp = new Date().toISOString().slice(0, 10);
  downloadCsv(`forma-sessions-${stamp}.csv`, buildSessionsCsv(input.history));
  downloadCsv(`forma-weight-${stamp}.csv`, buildWeightCsv(input.progress));
  downloadCsv(`forma-inbody-${stamp}.csv`, buildInBodyCsv(input.inbody));
}
