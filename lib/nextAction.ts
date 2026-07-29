/**
 * Home “What should I do next?” — one dominant action from current state.
 */

import type { Workout } from "./types";
import type { WorkoutSession } from "./types";
import {
  breathworkDoneToday,
  gratitudeFilledCount,
  GRATITUDE_SLOTS,
  readinessDoneToday,
  type WellnessState,
} from "./wellness";
import { mealsForDay, type MealsState } from "./meals";
import { HYDRATION_GOAL } from "./content";

export type NextActionKind =
  | "resume"
  | "train"
  | "meal"
  | "wind_down"
  | "readiness"
  | "gratitude"
  | "hydrate"
  | "rest"
  | "caught_up";

export type NextAction = {
  kind: NextActionKind;
  eyebrow: string;
  title: string;
  detail: string;
  cta: string;
  /** Visual accent for the hero card */
  accent: "mocha" | "blue" | "sage" | "green" | "pink";
};

export type NextActionInput = {
  hour: number;
  todaysWorkout: Workout | null;
  pausedTitle?: string | null;
  history: WorkoutSession[];
  wellness: WellnessState;
  meals: MealsState;
  water: number;
  todayISO: string;
};

function trainedOnDate(history: WorkoutSession[], dayISO: string): boolean {
  return history.some((session) => session.completedAt.slice(0, 10) === dayISO);
}

/**
 * Pick a single primary action. Priority:
 * resume → train → evening wind-down → meal after train → readiness → gratitude → hydrate → rest/caught up
 */
export function resolveNextAction(input: NextActionInput): NextAction {
  const {
    hour,
    todaysWorkout,
    pausedTitle,
    history,
    wellness,
    meals,
    water,
    todayISO,
  } = input;

  const evening = hour >= 18;
  const trained = trainedOnDate(history, todayISO);
  const mealCount = mealsForDay(meals, todayISO).length;
  const gratitudeDone = gratitudeFilledCount(wellness, todayISO) >= GRATITUDE_SLOTS;
  const breathDone = breathworkDoneToday(wellness, todayISO);
  const readyDone = readinessDoneToday(wellness, todayISO);

  if (pausedTitle) {
    return {
      kind: "resume",
      eyebrow: "Unfinished",
      title: `Resume ${pausedTitle}`,
      detail: "Your sets are still here — pick up where you left off.",
      cta: "Resume session",
      accent: "mocha",
    };
  }

  if (todaysWorkout && todaysWorkout.exercises.length > 0 && !trained) {
    return {
      kind: "train",
      eyebrow: evening ? "Still time to train" : "Today’s focus",
      title: `Start ${todaysWorkout.title}`,
      detail: `${todaysWorkout.exercises.length} exercises · ~${todaysWorkout.duration} min`,
      cta: "Start workout",
      accent: "mocha",
    };
  }

  if (evening && !breathDone) {
    return {
      kind: "wind_down",
      eyebrow: "Evening",
      title: "Begin wind-down ritual",
      detail: "A few minutes of breathwork settles the day and supports recovery.",
      cta: "Start breathwork",
      accent: "sage",
    };
  }

  if (trained && mealCount === 0) {
    return {
      kind: "meal",
      eyebrow: "After training",
      title: "Log a meal",
      detail: "Fuel what you just earned — photo or manual macros.",
      cta: "Log meal",
      accent: "mocha",
    };
  }

  if (!readyDone && (trained || evening || !todaysWorkout)) {
    return {
      kind: "readiness",
      eyebrow: "Check-in",
      title: "Complete recovery check-in",
      detail: "A quick 1–5 score on sleep, energy and stress — no workout required.",
      cta: "Log readiness",
      accent: "blue",
    };
  }

  if (!gratitudeDone) {
    return {
      kind: "gratitude",
      eyebrow: "Daily habit",
      title: "Three good things",
      detail: "A short gratitude practice — three lines is enough.",
      cta: "Add gratitude",
      accent: "green",
    };
  }

  if (water < HYDRATION_GOAL) {
    return {
      kind: "hydrate",
      eyebrow: "Hydration",
      title: "Drink some water",
      detail: `${water} of ${HYDRATION_GOAL} glasses so far today.`,
      cta: "Add a glass",
      accent: "blue",
    };
  }

  if (!todaysWorkout || todaysWorkout.exercises.length === 0) {
    return {
      kind: "rest",
      eyebrow: "Rest day",
      title: "Recover well today",
      detail: "Walk, mobility, or breathwork — rest is part of the programme.",
      cta: "Open Recovery",
      accent: "sage",
    };
  }

  return {
    kind: "caught_up",
    eyebrow: "You’re on track",
    title: "Nothing urgent right now",
    detail: "Training, habits, and recovery look covered. Browse Progress when you’re curious.",
    cta: "View Progress",
    accent: "green",
  };
}
