/**
 * FORMA programme engine.
 *
 * A Program is organised as: Program → Phase → (Week) → Training days.
 * Phases run as a repeating **12-week block**:
 *   Foundation (1–4) → Build (5–8) → Peak (9–11) → Align (12) → back to Foundation.
 * An optional mid-cycle Align override still exists for an early deload.
 */

import { EXERCISES, defaultIncrement } from "./exercises";
import type { Exercise, Season, Workout } from "./types";

export type PhaseId = Season;

export type PhaseDefinition = {
  id: PhaseId;
  name: string;
  weekStart: number;
  weekEnd: number;
  goal: string;
  rpeMin: number;
  rpeMax: number;
  repsInReserve: string;
  volume: "low" | "moderate" | "high";
  /** Sets added per exercise relative to the Foundation template. */
  setBonus: number;
};

/** Length of one Foundation → Align training block before the cycle restarts. */
export const CYCLE_WEEKS = 12;

export const PHASE_DEFINITIONS: Record<PhaseId, PhaseDefinition> = {
  Foundation: {
    id: "Foundation",
    name: "Foundation",
    weekStart: 1,
    weekEnd: 4,
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
    weekStart: 5,
    weekEnd: 8,
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
    weekStart: 9,
    weekEnd: 11,
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
    weekStart: 12,
    weekEnd: 12,
    goal: "Recovery, mobility and readiness before the next cycle",
    rpeMin: 5,
    rpeMax: 6,
    repsInReserve: "4–5 reps in reserve",
    volume: "low",
    setBonus: -1,
  },
};

export const PHASE_ORDER: PhaseId[] = ["Foundation", "Build", "Peak", "Align"];

/** Map any stored week onto the 1–12 cycle position. */
export function cycleWeek(week: number): number {
  const n = Math.max(1, Math.floor(week) || 1);
  return ((n - 1) % CYCLE_WEEKS) + 1;
}

/** Which phase a given programme week belongs to inside the 12-week block. */
export function getPhaseForWeek(week: number): PhaseDefinition {
  const w = cycleWeek(week);
  if (w <= 4) return PHASE_DEFINITIONS.Foundation;
  if (w <= 8) return PHASE_DEFINITIONS.Build;
  if (w <= 11) return PHASE_DEFINITIONS.Peak;
  return PHASE_DEFINITIONS.Align;
}

/**
 * Active phase for UI / programming.
 * Mid-cycle Align override can force recovery before week 12.
 */
export function resolveActivePhase(week: number, alignActive = false): PhaseDefinition {
  if (alignActive) return PHASE_DEFINITIONS.Align;
  return getPhaseForWeek(week);
}

/** First week number for a phase inside the 12-week block. */
export function startWeekForPhase(phaseId: PhaseId): number {
  return PHASE_DEFINITIONS[phaseId].weekStart;
}

/** Next phase in the block (Align → null; cycle restart is handled by week wrap). */
export function nextLinearPhase(phaseId: PhaseId): PhaseId | null {
  if (phaseId === "Foundation") return "Build";
  if (phaseId === "Build") return "Peak";
  if (phaseId === "Peak") return "Align";
  return null;
}

/** Advance one week inside the block; week 12 rolls back to Foundation (week 1). */
export function nextProgrammeWeek(week: number): { week: number; rolled: boolean } {
  const current = cycleWeek(week);
  if (current >= CYCLE_WEEKS) return { week: 1, rolled: true };
  return { week: current + 1, rolled: false };
}

export type PhaseJourneyStatus = "done" | "active" | "locked";

/** Journey status for each phase given week + optional early Align override. */
export function phaseJourneyStatuses(
  week: number,
  alignActive = false,
): Record<PhaseId, PhaseJourneyStatus> {
  const w = cycleWeek(week);
  const linearId = getPhaseForWeek(w).id;
  const activeId = alignActive ? "Align" : linearId;
  const statuses = {} as Record<PhaseId, PhaseJourneyStatus>;

  for (const id of PHASE_ORDER) {
    if (id === activeId) {
      statuses[id] = "active";
      continue;
    }
    const pastLinear = startWeekForPhase(id) < startWeekForPhase(linearId);
    const pausedForAlign = alignActive && id === linearId;
    statuses[id] = pastLinear || pausedForAlign ? "done" : "locked";
  }

  return statuses;
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
 * Glute-led lower days, posture-led upper days, and a dedicated weighted abs day.
 * Pilates/mobility is optional and not part of the recorded programme.
 */
export const FORMA_PROGRAM: Program = {
  id: "forma-foundation-v2",
  name: "Life & Soul Foundation",
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
          ],
        },
        {
          day: "Wednesday",
          title: "Glute Shape",
          type: "strength",
          slots: [
            { exerciseId: "squat", sets: 3, repMin: 6, repMax: 10, startingWeight: 30 },
            { exerciseId: "step_up", sets: 3, repMin: 10, repMax: 12, startingWeight: 10 },
            { exerciseId: "hip_thrust", sets: 3, repMin: 10, repMax: 12, startingWeight: 45 },
            { exerciseId: "cable_kickback", sets: 3, repMin: 12, repMax: 15, startingWeight: 10 },
            { exerciseId: "hip_abduction", sets: 3, repMin: 12, repMax: 20, startingWeight: 30 },
          ],
        },
        {
          day: "Thursday",
          title: "Upper Strength",
          type: "strength",
          slots: [
            { exerciseId: "chest_supported_row", sets: 3, repMin: 10, repMax: 12, startingWeight: 12 },
            { exerciseId: "shoulder_press", sets: 3, repMin: 8, repMax: 12, startingWeight: 12 },
            { exerciseId: "bicep_curl", sets: 2, repMin: 10, repMax: 15, startingWeight: 8 },
            { exerciseId: "triceps_pushdown", sets: 2, repMin: 10, repMax: 15, startingWeight: 15 },
            { exerciseId: "lateral_raise", sets: 3, repMin: 12, repMax: 18, startingWeight: 6 },
          ],
        },
        {
          day: "Friday",
          title: "Weighted Abs",
          type: "strength",
          slots: [
            { exerciseId: "cable_crunch", sets: 3, repMin: 12, repMax: 15, startingWeight: 25 },
            { exerciseId: "hanging_knee_raise", sets: 3, repMin: 8, repMax: 15, startingWeight: 0 },
            { exerciseId: "cable_woodchop", sets: 3, repMin: 10, repMax: 12, startingWeight: 15 },
            { exerciseId: "russian_twist", sets: 3, repMin: 12, repMax: 16, startingWeight: 8 },
            { exerciseId: "weighted_crunch", sets: 3, repMin: 12, repMax: 15, startingWeight: 10 },
            { exerciseId: "pallof_press", sets: 3, repMin: 10, repMax: 12, startingWeight: 10 },
          ],
        },
        {
          day: "Saturday",
          title: "Rest",
          type: "rest",
          slots: [],
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
const TRAINABLE: DayType[] = ["strength"];

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
 * Recovery and Rest days are display-only and excluded.
 */
export function buildWorkoutsForWeek(week: number, program: Program = FORMA_PROGRAM): Workout[] {
  const phase = getPhaseForWeek(week);
  const template = templateForPhase(program, phase.id);
  return template.days
    .filter((day) => TRAINABLE.includes(day.type))
    .map((day) => buildWorkout(day, phase));
}

/** Pick the workout that matches today's weekday.
 *  Returns undefined on rest days (no matching startable workout).
 */
export function pickTodaysWorkout(workouts: Workout[]): Workout | undefined {
  if (!workouts.length) return undefined;
  const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const match = workouts.find((workout) => workout.day === today);
  if (match) return match;
  // Don't fall back to Monday on rest days — the home screen shows Rest instead.
  if (today === "Saturday" || today === "Sunday") return undefined;
  return workouts[0];
}
