import type { Season } from "./types";

/**
 * Static presentation content for the FORMA experience.
 * Keeping this separate from FormaApp keeps the component focused on
 * state/logic while the editorial copy, imagery and schedule live here.
 */

export const USER_NAME = "Emma";

export const IMAGES = {
  hero: "/img/hero.jpg",
  strength: "/img/strength.jpg",
  pilates: "/img/pilates.jpg",
  running: "/img/running.jpg",
  nutrition: "/img/nutrition.jpg",
  recovery: "/img/recovery.jpg",
} as const;

/**
 * The training phases progress in order. Only Foundation is surfaced to the
 * user today — Build, Peak and Align exist internally for future unlocking.
 */
export const PHASES: Season[] = ["Foundation", "Build", "Peak", "Align"];
export const ACTIVE_PHASE: Season = "Foundation";

export const phaseCopy: Record<Season, { line: string; focus: string }> = {
  Foundation: { line: "Build the base.", focus: "Movement · Capacity · Consistency" },
  Build: { line: "Stronger every session.", focus: "Strength · Hypertrophy · Progression" },
  Peak: { line: "Express your strength.", focus: "Performance · Power · Precision" },
  Align: { line: "Recover to grow.", focus: "Recovery · Mobility · Readiness" },
};

export type ScheduleDay = {
  day: string;
  short: string;
  focus: string;
  image: string;
  rest?: boolean;
};

export const WEEKLY_SCHEDULE: ScheduleDay[] = [
  { day: "Monday", short: "Mon", focus: "Lower Body", image: IMAGES.strength },
  { day: "Tuesday", short: "Tue", focus: "Upper Body", image: IMAGES.strength },
  { day: "Wednesday", short: "Wed", focus: "Recovery", image: IMAGES.recovery },
  { day: "Thursday", short: "Thu", focus: "Lower Body", image: IMAGES.strength },
  { day: "Friday", short: "Fri", focus: "Upper Body", image: IMAGES.strength },
  { day: "Saturday", short: "Sat", focus: "Pilates", image: IMAGES.pilates },
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
  { label: "Calories", value: "1,850", unit: "kcal", accent: "pink" },
  { label: "Meals", value: "4", unit: "planned", accent: "sage" },
];

export const HYDRATION_GOAL = 8;

export type CoachReminder = { title: string; text: string; accent: Accent };

export const COACH_REMINDERS: CoachReminder[] = [
  { title: "Hydration", text: "Drink 8 glasses of water today to support recovery and energy.", accent: "blue" },
  { title: "Protein", text: "Aim for ~120g of protein to rebuild and protect lean strength.", accent: "mocha" },
  { title: "Recovery", text: "Wind down early — deep sleep is where adaptation happens.", accent: "sage" },
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

export const PROGRESS_GALLERY: string[] = [IMAGES.hero, IMAGES.pilates, IMAGES.running];
