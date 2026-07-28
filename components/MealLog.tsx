"use client";

import { useRef, useState } from "react";
import { fileToResizedDataUrl } from "@/lib/images";
import { analyzeMealPhoto, type MealMacros } from "@/lib/meals";
import { suggestionForRemaining, type DailyTargets } from "@/lib/nutritionTargets";
import type { NutritionGoal } from "@/lib/user";
import { NUTRITION_LABELS } from "@/lib/user";

export type MealDraft = {
  name: string;
  ingredients: string;
  photo?: string;
  macros: MealMacros;
  source: "manual" | "photo" | "photo+manual";
  aiNote?: string;
  suggestion?: string;
};

const EMPTY_MACROS: MealMacros = { calories: 0, protein: 0, carbs: 0, fat: 0 };

export function MealLogSheet({
  targets,
  nutritionGoal,
  eaten,
  onSave,
  onCancel,
}: {
  targets: DailyTargets;
  nutritionGoal: NutritionGoal;
  eaten: MealMacros;
  onSave: (draft: MealDraft) => void;
  onCancel: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [photo, setPhoto] = useState<string | undefined>();
  const [macros, setMacros] = useState<MealMacros>(EMPTY_MACROS);
  const [source, setSource] = useState<MealDraft["source"]>("manual");
  const [aiNote, setAiNote] = useState<string | undefined>();
  const [suggestion, setSuggestion] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const setMacro = (key: keyof MealMacros, value: string) => {
    const n = Number(value);
    setMacros((current) => ({ ...current, [key]: Number.isFinite(n) ? Math.max(0, n) : 0 }));
    if (source === "photo") setSource("photo+manual");
  };

  const onPickPhoto = async (file: File | null) => {
    if (!file) return;
    setBusy(true);
    setStatus("Preparing photo…");
    try {
      const dataUrl = await fileToResizedDataUrl(file, 512, 0.65);
      setPhoto(dataUrl);
      setStatus("Analysing meal with AI…");
      const result = await analyzeMealPhoto(dataUrl, nutritionGoal);
      if (!result) {
        setSource("photo");
        setStatus("AI unavailable — enter macros manually (add OPENAI_API_KEY to enable).");
        setSuggestion(suggestionForRemaining(targets, eaten));
        return;
      }
      setName(result.name || "Meal");
      setIngredients(result.ingredients || "");
      setMacros({
        calories: result.calories ?? 0,
        protein: result.protein ?? 0,
        carbs: result.carbs ?? 0,
        fat: result.fat ?? 0,
      });
      setSource("photo");
      setAiNote(result.note || "AI estimate — edit if needed");
      setSuggestion(result.suggestion || suggestionForRemaining(targets, eaten));
      setStatus("Estimate ready — edit anything before saving.");
    } catch {
      setStatus("Could not read that photo — try again or log manually.");
    } finally {
      setBusy(false);
    }
  };

  const canSave = macros.calories > 0 || macros.protein > 0 || name.trim().length > 0 || Boolean(photo);

  return (
    <div className="app">
      <div className="shell">
        <div className="onboard-screen meal-log-screen">
          <div className="onboard-top">
            <button type="button" className="ghost-btn" onClick={onCancel} disabled={busy}>
              ‹ Back
            </button>
            <span className="eyebrow">Log meal</span>
          </div>

          <div className="onboard-body">
            <h1>Fuel your day</h1>
            <p className="onboard-lead">
              Goal: <strong>{NUTRITION_LABELS[nutritionGoal]}</strong> · {targets.calories} kcal ·{" "}
              {targets.protein}g protein. Snap a plate for AI macros, or enter them yourself.
            </p>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={(event) => {
                void onPickPhoto(event.target.files?.[0] ?? null);
                event.target.value = "";
              }}
            />

            <div className="meal-photo-row">
              <button
                type="button"
                className="cta-btn"
                disabled={busy}
                onClick={() => fileRef.current?.click()}
              >
                {busy ? "Working…" : photo ? "Retake photo" : "Take / upload photo"}
              </button>
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo} alt="Meal preview" className="meal-photo-preview" />
              ) : (
                <div className="meal-photo-placeholder">Photo optional</div>
              )}
            </div>

            {status ? <p className="muted meal-status">{status}</p> : null}
            {aiNote ? <p className="muted meal-status">{aiNote}</p> : null}
            {suggestion ? <p className="meal-suggestion">{suggestion}</p> : null}

            <label className="meal-field">
              <span className="eyebrow">Meal name</span>
              <input
                type="text"
                value={name}
                placeholder="e.g. Salmon bowl"
                onChange={(event) => setName(event.target.value)}
              />
            </label>

            <label className="meal-field">
              <span className="eyebrow">Ingredients</span>
              <textarea
                value={ingredients}
                placeholder="e.g. salmon, rice, broccoli, olive oil"
                rows={3}
                onChange={(event) => setIngredients(event.target.value)}
              />
            </label>

            <div className="meal-macro-grid">
              {(
                [
                  ["calories", "Calories"],
                  ["protein", "Protein g"],
                  ["carbs", "Carbs g"],
                  ["fat", "Fat g"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="meal-field">
                  <span className="eyebrow">{label}</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={macros[key] || ""}
                    placeholder="0"
                    onChange={(event) => setMacro(key, event.target.value)}
                  />
                </label>
              ))}
            </div>

            <div className="onboard-nav">
              <button
                type="button"
                className="cta-btn"
                disabled={busy || !canSave}
                onClick={() =>
                  onSave({
                    name: name.trim() || "Meal",
                    ingredients: ingredients.trim(),
                    photo,
                    macros,
                    source,
                    aiNote,
                    suggestion,
                  })
                }
              >
                Save meal
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
