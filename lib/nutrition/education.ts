/**
 * Food-guide education modules — wording taken from
 * christmas-cracker-2026.netlify.app (Recipe & Food Guide intros).
 * Do not invent nutrition advice; presentation only.
 */

import type { NutritionLearnModule } from "./types";
import {
  CRACKER_WELLNESS_OVERVIEW,
  CRACKER_WELLNESS_WEEKS,
} from "@/lib/crackerWellness";
import { CRACKER_WEEK_TITLES, CRACKER_RECIPE_WEEKS } from "@/lib/crackerRecipes";

export const FOOD_GUIDE_MODULES: NutritionLearnModule[] = [
  {
    id: "food-welcome",
    kind: "food-guide",
    title: "Welcome to your food guide",
    eyebrow: "Recipe & Food Guide",
    summary: "Eating well made easier — perfect imperfection applied to food.",
    body: [
      "This guide is here to make eating well easier, not to turn the next six weeks into a full-time cooking project.",
      "There are seven days of meal ideas each week because we want you to have plenty of choice. You are not expected to cook every breakfast, lunch and dinner. You might try several recipes, repeat the ones you enjoy, make your own usual meals, use something from the freezer, have takeaway, eat out, or choose just one new recipe from the entire week.",
      "That is completely fine.",
      "If you discover one breakfast that keeps you satisfied, one lunch that is easy to take to work or one dinner the family actually asks you to make again, that is progress. Over six weeks, you will gradually build a collection of meals that suit your life rather than finishing the challenge with a folder full of recipes you never cook again.",
      "Use this guide as much or as little as you need. The aim is to eat well more often, understand what keeps you satisfied and make useful food choices easier when life is busy.",
      "That is perfect imperfection applied to food.",
    ],
  },
  {
    id: "food-how-to-use",
    kind: "food-guide",
    title: "How to use the recipes",
    eyebrow: "Serves",
    summary: "Base, Training / higher-energy, and Family of 4 — without doing the maths yourself.",
    body: [
      "Every recipe gives you three serving options so you do not have to work out the quantities yourself.",
      "Base serve — This is the standard starting serve used throughout the challenge.",
      "Training / higher-energy serve — Choose this version when you have trained hard, have been particularly active, are genuinely hungrier or simply need more fuel that day. The increase will depend on the meal. Sometimes it means more carbohydrate, sometimes a little more protein or vegetables, and sometimes a combination. It does not automatically mean adding extra oil, nuts, avocado or other calorie-dense ingredients.",
      "Family of 4 — These quantities make the meal for four people. For dinners, the quantities shown are for dinner only. We are not building tomorrow’s lunches into the recipe and leaving you with food you did not want.",
      "When dinner can make the following day’s lunch easier, you will see an optional Batch option in the prep notes. If you want to use it, cook the additional amount needed for tomorrow’s lunch. If you do not, cook dinner exactly as written.",
      "The following day’s lunch remains a complete recipe with its own quantities.",
    ],
  },
  {
    id: "food-weighing",
    kind: "food-guide",
    title: "You do not need to weigh your food forever",
    eyebrow: "Portions",
    summary: "Use measurements while helpful, then learn to recognise amounts by eye.",
    body: [
      "The quantities are here to make the recipes work and help you become familiar with what a useful meal looks like. They are not here because we expect you to live with kitchen scales beside your plate.",
      "Use the measurements while they are helpful. With time, you will become much better at recognising suitable amounts by eye and adjusting them according to your hunger, activity and the day you are having.",
      "That is a much more useful long-term skill than being able to weigh your dinner perfectly.",
    ],
  },
  {
    id: "food-raw-cooked",
    kind: "food-guide",
    title: "Raw and cooked weights",
    eyebrow: "Portions",
    summary: "How meat, fish, rice and pasta are listed in the guide.",
    body: [
      "Unless a recipe specifically says otherwise, meat and fish quantities are the raw amount you need to buy and cook.",
      "Rice and pasta will clearly state whether the measurement is cooked or dry.",
      "Chicken wings are listed by number because nobody needs to weigh chicken wings before dinner.",
    ],
  },
  {
    id: "food-still-hungry",
    kind: "food-guide",
    title: "What if I am still hungry?",
    eyebrow: "Hunger",
    summary: "Hunger is information — understand it rather than ignore it.",
    body: [
      "Pay attention to it.",
      "Hunger is information, and your appetite will not be identical every day. Before automatically reaching for another snack, look at the meal you just ate. Was there enough food? Was there a useful amount of protein? Would more vegetables or salad have made it more satisfying? Have you trained hard or had a highly active day and need more carbohydrate?",
      "Some days you will genuinely need more food.",
      "The aim is not to ignore hunger. It is to become better at understanding it.",
    ],
  },
  {
    id: "food-batch",
    kind: "food-guide",
    title: "Batch cooking is optional",
    eyebrow: "Prep",
    summary: "Batch cooking should save time, not consume your weekend.",
    body: [
      "Batch cooking should save time, not consume your weekend.",
      "Some dinners naturally lend themselves to making the following day’s lunch easier. When that happens, the recipe will simply tell you what can be cooked ahead.",
      "If you want the shortcut, use it. If tomorrow’s lunch does not suit you, cook the normal dinner quantity and forget about it.",
      "There is no requirement to spend Sunday filling twenty-one containers.",
    ],
  },
  {
    id: "food-shortcuts",
    kind: "food-guide",
    title: "Use normal shortcuts",
    eyebrow: "Real life",
    summary: "Frozen veg, microwave rice, bagged salad and cooked chicken all count.",
    body: [
      "Frozen vegetables, microwave rice, bagged salad, tinned beans, tuna, pre-cut vegetables, cooked chicken and useful freezer foods are all allowed.",
      "There will be days when cooking everything from scratch is easy, and others when getting dinner on the table quickly matters far more than whether you personally chopped the capsicum.",
      "Plan A might be cooking the full recipe. Plan B might use several supermarket shortcuts. Plan C might be a five-minute emergency meal.",
      "All three have a place.",
    ],
  },
  {
    id: "food-swaps",
    kind: "food-guide",
    title: "Easy food swaps",
    eyebrow: "Flexibility",
    summary: "Recipes are not contracts — make sensible swaps from the guide.",
    body: [
      "Recipes are not contracts. If you do not like something, cannot find it or already have something suitable at home, make a sensible swap.",
      "Protein: chicken, beef, lamb, fish, tuna, eggs, beans and lentils can often be changed depending on the recipe.",
      "Carbohydrates: rice, pasta, couscous, sweet potato, potato, wraps and bread can be interchanged where the flavours make sense.",
      "Vegetables: use what you have. Capsicum does not need to send you back to the supermarket if there is zucchini sitting in the fridge.",
      "Yoghurt: use yoghurt of your choice — dairy or coconut.",
      "Milk: use the milk you normally buy.",
      "Fish: if the recipe calls for white fish, choose a firm white fish that is fresh, available and affordable.",
      "You do not have to recreate every recipe exactly for it to be useful.",
    ],
  },
  {
    id: "food-eating-out",
    kind: "food-guide",
    title: "Eating out and takeaway",
    eyebrow: "Real life",
    summary: "One meal out does not undo the week.",
    body: [
      "You will probably eat out or have takeaway at some point during these six weeks. That is normal.",
      "There is no need to skip meals beforehand, “save” all your food for dinner or punish yourself with extra exercise the following day.",
      "Choose something you genuinely want to eat. If you want a simple guide, look for a useful protein source, include vegetables where they make sense, choose the carbohydrate you actually want and eat until you are comfortably satisfied.",
      "A Thai meal might be a curry or stir-fry with rice. At the pub it could be steak, fish or chicken with vegetables or salad and chips if you want them. Mexican might be tacos or a burrito bowl. Italian might be pasta or pizza with a salad. A café lunch could be eggs, a sandwich, wrap or breakfast bowl.",
      "Then carry on with your normal meals.",
      "One meal out does not undo the week.",
    ],
  },
  {
    id: "food-superhuman",
    kind: "food-guide",
    title: "SUPERHUMAN in the food guide",
    eyebrow: "Products",
    summary: "How SUPERHUMAN appears in selected recipes.",
    body: [
      "SUPERHUMAN will appear naturally in selected recipes throughout the six weeks.",
    ],
  },
  {
    id: "food-snacks",
    kind: "food-guide",
    title: "Snacks, if you need them",
    eyebrow: "Optional",
    summary: "Snacks are optional — use them when useful.",
    body: [
      "Snacks are optional.",
      "Some people will be perfectly satisfied with their main meals. Others may genuinely need something between meals because of training, activity, meal timing or hunger.",
      "Use the snack ideas when they are useful. You are not required to eat morning tea and afternoon tea simply because they appear in a food guide.",
    ],
  },
  {
    id: "food-dessert",
    kind: "food-guide",
    title: "Dessert can fit",
    eyebrow: "Optional",
    summary: "Optional desserts in sensible portions — enjoyable food is part of normal life.",
    body: [
      "Dessert is not disappearing for six weeks either.",
      "We will include optional desserts in sensible portions because enjoyable food is part of normal life. The point is to learn how it can fit rather than spending six weeks being incredibly strict and then returning to your usual eating the moment the challenge ends.",
    ],
  },
  {
    id: "food-emergency",
    kind: "food-guide",
    title: "Emergency meals matter",
    eyebrow: "Plan C",
    summary: "Emergency meals are part of the plan, not evidence you failed.",
    body: [
      "Emergency meals are part of the plan, not evidence that you failed to prepare properly.",
      "There will be evenings when work runs late, nothing has been defrosted, somebody forgot to shop or cooking simply is not happening.",
      "A few reliable meals made from normal supermarket ingredients can be the difference between eating something useful and standing in the kitchen at 8 pm picking at whatever you can find because you are starving.",
    ],
  },
];

export function wellnessLearnModules(): NutritionLearnModule[] {
  const overview: NutritionLearnModule = {
    id: "wellness-overview",
    kind: "wellness",
    title: CRACKER_WELLNESS_OVERVIEW.title,
    eyebrow: "Wellness Book",
    summary: CRACKER_WELLNESS_OVERVIEW.lead,
    body: [
      ...CRACKER_WELLNESS_OVERVIEW.pillars,
      `Plan A — ${CRACKER_WELLNESS_OVERVIEW.plans.a}`,
      `Plan B — ${CRACKER_WELLNESS_OVERVIEW.plans.b}`,
      `Plan C — ${CRACKER_WELLNESS_OVERVIEW.plans.c}`,
    ],
  };

  const weeks = CRACKER_WELLNESS_WEEKS.map((w) => {
    const food = CRACKER_RECIPE_WEEKS.find((r) => r.week === w.week);
    const body: string[] = [w.lead];
    for (const section of w.sections) {
      body.push(section.heading);
      body.push(...section.points);
    }
    if (w.experiment) body.push(`Experiment — ${w.experiment}`);
    if (w.ritual.length) body.push(...w.ritual);
    if (food?.foodFocus) body.push(`Food focus — ${food.foodFocus}`);
    return {
      id: `wellness-week-${w.week}`,
      kind: "wellness" as const,
      title: w.title,
      eyebrow: `Week ${w.week} · ${CRACKER_WEEK_TITLES[w.week] ?? w.title}`,
      summary: w.lead.slice(0, 140) + (w.lead.length > 140 ? "…" : ""),
      body,
      week: w.week,
    };
  });

  return [overview, ...weeks];
}

export function allLearnModules(): NutritionLearnModule[] {
  return [...FOOD_GUIDE_MODULES, ...wellnessLearnModules()];
}

export const RESOURCE_MODULE_IDS = [
  "food-how-to-use",
  "food-weighing",
  "food-raw-cooked",
  "food-still-hungry",
  "food-batch",
  "food-shortcuts",
  "food-swaps",
  "food-eating-out",
  "food-superhuman",
  "food-snacks",
  "food-dessert",
  "food-emergency",
] as const;
