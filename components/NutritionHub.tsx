"use client";

import { useEffect, useMemo, useState } from "react";
import {
  allLearnModules,
  addIngredientsToShopping,
  addManualShoppingItem,
  crackerRecipeImage,
  dessertId,
  findRecipeItem,
  loadNutritionPersist,
  mealPlanForWeek,
  recipeId,
  RESOURCE_MODULE_IDS,
  saveLearnCompleted,
  saveSavedRecipes,
  saveShopping,
  saveWeeksParticipated,
  searchRecipes,
  SHOPPING_CATEGORY_ORDER,
  weekParticipationStatus,
  weekTitle,
  type NutritionHubTab,
  type NutritionLearnModule,
  type RecipeListItem,
  type SavedRecipeRef,
  type ShoppingItem,
} from "@/lib/nutrition";
import type { CrackerDessert, CrackerRecipe } from "@/lib/crackerRecipes";

type Props = {
  weekInCycle: number;
};

type ServeTab = "base" | "training" | "family";

const SERVE_LABEL: Record<ServeTab, string> = {
  base: "Base serve",
  training: "Training serve",
  family: "Family of 4",
};

const NAV: { id: NutritionHubTab; label: string }[] = [
  { id: "home", label: "Home" },
  { id: "this-week", label: "This week" },
  { id: "meal-plan", label: "Meal plan" },
  { id: "recipes", label: "Recipes" },
  { id: "learn", label: "Learn" },
  { id: "shopping", label: "Shopping" },
  { id: "resources", label: "Resources" },
  { id: "saved", label: "Saved" },
];

function RecipeImage({
  title,
  className,
  priority,
}: {
  title: string;
  className: string;
  priority?: boolean;
}) {
  const src = crackerRecipeImage(title);
  if (!src) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={title}
      className={className}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
    />
  );
}

function statusLabel(status: "done" | "in-progress" | "locked") {
  if (status === "done") return "Done";
  if (status === "in-progress") return "In progress";
  return "Locked";
}

export function NutritionHub({ weekInCycle }: Props) {
  const currentWeek = Math.min(6, Math.max(1, weekInCycle));
  const [tab, setTab] = useState<NutritionHubTab>("home");
  const [planWeek, setPlanWeek] = useState(currentWeek);
  const [detail, setDetail] = useState<RecipeListItem | null>(null);
  const [learnDetail, setLearnDetail] = useState<NutritionLearnModule | null>(null);
  const [query, setQuery] = useState("");
  const [recipeWeekFilter, setRecipeWeekFilter] = useState<number | null>(null);
  const [manualItem, setManualItem] = useState("");
  const [shopping, setShopping] = useState<ShoppingItem[]>([]);
  const [saved, setSaved] = useState<SavedRecipeRef[]>([]);
  const [learnDone, setLearnDone] = useState<string[]>([]);
  const [weeksDone, setWeeksDone] = useState<number[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const state = loadNutritionPersist();
    setShopping(state.shopping);
    setSaved(state.saved);
    setLearnDone(state.learnCompleted);
    setWeeksDone(state.weeksParticipated);
    setHydrated(true);
  }, []);

  useEffect(() => {
    setPlanWeek(currentWeek);
  }, [currentWeek]);

  useEffect(() => {
    if (!hydrated) return;
    saveShopping(shopping);
  }, [shopping, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    saveSavedRecipes(saved);
  }, [saved, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    saveLearnCompleted(learnDone);
  }, [learnDone, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    saveWeeksParticipated(weeksDone);
  }, [weeksDone, hydrated]);

  const weekData = mealPlanForWeek(planWeek);
  const learnModules = useMemo(() => allLearnModules(), []);
  const resourceModules = useMemo(
    () =>
      learnModules.filter((m) =>
        (RESOURCE_MODULE_IDS as readonly string[]).includes(m.id),
      ),
    [learnModules],
  );
  const recipeResults = useMemo(
    () => searchRecipes(query, recipeWeekFilter),
    [query, recipeWeekFilter],
  );

  const isSaved = (id: string) => saved.some((s) => s.id === id);

  function toggleSaved(item: RecipeListItem) {
    setSaved((prev) => {
      if (prev.some((s) => s.id === item.id)) {
        return prev.filter((s) => s.id !== item.id);
      }
      const ref: SavedRecipeRef = {
        id: item.id,
        title: item.title,
        week: item.week,
        day: item.kind === "recipe" ? item.day : undefined,
        meal: item.kind === "recipe" ? item.meal : "Dessert",
        kind: item.kind,
        savedAt: new Date().toISOString(),
      };
      return [ref, ...prev];
    });
  }

  function addRecipeToShopping(item: RecipeListItem, serve: ServeTab = "base") {
    const lines =
      item.kind === "recipe"
        ? serve === "training"
          ? item.recipe.training
          : serve === "family"
            ? item.recipe.family
            : item.recipe.base
        : serve === "training"
          ? item.dessert.training
          : serve === "family"
            ? item.dessert.family
            : item.dessert.base;
    setShopping((prev) =>
      addIngredientsToShopping(prev, lines, {
        recipeId: item.id,
        recipeTitle: item.title,
      }),
    );
  }

  function openItem(item: RecipeListItem) {
    setDetail(item);
  }

  function openSaved(ref: SavedRecipeRef) {
    const item = findRecipeItem(ref.id);
    if (item) {
      setDetail(item);
      setTab("recipes");
    }
  }

  function markWeekParticipated(week: number) {
    setWeeksDone((prev) => (prev.includes(week) ? prev : [...prev, week]));
  }

  function toggleLearn(id: string) {
    setLearnDone((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  const thisWeekStatus = weekParticipationStatus(
    currentWeek,
    currentWeek,
    weeksDone,
  );

  return (
    <section className="nutrition-hub" aria-label="Nutrition">
      <header className="nutrition-hub-hero">
        <span className="eyebrow">Nutrition</span>
        <h2 className="nutrition-hub-title">Fuel your six weeks.</h2>
        <p className="muted nutrition-hub-lead">
          Recipe &amp; Food Guide for the Life &amp; Soul Christmas Cracker — meals,
          learning and shopping in one place.
        </p>
        <p className="nutrition-hub-credit">
          Nutrition content from the Christmas Cracker food &amp; wellness guides.
        </p>
      </header>

      <nav className="nutrition-hub-nav" aria-label="Nutrition sections">
        {NAV.map((item) => (
          <button
            key={item.id}
            type="button"
            className={tab === item.id ? "active" : ""}
            onClick={() => {
              setTab(item.id);
              setDetail(null);
              setLearnDetail(null);
            }}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {detail ? (
        <RecipeDetailView
          item={detail}
          saved={isSaved(detail.id)}
          onBack={() => setDetail(null)}
          onToggleSave={() => toggleSaved(detail)}
          onAddShopping={(serve) => addRecipeToShopping(detail, serve)}
          onNext={() => {
            const all = searchRecipes("", null);
            const idx = all.findIndex((i) => i.id === detail.id);
            const next = all[idx + 1] ?? all[0];
            if (next) setDetail(next);
          }}
        />
      ) : learnDetail ? (
        <LearnDetailView
          module={learnDetail}
          done={learnDone.includes(learnDetail.id)}
          onBack={() => setLearnDetail(null)}
          onToggleDone={() => toggleLearn(learnDetail.id)}
        />
      ) : tab === "home" ? (
        <div className="nutrition-dash">
          {(
            [
              ["this-week", "This week", `Week ${currentWeek} of 6 · ${weekTitle(currentWeek)}`],
              ["meal-plan", "Meal plan", "Breakfast, lunch, dinner by week"],
              ["recipes", "Recipes", "Search the full food guide"],
              ["learn", "Learn", "Food guide + wellness modules"],
              ["shopping", "Shopping list", `${shopping.filter((i) => !i.checked).length} open`],
              ["resources", "Resources", "How to use the guide"],
              ["saved", "Saved", `${saved.length} favourites`],
            ] as const
          ).map(([id, title, sub]) => (
            <button
              key={id}
              type="button"
              className="nutrition-dash-tile"
              onClick={() => setTab(id)}
            >
              <strong>{title}</strong>
              <span className="muted">{sub}</span>
            </button>
          ))}
        </div>
      ) : tab === "this-week" ? (
        <ThisWeekView
          week={currentWeek}
          status={thisWeekStatus}
          onViewWeek={() => {
            setPlanWeek(currentWeek);
            setTab("meal-plan");
          }}
          onViewMealPlan={() => {
            setPlanWeek(currentWeek);
            setTab("meal-plan");
          }}
          onMarkDone={() => markWeekParticipated(currentWeek)}
          weeksDone={weeksDone}
          currentWeek={currentWeek}
        />
      ) : tab === "meal-plan" ? (
        <MealPlanView
          week={planWeek}
          weekData={weekData}
          onWeekChange={setPlanWeek}
          onOpenRecipe={(recipe) =>
            openItem({
              kind: "recipe",
              id: recipeId(recipe),
              recipe,
              title: recipe.title,
              week: recipe.week,
              day: recipe.day,
              meal: recipe.meal,
              desc: recipe.why,
              tags: [],
            })
          }
          onOpenDessert={(dessert) =>
            openItem({
              kind: "dessert",
              id: dessertId(dessert),
              dessert,
              title: dessert.title,
              week: dessert.week,
              desc: dessert.why,
              tags: [],
            })
          }
        />
      ) : tab === "recipes" ? (
        <RecipesLibraryView
          query={query}
          onQuery={setQuery}
          weekFilter={recipeWeekFilter}
          onWeekFilter={setRecipeWeekFilter}
          results={recipeResults}
          onOpen={openItem}
        />
      ) : tab === "learn" ? (
        <LearnListView
          modules={learnModules}
          doneIds={learnDone}
          onOpen={setLearnDetail}
        />
      ) : tab === "resources" ? (
        <LearnListView
          modules={resourceModules}
          doneIds={learnDone}
          onOpen={setLearnDetail}
          heading="Resources"
          lead="Practical food-guide notes from the Christmas Cracker Recipe & Food Guide."
        />
      ) : tab === "shopping" ? (
        <ShoppingView
          items={shopping}
          manualItem={manualItem}
          onManualItem={setManualItem}
          onAddManual={() => {
            setShopping((prev) => addManualShoppingItem(prev, manualItem));
            setManualItem("");
          }}
          onToggle={(id) =>
            setShopping((prev) =>
              prev.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)),
            )
          }
          onDelete={(id) => setShopping((prev) => prev.filter((i) => i.id !== id))}
          onClearCompleted={() =>
            setShopping((prev) => prev.filter((i) => !i.checked))
          }
        />
      ) : (
        <SavedView saved={saved} onOpen={openSaved} onRemove={(id) => setSaved((p) => p.filter((s) => s.id !== id))} />
      )}
    </section>
  );
}

function ThisWeekView({
  week,
  status,
  onViewWeek,
  onViewMealPlan,
  onMarkDone,
  weeksDone,
  currentWeek,
}: {
  week: number;
  status: "done" | "in-progress" | "locked";
  onViewWeek: () => void;
  onViewMealPlan: () => void;
  onMarkDone: () => void;
  weeksDone: number[];
  currentWeek: number;
}) {
  const data = mealPlanForWeek(week);
  return (
    <div className="nutrition-panel">
      <div className="nutrition-week-banner">
        <span className="eyebrow">Week {week} of 6</span>
        <h3>{weekTitle(week)}</h3>
        <p className="muted">{data.foodFocus}</p>
        <span className={`nutrition-status nutrition-status-${status}`}>
          {statusLabel(status)}
        </span>
      </div>
      {data.notice.length ? (
        <div className="nutrition-soft-block">
          <strong>What to notice</strong>
          <ul>
            {data.notice.slice(0, 5).map((n) => (
              <li key={n.slice(0, 48)}>{n}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="nutrition-cta-row">
        <button type="button" className="primary-btn" onClick={onViewWeek}>
          View this week
        </button>
        <button type="button" className="secondary-btn" onClick={onViewMealPlan}>
          View meal plan
        </button>
        {status !== "done" ? (
          <button type="button" className="secondary-btn" onClick={onMarkDone}>
            Mark week participated
          </button>
        ) : null}
      </div>
      <div className="nutrition-progress-weeks">
        <span className="eyebrow">Challenge weeks</span>
        <div className="nutrition-week-status-grid">
          {[1, 2, 3, 4, 5, 6].map((w) => {
            const s = weekParticipationStatus(w, currentWeek, weeksDone);
            return (
              <div key={w} className={`nutrition-week-chip nutrition-week-chip-${s}`}>
                <strong>W{w}</strong>
                <small>{statusLabel(s)}</small>
              </div>
            );
          })}
        </div>
        <p className="muted nutrition-progress-note">
          Progress here is participation only — not calories or weight-loss scoring.
        </p>
      </div>
    </div>
  );
}

function MealPlanView({
  week,
  weekData,
  onWeekChange,
  onOpenRecipe,
  onOpenDessert,
}: {
  week: number;
  weekData: ReturnType<typeof mealPlanForWeek>;
  onWeekChange: (w: number) => void;
  onOpenRecipe: (r: CrackerRecipe) => void;
  onOpenDessert: (d: CrackerDessert) => void;
}) {
  const byDay = useMemo(() => {
    const map = new Map<number, CrackerRecipe[]>();
    for (const r of weekData.recipes) {
      const list = map.get(r.day) ?? [];
      list.push(r);
      map.set(r.day, list);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [weekData.recipes]);

  return (
    <div className="nutrition-panel">
      <div className="cracker-week-pills" role="tablist" aria-label="Meal plan week">
        {[1, 2, 3, 4, 5, 6].map((w) => (
          <button
            key={w}
            type="button"
            className={week === w ? "active" : ""}
            onClick={() => onWeekChange(w)}
          >
            Week {w}
          </button>
        ))}
      </div>
      <div className="nutrition-soft-block">
        <span className="eyebrow">
          Week {week} · {weekTitle(week)}
        </span>
        <p className="muted">{weekData.foodFocus}</p>
      </div>
      {byDay.map(([day, recipes]) => (
        <div key={day} className="nutrition-day-block">
          <span className="eyebrow">Day {day}</span>
          <div className="nutrition-meal-cards">
            {recipes.map((recipe) => (
              <MealCard
                key={recipeId(recipe)}
                title={recipe.title}
                tags={[recipe.meal]}
                desc={recipe.why}
                onClick={() => onOpenRecipe(recipe)}
              />
            ))}
          </div>
        </div>
      ))}
      {weekData.dessert ? (
        <div className="nutrition-day-block">
          <span className="eyebrow">Dessert</span>
          <MealCard
            title={weekData.dessert.title}
            tags={["Optional"]}
            desc={weekData.dessert.why}
            onClick={() => onOpenDessert(weekData.dessert!)}
          />
        </div>
      ) : null}
      {weekData.snacks.length ? (
        <div className="nutrition-soft-block">
          <strong>Snacks, if you need them</strong>
          <ul>
            {weekData.snacks.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {weekData.emergencies.length ? (
        <div className="nutrition-day-block">
          <span className="eyebrow">Emergency meals</span>
          <div className="nutrition-emergency-grid">
            {weekData.emergencies.map((e) => (
              <article key={e.title} className="nutrition-emergency">
                <strong>{e.title}</strong>
                <p className="muted">{e.detail}</p>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MealCard({
  title,
  tags,
  desc,
  onClick,
}: {
  title: string;
  tags: string[];
  desc: string;
  onClick: () => void;
}) {
  const image = crackerRecipeImage(title);
  return (
    <button type="button" className="nutrition-meal-card" onClick={onClick}>
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="nutrition-meal-card-img" loading="lazy" />
      ) : (
        <span className="nutrition-meal-card-img nutrition-meal-card-img-empty" aria-hidden />
      )}
      <span className="nutrition-meal-card-copy">
        <span className="nutrition-tag-row">
          {tags.map((t) => (
            <small key={t}>{t}</small>
          ))}
        </span>
        <strong>{title}</strong>
        <span className="muted">{desc.slice(0, 100)}{desc.length > 100 ? "…" : ""}</span>
      </span>
    </button>
  );
}

function RecipesLibraryView({
  query,
  onQuery,
  weekFilter,
  onWeekFilter,
  results,
  onOpen,
}: {
  query: string;
  onQuery: (q: string) => void;
  weekFilter: number | null;
  onWeekFilter: (w: number | null) => void;
  results: RecipeListItem[];
  onOpen: (item: RecipeListItem) => void;
}) {
  return (
    <div className="nutrition-panel">
      <label className="nutrition-search">
        <span className="eyebrow">Search recipes</span>
        <input
          type="search"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Search by name or meal…"
        />
      </label>
      <div className="cracker-week-pills" role="tablist" aria-label="Filter by week">
        <button
          type="button"
          className={weekFilter === null ? "active" : ""}
          onClick={() => onWeekFilter(null)}
        >
          All
        </button>
        {[1, 2, 3, 4, 5, 6].map((w) => (
          <button
            key={w}
            type="button"
            className={weekFilter === w ? "active" : ""}
            onClick={() => onWeekFilter(w)}
          >
            W{w}
          </button>
        ))}
      </div>
      <p className="muted">{results.length} recipes</p>
      <div className="nutrition-meal-cards">
        {results.map((item) => (
          <MealCard
            key={item.id}
            title={item.title}
            tags={item.tags}
            desc={item.desc}
            onClick={() => onOpen(item)}
          />
        ))}
      </div>
    </div>
  );
}

function LearnListView({
  modules,
  doneIds,
  onOpen,
  heading = "Learn",
  lead = "Educational modules from the Recipe & Food Guide and Wellness Guide.",
}: {
  modules: NutritionLearnModule[];
  doneIds: string[];
  onOpen: (m: NutritionLearnModule) => void;
  heading?: string;
  lead?: string;
}) {
  return (
    <div className="nutrition-panel">
      <div className="nutrition-soft-block">
        <strong>{heading}</strong>
        <p className="muted">{lead}</p>
      </div>
      <div className="nutrition-learn-grid">
        {modules.map((m) => {
          const done = doneIds.includes(m.id);
          return (
            <button
              key={m.id}
              type="button"
              className={`nutrition-learn-card${done ? " done" : ""}`}
              onClick={() => onOpen(m)}
            >
              <span className="eyebrow">{m.eyebrow}</span>
              <strong>{m.title}</strong>
              <span className="muted">{m.summary}</span>
              <small>{done ? "Completed" : "Open"}</small>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function LearnDetailView({
  module,
  done,
  onBack,
  onToggleDone,
}: {
  module: NutritionLearnModule;
  done: boolean;
  onBack: () => void;
  onToggleDone: () => void;
}) {
  return (
    <div className="nutrition-detail">
      <button type="button" className="cracker-nutrition-back" onClick={onBack}>
        ← Back
      </button>
      <span className="eyebrow">{module.eyebrow}</span>
      <h3 className="cracker-recipe-title">{module.title}</h3>
      <div className="nutrition-learn-body">
        {module.body.map((p) => (
          <p key={p.slice(0, 48)}>{p}</p>
        ))}
      </div>
      <button type="button" className="secondary-btn" onClick={onToggleDone}>
        {done ? "Mark as not done" : "Mark complete"}
      </button>
    </div>
  );
}

function ShoppingView({
  items,
  manualItem,
  onManualItem,
  onAddManual,
  onToggle,
  onDelete,
  onClearCompleted,
}: {
  items: ShoppingItem[];
  manualItem: string;
  onManualItem: (v: string) => void;
  onAddManual: () => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onClearCompleted: () => void;
}) {
  const grouped = SHOPPING_CATEGORY_ORDER.map((cat) => ({
    cat,
    items: items.filter((i) => i.category === cat),
  })).filter((g) => g.items.length);

  return (
    <div className="nutrition-panel">
      <div className="nutrition-soft-block">
        <strong>Shopping list</strong>
        <p className="muted">
          Add from recipes or type an item. Duplicates merge. Saved in this browser
          (localStorage).
        </p>
      </div>
      <form
        className="nutrition-shop-add"
        onSubmit={(e) => {
          e.preventDefault();
          onAddManual();
        }}
      >
        <input
          type="text"
          value={manualItem}
          onChange={(e) => onManualItem(e.target.value)}
          placeholder="Add an item…"
        />
        <button type="submit" className="secondary-btn">
          Add
        </button>
      </form>
      {items.some((i) => i.checked) ? (
        <button type="button" className="secondary-btn" onClick={onClearCompleted}>
          Clear completed
        </button>
      ) : null}
      {!items.length ? (
        <p className="muted">Your list is empty. Open a recipe and tap Add to shopping list.</p>
      ) : (
        grouped.map(({ cat, items: list }) => (
          <div key={cat} className="nutrition-shop-group">
            <span className="eyebrow">{cat}</span>
            <ul className="nutrition-shop-list">
              {list.map((item) => (
                <li key={item.id} className={item.checked ? "checked" : ""}>
                  <label>
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => onToggle(item.id)}
                    />
                    <span>{item.name}</span>
                  </label>
                  <button type="button" aria-label="Delete" onClick={() => onDelete(item.id)}>
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
}

function SavedView({
  saved,
  onOpen,
  onRemove,
}: {
  saved: SavedRecipeRef[];
  onOpen: (ref: SavedRecipeRef) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="nutrition-panel">
      <div className="nutrition-soft-block">
        <strong>Saved</strong>
        <p className="muted">Favourites stay on this device (localStorage).</p>
      </div>
      {!saved.length ? (
        <p className="muted">No saved recipes yet.</p>
      ) : (
        <div className="nutrition-meal-cards">
          {saved.map((ref) => (
            <div key={ref.id} className="nutrition-saved-row">
              <MealCard
                title={ref.title}
                tags={[
                  `Week ${ref.week}`,
                  ref.meal ?? (ref.kind === "dessert" ? "Dessert" : ""),
                ].filter(Boolean)}
                desc=""
                onClick={() => onOpen(ref)}
              />
              <button type="button" className="secondary-btn" onClick={() => onRemove(ref.id)}>
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RecipeDetailView({
  item,
  saved,
  onBack,
  onToggleSave,
  onAddShopping,
  onNext,
}: {
  item: RecipeListItem;
  saved: boolean;
  onBack: () => void;
  onToggleSave: () => void;
  onAddShopping: (serve: ServeTab) => void;
  onNext: () => void;
}) {
  const [serve, setServe] = useState<ServeTab>("base");
  const base = item.kind === "recipe" ? item.recipe.base : item.dessert.base;
  const training =
    item.kind === "recipe" ? item.recipe.training : item.dessert.training;
  const family = item.kind === "recipe" ? item.recipe.family : item.dessert.family;
  const method = item.kind === "recipe" ? item.recipe.method : item.dessert.method;
  const why = item.kind === "recipe" ? item.recipe.why : item.dessert.why;
  const tip = item.kind === "recipe" ? item.recipe.tip : item.dessert.tip;
  const ingredients =
    serve === "training" ? training : serve === "family" ? family : base;
  const mealLabel =
    item.kind === "recipe"
      ? `Day ${item.day} · ${item.meal}`
      : `Week ${item.week} · Dessert`;

  return (
    <div className="nutrition-detail">
      <button type="button" className="cracker-nutrition-back" onClick={onBack}>
        ← Back
      </button>
      <RecipeImage title={item.title} className="cracker-recipe-hero" priority />
      <span className="eyebrow">{mealLabel}</span>
      <h3 className="cracker-recipe-title">{item.title}</h3>
      <p className="muted cracker-recipe-why">{why}</p>

      <div className="nutrition-cta-row">
        <button type="button" className="secondary-btn" onClick={onToggleSave}>
          {saved ? "Saved" : "Save"}
        </button>
        <button
          type="button"
          className="secondary-btn"
          onClick={() => onAddShopping(serve)}
        >
          Add to shopping list
        </button>
        <button type="button" className="secondary-btn" onClick={onNext}>
          Next
        </button>
      </div>

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

      <div className="cracker-wellness-section">
        <strong>Ingredients</strong>
        {ingredients.length ? (
          <ul className="cracker-wellness-list">
            {ingredients.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        ) : (
          <p className="muted">No ingredients listed for this serve.</p>
        )}
      </div>

      <div className="cracker-wellness-section">
        <strong>Method</strong>
        <ol className="cracker-method-list">
          {method.map((step) => (
            <li key={step.slice(0, 40)}>{step}</li>
          ))}
        </ol>
      </div>

      {tip ? (
        <div className="cracker-wellness-callout">
          <span className="eyebrow">Swaps / notes</span>
          <p>{tip}</p>
        </div>
      ) : null}
    </div>
  );
}
