"use client";

import { useEffect, useMemo, useState } from "react";
import {
  crackerRecipesForWeek,
  type CrackerMeal,
  type CrackerRecipe,
} from "@/lib/crackerRecipes";

type Props = {
  weekInCycle: number;
};

const MEALS: CrackerMeal[] = ["Breakfast", "Lunch", "Dinner"];
const SERVE_TABS = ["base", "training", "family"] as const;
type ServeTab = (typeof SERVE_TABS)[number];

export function CrackerRecipesPanel({ weekInCycle }: Props) {
  const current = Math.min(6, Math.max(1, weekInCycle));
  const [week, setWeek] = useState(current);
  const [day, setDay] = useState(1);
  const [meal, setMeal] = useState<CrackerMeal>("Breakfast");
  const [serve, setServe] = useState<ServeTab>("base");
  const [open, setOpen] = useState(true);

  useEffect(() => {
    setWeek(current);
  }, [current]);

  const weekData = useMemo(() => crackerRecipesForWeek(week), [week]);
  const recipe: CrackerRecipe | undefined = useMemo(
    () => weekData.recipes.find((r) => r.day === day && r.meal === meal),
    [weekData, day, meal],
  );

  const ingredients =
    serve === "training"
      ? recipe?.training ?? []
      : serve === "family"
        ? recipe?.family ?? []
        : recipe?.base ?? [];

  return (
    <article className="card cracker-recipes-card">
      <button
        type="button"
        className="cracker-wellness-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <div className="cracker-wellness-heading">
          <span className="eyebrow">Recipe & food guide</span>
          <strong>Week {week} meals</strong>
          <p className="muted">
            {weekData.foodFocus
              ? weekData.foodFocus.slice(0, 160) + (weekData.foodFocus.length > 160 ? "…" : "")
              : "Base · Training · Family of 4 serves from the Cracker food guide."}
          </p>
        </div>
        <span className="cracker-wellness-chevron">{open ? "−" : "+"}</span>
      </button>

      {open ? (
        <div className="cracker-wellness-body">
          <div className="cracker-week-pills" role="tablist" aria-label="Recipe week">
            {[1, 2, 3, 4, 5, 6].map((w) => (
              <button
                key={w}
                type="button"
                className={week === w ? "active" : ""}
                onClick={() => setWeek(w)}
              >
                W{w}
              </button>
            ))}
          </div>

          {weekData.notice.length ? (
            <div className="cracker-wellness-section">
              <strong>What to notice</strong>
              <ul className="cracker-wellness-list">
                {weekData.notice.slice(0, 5).map((n) => (
                  <li key={n.slice(0, 40)}>{n}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="cracker-day-pills" role="tablist" aria-label="Day">
            {[1, 2, 3, 4, 5, 6, 7].map((d) => (
              <button
                key={d}
                type="button"
                className={day === d ? "active" : ""}
                onClick={() => setDay(d)}
              >
                D{d}
              </button>
            ))}
          </div>

          <div className="cracker-meal-pills" role="tablist" aria-label="Meal">
            {MEALS.map((m) => (
              <button
                key={m}
                type="button"
                className={meal === m ? "active" : ""}
                onClick={() => setMeal(m)}
              >
                {m}
              </button>
            ))}
          </div>

          {recipe ? (
            <div className="cracker-recipe-detail">
              <strong className="cracker-recipe-title">{recipe.title}</strong>

              <div className="cracker-serve-pills">
                {SERVE_TABS.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    className={serve === tab ? "active" : ""}
                    onClick={() => setServe(tab)}
                  >
                    {tab === "base"
                      ? "Base serve"
                      : tab === "training"
                        ? "Training serve"
                        : "Family of 4"}
                  </button>
                ))}
              </div>

              <ul className="cracker-wellness-list">
                {ingredients.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>

              {recipe.method.length ? (
                <div className="cracker-wellness-section">
                  <strong>Method</strong>
                  <ol className="cracker-method-list">
                    {recipe.method.map((step) => (
                      <li key={step.slice(0, 40)}>{step}</li>
                    ))}
                  </ol>
                </div>
              ) : null}

              {recipe.why ? (
                <p className="muted cracker-recipe-why">
                  <strong>Why: </strong>
                  {recipe.why}
                </p>
              ) : null}

              {recipe.tip ? (
                <p className="muted">
                  <strong>Prep tip: </strong>
                  {recipe.tip}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="muted">No recipe for this slot.</p>
          )}
        </div>
      ) : null}
    </article>
  );
}
