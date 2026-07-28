/**
 * Goal-aware daily macro targets from profile.nutritionGoal.
 * Training `goal` (sculpt/glutes/…) stays separate — this is calorie intent only.
 */

import { NUTRITION_LABELS, type NutritionGoal, type UserProfile } from "./user";

export type DailyTargets = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealsPlanned: number;
  goal: NutritionGoal;
  goalLabel: string;
  note: string;
};

/** Rough Mifflin–St Jeor × activity when stats exist; else editorial baseline. */
export function estimateTdee(profile: UserProfile): number {
  const weight = profile.weight;
  const height = profile.height;
  const age = profile.age;
  if (weight == null || height == null || age == null) {
    return 1850;
  }

  const isMale = profile.gender === "male";
  const bmr = isMale
    ? 10 * weight + 6.25 * height - 5 * age + 5
    : 10 * weight + 6.25 * height - 5 * age - 161;

  const steps = profile.dailySteps ?? 7000;
  let activity = 1.375;
  if (steps >= 10000) activity = 1.55;
  else if (steps >= 8000) activity = 1.45;
  else if (steps < 5000) activity = 1.2;

  // Training days nudge activity slightly.
  activity += (profile.trainingDays - 3) * 0.03;

  return Math.round(bmr * activity);
}

function splitMacros(
  calories: number,
  proteinG: number,
  fatG: number,
): { protein: number; carbs: number; fat: number; calories: number } {
  const protein = Math.round(proteinG);
  const fat = Math.round(fatG);
  const proteinKcal = protein * 4;
  const fatKcal = fat * 9;
  const carbs = Math.max(0, Math.round((calories - proteinKcal - fatKcal) / 4));
  return { calories: Math.round(calories), protein, carbs, fat };
}

export function targetsForProfile(profile: UserProfile): DailyTargets {
  const tdee = estimateTdee(profile);
  const weight = profile.weight ?? 62;
  const goal = profile.nutritionGoal;

  switch (goal) {
    case "lose": {
      const macros = splitMacros(tdee * 0.8, weight * 2.0, weight * 0.8);
      return {
        ...macros,
        mealsPlanned: 4,
        goal,
        goalLabel: NUTRITION_LABELS[goal],
        note: "Mild deficit · higher protein to protect lean tissue",
      };
    }
    case "gain": {
      const macros = splitMacros(tdee * 1.1, weight * 1.8, weight * 0.9);
      return {
        ...macros,
        mealsPlanned: 4,
        goal,
        goalLabel: NUTRITION_LABELS[goal],
        note: "Slight surplus · fuel strength and muscle",
      };
    }
    case "recomp": {
      const macros = splitMacros(tdee * 0.95, weight * 2.0, weight * 0.85);
      return {
        ...macros,
        mealsPlanned: 4,
        goal,
        goalLabel: NUTRITION_LABELS[goal],
        note: "Near maintenance · high protein for recomposition",
      };
    }
    case "maintain":
    default: {
      const macros = splitMacros(tdee, weight * 1.6, weight * 0.9);
      return {
        ...macros,
        mealsPlanned: 4,
        goal: "maintain",
        goalLabel: NUTRITION_LABELS.maintain,
        note: "Balanced fuel for your training week",
      };
    }
  }
}

export function suggestionForRemaining(
  targets: DailyTargets,
  eaten: { calories: number; protein: number },
): string {
  const calLeft = targets.calories - eaten.calories;
  const proLeft = targets.protein - eaten.protein;

  if (eaten.calories <= 0) {
    switch (targets.goal) {
      case "lose":
        return "Start with a protein-led plate — keep calories purposeful.";
      case "gain":
        return "Eat enough to train hard — include carbs around sessions.";
      case "recomp":
        return "Prioritise protein at every meal; keep calories steady.";
      default:
        return "Build your day around protein, colour, and steady energy.";
    }
  }

  if (calLeft <= 0 && proLeft <= 0) {
    return "Targets met — hydrate and leave room to digest before bed.";
  }
  if (proLeft > 20) {
    return `About ${Math.round(proLeft)}g protein left — lean meat, Greek yoghurt, or a shake helps.`;
  }
  if (calLeft > 250 && targets.goal === "gain") {
    return `~${Math.round(calLeft)} kcal still open — add a carb-rich side or snack.`;
  }
  if (calLeft < 150 && targets.goal === "lose") {
    return "Close to your calorie target — keep the next meal light and protein-forward.";
  }
  return `Roughly ${Math.max(0, Math.round(calLeft))} kcal and ${Math.max(0, Math.round(proLeft))}g protein remaining.`;
}
