import type { Season } from "./types";
import type { Gender } from "./user";

/**
 * Static presentation content for the Life & Soul experience.
 */

export const USER_NAME = "Hayley";

export type EditorialImages = {
  hero: string;
  strength: string;
  glutes: string;
  glutesStrength: string;
  upper: string;
  upperSculpt: string;
  abs: string;
  fullbody: string;
  pilates: string;
  running: string;
  nutrition: string;
  recovery: string;
};

export const IMAGES: EditorialImages = {
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
};

/** Men's editorial set — AI-generated luxe fitness photography */
export const IMAGES_MALE: EditorialImages = {
  hero: "/img/male/hero.jpg",
  strength: "/img/male/strength.jpg",
  glutes: "/img/male/glutes.jpg",
  glutesStrength: "/img/male/glutes-strength.jpg",
  upper: "/img/male/upper.jpg",
  upperSculpt: "/img/male/upper-sculpt.jpg",
  abs: "/img/male/abs.jpg",
  fullbody: "/img/male/fullbody.jpg",
  pilates: "/img/male/pilates.jpg",
  running: "/img/male/running.jpg",
  nutrition: "/img/male/nutrition.jpg",
  recovery: "/img/male/recovery.jpg",
};

export function editorialImages(gender?: Gender): EditorialImages {
  return gender === "male" ? IMAGES_MALE : IMAGES;
}

export function heroImage(gender?: Gender): string {
  return editorialImages(gender).hero;
}

/** Pick a workout card image from the session title / focus. */
export function imageForWorkout(title: string, gender?: Gender): string {
  const img = editorialImages(gender);
  const t = title.toLowerCase();
  if (/rest|recover|mobility|stretch|align/.test(t)) return img.recovery;
  if (/abs|core|woodchop|crunch|pallof|athletic/.test(t)) return img.abs;
  // Men's push/pull/legs labels
  if (/push power|push & pull|upper · push/.test(t)) return img.upper;
  if (/pull strength|pull|upper · volume|upper hypertrophy/.test(t)) return img.upperSculpt;
  if (/legs & squat|legs & power|lower · squat|lower · hinge|full body · strength|full body · power/.test(t)) {
    return img.glutesStrength;
  }
  if (/full body/.test(t)) return img.fullbody;
  // Women's / legacy labels
  if (/glute strength|lower body|lower strength|figure strength/.test(t)) return img.glutesStrength;
  if (/contour drive/.test(t)) return img.fullbody;
  if (/glute|lower|hip|leg|squat|hinge|shape|figure|contour/.test(t)) return img.glutes;
  if (/upper sculpt|upper body a|pull day/.test(t)) return img.upperSculpt;
  if (/upper|sculpt|pull|push|shoulder|press|row|chest|back|arm/.test(t)) return img.upper;
  if (/full\s*body|fullbody/.test(t)) return img.fullbody;
  return img.strength;
}

/** Soft fallback for exercise thumbnails from the exercise name. */
export function imageForExercise(name: string, gender?: Gender): string {
  const img = editorialImages(gender);
  const n = name.toLowerCase();
  if (/crunch|plank|pallof|woodchop|twist|knee raise|core|abs/.test(n)) return img.abs;
  if (/hip|glute|thrust|deadlift|rdl|squat|lunge|split|leg curl|abduction|kickback|step/.test(n)) {
    return img.glutes;
  }
  if (/row|pulldown|press|raise|curl|push|tricep|bicep|delt|lat|chest|shoulder/.test(n)) {
    return img.upper;
  }
  return img.strength;
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
};

export const WEEKLY_SCHEDULE_MALE: ScheduleDay[] = [
  { day: "Monday", short: "Mon", focus: "Push Power", image: IMAGES_MALE.upper },
  { day: "Tuesday", short: "Tue", focus: "Pull Strength", image: IMAGES_MALE.strength },
  { day: "Wednesday", short: "Wed", focus: "Legs & Squat", image: IMAGES_MALE.glutesStrength },
  { day: "Thursday", short: "Thu", focus: "Upper Hypertrophy", image: IMAGES_MALE.upperSculpt },
  { day: "Friday", short: "Fri", focus: "Legs & Power", image: IMAGES_MALE.glutesStrength },
  { day: "Saturday", short: "Sat", focus: "Rest", image: IMAGES_MALE.recovery, rest: true },
  { day: "Sunday", short: "Sun", focus: "Rest", image: IMAGES_MALE.recovery, rest: true },
];

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

export const PROGRESS_GALLERY: string[] = [IMAGES.hero, IMAGES.strength, IMAGES.running];
