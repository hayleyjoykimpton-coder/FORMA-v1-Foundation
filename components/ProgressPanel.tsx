"use client";

import { useState } from "react";
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
import { GOAL_LABELS } from "@/lib/user";
import type { Goal, UserProfile } from "@/lib/user";

const GOAL_FOCUS: Record<Goal, string> = {
  glutes: "We track glute training, lower-body strength, hip thrust progression and measurements.",
  sculpt: "We track strength, body composition and measurements as you build a strong, sculpted physique.",
  strength: "We track strength progression, performance and consistency.",
  fitness: "We track consistency, performance and how strong and capable you feel.",
  health: "We track consistency, energy and steady, healthy progress.",
};

async function fileToResizedDataUrl(file: File, max = 720): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(String(reader.result));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.72));
      };
      img.onerror = reject;
      img.src = String(reader.result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

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

export function ProgressPanel({
  profile,
  entries,
  photos,
  onSaveEntry,
  onAddPhoto,
  onDeletePhoto,
}: {
  profile: UserProfile;
  entries: ProgressEntry[];
  photos: ProgressPhoto[];
  onSaveEntry: (entry: ProgressEntry) => void;
  onAddPhoto: (photo: ProgressPhoto) => void;
  onDeletePhoto: (id: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [weight, setWeight] = useState("");
  const [measurements, setMeasurements] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [compareCategory, setCompareCategory] = useState<PhotoCategory>("front");

  const current = currentWeight(entries, profile);
  const starting = startingWeight(entries, profile);
  const change = weightChange(entries, profile);
  const points = weightSeries(entries);
  const weeks = weeksTracked(entries, profile);
  const goalLabel = GOAL_LABELS[profile.goal];

  const saveEntry = () => {
    const parsed: Measurements = {};
    for (const key of MEASUREMENT_KEYS) {
      const raw = measurements[key];
      if (raw && raw.trim() !== "" && Number.isFinite(Number(raw))) parsed[key] = Number(raw);
    }
    const weightValue = weight.trim() !== "" && Number.isFinite(Number(weight)) ? Number(weight) : null;
    if (weightValue === null && Object.keys(parsed).length === 0) {
      setShowForm(false);
      return;
    }
    onSaveEntry({ id: uid(), date: new Date().toISOString(), weight: weightValue, measurements: parsed, notes: notes.trim() });
    setWeight("");
    setMeasurements({});
    setNotes("");
    setShowForm(false);
  };

  const handleFile = async (category: PhotoCategory, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const image = await fileToResizedDataUrl(file);
    onAddPhoto({ id: uid(), date: new Date().toISOString(), image, category, notes: "" });
  };

  const categoryPhotos = photos.filter((photo) => photo.category === compareCategory);
  const before = categoryPhotos[0] ?? null;
  const after = categoryPhotos.length > 1 ? categoryPhotos[categoryPhotos.length - 1] : null;
  const recentPhotos = [...photos].reverse();

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });

  return (
    <>
      <SectionHeading eyebrow="Your journey" title={weeks > 0 ? `${weeks} week${weeks === 1 ? "" : "s"} in` : "Your transformation"} />
      <article className="card">
        <p className="muted">Goal: <strong>{goalLabel}</strong>. {GOAL_FOCUS[profile.goal]}</p>
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
          <p className="muted centered transform-empty">Log your weight over time to reveal your trend.</p>
        )}
        <button className="secondary-btn" onClick={() => setShowForm((value) => !value)}>
          {showForm ? "Close" : "Log weight & measurements"}
        </button>
        {showForm && (
          <div className="log-form">
            <label className="field">
              <span>Weight (kg)</span>
              <input type="number" step="0.1" value={weight} onChange={(event) => setWeight(event.target.value)} placeholder="e.g. 62" />
            </label>
            <div className="profile-fields">
              {MEASUREMENT_KEYS.map((key) => (
                <label className="field" key={key}>
                  <span>{MEASUREMENT_LABELS[key]} (cm)</span>
                  <input
                    type="number"
                    step="0.1"
                    value={measurements[key] ?? ""}
                    onChange={(event) => setMeasurements((current) => ({ ...current, [key]: event.target.value }))}
                  />
                </label>
              ))}
            </div>
            <label className="field">
              <span>Notes</span>
              <input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="How you're feeling, energy, strength…" />
            </label>
            <button className="cta-btn" onClick={saveEntry}>Save entry</button>
          </div>
        )}
      </article>

      <SectionHeading eyebrow="Measurements" title="Body measurements" />
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
                    <span className={`delta ${delta > 0 ? "up" : "down"}`}>{delta > 0 ? "+" : ""}{delta} cm</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {!entries.length && <p className="muted centered transform-empty">Log measurements to track your shape over time.</p>}
      </article>

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
                <img src={photo.image} alt={`${PHOTO_LABELS[photo.category]} · ${formatDate(photo.date)}`} />
                <button className="photo-del" onClick={() => onDeletePhoto(photo.id)} aria-label="Delete photo">×</button>
                <span className="photo-cap">{PHOTO_LABELS[photo.category]} · {formatDate(photo.date)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted centered transform-empty">Add front, side and back photos to build your visual timeline.</p>
        )}
      </article>

      <SectionHeading eyebrow="Compare" title="Before / after" />
      <article className="card">
        <div className="choice-row">
          {PHOTO_CATEGORIES.map((category) => (
            <button
              key={category}
              className={`choice mini${compareCategory === category ? " selected" : ""}`}
              onClick={() => setCompareCategory(category)}
            >
              {PHOTO_LABELS[category]}
            </button>
          ))}
        </div>
        {before ? (
          <div className="compare-grid">
            <div className="compare-cell">
              <img src={before.image} alt={`Before · ${formatDate(before.date)}`} />
              <span className="photo-cap">Before · {formatDate(before.date)}</span>
            </div>
            <div className="compare-cell">
              {after ? (
                <>
                  <img src={after.image} alt={`After · ${formatDate(after.date)}`} />
                  <span className="photo-cap">After · {formatDate(after.date)}</span>
                </>
              ) : (
                <div className="compare-placeholder">Add another {PHOTO_LABELS[compareCategory].toLowerCase()} photo later to compare.</div>
              )}
            </div>
          </div>
        ) : (
          <p className="muted centered transform-empty">Upload a {PHOTO_LABELS[compareCategory].toLowerCase()} photo to start your comparison.</p>
        )}
      </article>
    </>
  );
}
