/** External Christmas Cracker Nutrition platform (authoritative). */

import { CRACKER_EXTERNAL_LINKS } from "./crackerLinks";

export const NOURISH_PROGRAM_URL = CRACKER_EXTERNAL_LINKS.nutritionProgram;

/** Real flat-lay whole-foods photo for the Cracker NOURISH gateway hero. */
export const NOURISH_HERO_IMAGE = "/cracker/nourish/nourish-hero-flatlay.jpg";

/** Naomi Gillespie — supplied portrait for the nutrition program card. */
export const NOURISH_NAOMI_IMAGE = "/cracker/nourish/naomi-gillespie.jpg";

export const NOURISH_COPY = {
  title: "NOURISH",
  supporting: "Fuel your six weeks.",
  description: "Your complete CRACKER nutrition program with Naomi Gillespie.",
  note: "Your nutrition plan, recipes and education are managed through the separate CRACKER Nutrition platform.",
  ctaPrimary: "OPEN NUTRITION PROGRAM",
  ctaHome: "OPEN NUTRITION",
  personalisedPrice: "$25",
  wellnessPrice: "$10",
  pricePeriod: "per week",
  wellnessHowTo:
    "On the signup page: select your club, choose weekly payments, then add Wellness $10 per week.",
  supportEyebrow: "NUTRITION SUPPORT",
  supportTitle: "ASK NAOMI",
  supportBody:
    "Email Origin Wellness or message the CRACKER page. Naomi also hosts Thursday Question Bomb — live Q&A every Thursday.",
  supportEmailCta: "EMAIL ORIGIN WELLNESS",
  supportMessageCta: "MESSAGE CRACKER PAGE",
  introEyebrow: "WATCH NAOMI",
  introTitle: "Intro to CRACKER nutrition",
} as const;
