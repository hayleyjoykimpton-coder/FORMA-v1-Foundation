/**
 * Meal logging — calories, macros, ingredients, optional photo.
 * Local: forma-meals-v1. Cloud: nested under programme.meals.
 */

export const MEALS_STORAGE_KEY = "forma-meals-v1";

export type MealMacros = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type MealLogEntry = {
  id: string;
  date: string;
  loggedAt: string;
  name: string;
  ingredients: string;
  /** Small JPEG data URL — stripped from older entries to protect storage. */
  photo?: string;
  macros: MealMacros;
  source: "manual" | "photo" | "photo+manual";
  aiNote?: string;
  suggestion?: string;
};

export type MealsState = {
  entries: MealLogEntry[];
};

export const EMPTY_MEALS: MealsState = { entries: [] };

const uid = () => Math.random().toString(36).slice(2, 10);

export function localDateKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function clampMacro(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n);
}

export function normalizeMeals(raw: unknown): MealsState {
  if (!raw || typeof raw !== "object") return { entries: [] };
  const data = raw as Partial<MealsState>;
  const entries = Array.isArray(data.entries)
    ? data.entries
        .filter(
          (entry): entry is MealLogEntry =>
            Boolean(entry && typeof entry === "object" && typeof entry.id === "string" && typeof entry.date === "string"),
        )
        .map((entry) => {
          const source: MealLogEntry["source"] =
            entry.source === "photo" || entry.source === "photo+manual" ? entry.source : "manual";
          return {
            id: entry.id,
            date: entry.date,
            loggedAt: typeof entry.loggedAt === "string" ? entry.loggedAt : new Date().toISOString(),
            name: String(entry.name ?? "Meal"),
            ingredients: String(entry.ingredients ?? ""),
            ...(typeof entry.photo === "string" && entry.photo.startsWith("data:") ? { photo: entry.photo } : {}),
            macros: {
              calories: clampMacro(entry.macros?.calories),
              protein: clampMacro(entry.macros?.protein),
              carbs: clampMacro(entry.macros?.carbs),
              fat: clampMacro(entry.macros?.fat),
            },
            source,
            ...(entry.aiNote ? { aiNote: String(entry.aiNote) } : {}),
            ...(entry.suggestion ? { suggestion: String(entry.suggestion) } : {}),
          };
        })
        .slice(-120)
    : [];
  return pruneMealPhotos({ entries });
}

/** Keep photos only on the newest ~20 entries to limit localStorage / sync size. */
export function pruneMealPhotos(state: MealsState): MealsState {
  const sorted = [...state.entries].sort((a, b) => b.loggedAt.localeCompare(a.loggedAt));
  const keepPhoto = new Set(sorted.slice(0, 20).map((entry) => entry.id));
  return {
    entries: state.entries.map((entry) =>
      keepPhoto.has(entry.id) ? entry : { ...entry, photo: undefined },
    ),
  };
}

export function loadMeals(): MealsState {
  if (typeof window === "undefined") return { entries: [] };
  try {
    const raw = window.localStorage.getItem(MEALS_STORAGE_KEY);
    return raw ? normalizeMeals(JSON.parse(raw)) : { entries: [] };
  } catch {
    return { entries: [] };
  }
}

export function saveMeals(state: MealsState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MEALS_STORAGE_KEY, JSON.stringify(normalizeMeals(state)));
}

export function mealsForDay(state: MealsState, day = localDateKey()): MealLogEntry[] {
  return state.entries
    .filter((entry) => entry.date === day)
    .sort((a, b) => b.loggedAt.localeCompare(a.loggedAt));
}

export function dayMacroTotals(state: MealsState, day = localDateKey()): MealMacros {
  return mealsForDay(state, day).reduce(
    (sum, entry) => ({
      calories: sum.calories + entry.macros.calories,
      protein: sum.protein + entry.macros.protein,
      carbs: sum.carbs + entry.macros.carbs,
      fat: sum.fat + entry.macros.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

export function addMeal(
  state: MealsState,
  input: Omit<MealLogEntry, "id" | "loggedAt" | "date"> & { date?: string },
): MealsState {
  const entry: MealLogEntry = {
    id: uid(),
    date: input.date ?? localDateKey(),
    loggedAt: new Date().toISOString(),
    name: input.name.trim() || "Meal",
    ingredients: input.ingredients.trim(),
    ...(input.photo ? { photo: input.photo } : {}),
    macros: {
      calories: clampMacro(input.macros.calories),
      protein: clampMacro(input.macros.protein),
      carbs: clampMacro(input.macros.carbs),
      fat: clampMacro(input.macros.fat),
    },
    source: input.source,
    ...(input.aiNote ? { aiNote: input.aiNote } : {}),
    ...(input.suggestion ? { suggestion: input.suggestion } : {}),
  };
  return pruneMealPhotos({ entries: [...state.entries, entry] });
}

export function removeMeal(state: MealsState, id: string): MealsState {
  return { entries: state.entries.filter((entry) => entry.id !== id) };
}

export type AnalyzeMealResult = {
  name?: string;
  ingredients?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  suggestion?: string;
  note?: string;
};

/** Client helper — returns null when AI is unavailable or fails. */
export async function analyzeMealPhoto(
  imageDataUrl: string,
  nutritionGoal: string,
): Promise<AnalyzeMealResult | null> {
  const detailed = await analyzeMealPhotoDetailed(imageDataUrl, nutritionGoal);
  return detailed.ok ? detailed.result : null;
}

export type AnalyzeMealDetailed =
  | { ok: true; result: AnalyzeMealResult }
  | { ok: false; reason: "unavailable" | "quota" | "failed"; message: string };

/** Client helper with actionable errors for the meal log UI. */
export async function analyzeMealPhotoDetailed(
  imageDataUrl: string,
  nutritionGoal: string,
): Promise<AnalyzeMealDetailed> {
  try {
    const res = await fetch("/api/analyze-meal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: imageDataUrl, nutritionGoal }),
    });
    if (res.status === 503) {
      return {
        ok: false,
        reason: "unavailable",
        message: "Photo macros aren’t set up yet — enter calories manually for now.",
      };
    }
    if (!res.ok) {
      let detail = "";
      try {
        const payload = (await res.json()) as { error?: string; detail?: string };
        detail = `${payload.error ?? ""} ${payload.detail ?? ""}`.toLowerCase();
      } catch {
        /* ignore */
      }
      if (detail.includes("insufficient_quota") || detail.includes("billing")) {
        return {
          ok: false,
          reason: "quota",
          message: "AI credits ran out — enter macros manually (photo is still saved).",
        };
      }
      return {
        ok: false,
        reason: "failed",
        message: "Couldn’t estimate that plate — enter macros manually (photo is still saved).",
      };
    }
    return { ok: true, result: (await res.json()) as AnalyzeMealResult };
  } catch {
    return {
      ok: false,
      reason: "failed",
      message: "Couldn’t reach meal AI — enter macros manually (photo is still saved).",
    };
  }
}
