"use client";

import { useEffect, useState } from "react";
import { SectionHeading, StatTile } from "@/components/ui";
import {
  INBODY_METRIC_LABELS,
  INBODY_METRIC_UNITS,
  addInBodyScan,
  latestInBodyScan,
  localDateKey,
  metricDelta,
  metricPreferDown,
  previousInBodyScan,
  removeInBodyScan,
  seriesForMetric,
  type InBodyMetricKey,
  type InBodyState,
} from "@/lib/inbody";

const FORM_FIELDS: { key: InBodyMetricKey; placeholder: string }[] = [
  { key: "weightKg", placeholder: "e.g. 62.4" },
  { key: "skeletalMuscleMassKg", placeholder: "e.g. 24.1" },
  { key: "bodyFatPercent", placeholder: "e.g. 28.5" },
  { key: "bodyFatMassKg", placeholder: "e.g. 17.8" },
  { key: "leanBodyMassKg", placeholder: "e.g. 44.6" },
  { key: "visceralFatLevel", placeholder: "e.g. 5" },
  { key: "bmi", placeholder: "e.g. 22.1" },
  { key: "bmrKcal", placeholder: "e.g. 1380" },
];

function formatMetric(value: number | null, unit: string): string {
  if (value === null) return "—";
  return unit ? `${value}${unit === "%" || unit === "" ? unit : ` ${unit}`}` : String(value);
}

function MiniTrend({ points }: { points: { label: string; value: number }[] }) {
  if (points.length < 2) {
    return <p className="guided-empty">Log a second scan to unlock your first trend.</p>;
  }
  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const width = 300;
  const height = 88;
  const pad = 10;
  const step = (width - 2 * pad) / (points.length - 1);
  const coords = points.map((point, index) => ({
    x: pad + index * step,
    y: pad + (1 - (point.value - min) / range) * (height - 2 * pad),
  }));
  const path = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
  return (
    <div className="inbody-trend">
      <svg className="weight-chart" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label="InBody trend">
        <path d={path} className="weight-line" fill="none" />
        {coords.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r={3} className="weight-dot" />
        ))}
      </svg>
      <div className="inbody-trend-labels">
        <span>{points[0].label}</span>
        <span>{points[points.length - 1].label}</span>
      </div>
    </div>
  );
}

export function InBodyPanel({
  state,
  onChange,
  forceOpenForm = false,
  onForceOpenConsumed,
}: {
  state: InBodyState;
  onChange: (next: InBodyState) => void;
  /** When true, open the log form once (e.g. empty-state CTA). */
  forceOpenForm?: boolean;
  onForceOpenConsumed?: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState(localDateKey());
  const [fields, setFields] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [trendKey, setTrendKey] = useState<InBodyMetricKey>("bodyFatPercent");

  useEffect(() => {
    if (!forceOpenForm) return;
    setShowForm(true);
    onForceOpenConsumed?.();
  }, [forceOpenForm, onForceOpenConsumed]);

  const latest = latestInBodyScan(state);
  const previous = previousInBodyScan(state);
  const trendPoints = seriesForMetric(state, trendKey);

  const save = () => {
    const next = addInBodyScan(state, {
      date,
      weightKg: fields.weightKg,
      skeletalMuscleMassKg: fields.skeletalMuscleMassKg,
      bodyFatMassKg: fields.bodyFatMassKg,
      bodyFatPercent: fields.bodyFatPercent,
      leanBodyMassKg: fields.leanBodyMassKg,
      visceralFatLevel: fields.visceralFatLevel,
      bmi: fields.bmi,
      bmrKcal: fields.bmrKcal,
      notes,
    });
    if (next.scans.length === state.scans.length) {
      setShowForm(false);
      return;
    }
    onChange(next);
    setFields({});
    setNotes("");
    setDate(localDateKey());
    setShowForm(false);
  };

  const highlightKeys: InBodyMetricKey[] = [
    "skeletalMuscleMassKg",
    "bodyFatPercent",
    "leanBodyMassKg",
    "visceralFatLevel",
  ];

  return (
    <>
      <SectionHeading
        eyebrow="InBody"
        title={latest ? "Latest scan" : "Body composition"}
      />
      <article className="card inbody-intro-card">
        <p className="muted">
          Log numbers from your InBody printout — muscle, fat % and lean mass over time.
          Use this alongside tape measurements on Body; it doesn’t replace them.
        </p>
        <button type="button" className="cta-btn" onClick={() => setShowForm((value) => !value)}>
          {showForm ? "Close" : "Log InBody scan"}
        </button>
        {showForm ? (
          <div className="log-form inbody-log-form">
            <label className="field">
              <span>Scan date</span>
              <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </label>
            <div className="profile-fields">
              {FORM_FIELDS.map(({ key, placeholder }) => (
                <label className="field" key={key}>
                  <span>
                    {INBODY_METRIC_LABELS[key]}
                    {INBODY_METRIC_UNITS[key] ? ` (${INBODY_METRIC_UNITS[key]})` : ""}
                  </span>
                  <input
                    type="number"
                    step="0.1"
                    inputMode="decimal"
                    placeholder={placeholder}
                    value={fields[key] ?? ""}
                    onChange={(event) =>
                      setFields((current) => ({ ...current, [key]: event.target.value }))
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
                placeholder="Morning scan, post-training, etc."
              />
            </label>
            <button type="button" className="cta-btn" onClick={save}>
              Save scan
            </button>
          </div>
        ) : null}
      </article>

      {latest ? (
        <>
          <div className="stat-grid four">
            {highlightKeys.map((key) => {
              const value = latest[key];
              const delta = metricDelta(value, previous ? previous[key] : null);
              const preferDown = metricPreferDown(key);
              const positive =
                delta === null ? null : preferDown ? delta < 0 : delta > 0;
              const unit = INBODY_METRIC_UNITS[key];
              return (
                <StatTile
                  key={key}
                  label={INBODY_METRIC_LABELS[key]}
                  value={formatMetric(value, unit)}
                  note={
                    delta === null
                      ? new Date(latest.date).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })
                      : `${delta > 0 ? "+" : ""}${delta}${unit ? ` ${unit}` : ""} vs last`
                  }
                  accent={positive === true ? "sage" : positive === false ? "mocha" : "pink"}
                />
              );
            })}
          </div>

          <SectionHeading eyebrow="Trends" title={INBODY_METRIC_LABELS[trendKey]} />
          <article className="card">
            <div className="choice-row inbody-trend-tabs">
              {(
                [
                  "bodyFatPercent",
                  "skeletalMuscleMassKg",
                  "leanBodyMassKg",
                  "weightKg",
                ] as InBodyMetricKey[]
              ).map((key) => (
                <button
                  key={key}
                  type="button"
                  className={`choice mini${trendKey === key ? " selected" : ""}`}
                  onClick={() => setTrendKey(key)}
                >
                  {INBODY_METRIC_LABELS[key]}
                </button>
              ))}
            </div>
            <MiniTrend points={trendPoints} />
          </article>

          <SectionHeading eyebrow="History" title="All scans" />
          <div className="inbody-history">
            {[...state.scans].reverse().map((scan) => (
              <article className="card inbody-scan-card" key={scan.id}>
                <div className="workout-card-head">
                  <div>
                    <span className="eyebrow">
                      {new Date(scan.date).toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <h3>
                      {scan.weightKg != null ? `${scan.weightKg} kg` : "InBody scan"}
                      {scan.bodyFatPercent != null ? ` · ${scan.bodyFatPercent}% fat` : ""}
                    </h3>
                  </div>
                  <button
                    type="button"
                    className="text-btn"
                    onClick={() => {
                      if (typeof window !== "undefined" && !window.confirm("Delete this InBody scan?")) {
                        return;
                      }
                      onChange(removeInBodyScan(state, scan.id));
                    }}
                  >
                    Delete
                  </button>
                </div>
                <div className="measurement-list">
                  {FORM_FIELDS.map(({ key }) => {
                    const value = scan[key];
                    if (value === null) return null;
                    return (
                      <div className="measurement-row" key={key}>
                        <span>{INBODY_METRIC_LABELS[key]}</span>
                        <div className="measurement-value">
                          <strong>{formatMetric(value, INBODY_METRIC_UNITS[key])}</strong>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {scan.notes ? <p className="muted">{scan.notes}</p> : null}
              </article>
            ))}
          </div>
        </>
      ) : (
        <article className="card guided-empty empty-cta-card">
          <p>
            After your next InBody appointment — or whenever you have a printout — log your first scan.
            Muscle and lean mass trends will appear here.
          </p>
          <button type="button" className="cta-btn" onClick={() => setShowForm(true)}>
            Log InBody
          </button>
        </article>
      )}
    </>
  );
}
