"use client";

import { useMemo, useState } from "react";
import { SectionHeading, StatTile } from "@/components/ui";
import {
  MEASUREMENT_KEYS,
  MEASUREMENT_LABELS,
  PHOTO_CATEGORIES,
  PHOTO_LABELS,
  currentWeight,
  latestMeasurement,
  measurementDelta,
  startingWeight,
  uid,
  weeksTracked,
  weightChange,
  weightSeries,
} from "@/lib/progress";
import type {
  Measurements,
  PhotoCategory,
  ProgressEntry,
  ProgressPhoto,
  WeightPoint,
} from "@/lib/progress";
import { fileToResizedDataUrl } from "@/lib/images";
import { GOAL_LABELS } from "@/lib/user";
import type { Goal, UserProfile } from "@/lib/user";

const GOAL_FOCUS: Record<Goal, string> = {
  glutes: "Glute work, hip thrusts and lower-body strength — measurements as quiet context.",
  sculpt: "Strength and shape, tracked gently — not a weekly weigh-in story.",
  strength: "Load and consistency first. The numbers here are optional colour.",
  fitness: "Showing up and feeling capable — body logs when you want them.",
  health: "Steady habits and energy. Log what helps you notice change.",
};

function WeightChart({ points }: { points: WeightPoint[] }) {
  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const width = 300;
  const height = 96;
  const pad = 10;
  const step = points.length > 1 ? (width - 2 * pad) / (points.length - 1) : 0;
  const coords = points.map((point, index) => ({
    x: pad + index * step,
    y: pad + (1 - (point.value - min) / range) * (height - 2 * pad),
  }));
  const path = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
  return (
    <svg className="weight-chart" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label="Weight over time">
      <path d={path} className="weight-line" fill="none" />
      {coords.map((c, i) => (
        <circle key={i} cx={c.x} cy={c.y} r={3} className="weight-dot" />
      ))}
    </svg>
  );
}

export type ProgressPanelSection = "body" | "photos" | "all";

export function ProgressPanel({
  profile,
  entries,
  photos,
  onSaveEntry,
  onAddPhoto,
  onDeletePhoto,
  section = "all",
}: {
  profile: UserProfile;
  entries: ProgressEntry[];
  photos: ProgressPhoto[];
  onSaveEntry: (entry: ProgressEntry) => void;
  onAddPhoto: (photo: ProgressPhoto) => void;
  onDeletePhoto: (id: string) => void;
  section?: ProgressPanelSection;
}) {
  const showBody = section === "all" || section === "body";
  const showPhotos = section === "all" || section === "photos";
  const [formMode, setFormMode] = useState<"closed" | "quick" | "full">("closed");
  const [weight, setWeight] = useState("");
  const [measurements, setMeasurements] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [compareCategory, setCompareCategory] = useState<PhotoCategory>("front");
  const [beforeId, setBeforeId] = useState<string | null>(null);
  const [afterId, setAfterId] = useState<string | null>(null);

  const current = currentWeight(entries, profile);
  const starting = startingWeight(entries, profile);
  const change = weightChange(entries, profile);
  const points = weightSeries(entries);
  const weeks = weeksTracked(entries, profile);
  const goalLabel = GOAL_LABELS[profile.goal];

  const categoryPhotos = useMemo(
    () => photos.filter((photo) => photo.category === compareCategory),
    [photos, compareCategory],
  );

  const before =
    categoryPhotos.find((photo) => photo.id === beforeId) ??
    categoryPhotos[0] ??
    null;
  const after =
    categoryPhotos.find((photo) => photo.id === afterId) ??
    (categoryPhotos.length > 1 ? categoryPhotos[categoryPhotos.length - 1] : null);

  const hasTape = entries.some((entry) =>
    MEASUREMENT_KEYS.some((key) => entry.measurements[key] != null),
  );

  const openQuickWeight = () => setFormMode((mode) => (mode === "quick" ? "closed" : "quick"));
  const openFullForm = () => setFormMode((mode) => (mode === "full" ? "closed" : "full"));

  const saveEntry = (mode: "quick" | "full" = formMode === "quick" ? "quick" : "full") => {
    const parsed: Measurements = {};
    if (mode === "full") {
      for (const key of MEASUREMENT_KEYS) {
        const raw = measurements[key];
        if (raw && raw.trim() !== "" && Number.isFinite(Number(raw))) parsed[key] = Number(raw);
      }
    }
    const weightValue = weight.trim() !== "" && Number.isFinite(Number(weight)) ? Number(weight) : null;
    if (weightValue === null && Object.keys(parsed).length === 0) {
      setFormMode("closed");
      return;
    }
    onSaveEntry({
      id: uid(),
      date: new Date().toISOString(),
      weight: weightValue,
      measurements: parsed,
      notes: mode === "full" ? notes.trim() : "",
    });
    setWeight("");
    setMeasurements({});
    setNotes("");
    setFormMode("closed");
  };

  const handleFile = async (category: PhotoCategory, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const image = await fileToResizedDataUrl(file);
    onAddPhoto({ id: uid(), date: new Date().toISOString(), image, category, notes: "" });
  };

  const recentPhotos = [...photos].reverse();
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });

  return (
    <>
      {showBody ? (
        <>
          <SectionHeading
            eyebrow="Your journey"
            title={weeks > 0 ? `${weeks} week${weeks === 1 ? "" : "s"} in` : "Your body log"}
          />
          <article className="card">
            <p className="muted">
              Goal: <strong>{goalLabel}</strong>. {GOAL_FOCUS[profile.goal]}
            </p>
            <div className="stat-grid three transform-stats">
              <StatTile label="Current" value={current !== null ? `${current}kg` : "—"} note="latest" accent="pink" />
              <StatTile label="Starting" value={starting !== null ? `${starting}kg` : "—"} note="baseline" accent="mocha" />
              <StatTile
                label="Change"
                value={change !== null ? `${change > 0 ? "+" : ""}${change}kg` : "—"}
                note="since start"
                accent="sage"
              />
            </div>
            {points.length >= 2 ? (
              <WeightChart points={points} />
            ) : (
              <div className="guided-empty empty-cta-card">
                <p>Log weight twice to unlock your first trend line.</p>
                <button type="button" className="cta-btn" onClick={openQuickWeight}>
                  Log weight
                </button>
              </div>
            )}

            <div className="body-log-actions">
              <button type="button" className="cta-btn" onClick={openQuickWeight}>
                Quick weight
              </button>
              <button type="button" className="secondary-btn" onClick={openFullForm}>
                {formMode === "full" ? "Close form" : "Weight + tape"}
              </button>
            </div>

            {formMode === "quick" ? (
              <div className="log-form quick-weight-form">
                <label className="field">
                  <span>Weight (kg)</span>
                  <input
                    type="number"
                    step="0.1"
                    inputMode="decimal"
                    autoFocus
                    value={weight}
                    onChange={(event) => setWeight(event.target.value)}
                    placeholder={current != null ? String(current) : "e.g. 62.4"}
                  />
                </label>
                <button type="button" className="cta-btn" onClick={() => saveEntry("quick")}>
                  Save weight
                </button>
              </div>
            ) : null}

            {formMode === "full" ? (
              <div className="log-form">
                <label className="field">
                  <span>Weight (kg)</span>
                  <input
                    type="number"
                    step="0.1"
                    value={weight}
                    onChange={(event) => setWeight(event.target.value)}
                    placeholder="e.g. 62.4"
                  />
                </label>
                <div className="profile-fields">
                  {MEASUREMENT_KEYS.map((key) => (
                    <label className="field" key={key}>
                      <span>{MEASUREMENT_LABELS[key]} (cm)</span>
                      <input
                        type="number"
                        step="0.1"
                        value={measurements[key] ?? ""}
                        onChange={(event) =>
                          setMeasurements((current) => ({ ...current, [key]: event.target.value }))
                        }
                      />
                    </label>
                  ))}
                </div>
                <label className="field">
                  <span>Notes</span>
                  <input
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Energy, how clothes feel, strength…"
                  />
                </label>
                <button type="button" className="cta-btn" onClick={() => saveEntry("full")}>
                  Save entry
                </button>
              </div>
            ) : null}
          </article>

          <SectionHeading eyebrow="Measurements" title="Tape" />
          <article className="card">
            <div className="measurement-list">
              {MEASUREMENT_KEYS.map((key) => {
                const latest = latestMeasurement(entries, key);
                const delta = measurementDelta(entries, key);
                return (
                  <div className="measurement-row" key={key}>
                    <span>{MEASUREMENT_LABELS[key]}</span>
                    <div className="measurement-value">
                      <strong>{latest !== null ? `${latest} cm` : "—"}</strong>
                      {delta !== null && delta !== 0 && (
                        <span className={`delta ${delta > 0 ? "up" : "down"}`}>
                          {delta > 0 ? "+" : ""}
                          {delta} cm
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {!hasTape ? (
              <div className="guided-empty empty-cta-card">
                <p>No tape yet — add waist, hips or glutes whenever you like.</p>
                <button type="button" className="cta-btn" onClick={() => setFormMode("full")}>
                  Log measurements
                </button>
              </div>
            ) : null}
          </article>
        </>
      ) : null}

      {showPhotos ? (
        <>
          <SectionHeading eyebrow="Photos" title="Progress photos" />
          <article className="card">
            <div className="photo-actions">
              {PHOTO_CATEGORIES.map((category) => (
                <label className="pill-btn small photo-upload" key={category}>
                  + {PHOTO_LABELS[category]}
                  <input type="file" accept="image/*" hidden onChange={(event) => handleFile(category, event)} />
                </label>
              ))}
            </div>
            {recentPhotos.length ? (
              <div className="photo-grid">
                {recentPhotos.map((photo) => (
                  <div className="photo-cell" key={photo.id}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.image} alt={`${PHOTO_LABELS[photo.category]} · ${formatDate(photo.date)}`} />
                    <button className="photo-del" onClick={() => onDeletePhoto(photo.id)} aria-label="Delete photo">
                      ×
                    </button>
                    <span className="photo-cap">
                      {PHOTO_LABELS[photo.category]} · {formatDate(photo.date)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="guided-empty empty-cta-card">
                <p>Add a front, side or back photo when you’re ready — same light, same pose helps.</p>
                <label className="cta-btn photo-upload-cta">
                  Add front photo
                  <input type="file" accept="image/*" hidden onChange={(event) => handleFile("front", event)} />
                </label>
              </div>
            )}
          </article>

          <SectionHeading eyebrow="Compare" title="Before / after" />
          <article className="card">
            <div className="choice-row">
              {PHOTO_CATEGORIES.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={`choice mini${compareCategory === category ? " selected" : ""}`}
                  onClick={() => {
                    setCompareCategory(category);
                    setBeforeId(null);
                    setAfterId(null);
                  }}
                >
                  {PHOTO_LABELS[category]}
                </button>
              ))}
            </div>

            {categoryPhotos.length >= 2 ? (
              <>
                <div className="compare-pickers">
                  <label className="field">
                    <span>Before</span>
                    <select
                      value={before?.id ?? ""}
                      onChange={(event) => setBeforeId(event.target.value || null)}
                    >
                      {categoryPhotos.map((photo) => (
                        <option key={photo.id} value={photo.id}>
                          {formatDate(photo.date)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>After</span>
                    <select
                      value={after?.id ?? ""}
                      onChange={(event) => setAfterId(event.target.value || null)}
                    >
                      {categoryPhotos.map((photo) => (
                        <option key={photo.id} value={photo.id}>
                          {formatDate(photo.date)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <button
                  type="button"
                  className="text-btn"
                  onClick={() => {
                    if (!before || !after) return;
                    setBeforeId(after.id);
                    setAfterId(before.id);
                  }}
                >
                  Swap before / after
                </button>
              </>
            ) : null}

            {before ? (
              <div className="compare-grid">
                <div className="compare-cell">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={before.image} alt={`Before · ${formatDate(before.date)}`} />
                  <span className="photo-cap">Before · {formatDate(before.date)}</span>
                </div>
                <div className="compare-cell">
                  {after && after.id !== before.id ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={after.image} alt={`After · ${formatDate(after.date)}`} />
                      <span className="photo-cap">After · {formatDate(after.date)}</span>
                    </>
                  ) : (
                    <div className="compare-placeholder empty-cta-card">
                      <p>Add another {PHOTO_LABELS[compareCategory].toLowerCase()} photo to compare.</p>
                      <label className="secondary-btn photo-upload-cta">
                        Upload {PHOTO_LABELS[compareCategory].toLowerCase()}
                        <input
                          type="file"
                          accept="image/*"
                          hidden
                          onChange={(event) => handleFile(compareCategory, event)}
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="guided-empty empty-cta-card">
                <p>Upload a {PHOTO_LABELS[compareCategory].toLowerCase()} photo to start comparing.</p>
                <label className="cta-btn photo-upload-cta">
                  Add {PHOTO_LABELS[compareCategory].toLowerCase()} photo
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(event) => handleFile(compareCategory, event)}
                  />
                </label>
              </div>
            )}
          </article>
        </>
      ) : null}
    </>
  );
}
