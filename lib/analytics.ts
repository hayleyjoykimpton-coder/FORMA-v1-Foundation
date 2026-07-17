/**
 * FORMA analytics.
 *
 * Strength progression (volume, e1RM trends), consistency, and physique-focused
 * "body sculpt" metrics (glute / upper / core volume, adherence). Pure functions
 * over the workout + history data — no side effects.
 */

import { EXERCISES, findExerciseIdByName } from "./exercises";
import type { MuscleGroup } from "./exercises";
import { setE1RM } from "./progression";
import type { Workout, WorkoutSession } from "./types";

const DAY_MS = 86_400_000;

export function sessionVolume(session: WorkoutSession): number {
  return session.exercises.reduce(
    (total, exercise) =>
      total +
      exercise.sets
        .filter((set) => set.complete)
        .reduce((sum, set) => sum + set.weight * set.reps, 0),
    0,
  );
}

export function totalCompletedSets(history: WorkoutSession[]): number {
  return history.reduce(
    (total, session) =>
      total + session.exercises.reduce((sum, exercise) => sum + exercise.sets.filter((set) => set.complete).length, 0),
    0,
  );
}

export function plannedWeeklySets(workouts: Workout[]): number {
  return workouts.reduce(
    (total, workout) => total + workout.exercises.reduce((sum, exercise) => sum + exercise.sets, 0),
    0,
  );
}

export function weekSessionCount(history: WorkoutSession[]): number {
  const now = Date.now();
  return history.filter((session) => now - new Date(session.completedAt).getTime() <= 7 * DAY_MS).length;
}

export function computeStreak(history: WorkoutSession[]): number {
  const days = new Set(history.map((session) => new Date(session.completedAt).toDateString()));
  const cursor = new Date();
  if (!days.has(cursor.toDateString())) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(cursor.toDateString())) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export type VolumePoint = { label: string; value: number };

export function buildVolumeSeries(history: WorkoutSession[], count = 6): VolumePoint[] {
  return [...history].slice(-count).map((session) => ({
    label: new Date(session.completedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    value: sessionVolume(session),
  }));
}

export type StrengthProgressRow = { name: string; base: number; current: number };

/**
 * Planned vs. latest working weight per exercise. Matching prefers the stable
 * exercise id and falls back to name so legacy data still lines up.
 */
export function computeStrengthProgress(workouts: Workout[], history: WorkoutSession[]): StrengthProgressRow[] {
  const plannedByKey = new Map<string, { name: string; base: number }>();
  for (const workout of workouts) {
    for (const exercise of workout.exercises) {
      const key = exercise.exerciseId ?? exercise.name;
      if (!plannedByKey.has(key)) plannedByKey.set(key, { name: exercise.name, base: exercise.weight });
    }
  }

  const latestByKey = new Map<string, number>();
  for (const session of history) {
    for (const result of session.exercises) {
      const done = result.sets.filter((set) => set.complete);
      if (!done.length) continue;
      const key = result.libraryId ?? result.name;
      latestByKey.set(key, done[0].weight);
    }
  }

  return Array.from(plannedByKey.entries())
    .map(([key, { name, base }]) => ({ name, base, current: latestByKey.get(key) ?? base }))
    .slice(0, 5);
}

/** Total completed working sets targeting a given muscle group (primary). */
export function muscleVolume(history: WorkoutSession[], group: MuscleGroup, sinceDays?: number): number {
  const cutoff = sinceDays ? Date.now() - sinceDays * DAY_MS : 0;
  let sets = 0;
  for (const session of history) {
    if (cutoff && new Date(session.completedAt).getTime() < cutoff) continue;
    for (const result of session.exercises) {
      const libraryId = result.libraryId ?? findExerciseIdByName(result.name);
      const definition = libraryId ? EXERCISES[libraryId] : undefined;
      if (!definition) continue;
      if (definition.primaryMuscles.includes(group)) {
        sets += result.sets.filter((set) => set.complete).length;
      }
    }
  }
  return sets;
}

export type BodySculptMetrics = {
  gluteVolume: number;
  upperVolume: number;
  coreSessions: number;
  bestE1RM: number;
  adherence: number;
};

/**
 * Physique-focused summary over a recent window (default 28 days):
 * glute-set volume, upper-body-set volume, number of sessions that hit core,
 * best estimated 1RM, and adherence versus a weekly session target.
 */
export function bodySculptMetrics(
  history: WorkoutSession[],
  weeklyTarget = 5,
  windowDays = 28,
): BodySculptMetrics {
  const cutoff = Date.now() - windowDays * DAY_MS;
  const recent = history.filter((session) => new Date(session.completedAt).getTime() >= cutoff);

  const gluteVolume = muscleVolume(recent, "glutes");
  const upperVolume =
    muscleVolume(recent, "back") + muscleVolume(recent, "shoulders") + muscleVolume(recent, "chest");

  let coreSessions = 0;
  let bestE1RM = 0;
  for (const session of recent) {
    let hasCore = false;
    for (const result of session.exercises) {
      const libraryId = result.libraryId ?? findExerciseIdByName(result.name);
      const definition = libraryId ? EXERCISES[libraryId] : undefined;
      const completed = result.sets.filter((set) => set.complete);
      if (definition?.primaryMuscles.includes("core") && completed.length) hasCore = true;
      for (const set of completed) bestE1RM = Math.max(bestE1RM, setE1RM(set));
    }
    if (hasCore) coreSessions += 1;
  }

  const weeks = Math.max(1, windowDays / 7);
  const adherence = Math.min(100, Math.round((recent.length / (weeklyTarget * weeks)) * 100));

  return { gluteVolume, upperVolume, coreSessions, bestE1RM, adherence };
}
