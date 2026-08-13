/**
 * Progress & challenge CSV export — sessions, body metrics, InBody, challenge summary.
 */

import { computeStreak, sessionVolume, totalCompletedSets, weekSessionCount } from "./analytics";
import type { WorkoutSession } from "./types";
import type { ProgressEntry } from "./progress";
import type { InBodyState } from "./inbody";
import { CLUB_LABELS, GENDER_LABELS, type LifeSoulClub, type UserProfile } from "./user";

function csvEscape(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function sessionVolumeRow(session: WorkoutSession): number {
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
      Math.round(sessionVolumeRow(session)),
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

/** One-row challenge summary for emailing to coach / judging winners */
export function buildChallengeSummaryCsv(input: {
  profile: UserProfile;
  history: WorkoutSession[];
  progress: ProgressEntry[];
  inbody: InBodyState;
}): string {
  const { profile, history, progress, inbody } = input;
  const sortedProgress = [...progress].sort((a, b) => a.date.localeCompare(b.date));
  const startWeight = sortedProgress.find((e) => e.weight != null)?.weight ?? profile.weight;
  const latestProgress = [...sortedProgress].reverse().find((e) => e.weight != null);
  const latestWeight = latestProgress?.weight ?? profile.weight;
  const weightChange =
    startWeight != null && latestWeight != null ? Number((latestWeight - startWeight).toFixed(2)) : "";
  const latestInBody = [...inbody.scans].sort((a, b) => b.date.localeCompare(a.date))[0];
  const clubLabel = profile.club ? CLUB_LABELS[profile.club as LifeSoulClub] : "";
  const totalVolume = history.reduce((sum, s) => sum + sessionVolume(s), 0);

  const header = [
    "exportDate",
    "firstName",
    "email",
    "club",
    "gender",
    "goal",
    "sessionsCompleted",
    "totalSetsCompleted",
    "currentStreakDays",
    "sessionsThisWeek",
    "startWeightKg",
    "latestWeightKg",
    "weightChangeKg",
    "latestBodyFatPercent",
    "latestSkeletalMuscleKg",
    "latestInBodyDate",
    "memberSince",
  ];

  const row = [
    new Date().toISOString().slice(0, 10),
    profile.firstName,
    profile.email,
    clubLabel,
    GENDER_LABELS[profile.gender],
    profile.goal,
    history.length,
    totalCompletedSets(history),
    computeStreak(history),
    weekSessionCount(history),
    startWeight ?? "",
    latestWeight ?? "",
    weightChange,
    latestInBody?.bodyFatPercent ?? "",
    latestInBody?.skeletalMuscleMassKg ?? "",
    latestInBody?.date?.slice(0, 10) ?? "",
    profile.createdAt.slice(0, 10),
  ];

  return [header, row].map((r) => r.map(csvEscape).join(",")).join("\n");
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
  downloadCsv(`life-and-soul-sessions-${stamp}.csv`, buildSessionsCsv(input.history));
  downloadCsv(`life-and-soul-weight-${stamp}.csv`, buildWeightCsv(input.progress));
  downloadCsv(`life-and-soul-inbody-${stamp}.csv`, buildInBodyCsv(input.inbody));
}

/** Challenge-friendly export: summary + detail files */
export function exportChallengeBundle(input: {
  profile: UserProfile;
  history: WorkoutSession[];
  progress: ProgressEntry[];
  inbody: InBodyState;
}): void {
  const stamp = new Date().toISOString().slice(0, 10);
  const clubSlug = input.profile.club || "member";
  const prefix = `life-and-soul-challenge-${clubSlug}-${input.profile.firstName.replace(/\s+/g, "-").toLowerCase()}-${stamp}`;
  downloadCsv(`${prefix}-summary.csv`, buildChallengeSummaryCsv(input));
  downloadCsv(`${prefix}-sessions.csv`, buildSessionsCsv(input.history));
  downloadCsv(`${prefix}-weight.csv`, buildWeightCsv(input.progress));
  if (input.inbody.scans.length) {
    downloadCsv(`${prefix}-inbody.csv`, buildInBodyCsv(input.inbody));
  }
}
