"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CRACKER_WEEK_TITLES,
  crackerRecipesForWeek,
  type CrackerDessert,
  type CrackerRecipe,
} from "@/lib/crackerRecipes";

type Props = {
  weekInCycle: number;
};

type ServeTab = "base" | "training" | "family";
type Detail =
  | { kind: "recipe"; recipe: CrackerRecipe }
  | { kind: "dessert"; dessert: CrackerDessert }
  | null;

const SERVE_LABEL: Record<ServeTab, string> = {
  base: "Base serve",
  training: "Training serve",
  family: "Family of 4",
};

function ServeDetail({
  title,
  mealLabel,
  base,
  training,
  family,
  method,
  why,
  tip,
  onBack,
}: {
  title: string;
  mealLabel?: string;
  base: string[];
  training: string[];
  family: string[];
  method: string[];
  why: string;
  tip: string;
  onBack: () => void;
}) {
  const [serve, setServe] = useState<ServeTab>("base");
  const ingredients =
    serve === "training" ? training : serve === "family" ? family : base;

  return (
    <div className="cracker-nutrition-detail">
      <button type="button" className="cracker-nutrition-back" onClick={onBack}>
        ← Recipes
      </button>
      {mealLabel ? <span className="eyebrow">{mealLabel}</span> : null}
      <h3 className="cracker-recipe-title">{title}</h3>

      <div className="cracker-serve-pills">
        {(Object.keys(SERVE_LABEL) as ServeTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            className={serve === tab ? "active" : ""}
            onClick={() => setServe(tab)}
          >
            {SERVE_LABEL[tab]}
          </button>
        ))}
      </div>

      {ingredients.length ? (
        <ul className="cracker-wellness-list">
          {ingredients.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="muted">Use the Base serve for this option.</p>
      )}

      {method.length ? (
        <div className="cracker-wellness-section">
          <strong>Method</strong>
          <ol className="cracker-method-list">
            {method.map((step) => (
              <li key={step.slice(0, 48)}>{step}</li>
            ))}
          </ol>
        </div>
      ) : null}

      {why ? (
        <p className="muted cracker-recipe-why">
          <strong>Why: </strong>
          {why}
        </p>
      ) : null}
      {tip ? (
        <p className="muted">
          <strong>Prep tip: </strong>
          {tip}
        </p>
      ) : null}
    </div>
  );
}

export function CrackerRecipesPanel({ weekInCycle }: Props) {
  const current = Math.min(6, Math.max(1, weekInCycle));
  const [week, setWeek] = useState(current);
  const [detail, setDetail] = useState<Detail>(null);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    setWeek(current);
    setDetail(null);
  }, [current]);

  const weekData = useMemo(() => crackerRecipesForWeek(week), [week]);
  const weekTitle = CRACKER_WEEK_TITLES[week] ?? `Week ${week}`;

  return (
    <article className="card cracker-recipes-card cracker-nutrition-hub">
      <button
        type="button"
        className="cracker-wellness-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <div className="cracker-wellness-heading">
          <span className="eyebrow">Nutrition · Recipe & food guide</span>
          <strong>
            Week {week} · {weekTitle}
          </strong>
          <p className="muted">
            Open Day 1–7 meals below — Base, Training and Family of 4 serves, plus dessert,
            snacks and emergency meals.
          </p>
        </div>
        <span className="cracker-wellness-chevron">{open ? "−" : "+"}</span>
      </button>

      {open ? (
        <div className="cracker-wellness-body">
          <div className="cracker-week-pills" role="tablist" aria-label="Nutrition week">
            {[1, 2, 3, 4, 5, 6].map((w) => (
              <button
                key={w}
                type="button"
                className={week === w ? "active" : ""}
                onClick={() => {
                  setWeek(w);
                  setDetail(null);
                }}
              >
                Week {w}
              </button>
            ))}
          </div>

          {detail ? (
            detail.kind === "recipe" ? (
              <ServeDetail
                title={detail.recipe.title}
                mealLabel={`Day ${detail.recipe.day} · ${detail.recipe.meal}`}
                base={detail.recipe.base}
                training={detail.recipe.training}
                family={detail.recipe.family}
                method={detail.recipe.method}
                why={detail.recipe.why}
                tip={detail.recipe.tip}
                onBack={() => setDetail(null)}
              />
            ) : (
              <ServeDetail
                title={detail.dessert.title}
                mealLabel="Dessert"
                base={detail.dessert.base}
                training={detail.dessert.training}
                family={detail.dessert.family}
                method={detail.dessert.method}
                why={detail.dessert.why}
                tip={detail.dessert.tip}
                onBack={() => setDetail(null)}
              />
            )
          ) : (
            <>
              <div className="cracker-nutrition-intro">
                <span className="eyebrow">Recipe & Food Guide</span>
                <strong>
                  Week {week} — {weekTitle}
                </strong>
                {weekData.foodFocus ? (
                  <p className="muted">{weekData.foodFocus}</p>
                ) : null}
              </div>

              {weekData.notice.length ? (
                <div className="cracker-wellness-section">
                  <strong>What to notice this week</strong>
                  <ul className="cracker-wellness-list">
                    {weekData.notice.slice(0, 5).map((n) => (
                      <li key={n.slice(0, 40)}>{n}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="cracker-nutrition-list-block">
                <span className="eyebrow">Recipes</span>
                <div className="cracker-recipe-rows">
                  {weekData.recipes.map((recipe) => (
                    <button
                      key={`${recipe.day}-${recipe.meal}`}
                      type="button"
                      className="cracker-recipe-row"
                      onClick={() => setDetail({ kind: "recipe", recipe })}
                    >
                      <span className="cracker-recipe-row-copy">
                        <small>
                          Day {recipe.day} · {recipe.meal}
                        </small>
                        <strong>{recipe.title}</strong>
                      </span>
                      <span className="cracker-recipe-chevron" aria-hidden>
                        ›
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {weekData.dessert ? (
                <div className="cracker-nutrition-list-block">
                  <span className="eyebrow">Dessert</span>
                  <button
                    type="button"
                    className="cracker-recipe-row"
                    onClick={() =>
                      setDetail({ kind: "dessert", dessert: weekData.dessert! })
                    }
                  >
                    <span className="cracker-recipe-row-copy">
                      <small>Optional</small>
                      <strong>{weekData.dessert.title}</strong>
                    </span>
                    <span className="cracker-recipe-chevron" aria-hidden>
                      ›
                    </span>
                  </button>
                </div>
              ) : null}

              {weekData.snacks.length ? (
                <div className="cracker-wellness-section">
                  <strong>Snacks, if you need them</strong>
                  <ul className="cracker-wellness-list">
                    {weekData.snacks.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
              ) : week === 6 ? (
                <p className="muted">
                  By Week 6, reuse snack ideas from earlier weeks only if you genuinely need
                  them.
                </p>
              ) : null}

              {weekData.emergencies.length ? (
                <div className="cracker-nutrition-list-block">
                  <span className="eyebrow">Emergency meals</span>
                  <div className="cracker-emergency-list">
                    {weekData.emergencies.map((meal) => (
                      <article key={meal.title} className="cracker-emergency-card">
                        <strong>{meal.title}</strong>
                        <p className="muted">{meal.detail}</p>
                      </article>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </article>
  );
}
