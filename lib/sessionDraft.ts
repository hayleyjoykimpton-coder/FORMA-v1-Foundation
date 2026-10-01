import type { Exercise, Workout } from "./types";
import type { SessionDraftStored } from "./migrations";

export function draftHasProgress(draft: SessionDraftStored | null | undefined): boolean {
  if (!draft) return false;
  if (draft.exerciseIndex > 0) return true;
  return draft.results.some(
    (result) =>
      Boolean(result.wodResult) ||
      result.sets.some((set) => set.complete || set.skipped),
  );
}

export function draftMatchesWorkout(
  draft: SessionDraftStored | null | undefined,
  workout: Workout,
  workouts: Workout[],
): boolean {
  if (!draft) return false;
  if (draft.workoutId === workout.id) return true;
  const idStillExists = workouts.some((item) => item.id === draft.workoutId);
  if (idStillExists) return false;
  const title = (draft.workoutTitle || draft.workout?.title || "").trim().toLowerCase();
  return Boolean(title) && title === workout.title.trim().toLowerCase();
}

export function findWorkoutForDraft(
  workouts: Workout[],
  draft: SessionDraftStored | null | undefined,
): Workout | null {
  if (!draft) return null;
  const byId = workouts.find((workout) => workout.id === draft.workoutId);
  if (byId) return byId;
  const title = (draft.workoutTitle || draft.workout?.title || "").trim().toLowerCase();
  if (title) {
    const byTitle = workouts.find((workout) => workout.title.trim().toLowerCase() === title);
    if (byTitle) return byTitle;
  }
  return draft.workout ?? workoutFromDraftResults(draft);
}

export function workoutFromDraftResults(draft: SessionDraftStored): Workout {
  if (draft.workout) return draft.workout;
  return {
    id: draft.workoutId,
    title: draft.workoutTitle?.trim() || "Workout",
    day: "",
    duration: 45,
    exercises: draft.results.map((result, index): Exercise => ({
      id: result.exerciseId || `draft-${index}`,
      exerciseId: result.libraryId,
      name: result.name,
      sets: Math.max(1, result.sets.length),
      repMin: result.repMin,
      repMax: result.repMax,
      weight: result.sets[0]?.weight ?? 0,
      rpe: result.sets[0]?.rpe ?? 7,
      notes: result.note ?? "",
      increment: result.increment,
      restSeconds: 75,
    })),
  };
}

export function storedSessionDraft(
  draft: {
    workoutId: string;
    exerciseIndex: number;
    results: SessionDraftStored["results"];
    readiness?: number;
  },
  workout: Workout | null | undefined,
  restRemaining = 0,
  live = true,
): SessionDraftStored {
  return {
    workoutId: draft.workoutId,
    exerciseIndex: draft.exerciseIndex,
    results: draft.results,
    readiness: draft.readiness,
    restRemaining,
    workoutTitle: workout?.title,
    workout: workout ?? undefined,
    live,
  };
}
