/**
 * Nutrition hub persistence (browser localStorage).
 *
 * Keys:
 * - forma-nutrition-shopping-v1
 * - forma-nutrition-saved-v1
 * - forma-nutrition-learn-v1
 * - forma-nutrition-weeks-v1
 *
 * Data stays on-device only (same model as the rest of Cracker / FORMA local state).
 */

import type {
  LearnModuleId,
  NutritionPersistState,
  SavedRecipeRef,
  ShoppingCategory,
  ShoppingItem,
} from "./types";

const SHOPPING_KEY = "forma-nutrition-shopping-v1";
const SAVED_KEY = "forma-nutrition-saved-v1";
const LEARN_KEY = "forma-nutrition-learn-v1";
const WEEKS_KEY = "forma-nutrition-weeks-v1";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / private mode */
  }
}

export function loadNutritionPersist(): NutritionPersistState {
  return {
    shopping: readJson<ShoppingItem[]>(SHOPPING_KEY, []),
    saved: readJson<SavedRecipeRef[]>(SAVED_KEY, []),
    learnCompleted: readJson<LearnModuleId[]>(LEARN_KEY, []),
    weeksParticipated: readJson<number[]>(WEEKS_KEY, []),
  };
}

export function saveShopping(items: ShoppingItem[]): void {
  writeJson(SHOPPING_KEY, items);
}

export function saveSavedRecipes(items: SavedRecipeRef[]): void {
  writeJson(SAVED_KEY, items);
}

export function saveLearnCompleted(ids: LearnModuleId[]): void {
  writeJson(LEARN_KEY, ids);
}

export function saveWeeksParticipated(weeks: number[]): void {
  writeJson(WEEKS_KEY, weeks);
}

/** Keyword grouping only — no invented nutrition labels. */
export function categorizeIngredient(line: string): ShoppingCategory {
  const t = line.toLowerCase();
  if (
    /(chicken|beef|lamb|pork|fish|salmon|tuna|prawn|tofu|egg|mince|turkey|wings)/.test(t)
  ) {
    return "Protein";
  }
  if (
    /(yoghurt|yogurt|ricotta|milk|feta|cheese|cream|butter|cottage)/.test(t)
  ) {
    return "Dairy & alternatives";
  }
  if (
    /(bread|toast|wrap|tortilla|pita|pasta|rice|oat|couscous|quinoa|flour|buckwheat|barley)/.test(
      t,
    )
  ) {
    return "Bakery & carbs";
  }
  if (/(frozen)/.test(t)) return "Frozen";
  if (
    /(onion|garlic|tomato|spinach|lettuce|cabbage|cucumber|carrot|capsicum|zucchini|mushroom|avocado|berry|berries|apple|pear|banana|lemon|lime|potato|pumpkin|pea|bean|herb|parsley|coriander|mint|salad|fruit|kiwi|mango|peach|corn|edamame|bok choy|snow pea|asparagus|rocket)/.test(
      t,
    )
  ) {
    return "Produce";
  }
  if (
    /(oil|soy|tamari|vinegar|spice|paprika|cumin|cinnamon|honey|maple|stock|salsa|pesto|tahini|sesame|chia|nut|peanut|almond|walnut|seed|nori|sauce|salt|pepper|cacao|vanilla|baking|superhuman|tin |tinned|can )/i.test(
      t,
    )
  ) {
    return "Pantry";
  }
  return "Other";
}

function normalizeName(line: string): string {
  return line.replace(/\s+/g, " ").trim();
}

function mergeKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/^\d+[¼½¾\/\d\s.]*\s*(g|kg|ml|l|cup|cups|tbsp|tsp|slice|slices|serve|serves)?\s*/i, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function newShoppingId(): string {
  return `shop-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Add ingredient lines; merge duplicates by normalised name. */
export function addIngredientsToShopping(
  existing: ShoppingItem[],
  lines: string[],
  meta?: { recipeId?: string; recipeTitle?: string },
): ShoppingItem[] {
  const next = [...existing];
  for (const raw of lines) {
    const name = normalizeName(raw);
    if (!name) continue;
    const key = mergeKey(name);
    if (!key) continue;
    const found = next.find((i) => mergeKey(i.name) === key && !i.checked);
    if (found) {
      /* already on list — keep first wording */
      continue;
    }
    next.push({
      id: newShoppingId(),
      name,
      category: categorizeIngredient(name),
      checked: false,
      fromRecipeId: meta?.recipeId,
      fromRecipeTitle: meta?.recipeTitle,
    });
  }
  return next;
}

export function addManualShoppingItem(
  existing: ShoppingItem[],
  name: string,
): ShoppingItem[] {
  const cleaned = normalizeName(name);
  if (!cleaned) return existing;
  return addIngredientsToShopping(existing, [cleaned]);
}

export const SHOPPING_CATEGORY_ORDER: ShoppingCategory[] = [
  "Produce",
  "Protein",
  "Dairy & alternatives",
  "Bakery & carbs",
  "Pantry",
  "Frozen",
  "Other",
];
