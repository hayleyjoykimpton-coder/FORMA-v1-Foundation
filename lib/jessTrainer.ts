/** Jess McKee / JMK Training — Head Trainer feature for MOVE. */

import { jessInstagramUrl, jessIntroVideoUrl as introFromLinks, jessVideoUrl } from "./crackerLinks";

export const JESS_HEAD_TRAINER = {
  eyebrow: "YOUR HEAD TRAINER",
  name: "JESS MCKEE",
  tagline: "Your CRACKER 2026 Head Trainer.",
  body: "Jess leads the CRACKER 2026 training program and weekly training education.",
  imageSrc: "/cracker/move/jess-life-and-soul-portrait.jpg",
  imageAlt: "Jess McKee — Life & Soul Head Trainer for Christmas Cracker 2026.",
  followLabel: "FOLLOW JESS",
  watchLabel: "WATCH THIS WEEK'S TRAINING VIDEO",
  comingSoonLabel: "VIDEO COMING SOON",
} as const;

export function crackerWeeklyTrainingVideoUrl(week: number): string | null {
  return jessVideoUrl(week);
}

export function crackerIntroVideoUrl(): string | null {
  return introFromLinks();
}

export function crackerJessInstagramUrl(): string | null {
  return jessInstagramUrl();
}
