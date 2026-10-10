/**
 * MY PROGRESS — derived from existing history, check-ins, and education ticks.
 * Does not store a second copy of results.
 */

import { crackerSessionIndex, type CrackerLevel } from "./crackerProgram";
import {
  getWeekChecklist,
  type MoveChecklistState,
} from "./crackerMoveChecklist";
import {
  hasFitnessData,
  hasInBodyData,
  hasMeasurementsData,
  type CrackerMoveCheckIns,
} from "./crackerMoveCheckIns";
import { sessionsCompletedThisCalendarWeek } from "./historyMerge";
import type { WorkoutSession } from "./types";

export const CRACKER_WORKOUTS_TARGET = 18;
export const CRACKER_SESSIONS_PER_WEEK = 3;

export type ChallengeProgress = {
  workoutsDone: number;
  workoutsTarget: number;
  educationDone: number;
  educationTarget: number;
  fitnessDone: number;
  fitnessTarget: number;
  inbodyDone: number;
  inbodyTarget: number;
  measurementsDone: number;
  measurementsTarget: number;
  completed: number;
  total: number;
  percent: number;
  thisWeekDone: number;
  thisWeekTarget: number;
};

function uniqueCrackerWorkouts(history: WorkoutSession[]): number {
  const keys = new Set<string>();
  for (const session of history) {
    const week = session.week;
    const idx = crackerSessionIndex(session.workoutTitle);
    const isCrackerSession =
      session.crackerLevel != null ||
      (week != null && week >= 1 && week <= 6 && idx >= 1);
    if (!isCrackerSession) continue;
    if (week != null && week >= 1 && week <= 6 && idx >= 1) {
      keys.add(`${week}-${idx}`);
    } else {
      keys.add(session.id);
    }
  }
  return Math.min(CRACKER_WORKOUTS_TARGET, keys.size);
}

function educationWeeksDone(checklist: MoveChecklistState, level: CrackerLevel): number {
  let count = 0;
  for (let week = 1; week <= 6; week += 1) {
    if (getWeekChecklist(checklist, level, week).education) count += 1;
  }
  return count;
}

export function buildChallengeProgress(input: {
  history: WorkoutSession[];
  checklist: MoveChecklistState;
  checkIns: CrackerMoveCheckIns;
  level: CrackerLevel;
  now?: Date;
}): ChallengeProgress {
  const workoutsDone = uniqueCrackerWorkouts(input.history);
  const educationDone = educationWeeksDone(input.checklist, input.level);
  const fitnessDone =
    (hasFitnessData(input.checkIns.fitness_initial) ? 1 : 0) +
    (hasFitnessData(input.checkIns.fitness_final) ? 1 : 0);
  const inbodyDone =
    (hasInBodyData(input.checkIns.inbody_initial) ? 1 : 0) +
    (hasInBodyData(input.checkIns.inbody_final) ? 1 : 0);
  const measurementsDone =
    (hasMeasurementsData(input.checkIns.measurements_initial) ? 1 : 0) +
    (hasMeasurementsData(input.checkIns.measurements_final) ? 1 : 0);

  const workoutsTarget = CRACKER_WORKOUTS_TARGET;
  const educationTarget = 6;
  const fitnessTarget = 2;
  const inbodyTarget = 2;
  const measurementsTarget = 2;
  const completed = workoutsDone + educationDone + fitnessDone + inbodyDone + measurementsDone;
  const total = workoutsTarget + educationTarget + fitnessTarget + inbodyTarget + measurementsTarget;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  return {
    workoutsDone,
    workoutsTarget,
    educationDone,
    educationTarget,
    fitnessDone,
    fitnessTarget,
    inbodyDone,
    inbodyTarget,
    measurementsDone,
    measurementsTarget,
    completed,
    total,
    percent,
    thisWeekDone: sessionsCompletedThisCalendarWeek(input.history, input.now),
    thisWeekTarget: CRACKER_SESSIONS_PER_WEEK,
  };
}
