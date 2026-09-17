import {
  CRACKER_RECIPE_WEEKS,
  CRACKER_WEEK_TITLES,
  type CrackerDessert,
  type CrackerRecipe,
  type CrackerRecipeWeek,
} from "@/lib/crackerRecipes";
import type { WeekParticipationStatus } from "./types";

export type RecipeListItem =
  | {
      kind: "recipe";
      id: string;
      recipe: CrackerRecipe;
      title: string;
      week: number;
      day: number;
      meal: string;
      desc: string;
      tags: string[];
    }
  | {
      kind: "dessert";
      id: string;
      dessert: CrackerDessert;
      title: string;
      week: number;
      desc: string;
      tags: string[];
    };

export function recipeId(r: CrackerRecipe): string {
  return `w${r.week}-d${r.day}-${r.meal.toLowerCase()}`;
}

export function dessertId(d: CrackerDessert): string {
  return `w${d.week}-dessert`;
}

export function weekTitle(week: number): string {
  return CRACKER_WEEK_TITLES[week] ?? `Week ${week}`;
}

export function allRecipeItems(): RecipeListItem[] {
  const items: RecipeListItem[] = [];
  for (const week of CRACKER_RECIPE_WEEKS) {
    for (const recipe of week.recipes) {
      items.push({
        kind: "recipe",
        id: recipeId(recipe),
        recipe,
        title: recipe.title,
        week: recipe.week,
        day: recipe.day,
        meal: recipe.meal,
        desc: recipe.why.slice(0, 120) + (recipe.why.length > 120 ? "…" : ""),
        tags: [`Week ${recipe.week}`, `Day ${recipe.day}`, recipe.meal],
      });
    }
    if (week.dessert) {
      items.push({
        kind: "dessert",
        id: dessertId(week.dessert),
        dessert: week.dessert,
        title: week.dessert.title,
        week: week.week,
        desc: week.dessert.why.slice(0, 120) + (week.dessert.why.length > 120 ? "…" : ""),
        tags: [`Week ${week.week}`, "Dessert"],
      });
    }
  }
  return items;
}

export function findRecipeItem(id: string): RecipeListItem | null {
  return allRecipeItems().find((i) => i.id === id) ?? null;
}

export function searchRecipes(query: string, weekFilter?: number | null): RecipeListItem[] {
  const q = query.trim().toLowerCase();
  return allRecipeItems().filter((item) => {
    if (weekFilter && item.week !== weekFilter) return false;
    if (!q) return true;
    const hay = `${item.title} ${item.tags.join(" ")} ${item.desc}`.toLowerCase();
    return hay.includes(q);
  });
}

export function mealPlanForWeek(week: number): CrackerRecipeWeek {
  return (
    CRACKER_RECIPE_WEEKS.find((w) => w.week === week) ?? CRACKER_RECIPE_WEEKS[0]
  );
}

export function weekParticipationStatus(
  week: number,
  currentWeek: number,
  participated: number[],
): WeekParticipationStatus {
  if (participated.includes(week) || week < currentWeek) return "done";
  if (week === currentWeek) return "in-progress";
  return "locked";
}
