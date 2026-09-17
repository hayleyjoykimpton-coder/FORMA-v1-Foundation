"use client";

import { useEffect, useState } from "react";
import {
  CRACKER_WELLNESS_OVERVIEW,
  CRACKER_WELLNESS_WEEKS,
  crackerWellnessForWeek,
  type CrackerWellnessWeek,
} from "@/lib/crackerWellness";

type Props = {
  weekInCycle: number;
};

export function CrackerWellnessPanel({ weekInCycle }: Props) {
  const current = Math.min(6, Math.max(1, weekInCycle));
  const [week, setWeek] = useState(current);
  const [open, setOpen] = useState(true);
  const [showOverview, setShowOverview] = useState(false);

  useEffect(() => {
    setWeek(current);
  }, [current]);

  const guide: CrackerWellnessWeek = crackerWellnessForWeek(week);

  return (
    <article className="card cracker-wellness-card">
      <button
        type="button"
        className="cracker-wellness-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <div className="cracker-wellness-heading">
          <span className="eyebrow">Wellness · Week {week}</span>
          <strong>{guide.title}</strong>
          <p className="muted">{guide.lead}</p>
        </div>
        <span className="cracker-wellness-chevron">{open ? "−" : "+"}</span>
      </button>

      {open ? (
        <div className="cracker-wellness-body">
          <div className="cracker-week-pills" role="tablist" aria-label="Wellness week">
            {CRACKER_WELLNESS_WEEKS.map((w) => (
              <button
                key={w.week}
                type="button"
                role="tab"
                aria-selected={week === w.week}
                className={week === w.week ? "active" : ""}
                onClick={() => {
                  setShowOverview(false);
                  setWeek(w.week);
                }}
              >
                {w.week}
              </button>
            ))}
            <button
              type="button"
              className={showOverview ? "active overview" : "overview"}
              onClick={() => setShowOverview(true)}
            >
              Guide
            </button>
          </div>

          {showOverview ? (
            <div className="cracker-wellness-overview">
              <strong>{CRACKER_WELLNESS_OVERVIEW.title}</strong>
              <p className="muted">{CRACKER_WELLNESS_OVERVIEW.lead}</p>
              <ul className="cracker-wellness-list">
                {CRACKER_WELLNESS_OVERVIEW.pillars.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
              <div className="cracker-plan-grid">
                <div>
                  <span className="eyebrow">Plan A</span>
                  <p>{CRACKER_WELLNESS_OVERVIEW.plans.a}</p>
                </div>
                <div>
                  <span className="eyebrow">Plan B</span>
                  <p>{CRACKER_WELLNESS_OVERVIEW.plans.b}</p>
                </div>
                <div>
                  <span className="eyebrow">Plan C</span>
                  <p>{CRACKER_WELLNESS_OVERVIEW.plans.c}</p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <span className="eyebrow">{guide.eyebrow}</span>

              {guide.sections.map((section) => (
                <div key={section.heading} className="cracker-wellness-section">
                  <strong>{section.heading}</strong>
                  <ul className="cracker-wellness-list">
                    {section.points.map((point) => (
                      <li key={point.slice(0, 48)}>{point}</li>
                    ))}
                  </ul>
                </div>
              ))}

              {guide.experiment ? (
                <div className="cracker-wellness-callout">
                  <span className="eyebrow">This week’s experiment</span>
                  <p>{guide.experiment}</p>
                </div>
              ) : null}

              {guide.ritual.length ? (
                <div className="cracker-wellness-section">
                  <strong>Daily ritual</strong>
                  <ul className="cracker-wellness-list">
                    {guide.ritual.map((item) => (
                      <li key={item.slice(0, 48)}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {(guide.plan.a || guide.plan.b || guide.plan.c) ? (
                <div className="cracker-plan-grid">
                  {guide.plan.a ? (
                    <div>
                      <span className="eyebrow">Plan A</span>
                      <p>{guide.plan.a}</p>
                    </div>
                  ) : null}
                  {guide.plan.b ? (
                    <div>
                      <span className="eyebrow">Plan B</span>
                      <p>{guide.plan.b}</p>
                    </div>
                  ) : null}
                  {guide.plan.c ? (
                    <div>
                      <span className="eyebrow">Plan C</span>
                      <p>{guide.plan.c}</p>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {guide.reflection.length ? (
                <div className="cracker-wellness-section">
                  <strong>Reflection</strong>
                  <ul className="cracker-wellness-list">
                    {guide.reflection.map((item) => (
                      <li key={item.slice(0, 48)}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </article>
  );
}
