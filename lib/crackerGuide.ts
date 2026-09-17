/**
 * Cracker Challenge nutrition guide (temporary in-app copy).
 * Replace bullets when Hayley pastes the real guide — no PDF pipeline needed yet.
 */

export type CrackerNutritionGuide = {
  title: string;
  lead: string;
  bullets: string[];
  note: string;
};

export const CRACKER_NUTRITION_GUIDE: CrackerNutritionGuide = {
  title: "Christmas Cracker fuel",
  lead: "Six-week challenge nutrition — keep it simple and consistent through the season.",
  bullets: [
    "Protein at most meals (hand-sized portion).",
    "Veg / colour on the plate twice a day.",
    "Hydrate — water before coffee if you can.",
    "One flexible meal a week is fine; don’t spiral.",
  ],
  note: "Swap these bullets for your real Christmas Cracker nutrition guide anytime — Profile → Challenge mode stays on.",
};

/** Soft calorie / protein framing shown under the guide (not a hard prescription). */
export const CRACKER_FUEL_HINT =
  "Use your meal log as usual — targets still follow your nutrition goal until we lock Cracker macros from the guide.";
