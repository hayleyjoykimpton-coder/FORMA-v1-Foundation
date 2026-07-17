/**
 * FORMA persistence & migration layer.
 *
 * Introduces the `forma-*-v12` storage namespace for the scientific engine,
 * while safely migrating existing `-v11` users (attaching stable exercise ids
 * to their workouts and history) and seeding new users with the FORMA
 * Foundation programme. Legacy keys are never deleted.
 */

import { EXERCISES, defaultIncrement, findExerciseIdByName } from "./exercises";
import { FORMA_PROGRAM, buildWorkoutsForWeek } from "./program";
import type { Exercise, ExerciseResult, Workout, WorkoutSession } from "./types";

export const STORAGE = {
  workouts: "forma-workouts-v12",
  history: "forma-history-v12",
  program: "forma-program-v12",
  // Ancillary trackers are unchanged across versions.
  water: "forma-water-v1",
  journal: "forma-journal-v1",
};

const LEGACY = {
  workouts: "forma-workouts-v11",
  history: "forma-history-v11",
};

export type LoadedState = {
  workouts: Workout[];
  history: WorkoutSession[];
  week: number;
  water: number;
  journal: Record<string, string>;
  migrated: boolean;
};

function normalizeExercise(exercise: Exercise): Exercise {
  const exerciseId = exercise.exerciseId ?? findExerciseIdByName(exercise.name);
  const equipment = exerciseId ? EXERCISES[exerciseId]?.equipment : undefined;
  return {
    ...exercise,
    exerciseId,
    increment: exercise.increment ?? (equipment ? defaultIncrement(equipment) : 2.5),
    restSeconds: exercise.restSeconds ?? 90,
  };
}

export function normalizeWorkouts(workouts: Workout[]): Workout[] {
  return workouts.map((workout) => ({
    ...workout,
    exercises: workout.exercises.map(normalizeExercise),
  }));
}

function migrateHistory(history: WorkoutSession[]): WorkoutSession[] {
  return history.map((session) => ({
    ...session,
    exercises: session.exercises.map(
      (result): ExerciseResult => ({
        ...result,
        libraryId: result.libraryId ?? findExerciseIdByName(result.name),
      }),
    ),
  }));
}

function readWater(): number {
  try {
    const raw = window.localStorage.getItem(STORAGE.water);
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as { date: string; count: number };
    return parsed.date === new Date().toDateString() ? parsed.count : 0;
  } catch {
    return 0;
  }
}

function readJournal(): Record<string, string> {
  try {
    const raw = window.localStorage.getItem(STORAGE.journal);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function persistCore(workouts: Workout[], history: WorkoutSession[], week: number) {
  window.localStorage.setItem(STORAGE.workouts, JSON.stringify(workouts));
  window.localStorage.setItem(STORAGE.history, JSON.stringify(history));
  window.localStorage.setItem(STORAGE.program, JSON.stringify({ week, programId: FORMA_PROGRAM.id }));
}

/**
 * Load FORMA state, migrating or seeding as needed.
 * Precedence: existing v12 data → migrate legacy v11 → seed new user.
 */
export function loadForma(): LoadedState {
  const seed = (): LoadedState => ({
    workouts: buildWorkoutsForWeek(1),
    history: [],
    week: 1,
    water: 0,
    journal: {},
    migrated: false,
  });

  if (typeof window === "undefined") return seed();

  try {
    const water = readWater();
    const journal = readJournal();

    // 1. Current-version data.
    const rawWorkouts = window.localStorage.getItem(STORAGE.workouts);
    if (rawWorkouts) {
      const workouts = normalizeWorkouts(JSON.parse(rawWorkouts) as Workout[]);
      const history = JSON.parse(window.localStorage.getItem(STORAGE.history) ?? "[]") as WorkoutSession[];
      const program = JSON.parse(window.localStorage.getItem(STORAGE.program) ?? "{}") as { week?: number };
      return {
        workouts: workouts.length ? workouts : buildWorkoutsForWeek(1),
        history,
        week: program.week ?? 1,
        water,
        journal,
        migrated: false,
      };
    }

    // 2. Migrate legacy v11 data (keep the originals intact).
    const rawLegacy = window.localStorage.getItem(LEGACY.workouts);
    if (rawLegacy) {
      const workouts = normalizeWorkouts(JSON.parse(rawLegacy) as Workout[]);
      const history = migrateHistory(
        JSON.parse(window.localStorage.getItem(LEGACY.history) ?? "[]") as WorkoutSession[],
      );
      const resolved = workouts.length ? workouts : buildWorkoutsForWeek(1);
      persistCore(resolved, history, 1);
      return { workouts: resolved, history, week: 1, water, journal, migrated: true };
    }

    // 3. New user — seed the FORMA Foundation programme.
    const fresh = seed();
    persistCore(fresh.workouts, fresh.history, fresh.week);
    return fresh;
  } catch {
    return seed();
  }
}
