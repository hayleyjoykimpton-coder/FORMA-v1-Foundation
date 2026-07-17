/**
 * FORMA programme engine.
 *
 * A Program is organised as: Program → Phase → (Week) → Training days.
 * Phases are periodised by week number and drive intensity (RPE) and volume.
 * Only Foundation is surfaced to the user today; Build / Peak / Align exist
 * in the model for future unlocking and progression.
 */

import { EXERCISES, defaultIncrement } from "./exercises";
import type { Exercise, Season, Workout } from "./types";

export type PhaseId = Season;

export type PhaseDefinition = {
  id: PhaseId;
  name: string;
  weekStart: number;
  /** null = open-ended (Peak) or not on the linear timeline (Align). */
  weekEnd: number | null;
  goal: string;
  rpeMin: number;
  rpeMax: number;
  repsInReserve: string;
  volume: "low" | "moderate" | "high";
  /** Sets added per exercise relative to the Foundation template. */
  setBonus: number;
};

export const PHASE_DEFINITIONS: Record<PhaseId, PhaseDefinition> = {
  Foundation: {
    id: "Foundation",
    name: "Foundation",
    weekStart: 1,
    weekEnd: 6,
    goal: "Technique, consistency, movement quality, building training tolerance",
    rpeMin: 6,
    rpeMax: 7,
    repsInReserve: "3–4 reps in reserve",
    volume: "moderate",
    setBonus: 0,
  },
  Build: {
    id: "Build",
    name: "Build",
    weekStart: 7,
    weekEnd: 16,
    goal: "Hypertrophy — increase sets, load and training density",
    rpeMin: 7,
    rpeMax: 9,
    repsInReserve: "1–3 reps in reserve",
    volume: "high",
    setBonus: 1,
  },
  Peak: {
    id: "Peak",
    name: "Peak",
    weekStart: 17,
    weekEnd: null,
    goal: "Maximum physique development at higher intensity",
    rpeMin: 8,
    rpeMax: 9.5,
    repsInReserve: "0–2 reps in reserve",
    volume: "high",
    setBonus: 1,
  },
  Align: {
    id: "Align",
    name: "Align",
    weekStart: 0,
    weekEnd: null,
    goal: "Recovery, mobility and readiness",
    rpeMin: 5,
    rpeMax: 6,
    repsInReserve: "4–5 reps in reserve",
    volume: "low",
    setBonus: -1,
  },
};

export const PHASE_ORDER: PhaseId[] = ["Foundation", "Build", "Peak", "Align"];

/** Which phase a given (1-indexed) programme week belongs to. */
export function getPhaseForWeek(week: number): PhaseDefinition {
  if (week <= 6) return PHASE_DEFINITIONS.Foundation;
  if (week <= 16) return PHASE_DEFINITIONS.Build;
  return PHASE_DEFINITIONS.Peak;
}

export type DayType = "strength" | "mobility" | "recovery" | "rest";

export type ExerciseSlot = {
  exerciseId: string;
  sets: number;
  repMin: number;
  repMax: number;
  startingWeight?: number;
  restSeconds?: number;
};

export type DayTemplate = {
  day: string;
  title: string;
  type: DayType;
  slots: ExerciseSlot[];
};

export type PhaseTemplate = {
  phase: PhaseId;
  days: DayTemplate[];
};

export type Program = {
  id: string;
  name: string;
  phases: PhaseTemplate[];
};

/**
 * The default FORMA women's strength programme (Foundation block).
 * Glute-led lower days, posture-led upper days, dedicated core, and a
 * Pilates/mobility movement day — quads present but not over-emphasised.
 */
export const FORMA_PROGRAM: Program = {
  id: "forma-foundation-v1",
  name: "FORMA Foundation",
  phases: [
    {
      phase: "Foundation",
      days: [
        {
          day: "Monday",
          title: "Glute Strength",
          type: "strength",
          slots: [
            { exerciseId: "hip_thrust", sets: 3, repMin: 8, repMax: 12, startingWeight: 40 },
            { exerciseId: "romanian_deadlift", sets: 3, repMin: 8, repMax: 12, startingWeight: 40 },
            { exerciseId: "bulgarian_split_squat", sets: 3, repMin: 8, repMax: 12, startingWeight: 12 },
            { exerciseId: "leg_curl", sets: 3, repMin: 10, repMax: 15, startingWeight: 25 },
            { exerciseId: "cable_kickback", sets: 3, repMin: 12, repMax: 15, startingWeight: 10 },
            { exerciseId: "hip_abduction", sets: 3, repMin: 12, repMax: 20, startingWeight: 30 },
            { exerciseId: "pallof_press", sets: 3, repMin: 10, repMax: 12, startingWeight: 10 },
          ],
        },
        {
          day: "Tuesday",
          title: "Upper Sculpt",
          type: "strength",
          slots: [
            { exerciseId: "lat_pulldown", sets: 3, repMin: 8, repMax: 12, startingWeight: 30 },
            { exerciseId: "seated_row", sets: 3, repMin: 10, repMax: 12, startingWeight: 30 },
            { exerciseId: "shoulder_press", sets: 3, repMin: 8, repMax: 12, startingWeight: 12 },
            { exerciseId: "lateral_raise", sets: 3, repMin: 12, repMax: 18, startingWeight: 6 },
            { exerciseId: "rear_delt_fly", sets: 3, repMin: 12, repMax: 18, startingWeight: 6 },
            { exerciseId: "bicep_curl", sets: 2, repMin: 10, repMax: 15, startingWeight: 8 },
            { exerciseId: "cable_crunch", sets: 3, repMin: 12, repMax: 15, startingWeight: 20 },
          ],
        },
        {
          day: "Wednesday",
          title: "Recovery",
          type: "recovery",
          slots: [
            { exerciseId: "mobility_flow", sets: 2, repMin: 5, repMax: 8 },
            { exerciseId: "hip_mobility", sets: 2, repMin: 5, repMax: 10 },
          ],
        },
        {
          day: "Thursday",
          title: "Glute Shape",
          type: "strength",
          slots: [
            { exerciseId: "squat", sets: 3, repMin: 6, repMax: 10, startingWeight: 30 },
            { exerciseId: "step_up", sets: 3, repMin: 10, repMax: 12, startingWeight: 10 },
            { exerciseId: "hip_thrust", sets: 3, repMin: 10, repMax: 12, startingWeight: 45 },
            { exerciseId: "cable_kickback", sets: 3, repMin: 12, repMax: 15, startingWeight: 10 },
            { exerciseId: "hip_abduction", sets: 3, repMin: 12, repMax: 20, startingWeight: 30 },
            { exerciseId: "dead_bug", sets: 3, repMin: 8, repMax: 12, startingWeight: 0 },
          ],
        },
        {
          day: "Friday",
          title: "Upper + Core",
          type: "strength",
          slots: [
            { exerciseId: "chest_supported_row", sets: 3, repMin: 10, repMax: 12, startingWeight: 12 },
            { exerciseId: "shoulder_press", sets: 3, repMin: 8, repMax: 12, startingWeight: 12 },
            { exerciseId: "bicep_curl", sets: 2, repMin: 10, repMax: 15, startingWeight: 8 },
            { exerciseId: "triceps_pushdown", sets: 2, repMin: 10, repMax: 15, startingWeight: 15 },
            { exerciseId: "hanging_knee_raise", sets: 3, repMin: 8, repMax: 15, startingWeight: 0 },
            { exerciseId: "side_plank", sets: 3, repMin: 8, repMax: 12, startingWeight: 0 },
          ],
        },
        {
          day: "Saturday",
          title: "Pilates / Movement",
          type: "mobility",
          slots: [
            { exerciseId: "mobility_flow", sets: 2, repMin: 5, repMax: 8 },
            { exerciseId: "core_control", sets: 3, repMin: 8, repMax: 12 },
            { exerciseId: "hip_mobility", sets: 2, repMin: 5, repMax: 10 },
          ],
        },
        {
          day: "Sunday",
          title: "Rest",
          type: "rest",
          slots: [],
        },
      ],
    },
  ],
};

const uid = () => Math.random().toString(36).slice(2, 10);

/** Day types that appear in the editable / startable `workouts` list. */
const TRAINABLE: DayType[] = ["strength", "mobility"];

function estimateDuration(exercises: Exercise[]): number {
  const seconds = exercises.reduce(
    (total, exercise) => total + exercise.sets * (exercise.restSeconds + 50),
    0,
  );
  return Math.max(20, Math.round(seconds / 60));
}

/** Build a concrete UI Exercise from a programme slot, applying phase RPE. */
export function buildExerciseInstance(slot: ExerciseSlot, phase: PhaseDefinition): Exercise {
  const definition = EXERCISES[slot.exerciseId];
  const equipment = definition?.equipment ?? "dumbbell";
  return {
    id: uid(),
    exerciseId: slot.exerciseId,
    name: definition?.name ?? slot.exerciseId,
    sets: Math.max(1, slot.sets + phase.setBonus),
    repMin: slot.repMin,
    repMax: slot.repMax,
    weight: slot.startingWeight ?? 0,
    rpe: phase.rpeMax,
    notes: definition?.coachingCues[0] ?? "",
    increment: defaultIncrement(equipment),
    restSeconds: slot.restSeconds ?? definition?.restSeconds ?? 90,
  };
}

export function buildWorkout(day: DayTemplate, phase: PhaseDefinition): Workout {
  const exercises = day.slots.map((slot) => buildExerciseInstance(slot, phase));
  return {
    id: uid(),
    day: day.day,
    title: day.title,
    duration: estimateDuration(exercises),
    exercises,
  };
}

/** Get the phase template for a phase, falling back to Foundation's structure. */
function templateForPhase(program: Program, phase: PhaseId): PhaseTemplate {
  return program.phases.find((entry) => entry.phase === phase) ?? program.phases[0];
}

/**
 * Build the startable/editable workout list for a programme week.
 * Recovery and Rest days are display-only (see WEEKLY_SCHEDULE) and excluded.
 */
export function buildWorkoutsForWeek(week: number, program: Program = FORMA_PROGRAM): Workout[] {
  const phase = getPhaseForWeek(week);
  const template = templateForPhase(program, phase.id);
  return template.days
    .filter((day) => TRAINABLE.includes(day.type))
    .map((day) => buildWorkout(day, phase));
}
