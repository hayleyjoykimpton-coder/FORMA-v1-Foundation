"use client";

import { useMemo, useState } from "react";

type SeasonKey = "foundation" | "build" | "peak" | "align";
type TabKey = "today" | "plan" | "progress" | "recovery";

const seasons: Record<SeasonKey, {
  label: string;
  week: number;
  total: number;
  focus: string;
  phrase: string;
  accent: string;
}> = {
  foundation: {
    label: "Foundation",
    week: 2,
    total: 8,
    focus: "Movement quality · Capacity · Consistency",
    phrase: "Build the base you can progress from.",
    accent: "foundation",
  },
  build: {
    label: "Build",
    week: 3,
    total: 8,
    focus: "Strength · Hypertrophy · Progressive overload",
    phrase: "Earn the next increase through better reps.",
    accent: "build",
  },
  peak: {
    label: "Peak",
    week: 7,
    total: 8,
    focus: "Max strength · Power · Precision",
    phrase: "Express strength without chasing fatigue.",
    accent: "peak",
  },
  align: {
    label: "Align",
    week: 1,
    total: 2,
    focus: "Recovery · Mobility · Readiness",
    phrase: "Reduce fatigue so adaptation can catch up.",
    accent: "align",
  },
};

const weeklyPlan = [
  ["MON", "Lower Body", "Glutes + posterior chain", "55 min"],
  ["TUE", "Upper Body", "Push + pull", "50 min"],
  ["THU", "Lower Body", "Strength focus", "60 min"],
  ["SAT", "Full Body", "Conditioning", "45 min"],
];

export default function FormaApp() {
  const [season, setSeason] = useState<SeasonKey>("build");
  const [tab, setTab] = useState<TabKey>("today");
  const [setOpen, setSetOpen] = useState(false);
  const [weight, setWeight] = useState(82.5);
  const [reps, setReps] = useState(8);
  const [rpe, setRpe] = useState(8);
  const [completed, setCompleted] = useState(false);

  const current = seasons[season];
  const progress = Math.round((current.week / current.total) * 100);

  const recommendation = useMemo(() => {
    if (rpe <= 7 && reps >= 10) return "Next target: increase by 2.5 kg";
    if (rpe >= 9) return "Repeat this load next week";
    return "Stay at this load and add one clean rep";
  }, [rpe, reps]);

  return (
    <main className="page-shell">
      <section className="phone-shell">
        <header className="topbar">
          <div>
            <span className="eyebrow">Good morning,</span>
            <h1>Hayley</h1>
          </div>
          <button className="icon-btn" aria-label="Notifications">○</button>
        </header>

        {tab === "today" && !setOpen && (
          <>
            <section className={`season-hero ${current.accent}`}>
              <div className="texture texture-a" />
              <div className="texture texture-b" />
              <div className="season-copy">
                <span className="eyebrow light">Current season</span>
                <h2>{current.label}</h2>
                <p>{current.phrase}</p>
                <div className="meta-row">
                  <span>Week {current.week} of {current.total}</span>
                  <span>{progress}%</span>
                </div>
                <div className="progress"><span style={{ width: `${progress}%` }} /></div>
              </div>
            </section>

            <div className="season-switcher">
              {(Object.keys(seasons) as SeasonKey[]).map((key) => (
                <button
                  key={key}
                  className={season === key ? "active" : ""}
                  onClick={() => setSeason(key)}
                >
                  {seasons[key].label}
                </button>
              ))}
            </div>

            <section className="today-heading">
              <div>
                <span className="eyebrow">Today</span>
                <h3>Upper Body Strength</h3>
              </div>
              <span>55 min</span>
            </section>

            <section className="exercise-card">
              <div className="exercise-visual safe-placeholder">
                <span>Verified exercise media</span>
                <small>Replace with coach-approved photo or video</small>
              </div>
              <div className="exercise-copy">
                <span className="eyebrow">Primary lift</span>
                <h3>Bench Press</h3>
                <p>3 sets · 8–10 reps · RPE 8</p>
                <strong>Today: 82.5 kg</strong>
              </div>
              <button className="arrow-btn" onClick={() => setSetOpen(true)}>→</button>
            </section>

            <section className="metrics">
              <Metric label="Recovery" value="82%" note="Well recovered" />
              <Metric label="Energy" value="84%" note="Good" />
              <Metric label="Sleep" value="7h 48m" note="Consistent" />
            </section>

            <section className="coach-card">
              <span className="eyebrow light">Coach brief</span>
              <h3>Progress without guessing.</h3>
              <p>{recommendation}</p>
            </section>
          </>
        )}

        {tab === "today" && setOpen && (
          <section className="set-screen">
            <div className="set-header">
              <button onClick={() => setSetOpen(false)}>‹</button>
              <span>Set 1 of 3</span>
              <button>•••</button>
            </div>

            <div className="exercise-banner safe-placeholder">
              <span>Bench Press</span>
              <small>Coach-approved media slot</small>
            </div>

            <div className="target-strip">
              <div><span>Target</span><strong>{weight} kg × {reps}</strong></div>
              <em>RPE {rpe}</em>
            </div>

            <div className="set-panel">
              <span className="eyebrow">Working weight</span>
              <div className="weight">{weight}</div>
              <small>kg</small>

              <Control label="Reps" value={reps} onMinus={() => setReps(Math.max(1, reps - 1))} onPlus={() => setReps(reps + 1)} />
              <Control label="RPE" value={rpe} onMinus={() => setRpe(Math.max(1, rpe - 1))} onPlus={() => setRpe(Math.min(10, rpe + 1))} />

              <button className={`complete ${completed ? "done" : ""}`} onClick={() => setCompleted(!completed)}>
                {completed ? "✓" : "Complete set"}
              </button>
              <p className="recommendation">{recommendation}</p>
            </div>
          </section>
        )}

        {tab === "plan" && (
          <section className="content-page">
            <span className="eyebrow">This week</span>
            <h2>Your plan</h2>
            <div className="week-strip">
              {["M","T","W","T","F","S","S"].map((d, i) => <span key={i} className={i === 3 ? "selected" : ""}>{d}</span>)}
            </div>
            <div className="plan-list">
              {weeklyPlan.map(([day, title, detail, time]) => (
                <article key={day}>
                  <div className="day">{day}</div>
                  <div className="mini-visual" />
                  <div><h3>{title}</h3><p>{detail}</p></div>
                  <span>{time}</span>
                </article>
              ))}
            </div>
          </section>
        )}

        {tab === "progress" && (
          <section className="content-page">
            <span className="eyebrow">Progress</span>
            <h2>Strength over time</h2>
            <div className="progress-card">
              <span>Bench Press estimated 1RM</span>
              <strong>94.6 kg</strong>
              <em>+7.5 kg this cycle</em>
              <div className="bars">
                {[28,33,38,42,49,55,61,68,76,83,91].map((v, i) => <i key={i} style={{ height: `${v}%` }} />)}
              </div>
            </div>
            <Decision title="Bench Press" status="Increase" note="+2.5 kg next session" />
            <Decision title="Romanian Deadlift" status="Hold" note="Repeat until 8 clean reps" />
            <Decision title="Dumbbell Row" status="Add reps" note="Aim for 10–12" />
          </section>
        )}

        {tab === "recovery" && (
          <section className="content-page">
            <span className="eyebrow">Recovery</span>
            <h2>Ready to train</h2>
            <div className="ocean-panel">
              <div className="wave one" />
              <div className="wave two" />
              <strong>82%</strong>
              <span>Well recovered</span>
            </div>
            <div className="recovery-grid">
              <Metric label="Sleep" value="7h 48m" note="Good" />
              <Metric label="Stress" value="Low" note="Good" />
              <Metric label="Readiness" value="High" note="Train as planned" />
            </div>
          </section>
        )}

        <nav className="bottom-nav">
          {[
            ["today", "Today"],
            ["plan", "Plan"],
            ["progress", "Progress"],
            ["recovery", "Recovery"],
          ].map(([key, label]) => (
            <button key={key} className={tab === key ? "active" : ""} onClick={() => { setTab(key as TabKey); setSetOpen(false); }}>
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </section>
    </main>
  );
}

function Control({ label, value, onMinus, onPlus }: { label: string; value: number; onMinus: () => void; onPlus: () => void }) {
  return (
    <div className="control">
      <span>{label}</span>
      <button onClick={onMinus}>−</button>
      <strong>{value}</strong>
      <button onClick={onPlus}>+</button>
    </div>
  );
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <article className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}

function Decision({ title, status, note }: { title: string; status: string; note: string }) {
  return (
    <article className="decision">
      <div><h3>{title}</h3><p>{note}</p></div>
      <span>{status}</span>
    </article>
  );
}
