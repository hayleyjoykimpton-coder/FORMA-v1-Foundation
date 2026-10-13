/**
 * The Yard Gym class log — counts as that week's programmed session
 * when a member trains in class instead of the gym program.
 */

import type { CrackerLevel } from "./crackerProgram";
import type { Season, Workout, WorkoutSession } from "./types";

export const TYG_CLASS_NOTE =
  "Logged as a The Yard Gym class instead of the gym program.";

export function tygClassTitle(workoutTitle: string): string {
  return `${workoutTitle} · TYG class`;
}

export function isTygClassSession(session: Pick<WorkoutSession, "workoutTitle" | "notes">): boolean {
  return /TYG class/i.test(session.workoutTitle) || session.notes === TYG_CLASS_NOTE;
}

export function buildTygClassSession(input: {
  id: string;
  workout: Workout;
  week: number;
  level: CrackerLevel;
  season: Season;
}): WorkoutSession {
  const completedAt = new Date().toISOString();
  return {
    id: input.id,
    workoutId: input.workout.id,
    workoutTitle: tygClassTitle(input.workout.title),
    completedAt,
    season: input.season,
    week: input.week,
    notes: TYG_CLASS_NOTE,
    crackerLevel: input.level,
    exercises: [
      {
        exerciseId: "tyg-class",
        name: "The Yard Gym class",
        repMin: 1,
        repMax: 1,
        increment: 0,
        sets: [{ reps: 1, weight: 0, rpe: 0, complete: true, completedAt }],
      },
    ],
  };
}
