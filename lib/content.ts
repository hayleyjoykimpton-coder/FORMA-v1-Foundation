import type { Season } from "./types";

/**
 * Static presentation content for the FORMA experience.
 * Keeping this separate from FormaApp keeps the component focused on
 * state/logic while the editorial copy, imagery and schedule live here.
 */

export const USER_NAME = "Hayley";

export const IMAGES = {
  hero: "/img/hero.jpg",
  strength: "/img/strength.jpg",
  glutes: "/img/glutes.jpg",
  glutesStrength: "/img/glutes-strength.jpg",
  upper: "/img/upper.jpg",
  upperSculpt: "/img/upper-sculpt.jpg",
  abs: "/img/abs.jpg",
  fullbody: "/img/fullbody.jpg",
  pilates: "/img/pilates.jpg",
  running: "/img/running.jpg",
  nutrition: "/img/nutrition.jpg",
  recovery: "/img/recovery.jpg",
} as const;

/** Pick a workout card image from the session title / focus. */
export function imageForWorkout(title: string): string {
  const t = title.toLowerCase();
  if (/rest|recover|mobility|stretch|align/.test(t)) return IMAGES.recovery;
  if (/abs|core|woodchop|crunch/.test(t)) return IMAGES.abs;
  // First glute / lower / figure day (strength focus) vs shape / contour
  if (/glute strength|lower body|lower strength|figure strength/.test(t)) return IMAGES.glutesStrength;
  if (/contour drive/.test(t)) return IMAGES.fullbody;
  if (/glute|lower|hip|leg|squat|hinge|shape|figure|contour/.test(t)) return IMAGES.glutes;
  // First upper day (sculpt) vs second (strength)
  if (/upper sculpt|upper body a|pull day/.test(t)) return IMAGES.upperSculpt;
  if (/upper|sculpt|pull|push|shoulder|press|row|chest|back|arm/.test(t)) return IMAGES.upper;
  if (/full\s*body|fullbody/.test(t)) return IMAGES.fullbody;
  return IMAGES.strength;
}

/** Soft fallback for exercise thumbnails from the exercise name. */
export function imageForExercise(name: string): string {
  const n = name.toLowerCase();
  if (/crunch|plank|pallof|woodchop|twist|knee raise|core|abs/.test(n)) return IMAGES.abs;
  if (/hip|glute|thrust|deadlift|rdl|squat|lunge|split|leg curl|abduction|kickback|step/.test(n)) {
    return IMAGES.glutes;
  }
  if (/row|pulldown|press|raise|curl|push|tricep|bicep|delt|lat|chest|shoulder/.test(n)) {
    return IMAGES.upper;
  }
  return IMAGES.strength;
}

/**
 * The training phases run as a repeating 12-week block:
 * Foundation → Build → Peak → Align, then back to Foundation.
 */
export const PHASES: Season[] = ["Foundation", "Build", "Peak", "Align"];

export const phaseCopy: Record<Season, { line: string; focus: string }> = {
  Foundation: { line: "Build the base.", focus: "Weeks 1–4 · Movement · Capacity · Consistency" },
  Build: { line: "Stronger every session.", focus: "Weeks 5–8 · Strength · Hypertrophy · Progression" },
  Peak: { line: "Express your strength.", focus: "Weeks 9–11 · Performance · Power · Precision" },
  Align: { line: "Recover to grow.", focus: "Week 12 · Recovery · then a fresh Foundation cycle" },
};

export type ScheduleDay = {
  day: string;
  short: string;
  focus: string;
  image: string;
  rest?: boolean;
  /** Present when the schedule is built from live workouts (tappable start). */
  workoutId?: string;
  /** True when a session for this workout was logged this calendar week. */
  completed?: boolean;
};

export const WEEKLY_SCHEDULE: ScheduleDay[] = [
  { day: "Monday", short: "Mon", focus: "Glute Strength", image: IMAGES.glutesStrength },
  { day: "Tuesday", short: "Tue", focus: "Upper Sculpt", image: IMAGES.upperSculpt },
  { day: "Wednesday", short: "Wed", focus: "Glute Shape", image: IMAGES.glutes },
  { day: "Thursday", short: "Thu", focus: "Upper Strength", image: IMAGES.upper },
  { day: "Friday", short: "Fri", focus: "Weighted Abs", image: IMAGES.abs },
  { day: "Saturday", short: "Sat", focus: "Rest", image: IMAGES.recovery, rest: true },
  { day: "Sunday", short: "Sun", focus: "Rest", image: IMAGES.recovery, rest: true },
];

export type Accent = "pink" | "blue" | "mocha" | "sage" | "green";

export type NutritionTarget = {
  label: string;
  value: string;
  unit: string;
  accent: Accent;
};

export const NUTRITION_TARGETS: NutritionTarget[] = [
  { label: "Protein", value: "120", unit: "g goal", accent: "mocha" },
  { label: "Calories", value: "1,850", unit: "kcal", accent: "mocha" },
  { label: "Meals", value: "4", unit: "planned", accent: "sage" },
];

export const HYDRATION_GOAL = 8;

export type CoachReminder = { title: string; text: string; accent: Accent };

export const COACH_REMINDERS: CoachReminder[] = [
  { title: "Water", text: "A few glasses today is enough — keep it gentle.", accent: "blue" },
  { title: "Protein", text: "Include protein when you can. No need to chase a perfect number.", accent: "mocha" },
  { title: "Rest", text: "An earlier night helps tomorrow’s session land better.", accent: "sage" },
];

/**
 * A soft, presentational sample of body measurements. FORMA does not yet
 * capture these, so they render as an aspirational luxury card.
 */
export const MEASUREMENTS: { label: string; value: string }[] = [
  { label: "Weight", value: "62.4 kg" },
  { label: "Waist", value: "70 cm" },
  { label: "Hips", value: "96 cm" },
];

export const PROGRESS_GALLERY: string[] = [IMAGES.hero, IMAGES.strength, IMAGES.running];
