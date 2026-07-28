/**
 * Default owner profile for this personal FORMA install.
 * Keeps Hayley's identity available when localStorage is empty
 * (new browser / fresh cloud VM) without wiping existing saved data.
 */

import { createProfile, loadProfile, saveProfile, type UserProfile } from "./user";
import { loadProgress, saveProgress, type ProgressEntry } from "./progress";

export const HAYLEY_PROFILE: UserProfile = createProfile({
  id: "hayley-forma",
  firstName: "Hayley",
  email: "",
  gender: "female",
  goal: "glutes",
  experienceLevel: "intermediate",
  trainingDays: 5,
  equipmentAccess: "full_gym",
  workoutLocation: "gym",
  preferredTrainingStyle: "strength",
  nutritionGoal: "recomp",
  weight: 62.4,
  height: 165,
  createdAt: "2026-01-01T00:00:00.000Z",
});

const BASELINE_PROGRESS: ProgressEntry = {
  id: "hayley-baseline",
  date: "2026-01-01T00:00:00.000Z",
  weight: 62.4,
  measurements: { waist: 70, hips: 96 },
  notes: "Baseline",
};

/**
 * Ensure Hayley's profile (and a baseline progress row) exist.
 * Never overwrites an existing profile, progress log, or photos.
 */
export function ensureHayleyData(): UserProfile {
  const existing = loadProfile();
  if (existing) {
    // Earlier demos used Sophia/Emma — keep their training prefs, restore Hayley's name.
    if (existing.firstName === "Sophia" || existing.firstName === "Emma") {
      const updated: UserProfile = {
        ...existing,
        firstName: "Hayley",
        weight: existing.weight ?? HAYLEY_PROFILE.weight,
        height: existing.height ?? HAYLEY_PROFILE.height,
      };
      saveProfile(updated);
      const progress = loadProgress();
      if (!progress.length) saveProgress([BASELINE_PROGRESS]);
      return updated;
    }
    return existing;
  }

  saveProfile(HAYLEY_PROFILE);

  const progress = loadProgress();
  if (!progress.length) {
    saveProgress([BASELINE_PROGRESS]);
  }

  return HAYLEY_PROFILE;
}

/** Carry programmed weights across a programme rebuild by stable exercise id. */
export function transferExerciseWeights<T extends { exercises: { exerciseId?: string; weight: number }[] }>(
  previous: T[],
  next: T[],
): T[] {
  const byId = new Map<string, number>();
  for (const workout of previous) {
    for (const exercise of workout.exercises) {
      if (exercise.exerciseId && exercise.weight > 0) {
        byId.set(exercise.exerciseId, exercise.weight);
      }
    }
  }
  return next.map((workout) => ({
    ...workout,
    exercises: workout.exercises.map((exercise) => {
      const kept = exercise.exerciseId ? byId.get(exercise.exerciseId) : undefined;
      return kept != null ? { ...exercise, weight: kept } : exercise;
    }),
  }));
}
