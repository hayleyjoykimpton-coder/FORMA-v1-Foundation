/**
 * Central Christmas Cracker external URLs.
 * Paste real links here — components must not hardcode service URLs.
 * Empty string = not ready yet (show Coming soon, never a broken button).
 */

import { CRACKER_FACEBOOK_URL } from "./connect";

export const CRACKER_SUPPORT_EMAIL = "hayleyk@lifeandsoul.com.au";
export const CRACKER_NUTRITION_SUPPORT_EMAIL = "hello@originwellness.au";

export const CRACKER_EXTERNAL_LINKS = {
  nutritionProgram: "https://christmas-cracker-2026.netlify.app/",
  facebookCommunity: CRACKER_FACEBOOK_URL,
  /** Existing Jess / JMK Training link-in-bio. Leave "" to hide Follow / Contact Jess. */
  jessInstagram: "https://linktr.ee/JMKTrainingClub",
  /** Happy Healthy Nutrition / Jess Lowe — https://lifeandsoul.com.au/nutrition/ */
  personalisedNutrition: "https://lifeandsoul.com.au/nutrition/",
  /** Shared Christmas Cracker signup — select club, weekly payments, Wellness $10 add-on. */
  wellnessSignup: "https://lifeandsoul.com.au/christmascracker/",
  /** Optional per-club GymMaster links. Empty = use wellnessSignup. */
  wellness: {
    fremantle: "",
    broome: "",
    karratha: "",
  },
  jessVideos: {
    intro: "",
    week1: "",
    week2: "",
    week3: "",
    week4: "",
    week5: "",
    week6: "",
  },
  naomiVideos: {
    intro: "https://youtube.com/shorts/UjnC8Fp6Mxs?feature=share",
  },
  /** Naomi workshop / education links — render Nourish education only when a URL is set. */
  nutritionEducation: [] as { title: string; url: string }[],
} as const;

export type WellnessClub = keyof typeof CRACKER_EXTERNAL_LINKS.wellness;

export const WELLNESS_UPGRADE_CLUBS: WellnessClub[] = ["fremantle", "broome", "karratha"];

export function configuredUrl(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function jessInstagramUrl(): string | null {
  return configuredUrl(CRACKER_EXTERNAL_LINKS.jessInstagram);
}

export function jessIntroVideoUrl(): string | null {
  return configuredUrl(CRACKER_EXTERNAL_LINKS.jessVideos.intro);
}

export function jessVideoUrl(week: number): string | null {
  const w = Math.min(6, Math.max(1, Math.floor(week) || 1));
  const key = `week${w}` as keyof typeof CRACKER_EXTERNAL_LINKS.jessVideos;
  return configuredUrl(CRACKER_EXTERNAL_LINKS.jessVideos[key]);
}

export function naomiIntroVideoUrl(): string | null {
  return configuredUrl(CRACKER_EXTERNAL_LINKS.naomiVideos.intro);
}

export function personalisedNutritionUrl(): string | null {
  return configuredUrl(CRACKER_EXTERNAL_LINKS.personalisedNutrition);
}

export function nutritionSupportMailto(): string {
  return `mailto:${CRACKER_NUTRITION_SUPPORT_EMAIL}`;
}

export function facebookCommunityUrl(): string | null {
  return configuredUrl(CRACKER_EXTERNAL_LINKS.facebookCommunity);
}

export function isWellnessClub(club: string): club is WellnessClub {
  return club === "fremantle" || club === "broome" || club === "karratha";
}

export function wellnessUpgradeUrl(club: string): string | null {
  if (!isWellnessClub(club)) return null;
  return (
    configuredUrl(CRACKER_EXTERNAL_LINKS.wellness[club]) ??
    configuredUrl(CRACKER_EXTERNAL_LINKS.wellnessSignup)
  );
}

export function nutritionEducationLinks(): { title: string; url: string }[] {
  return CRACKER_EXTERNAL_LINKS.nutritionEducation.filter((item) => configuredUrl(item.url));
}

/** Spec name — same object as CRACKER_EXTERNAL_LINKS. */
export const crackerExternalLinks = CRACKER_EXTERNAL_LINKS;
