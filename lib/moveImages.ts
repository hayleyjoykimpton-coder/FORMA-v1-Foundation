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

/**
 * Session card themes — Intermediate / Beginner / Cracker titles map here so
 * adjacent cards never share the same Jess photo.
 */
export type MoveSessionTheme =
  | "lower"
  | "glute-strength"
  | "glute-shape"
  | "upper"
  | "upper-sculpt"
  | "upper-strength"
  | "full"
  | "figure"
  | "contour"
  | "abs"
  | "train";

/** Official JMK Training promo (Jess + branding). */
export const JMK_TRAINING_IMAGE = "/cracker/jess-mckee-jmk-training.jpg";

/** Jess in Life & Soul kit — gym portrait. */
export const JESS_LAS_PORTRAIT = "/cracker/move/jess-life-and-soul-portrait.jpg";

/** Jess coaching a client through a lower-body hinge at Life & Soul. */
export const JESS_COACHING_CLIENT = "/cracker/move/jess-coaching-client.jpg";

/**
 * Jess coaching a client (hinge / form cue) — Life & Soul gym, screens + retail wall.
 * Preferred authentic 1:1 coaching shot for lower / check-in rotation.
 */
export const JESS_COACHING_CLIENT_01 = "/cracker/move/jess-coaching-client-01.jpg";

/** Hands-on form guidance — same session as client-01 (canonical path). */
export const JESS_COACHING_FORM = JESS_COACHING_CLIENT_01;

/** Jess demonstrating lateral raise with client + dumbbells. */
export const JESS_LATERAL_RAISE = "/cracker/move/jess-lateral-raise.jpg";

/** Jess coaching a client on lateral raise — Life & Soul gym. */
export const JESS_COACHING_LATERAL = "/cracker/move/jess-coaching-lateral.jpg";

/** Jess kneeling to cue lat-pulldown form — Life & Soul gym. */
export const JESS_COACHING_PULLDOWN = "/cracker/move/jess-coaching-pulldown.jpg";

/** Jess coaching lateral raise — Soul Pilates mirror wall (Life & Soul kit). */
export const JESS_COACHING_LATERAL_02 = "/cracker/move/jess-coaching-lateral-raise-02.jpg";

/** Jess coaching a blonde client at a Hammer Strength rack with barbell — The Mayfair. */
export const JESS_COACHING_FULL_BARBELL = "/cracker/move/jess-coaching-full-barbell.jpg";

/** Life & Soul Christmas Cracker badge — branded, no AI people. */
export const CRACKER_BADGE_IMAGE = "/brand/christmas-cracker-512.png";

/**
 * Active MOVE image paths. Empty string = use neutral graphic treatment.
 * Fill slots as real Jess/client photos are supplied.
 */
export const MOVE_IMAGES: Record<MoveImageSlot, string> = {
  hero: JESS_LAS_PORTRAIT,
  week1: JESS_COACHING_CLIENT_01,
  week2: JESS_COACHING_LATERAL_02,
  week3: JESS_COACHING_CLIENT,
  // Real coaching photo — not the JMK "Real Results" promo graphic
  week4: JESS_COACHING_FULL_BARBELL,
  week5: JESS_COACHING_LATERAL,
  week6: JESS_COACHING_PULLDOWN,
  lower: JESS_COACHING_CLIENT_01,
  upper: JESS_COACHING_PULLDOWN,
  full: JESS_COACHING_FULL_BARBELL,
  // Distinct from headTrainer (portrait) and from week banners — lateral-raise demo
  learnWithJess: JESS_LATERAL_RAISE,
  fitnessCheckIn: JESS_COACHING_CLIENT_01,
  scans: JESS_COACHING_LATERAL,
  // Identity portrait — keep separate from LEARN WITH JESS
  headTrainer: JESS_LAS_PORTRAIT,
};

/**
 * Distinct Jess photos per session theme.
 * Chosen so same-week neighbours (e.g. Glute Shape → Weighted Abs) never match.
 *
 * Cracker: Lower Body / Upper Body / Full Body
 * Intermediate 5-day: Glute Strength · Upper Sculpt · Glute Shape · Upper Strength · Weighted Abs
 * Intermediate 4-day: Lower Strength · Upper Sculpt · Glute Shape · Weighted Abs
 * Intermediate 3-day: Figure Strength · Contour Drive · Weighted Abs
 */
export const SESSION_THEME_IMAGES: Record<MoveSessionTheme, string> = {
  lower: JESS_COACHING_CLIENT_01,
  "glute-strength": JESS_COACHING_CLIENT_01,
  "glute-shape": JESS_COACHING_CLIENT,
  upper: JESS_COACHING_PULLDOWN,
  "upper-sculpt": JESS_COACHING_PULLDOWN,
  "upper-strength": JESS_LATERAL_RAISE,
  full: JESS_COACHING_FULL_BARBELL,
  figure: JESS_COACHING_FULL_BARBELL,
  contour: JESS_COACHING_LATERAL,
  abs: JESS_COACHING_LATERAL_02,
  train: JESS_LAS_PORTRAIT,
};

/** Spare real photos available for rotation (not yet assigned to every slot). */
export const MOVE_IMAGE_POOL: string[] = [
  JESS_LAS_PORTRAIT,
  JESS_COACHING_CLIENT_01,
  JESS_COACHING_CLIENT,
  JESS_COACHING_PULLDOWN,
  JESS_COACHING_LATERAL_02,
  JESS_COACHING_FULL_BARBELL,
  JESS_LATERAL_RAISE,
  JESS_COACHING_LATERAL,
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

/** Stable pool pick for unknown titles — different strings → different files when possible. */
function poolImageForTitle(title: string): string {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = (hash * 31 + title.charCodeAt(i)) >>> 0;
  }
  return MOVE_IMAGE_POOL[hash % MOVE_IMAGE_POOL.length] ?? JESS_LAS_PORTRAIT;
}

/**
 * Map Intermediate / Beginner / Cracker session titles to a theme.
 * Specific phrases win over broad keywords so Glute Shape ≠ Glute Strength, etc.
 */
export function moveSessionTheme(title: string): MoveSessionTheme {
  const t = title.toLowerCase().trim();

  if (/weighted\s*abs|\babs\b|core/.test(t)) return "abs";
  if (/glute\s*shape/.test(t)) return "glute-shape";
  if (/glute\s*strength/.test(t)) return "glute-strength";
  if (/upper\s*sculpt/.test(t)) return "upper-sculpt";
  if (/upper\s*strength/.test(t)) return "upper-strength";
  if (/figure\s*strength/.test(t)) return "figure";
  if (/contour\s*drive/.test(t)) return "contour";
  if (/lower\s*(body|strength|power)?/.test(t) || /^lower\b/.test(t)) return "lower";
  if (/upper\s*(body|strength|sculpt)?/.test(t) || /^upper\b/.test(t)) {
    if (/sculpt/.test(t)) return "upper-sculpt";
    if (/strength/.test(t)) return "upper-strength";
    return "upper";
  }
  if (/full\s*body|fullbody|^full\b/.test(t)) return "full";
  if (/glute|hip|leg|squat|hinge|shape/.test(t)) return "glute-shape";
  if (/sculpt|pull|push|shoulder|row|press/.test(t)) return "upper-sculpt";
  return "train";
}

export function moveSessionImage(title: string): string | null {
  const theme = moveSessionTheme(title);
  if (theme === "train") {
    // Unknown title — rotate pool by hash so cards still diverge when possible
    return poolImageForTitle(title);
  }
  return SESSION_THEME_IMAGES[theme] ?? moveImage("hero");
}

/**
 * Workout / session hero for Cracker MOVE — always prefers real Jess photos
 * over generic `/img/*` stock.
 */
export function imageForMoveWorkout(title: string): string {
  return (
    moveSessionImage(title) ??
    moveImage("hero") ??
    JESS_LAS_PORTRAIT
  );
}

export type MoveMediaKind = "photo" | "neutral";

/** CSS modifier for object-position on session card media (optional crop). */
export function moveSessionCropClass(theme: MoveSessionTheme): string {
  if (theme === "full" || theme === "figure") return "cracker-workout-media--full";
  if (theme === "abs") return "cracker-workout-media--abs";
  if (theme === "glute-shape") return "cracker-workout-media--glute-shape";
  return "";
}

export function moveMediaForSession(title: string): {
  kind: MoveMediaKind;
  src: string | null;
  label: string;
  theme: MoveSessionTheme;
  cropClass: string;
} {
  const theme = moveSessionTheme(title);
  const label =
    theme === "lower" || theme === "glute-strength"
      ? "LOWER"
      : theme === "glute-shape"
        ? "GLUTE"
        : theme === "upper" || theme === "upper-sculpt" || theme === "upper-strength"
          ? "UPPER"
          : theme === "full" || theme === "figure" || theme === "contour"
            ? "FULL"
            : theme === "abs"
              ? "ABS"
              : "TRAIN";
  const src = moveSessionImage(title);
  return {
    kind: src ? "photo" : "neutral",
    src,
    label,
    theme,
    cropClass: moveSessionCropClass(theme),
  };
}
