/**
 * Central MOVE imagery map — real Jess / client photography first.
 *
 * Priority:
 * 1. Real Jess McKee training/client photos
 * 2. Official JMK Training image
 * 3. Life & Soul / Cracker branded imagery
 * 4. Neutral graphic treatment (no AI people)
 *
 * Drop new files under `public/cracker/move/` and point slots here.
 * Do not hardcode scattered paths in components.
 */

export type MoveImageSlot =
  | "hero"
  | "week1"
  | "week2"
  | "week3"
  | "week4"
  | "week5"
  | "week6"
  | "lower"
  | "upper"
  | "full"
  | "learnWithJess"
  | "fitnessCheckIn"
  | "scans"
  | "headTrainer";

/** Official JMK Training promo (Jess + branding). */
export const JMK_TRAINING_IMAGE = "/cracker/jess-mckee-jmk-training.jpg";

/** Life & Soul Christmas Cracker badge — branded, no AI people. */
export const CRACKER_BADGE_IMAGE = "/brand/christmas-cracker-512.png";

/**
 * Active MOVE image paths. Empty string = use neutral graphic treatment.
 * Fill slots as real Jess/client photos are supplied.
 */
export const MOVE_IMAGES: Record<MoveImageSlot, string> = {
  hero: JMK_TRAINING_IMAGE,
  week1: "",
  week2: "",
  week3: "",
  week4: "",
  week5: "",
  week6: "",
  lower: "",
  upper: "",
  full: "",
  learnWithJess: JMK_TRAINING_IMAGE,
  fitnessCheckIn: "",
  scans: "",
  headTrainer: JMK_TRAINING_IMAGE,
};

/** Spare real photos available for rotation (not yet assigned). */
export const MOVE_IMAGE_POOL: string[] = [
  JMK_TRAINING_IMAGE,
];

export function moveImage(slot: MoveImageSlot): string | null {
  const src = MOVE_IMAGES[slot]?.trim();
  return src ? src : null;
}

export function moveWeekImage(week: number): string | null {
  const w = Math.min(6, Math.max(1, week)) as 1 | 2 | 3 | 4 | 5 | 6;
  const key = `week${w}` as MoveImageSlot;
  return moveImage(key) ?? moveImage("hero");
}

export function moveSessionImage(title: string): string | null {
  const t = title.toLowerCase();
  if (t.includes("lower")) return moveImage("lower");
  if (t.includes("upper")) return moveImage("upper");
  if (t.includes("full")) return moveImage("full");
  return moveImage("hero");
}

export type MoveMediaKind = "photo" | "neutral";

export function moveMediaForSession(title: string): {
  kind: MoveMediaKind;
  src: string | null;
  label: string;
} {
  const t = title.toLowerCase();
  const label = t.includes("lower")
    ? "LOWER"
    : t.includes("upper")
      ? "UPPER"
      : t.includes("full")
        ? "FULL"
        : "TRAIN";
  const src = moveSessionImage(title);
  return { kind: src ? "photo" : "neutral", src, label };
}
