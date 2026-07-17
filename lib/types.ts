export type Season = "Foundation" | "Build" | "Peak" | "Align";

export type Exercise = {
  id: string;
  /**
   * Stable reference into the exercise database (`lib/exercises.ts`).
   * Optional for backward compatibility with user-created / legacy exercises;
   * the engine matches on this first and falls back to name.
   */
  exerciseId?: string;
  name: string;
  sets: number;
  repMin: number;
  repMax: number;
  weight: number;
  rpe: number;
  notes: string;
  increment: number;
  restSeconds: number;
};

export type Workout = {
  id: string;
  day: string;
  title: string;
  duration: number;
  exercises: Exercise[];
};

export type SetResult = {
  reps: number;
  weight: number;
  rpe: number;
  complete: boolean;
  /** Partial-session logging: a set that was left unfinished. */
  skipped?: boolean;
  completedAt?: string;
};

export type ExerciseResult = {
  exerciseId: string;
  /** Stable exercise-database id, used for cross-workout progression. */
  libraryId?: string;
  name: string;
  repMin: number;
  repMax: number;
  increment: number;
  sets: SetResult[];
  note?: string;
  discomfort?: number;
};

export type WorkoutSession = {
  id: string;
  workoutId: string;
  workoutTitle: string;
  completedAt: string;
  season: Season;
  /** Program week the session belongs to (for periodised analytics). */
  week?: number;
  notes?: string;
  exercises: ExerciseResult[];
};
