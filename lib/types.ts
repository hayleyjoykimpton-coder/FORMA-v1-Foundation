export type SetLog = {
  id: string;
  weight: string;
  reps: string;
  rpe: string;
  done: boolean;
};

export type Exercise = {
  id: string;
  name: string;
  targetSets: number;
  repRange: string;
  targetRpe: string;
  notes: string;
  previousWeight: string;
};

export type Workout = {
  id: string;
  name: string;
  day: string;
  duration: number;
  focus: string;
  exercises: Exercise[];
};

export type ActiveExercise = Exercise & { sets: SetLog[] };

export type ActiveWorkout = {
  workoutId: string;
  name: string;
  startedAt: string;
  exercises: ActiveExercise[];
  notes: string;
};

export type WorkoutHistory = {
  id: string;
  workoutId: string;
  name: string;
  date: string;
  durationMinutes: number;
  completedSets: number;
  totalSets: number;
  notes: string;
  exercises: ActiveExercise[];
};

export type AppState = {
  workouts: Workout[];
  activeWorkout: ActiveWorkout | null;
  history: WorkoutHistory[];
};
