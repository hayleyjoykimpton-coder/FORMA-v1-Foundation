/**
 * Cracker Challenge nutrition pointer.
 * Full program lives on the external CRACKER Nutrition platform.
 */

export type CrackerNutritionGuide = {
  title: string;
  lead: string;
  bullets: string[];
  note: string;
};

export const CRACKER_NUTRITION_GUIDE: CrackerNutritionGuide = {
  title: "CRACKER Nutrition",
  lead: "Fuel your six weeks with Naomi Gillespie’s complete CRACKER nutrition program.",
  bullets: [
    "Open the NOURISH tab for the full nutrition platform.",
    "Recipes, weekly guidance and education live outside FORMA.",
    "Training and wellness stay in MOVE and CONNECT.",
  ],
  note: "Your nutrition plan, recipes and education are managed through the separate CRACKER Nutrition platform.",
};

export const CRACKER_FUEL_HINT =
  "Open NOURISH for Naomi Gillespie’s CRACKER Nutrition program — recipes and education live on the separate platform.";
