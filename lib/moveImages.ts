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

/** Jess in Life & Soul kit — gym portrait. */
export const JESS_LAS_PORTRAIT = "/cracker/move/jess-life-and-soul-portrait.jpg";

/** Jess coaching a client through a lower-body hinge at Life & Soul. */
export const JESS_COACHING_CLIENT = "/cracker/move/jess-coaching-client.jpg";

/** Jess giving hands-on form guidance (Life & Soul polo). */
export const JESS_COACHING_FORM = "/cracker/move/jess-coaching-form.jpg";

/** Jess demonstrating lateral raise with client + dumbbells. */
export const JESS_LATERAL_RAISE = "/cracker/move/jess-lateral-raise.jpg";

/** Life & Soul Christmas Cracker badge — branded, no AI people. */
export const CRACKER_BADGE_IMAGE = "/brand/christmas-cracker-512.png";

/**
 * Active MOVE image paths. Empty string = use neutral graphic treatment.
 * Fill slots as real Jess/client photos are supplied.
 */
export const MOVE_IMAGES: Record<MoveImageSlot, string> = {
  hero: JESS_LAS_PORTRAIT,
  week1: JESS_COACHING_FORM,
  week2: JESS_LATERAL_RAISE,
  week3: JESS_COACHING_CLIENT,
  week4: JMK_TRAINING_IMAGE,
  week5: JESS_COACHING_FORM,
  week6: JESS_LATERAL_RAISE,
  lower: JESS_COACHING_CLIENT,
  upper: JESS_LATERAL_RAISE,
  full: "",
  learnWithJess: JESS_COACHING_FORM,
  fitnessCheckIn: JESS_COACHING_FORM,
  scans: "",
  headTrainer: JESS_LAS_PORTRAIT,
};

/** Spare real photos available for rotation (not yet assigned to every slot). */
export const MOVE_IMAGE_POOL: string[] = [
  JESS_LAS_PORTRAIT,
  JESS_COACHING_CLIENT,
  JESS_COACHING_FORM,
  JESS_LATERAL_RAISE,
  JMK_TRAINING_IMAGE,
];

export function moveImage(slot: MoveImageSlot): string | null {
  const src = MOVE_IMAGES[slot]?.trim();
  return src ? src : null;
}

export function moveWeekImage(week: number): string | null {
  const w = Math.min(6, Math.max(1, week)) as 1 | 2 | 3 | 4 | 5 | 6;
  const key = `week${w}` as MoveImageSlot;
  return moveImage(key);
}

export function moveSessionImage(title: string): string | null {
  const t = title.toLowerCase();
  if (t.includes("lower")) return moveImage("lower");
  if (t.includes("upper")) return moveImage("upper");
  if (t.includes("full")) return moveImage("full");
  return null;
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
