/**
 * Cracker Nutrition hub — structured data API.
 *
 * Content sources (do not invent calories/macros/advice):
 * - lib/crackerRecipes.ts — weekly recipes, desserts, snacks, emergencies
 * - lib/crackerWellness.ts — wellness education
 * - lib/nutrition/education.ts — food-guide modules from Netlify wording
 * - lib/crackerRecipeImages.ts — Netlify-sourced photos
 *
 * Persistence: see persistence.ts (localStorage keys documented there).
 */

export type {
  NutritionHubTab,
  NutritionLearnModule,
  ShoppingItem,
  ShoppingCategory,
  SavedRecipeRef,
  WeekParticipationStatus,
  NutritionPersistState,
} from "./types";

export {
  FOOD_GUIDE_MODULES,
  wellnessLearnModules,
  allLearnModules,
  RESOURCE_MODULE_IDS,
} from "./education";

export {
  loadNutritionPersist,
  saveShopping,
  saveSavedRecipes,
  saveLearnCompleted,
  saveWeeksParticipated,
  categorizeIngredient,
  addIngredientsToShopping,
  addManualShoppingItem,
  newShoppingId,
  SHOPPING_CATEGORY_ORDER,
} from "./persistence";

export {
  type RecipeListItem,
  recipeId,
  dessertId,
  weekTitle,
  allRecipeItems,
  findRecipeItem,
  searchRecipes,
  mealPlanForWeek,
  weekParticipationStatus,
} from "./recipes";

export { crackerRecipeImage } from "@/lib/crackerRecipeImages";
export {
  CRACKER_RECIPE_WEEKS,
  CRACKER_WEEK_TITLES,
  crackerRecipesForWeek,
} from "@/lib/crackerRecipes";
