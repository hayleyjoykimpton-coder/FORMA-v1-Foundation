/**
 * FORMA programme generator.
 *
 * Builds a personalised training week from the user's profile:
 *   - training days  → split structure (3 = full body, 4 = upper/lower, 5 = glute + upper)
 *   - experience     → training volume (sets per exercise)
 *   - equipment      → exercise selection (substitutes when equipment is missing)
 *   - goal           → accent (extra glute work for glute/sculpt goals)
 *
 * Everyone starts in the Foundation phase; the generated workouts feed the same
 * scientific progression engine as the default programme.
 */

import { ALL_EXERCISE_IDS, EXERCISES } from "./exercises";
import type { Equipment } from "./exercises";
import { buildWorkout, getPhaseForWeek } from "./program";
import type { DayTemplate, ExerciseSlot } from "./program";
import type { Workout } from "./types";
import type { EquipmentAccess, ExperienceLevel, Goal, TrainingDays, UserProfile } from "./user";

function allowedEquipment(access: EquipmentAccess): Equipment[] {
  switch (access) {
    case "full_gym":
      return ["barbell", "dumbbell", "machine", "cable", "bodyweight", "band", "none"];
    case "dumbbells":
      return ["dumbbell", "bodyweight", "band", "none"];
    case "bands":
      return ["band", "bodyweight", "none"];
    case "bodyweight":
      return ["bodyweight", "none"];
    default:
      return ["bodyweight", "none"];
  }
}

/** Resolve an exercise to one the user can actually perform with their kit. */
function resolveExerciseId(id: string, allowed: Equipment[]): string {
  const definition = EXERCISES[id];
  if (!definition) return id;
  if (allowed.includes(definition.equipment)) return id;

  // Try the curated substitutions first.
  for (const subId of definition.substitutions) {
    const sub = EXERCISES[subId];
    if (sub && allowed.includes(sub.equipment)) return subId;
  }

  // Fall back to any exercise sharing a primary muscle that fits the equipment.
  const fallback = ALL_EXERCISE_IDS.find((candidateId) => {
    const candidate = EXERCISES[candidateId];
    return (
      allowed.includes(candidate.equipment) &&
      candidate.primaryMuscles.some((muscle) => definition.primaryMuscles.includes(muscle))
    );
  });
  return fallback ?? id;
}

const COMPOUND_SETS: Record<ExperienceLevel, number> = { beginner: 3, intermediate: 3, advanced: 4 };
const ISO_SETS: Record<ExperienceLevel, number> = { beginner: 2, intermediate: 3, advanced: 3 };

function isIsolation(id: string): boolean {
  const pattern = EXERCISES[id]?.movementPattern;
  return pattern === "isolation" || pattern === "core" || pattern === "mobility";
}

function slot(id: string, experience: ExperienceLevel): ExerciseSlot {
  const definition = EXERCISES[id];
  const sets = isIsolation(id) ? ISO_SETS[experience] : COMPOUND_SETS[experience];
  return {
    exerciseId: id,
    sets,
    repMin: definition?.repRange.min ?? 8,
    repMax: definition?.repRange.max ?? 12,
    startingWeight: 0,
  };
}

function day(dayName: string, title: string, ids: string[], experience: ExperienceLevel): DayTemplate {
  return { day: dayName, title, type: "strength", slots: ids.map((id) => slot(id, experience)) };
}

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

function fullBodyWeek(experience: ExperienceLevel): DayTemplate[] {
  return [
    day(DAY_NAMES[0], "Full Body A", ["squat", "hip_thrust", "chest_supported_row", "shoulder_press", "pallof_press"], experience),
    day(DAY_NAMES[1], "Full Body B", ["romanian_deadlift", "bulgarian_split_squat", "lat_pulldown", "push_up", "dead_bug"], experience),
    day(DAY_NAMES[2], "Full Body C", ["hip_thrust", "leg_curl", "seated_row", "lateral_raise", "side_plank"], experience),
  ];
}

function upperLowerWeek(experience: ExperienceLevel): DayTemplate[] {
  return [
    day(DAY_NAMES[0], "Lower Body", ["squat", "romanian_deadlift", "bulgarian_split_squat", "leg_curl", "pallof_press"], experience),
    day(DAY_NAMES[1], "Upper Body", ["lat_pulldown", "shoulder_press", "seated_row", "lateral_raise", "cable_crunch"], experience),
    day(DAY_NAMES[2], "Glute Focus", ["hip_thrust", "step_up", "hip_abduction", "cable_kickback", "dead_bug"], experience),
    day(DAY_NAMES[3], "Upper Sculpt", ["chest_supported_row", "incline_press", "rear_delt_fly", "bicep_curl", "hanging_knee_raise"], experience),
  ];
}

function gluteEmphasisWeek(experience: ExperienceLevel): DayTemplate[] {
  const days = [
    day(DAY_NAMES[0], "Glute Strength", ["hip_thrust", "romanian_deadlift", "bulgarian_split_squat", "leg_curl", "cable_kickback", "hip_abduction", "pallof_press"], experience),
    day(DAY_NAMES[1], "Upper Sculpt", ["lat_pulldown", "seated_row", "shoulder_press", "lateral_raise", "rear_delt_fly", "bicep_curl", "cable_crunch"], experience),
    day(DAY_NAMES[2], "Glute Shape", ["squat", "step_up", "hip_thrust", "cable_kickback", "hip_abduction", "dead_bug"], experience),
    day(DAY_NAMES[3], "Upper + Core", ["chest_supported_row", "shoulder_press", "bicep_curl", "triceps_pushdown", "hanging_knee_raise", "side_plank"], experience),
  ];
  const movement: DayTemplate = {
    day: DAY_NAMES[4],
    title: "Pilates / Movement",
    type: "mobility",
    slots: [slot("mobility_flow", experience), slot("core_control", experience), slot("hip_mobility", experience)],
  };
  return [...days, movement];
}

function baseWeek(days: TrainingDays, experience: ExperienceLevel): DayTemplate[] {
  if (days >= 5) return gluteEmphasisWeek(experience);
  if (days === 4) return upperLowerWeek(experience);
  return fullBodyWeek(experience);
}

/** Add a glute isolation accent for glute-focused goals where it's missing. */
function applyGoalBias(days: DayTemplate[], goal: Goal, experience: ExperienceLevel): DayTemplate[] {
  if (goal !== "glutes" && goal !== "sculpt") return days;
  return days.map((template, index) => {
    if (index !== 0 || template.type !== "strength") return template;
    const hasAbduction = template.slots.some((s) => s.exerciseId === "hip_abduction");
    if (hasAbduction) return template;
    return { ...template, slots: [...template.slots, slot("hip_abduction", experience)] };
  });
}

/** Generate the personalised, startable workout list for a profile. */
export function generateProgram(profile: UserProfile): Workout[] {
  const phase = getPhaseForWeek(1);
  const allowed = allowedEquipment(profile.equipmentAccess);
  const days = applyGoalBias(baseWeek(profile.trainingDays, profile.experienceLevel), profile.goal, profile.experienceLevel);

  return days.map((template) => {
    const resolved: DayTemplate = {
      ...template,
      slots: template.slots.map((s) => ({ ...s, exerciseId: resolveExerciseId(s.exerciseId, allowed) })),
    };
    return buildWorkout(resolved, phase);
  });
}
