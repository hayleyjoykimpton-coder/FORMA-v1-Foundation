/**
 * Cracker Challenge nutrition pointer.
 * Full Recipe & Food Guide lives in `crackerRecipes.ts`;
 * Wellness education lives in `crackerWellness.ts`.
 */

export type CrackerNutritionGuide = {
  title: string;
  lead: string;
  bullets: string[];
  note: string;
};

export const CRACKER_NUTRITION_GUIDE: CrackerNutritionGuide = {
  title: "Recipe & Wellness guides",
  lead: "Two guides for the six weeks — cook from the food plan, learn the why in wellness.",
  bullets: [
    "Recipe & Food Guide — breakfast, lunch and dinner with Base, Training and Family of 4 serves.",
    "Wellness Guide — energy, stress, nervous system, gut, sleep and making it last.",
    "Plan A / B / C — organised day, busy shortcut, or the minimum.",
    "Log meals as usual — one imperfect meal does not undo the week.",
  ],
  note: "Open the Recipe and Wellness cards on Home in Christmas Cracker mode.",
};

export const CRACKER_FUEL_HINT =
  "Meal log targets still follow your nutrition goal. Use Base or Training serves from the food guide to match your day.";
