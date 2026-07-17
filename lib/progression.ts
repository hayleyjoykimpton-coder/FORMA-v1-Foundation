/**
 * FORMA progression engine.
 *
 * Autoregulated double progression: when every completed set reaches the top
 * of the rep range at a comfortable effort, load goes up; when effort is very
 * high, load holds or backs off. Intensity thresholds respect the current
 * phase (Foundation is deliberately conservative). Also provides estimated 1RM
 * and personal-best tracking.
 */

import type { Exercise, ExerciseResult, SetResult, Workout, WorkoutSession } from "./types";
import type { PhaseDefinition } from "./program";

const uid = () => Math.random().toString(36).slice(2, 10);

export type Recommendation = {
  title: string;
  detail: string;
  targetWeight: number;
};

/** Estimated 1RM (Epley). Returns 0 for empty/invalid input. */
export function estimate1RM(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

export function setE1RM(set: SetResult): number {
  return estimate1RM(set.weight, set.reps);
}

/** Best estimated 1RM achieved for an exercise across all history. */
export function bestE1RM(libraryId: string | undefined, name: string, history: WorkoutSession[]): number {
  let best = 0;
  for (const session of history) {
    for (const result of session.exercises) {
      if (!matchesExercise(result, libraryId, undefined, name)) continue;
      for (const set of result.sets) {
        if (set.complete) best = Math.max(best, setE1RM(set));
      }
    }
  }
  return best;
}

function matchesExercise(
  result: ExerciseResult,
  libraryId: string | undefined,
  instanceId: string | undefined,
  name: string,
): boolean {
  if (libraryId && result.libraryId && result.libraryId === libraryId) return true;
  if (instanceId && result.exerciseId === instanceId) return true;
  return result.name === name;
}

/** Most recent completed logging for an exercise, if any. */
function lastResult(exercise: Exercise, history: WorkoutSession[]): ExerciseResult | undefined {
  return history
    .flatMap((session) => session.exercises)
    .filter((result) => matchesExercise(result, exercise.exerciseId, exercise.id, exercise.name))
    .at(-1);
}

/**
 * Recommend how to load an exercise next, based on the previous session and
 * the current phase intensity ceiling.
 */
export function getRecommendation(
  exercise: Exercise,
  history: WorkoutSession[],
  phase?: PhaseDefinition,
): Recommendation {
  // Phase-aware effort ceiling for "ready to add load".
  const increaseCeiling = phase ? Math.min(9, phase.rpeMax + 1) : 8.5;
  const backoffFloor = 9.5;

  const previous = lastResult(exercise, history);

  if (!previous) {
    return {
      title: "Establish your baseline",
      detail: `${exercise.weight} kg for ${exercise.repMin}–${exercise.repMax} reps at about RPE ${exercise.rpe}.`,
      targetWeight: exercise.weight,
    };
  }

  const completed = previous.sets.filter((set) => set.complete);
  if (!completed.length) {
    return {
      title: "Repeat the planned target",
      detail: "The previous session was not completed.",
      targetWeight: exercise.weight,
    };
  }

  const allTopRange = completed.every((set) => set.reps >= exercise.repMax);
  const averageRpe = completed.reduce((sum, set) => sum + set.rpe, 0) / completed.length;
  const previousWeight = completed[0]?.weight ?? exercise.weight;

  if (allTopRange && averageRpe <= increaseCeiling) {
    const next = previousWeight + exercise.increment;
    return {
      title: `Increase to ${next} kg`,
      detail: `You reached the top of the rep range with manageable effort.`,
      targetWeight: next,
    };
  }

  if (averageRpe >= backoffFloor) {
    const next = Math.max(0, previousWeight - exercise.increment);
    return {
      title: `Reduce to ${next} kg`,
      detail: "Effort was very high. Reduce the load and rebuild clean reps.",
      targetWeight: next,
    };
  }

  return {
    title: `Stay at ${previousWeight} kg`,
    detail: `Add reps until every completed set reaches ${exercise.repMax}.`,
    targetWeight: previousWeight,
  };
}

/** Build the per-set draft for a session, seeding weights from recommendations. */
export function createSessionResults(
  workout: Workout,
  history: WorkoutSession[],
  phase?: PhaseDefinition,
): ExerciseResult[] {
  return workout.exercises.map((exercise) => {
    const recommendation = getRecommendation(exercise, history, phase);
    return {
      exerciseId: exercise.id,
      libraryId: exercise.exerciseId,
      name: exercise.name,
      repMin: exercise.repMin,
      repMax: exercise.repMax,
      increment: exercise.increment,
      sets: Array.from({ length: exercise.sets }, () => ({
        reps: exercise.repMin,
        weight: recommendation.targetWeight,
        rpe: exercise.rpe,
        complete: false,
      })),
    };
  });
}

export type PersonalBest = {
  name: string;
  bestWeight: number;
  bestReps: number;
  bestE1RM: number;
};

/** Personal bests per exercise (keyed by libraryId when available, else name). */
export function getPersonalBests(history: WorkoutSession[]): PersonalBest[] {
  const bests = new Map<string, PersonalBest>();
  for (const session of history) {
    for (const result of session.exercises) {
      const key = result.libraryId ?? result.name;
      for (const set of result.sets) {
        if (!set.complete) continue;
        const e1rm = setE1RM(set);
        const current = bests.get(key) ?? { name: result.name, bestWeight: 0, bestReps: 0, bestE1RM: 0 };
        bests.set(key, {
          name: result.name,
          bestWeight: Math.max(current.bestWeight, set.weight),
          bestReps: Math.max(current.bestReps, set.reps),
          bestE1RM: Math.max(current.bestE1RM, e1rm),
        });
      }
    }
  }
  return Array.from(bests.values());
}

export { uid };
