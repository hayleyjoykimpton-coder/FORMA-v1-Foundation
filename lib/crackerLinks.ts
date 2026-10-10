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
    intro: "https://youtu.be/oc93hzf6l8A",
    /** Training demos. Weeks 4/5/6 reuse week 1/2/3 unless a later week URL is set. */
    week1: "",
    week2: "",
    week3: "",
    week4: "",
    week5: "",
    week6: "",
  },
  /**
   * Jess session demos (Lower / Upper / Full).
   * Only week 1–3 need links — weeks 4/5/6 reuse those same videos.
   */
  jessSessionDemos: {
    beginner: {
      lower: { week1: "https://youtube.com/shorts/A2M8FBJhphU?feature=share", week2: "https://youtube.com/shorts/HFK0VpJ39Oo?feature=share", week3: "https://youtube.com/shorts/uSS1Z-GSyyY?feature=share" },
      upper: { week1: "https://youtube.com/shorts/5_pqL7Sw5zQ?feature=share", week2: "https://youtube.com/shorts/7mlca-_bY5Q?feature=share", week3: "https://youtube.com/shorts/3tqAmYg_slY?feature=share" },
      full: {
        week1: "https://youtube.com/shorts/bWjAxfCSV4Y?feature=share",
        week2: "https://youtube.com/shorts/SGlGwcAwmp0?feature=share",
        week3: "https://youtube.com/shorts/Az7cIf278No?feature=share",
      },
    },
    intermediate: {
      lower: { week1: "", week2: "", week3: "" },
      upper: { week1: "", week2: "https://youtube.com/shorts/hBg12P2VCVs?feature=share", week3: "" },
      full: { week1: "https://youtube.com/shorts/ReydEwFWN3k?feature=share", week2: "https://youtube.com/shorts/zMfn6qYPJFI?feature=share", week3: "https://youtube.com/shorts/5VO7OkeiFQE?feature=share" },
    },
  },
  naomiVideos: {
    intro: "https://youtube.com/shorts/UjnC8Fp6Mxs?feature=share",
  },
  /** Happy Healthy Nutrition / Jess Lowe — upgrade intro on the Nourish card. */
  jessLoweVideos: {
    intro: "https://youtube.com/shorts/FanaMCmboG8?feature=share",
  },
  /** Naomi workshop / education links — render Nourish education only when a URL is set. */
  nutritionEducation: [] as { title: string; url: string }[],
  /** Week 3 TYG Payday booking. Empty = Coming soon, never a placeholder. */
  tygPaydayBooking: "",
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

/** Weeks 4/5/6 play the same training demo as weeks 1/2/3. */
export function jessDemoSourceWeek(week: number): number {
  const w = Math.min(6, Math.max(1, Math.floor(week) || 1));
  return w > 3 ? w - 3 : w;
}

export type JessSessionKey = "lower" | "upper" | "full";

const SESSION_TITLES: Record<JessSessionKey, string> = {
  lower: "Lower Body",
  upper: "Upper Body",
  full: "Full Body",
};

export function jessSessionKeyFromTitle(title: string): JessSessionKey | null {
  const t = title.toLowerCase();
  if (t.includes("lower")) return "lower";
  if (t.includes("upper")) return "upper";
  if (t.includes("full")) return "full";
  return null;
}

export function jessSessionDemoUrl(
  level: "beginner" | "intermediate",
  titleOrKey: string,
  week: number,
): string | null {
  const key =
    titleOrKey === "lower" || titleOrKey === "upper" || titleOrKey === "full"
      ? titleOrKey
      : jessSessionKeyFromTitle(titleOrKey);
  if (!key) return null;
  const slot = CRACKER_EXTERNAL_LINKS.jessSessionDemos[level][key];
  const source = jessDemoSourceWeek(week);
  const weekKey = `week${source}` as keyof typeof slot;
  return configuredUrl(slot[weekKey]);
}

export function jessSessionDemosForWeek(
  level: "beginner" | "intermediate",
  week: number,
): { key: JessSessionKey; title: string; url: string; sourceWeek: number }[] {
  const sourceWeek = jessDemoSourceWeek(week);
  return (["lower", "upper", "full"] as const)
    .map((key) => {
      const url = jessSessionDemoUrl(level, key, week);
      return url ? { key, title: SESSION_TITLES[key], url, sourceWeek } : null;
    })
    .filter((item): item is { key: JessSessionKey; title: string; url: string; sourceWeek: number } =>
      Boolean(item),
    );
}

export function jessVideoUrl(week: number): string | null {
  const w = Math.min(6, Math.max(1, Math.floor(week) || 1));
  const key = `week${w}` as keyof typeof CRACKER_EXTERNAL_LINKS.jessVideos;
  const direct = configuredUrl(CRACKER_EXTERNAL_LINKS.jessVideos[key]);
  if (direct) return direct;
  if (w >= 4) {
    const replay = `week${jessDemoSourceWeek(w)}` as keyof typeof CRACKER_EXTERNAL_LINKS.jessVideos;
    return configuredUrl(CRACKER_EXTERNAL_LINKS.jessVideos[replay]);
  }
  return null;
}

export function naomiIntroVideoUrl(): string | null {
  return configuredUrl(CRACKER_EXTERNAL_LINKS.naomiVideos.intro);
}

export function jessLoweIntroVideoUrl(): string | null {
  return configuredUrl(CRACKER_EXTERNAL_LINKS.jessLoweVideos.intro);
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

export function tygPaydayBookingUrl(): string | null {
  return configuredUrl(CRACKER_EXTERNAL_LINKS.tygPaydayBooking);
}

/** Spec name — same object as CRACKER_EXTERNAL_LINKS. */
export const crackerExternalLinks = CRACKER_EXTERNAL_LINKS;
