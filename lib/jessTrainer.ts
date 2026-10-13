/** Jess McKee / JMK Training — Head Trainer feature for MOVE. */

import {
  jessDemoSourceWeek,
  jessInstagramUrl,
  jessIntroVideoUrl as introFromLinks,
  jessSessionDemoUrl,
  jessSessionDemosForWeek,
  jessVideoUrl,
} from "./crackerLinks";

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

export function crackerWeeklyTrainingDemoSourceWeek(week: number): number {
  return jessDemoSourceWeek(week);
}

export function crackerSessionDemoUrl(
  level: "beginner" | "intermediate",
  title: string,
  week: number,
): string | null {
  return jessSessionDemoUrl(level, title, week);
}

export function crackerSessionDemosForWeek(
  level: "beginner" | "intermediate",
  week: number,
) {
  return jessSessionDemosForWeek(level, week);
}

export function crackerIntroVideoUrl(): string | null {
  return introFromLinks();
}

export function crackerJessInstagramUrl(): string | null {
  return jessInstagramUrl();
}
