"use client";

import { useState } from "react";
import { computeReadiness, READINESS_METRICS } from "@/lib/coach";
import type { Readiness, ReadinessInput } from "@/lib/coach";
import type { Workout } from "@/lib/types";

const SCALE = [1, 2, 3, 4, 5];

export function ReadinessCheck({
  workout,
  onSubmit,
  onCancel,
}: {
  workout: Workout;
  onSubmit: (readiness: Readiness) => void;
  onCancel: () => void;
}) {
  const [input, setInput] = useState<ReadinessInput>({
    sleep: 3,
    energy: 3,
    stress: 3,
    soreness: 3,
    motivation: 3,
    pain: 1,
  });

  const preview = computeReadiness(input);
  const set = (key: keyof ReadinessInput, value: number) => setInput((current) => ({ ...current, [key]: value }));

  return (
    <div className="app">
      <div className="shell">
        <div className="onboard-screen">
          <div className="onboard-top">
            <button className="ghost-btn" onClick={onCancel}>‹ Back</button>
            <span className="eyebrow">Readiness check-in</span>
          </div>

          <div className="onboard-body">
            <h1>How are you today?</h1>
            <p className="onboard-lead">A quick check before <strong>{workout.title}</strong>. FORMA adapts your session to how you feel.</p>

            <div className="readiness-list">
              {READINESS_METRICS.map((metric) => (
                <div className="readiness-row" key={metric.key}>
                  <span className="readiness-label">{metric.label}</span>
                  <div className="readiness-scale">
                    {SCALE.map((value) => (
                      <button
                        key={value}
                        className={`readiness-dot${input[metric.key] === value ? " selected" : ""}`}
                        onClick={() => set(metric.key, value)}
                        aria-label={`${metric.label} ${value}`}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="readiness-preview">
              <div>
                <span className="eyebrow">Readiness</span>
                <strong className={`readiness-score band-${preview.band}`}>{preview.score}</strong>
              </div>
              <p className="muted">{preview.note}</p>
            </div>

            <div className="onboard-nav">
              <button className="cta-btn" onClick={() => onSubmit(preview)}>Start workout</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
