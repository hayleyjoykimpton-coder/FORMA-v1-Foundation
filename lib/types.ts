export type Season = "Foundation" | "Build" | "Peak" | "Align";

export type Exercise = {
  id: string;
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
};

export type ExerciseResult = {
  exerciseId: string;
  name: string;
  repMin: number;
  repMax: number;
  increment: number;
  sets: SetResult[];
};

export type WorkoutSession = {
  id: string;
  workoutId: string;
  workoutTitle: string;
  completedAt: string;
  season: Season;
  exercises: ExerciseResult[];
};
