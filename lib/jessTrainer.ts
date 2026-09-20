/** Jess McKee / JMK Training — Head Trainer feature for MOVE. */

export const JESS_HEAD_TRAINER = {
  eyebrow: "HEAD TRAINER",
  name: "JESS MCKEE",
  tagline: "Your CRACKER 2026 Head Trainer.",
  body: "Jess leads the CRACKER 2026 training program and weekly training education.",
  imageSrc: "/cracker/move/jess-life-and-soul-portrait.jpg",
  imageAlt: "Jess McKee — Life & Soul Head Trainer for Christmas Cracker 2026.",
  instagramUrl: "https://linktr.ee/JMKTrainingClub",
  followLabel: "FOLLOW JESS",
  watchLabel: "WATCH THIS WEEK'S TRAINING VIDEO",
  comingSoonLabel: "VIDEO COMING SOON",
} as const;

/**
 * Jess intro video (Home). Paste a YouTube or Vimeo link when Hayley sends it.
 */
export const CRACKER_INTRO_VIDEO: string | null = null;

/**
 * Weekly Jess training education video URLs (Learn with Jess).
 * Paste YouTube or Vimeo links when they arrive — week 1–6.
 */
export const CRACKER_WEEKLY_TRAINING_VIDEOS: Record<number, string | null> = {
  1: null,
  2: null,
  3: null,
  4: null,
  5: null,
  6: null,
};

export function crackerWeeklyTrainingVideoUrl(week: number): string | null {
  const w = Math.min(6, Math.max(1, week));
  const url = CRACKER_WEEKLY_TRAINING_VIDEOS[w];
  return url?.trim() ? url.trim() : null;
}

export function crackerIntroVideoUrl(): string | null {
  const url = CRACKER_INTRO_VIDEO?.trim();
  return url ? url : null;
}
