/** Shared nutrition types for the Cracker Nutrition hub. */

export type NutritionHubTab =
  | "home"
  | "this-week"
  | "meal-plan"
  | "recipes"
  | "learn"
  | "shopping"
  | "resources"
  | "saved";

export type LearnModuleId = string;

export type NutritionLearnModule = {
  id: LearnModuleId;
  kind: "food-guide" | "wellness" | "resource";
  title: string;
  eyebrow: string;
  summary: string;
  body: string[];
  week?: number;
};

export type ShoppingCategory =
  | "Produce"
  | "Protein"
  | "Dairy & alternatives"
  | "Pantry"
  | "Bakery & carbs"
  | "Frozen"
  | "Other";

export type ShoppingItem = {
  id: string;
  name: string;
  category: ShoppingCategory;
  checked: boolean;
  fromRecipeId?: string;
  fromRecipeTitle?: string;
};

export type SavedRecipeRef = {
  id: string;
  title: string;
  week: number;
  day?: number;
  meal?: string;
  kind: "recipe" | "dessert";
  savedAt: string;
};

export type WeekParticipationStatus = "done" | "in-progress" | "locked";

export type NutritionPersistState = {
  shopping: ShoppingItem[];
  saved: SavedRecipeRef[];
  learnCompleted: LearnModuleId[];
  /** Weeks the member marked as participated (not calorie scoring). */
  weeksParticipated: number[];
};
