/**
 * FORMA programme generator.
 *
 * Builds a personalised training week from the user's profile:
 *   - training days  → split structure
 *       3 = full-figure A/B + weighted abs (≈2× weekly stimulus per major group)
 *       4 = lower / upper / glute / abs (glute priority, upper once, core dedicated)
 *       5 = glute + upper + abs (existing emphasis week — left as the premium template)
 *   - experience     → training volume (sets per exercise)
 *   - equipment      → exercise selection (substitutes when equipment is missing)
 *   - goal           → accent (extra glute work for glute/sculpt goals)
 *
 * Abs are a dedicated weighted day (not tacked onto strength sessions).
 * Pilates/mobility is optional and not part of the recorded programme.
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

  for (const subId of definition.substitutions) {
    const sub = EXERCISES[subId];
    if (sub && allowed.includes(sub.equipment)) return subId;
  }

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

/**
 * 3-day — Full-figure density.
 * Two compound full-body sessions hit squat/hinge/push/pull ~2×/week, then a
 * dedicated weighted-core day. Volume per session is higher than 5-day so
 * weekly sets stay in a hypertrophy-effective range.
 */
function fullBodyWeek(experience: ExperienceLevel): DayTemplate[] {
  return [
    day(
      DAY_NAMES[0],
      "Figure Strength",
      [
        "squat",
        "hip_thrust",
        "chest_supported_row",
        "shoulder_press",
        "leg_curl",
        "lateral_raise",
      ],
      experience,
    ),
    day(
      DAY_NAMES[1],
      "Contour Drive",
      [
        "romanian_deadlift",
        "bulgarian_split_squat",
        "lat_pulldown",
        "push_up",
        "cable_kickback",
        "hip_abduction",
      ],
      experience,
    ),
    day(
      DAY_NAMES[2],
      "Weighted Abs",
      [
        "cable_crunch",
        "hanging_knee_raise",
        "cable_woodchop",
        "russian_twist",
        "weighted_crunch",
        "pallof_press",
      ],
      experience,
    ),
  ];
}

/**
 * 4-day — Lower / Upper / Glute / Abs.
 * Prioritises glute + lower frequency (2×) while keeping a full upper sculpt
 * day and the same dedicated weighted-abs session as the 5-day template.
 */
function upperLowerWeek(experience: ExperienceLevel): DayTemplate[] {
  return [
    day(
      DAY_NAMES[0],
      "Lower Strength",
      [
        "squat",
        "romanian_deadlift",
        "bulgarian_split_squat",
        "leg_curl",
        "hip_abduction",
      ],
      experience,
    ),
    day(
      DAY_NAMES[1],
      "Upper Sculpt",
      [
        "lat_pulldown",
        "seated_row",
        "shoulder_press",
        "lateral_raise",
        "rear_delt_fly",
        "bicep_curl",
      ],
      experience,
    ),
    day(
      DAY_NAMES[2],
      "Glute Shape",
      [
        "hip_thrust",
        "step_up",
        "walking_lunge",
        "cable_kickback",
        "hip_abduction",
      ],
      experience,
    ),
    day(
      DAY_NAMES[3],
      "Weighted Abs",
      [
        "cable_crunch",
        "hanging_knee_raise",
        "cable_woodchop",
        "russian_twist",
        "weighted_crunch",
        "pallof_press",
      ],
      experience,
    ),
  ];
}

function gluteEmphasisWeek(experience: ExperienceLevel): DayTemplate[] {
  return [
    day(DAY_NAMES[0], "Glute Strength", ["hip_thrust", "romanian_deadlift", "bulgarian_split_squat", "leg_curl", "cable_kickback", "hip_abduction"], experience),
    day(DAY_NAMES[1], "Upper Sculpt", ["lat_pulldown", "seated_row", "shoulder_press", "lateral_raise", "rear_delt_fly", "bicep_curl"], experience),
    day(DAY_NAMES[2], "Glute Shape", ["squat", "step_up", "hip_thrust", "cable_kickback", "hip_abduction"], experience),
    day(DAY_NAMES[3], "Upper Strength", ["chest_supported_row", "shoulder_press", "bicep_curl", "triceps_pushdown", "lateral_raise"], experience),
    day(DAY_NAMES[4], "Weighted Abs", ["cable_crunch", "hanging_knee_raise", "cable_woodchop", "russian_twist", "weighted_crunch", "pallof_press"], experience),
  ];
}

function baseWeek(days: TrainingDays, experience: ExperienceLevel): DayTemplate[] {
  if (days >= 5) return gluteEmphasisWeek(experience);
  if (days === 4) return upperLowerWeek(experience);
  return fullBodyWeek(experience);
}

/** Add a glute isolation accent for glute-focused goals where it's missing. */
function applyGoalBias(days: DayTemplate[], goal: Goal, experience: ExperienceLevel): DayTemplate[] {
  if (goal !== "glutes" && goal !== "sculpt") return days;
  return days.map((template) => {
    if (template.title === "Weighted Abs" || template.type !== "strength") return template;
    // Lower / glute / full-figure sessions — not pure upper days.
    if (!/glute|lower|figure|contour/i.test(template.title)) return template;
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

/** Old 3/4-day titles before the elevated-split upgrade. */
const LEGACY_SESSION_TITLE = /^(Full Body [AB]|Lower Body|Upper Body|Glute Focus)$/i;

/**
 * True when stored workouts should be regenerated for this profile.
 * Also catches the case where schemaVersion was stamped current while
 * workouts were still the legacy Full Body A/B templates.
 */
export function programmeNeedsUpgrade(
  workouts: Workout[],
  profile: UserProfile,
  storedSchemaVersion: number,
): boolean {
  if (storedSchemaVersion < PROGRAM_SCHEMA_VERSION) return true;
  if (!workouts.length) return true;
  if (workouts.some((workout) => LEGACY_SESSION_TITLE.test(workout.title))) return true;

  const expected = generateProgram(profile);
  if (workouts.length !== expected.length) return true;
  return workouts.some((workout, index) => workout.title !== expected[index]?.title);
}

/** Current programme schema version — bump when the weekly structure changes. */
export const PROGRAM_SCHEMA_VERSION = 4;
