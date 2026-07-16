"use client";

import { useEffect, useMemo, useState } from "react";
import { DEFAULT_WORKOUTS } from "@/lib/defaults";
import type { Exercise, Season, Workout } from "@/lib/types";

type Tab = "today" | "plan" | "progress" | "recovery";

const seasonCopy: Record<Season, { line: string; focus: string; className: string }> = {
  Foundation: { line: "Build the base.", focus: "Movement · Capacity · Consistency", className: "foundation" },
  Build: { line: "Stronger every day.", focus: "Strength · Hypertrophy · Progression", className: "build" },
  Peak: { line: "Perform your best.", focus: "Max strength · Power · Precision", className: "peak" },
  Align: { line: "Recover to grow.", focus: "Recovery · Mobility · Readiness", className: "align" },
};

const uid = () => Math.random().toString(36).slice(2, 9);

export default function FormaApp() {
  const [tab, setTab] = useState<Tab>("today");
  const [season, setSeason] = useState<Season>("Build");
  const [workouts, setWorkouts] = useState<Workout[]>(DEFAULT_WORKOUTS);
  const [activeWorkoutId, setActiveWorkoutId] = useState(DEFAULT_WORKOUTS[0].id);
  const [editingWorkoutId, setEditingWorkoutId] = useState<string | null>(null);
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem("forma-workouts-v03");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Workout[];
        if (Array.isArray(parsed) && parsed.length) {
          setWorkouts(parsed);
          setActiveWorkoutId(parsed[0].id);
        }
      } catch {}
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("forma-workouts-v03", JSON.stringify(workouts));
  }, [workouts]);

  const activeWorkout = workouts.find(w => w.id === activeWorkoutId) ?? workouts[0];
  const seasonData = seasonCopy[season];

  const weeklySets = useMemo(
    () => workouts.reduce((sum, workout) => sum + workout.exercises.reduce((s, ex) => s + ex.sets, 0), 0),
    [workouts]
  );

  const updateWorkout = (id: string, patch: Partial<Workout>) => {
    setWorkouts(prev => prev.map(w => w.id === id ? { ...w, ...patch } : w));
  };

  const addWorkout = () => {
    const workout: Workout = {
      id: uid(),
      day: "Saturday",
      title: "New Workout",
      duration: 45,
      exercises: [],
    };
    setWorkouts(prev => [...prev, workout]);
    setActiveWorkoutId(workout.id);
    setEditingWorkoutId(workout.id);
    setTab("plan");
  };

  const deleteWorkout = (id: string) => {
    setWorkouts(prev => {
      const next = prev.filter(w => w.id !== id);
      if (activeWorkoutId === id && next[0]) setActiveWorkoutId(next[0].id);
      return next.length ? next : DEFAULT_WORKOUTS;
    });
  };

  const addExercise = (workoutId: string) => {
    const exercise: Exercise = {
      id: uid(),
      name: "New Exercise",
      sets: 3,
      repMin: 8,
      repMax: 10,
      weight: 0,
      rpe: 8,
      notes: "",
    };
    setWorkouts(prev => prev.map(w => w.id === workoutId ? { ...w, exercises: [...w.exercises, exercise] } : w));
    setEditingExerciseId(exercise.id);
  };

  const updateExercise = (workoutId: string, exerciseId: string, patch: Partial<Exercise>) => {
    setWorkouts(prev => prev.map(w =>
      w.id === workoutId
        ? { ...w, exercises: w.exercises.map(ex => ex.id === exerciseId ? { ...ex, ...patch } : ex) }
        : w
    ));
  };

  const deleteExercise = (workoutId: string, exerciseId: string) => {
    setWorkouts(prev => prev.map(w =>
      w.id === workoutId
        ? { ...w, exercises: w.exercises.filter(ex => ex.id !== exerciseId) }
        : w
    ));
  };

  return (
    <main className="app-canvas">
      <section className="phone">
        <div className="textile-layer linen" />
        <div className="textile-layer contour" />
        <div className="textile-layer travertine" />

        <header className="topbar">
          <div>
            <span className="eyebrow">Good morning,</span>
            <h1>Hayley</h1>
          </div>
          <button className="round-btn">◌</button>
        </header>

        {tab === "today" && activeWorkout && (
          <section className="content">
            <article className={`season-card ${seasonData.className}`}>
              <div className="material-highlight" />
              <span className="eyebrow light">Current season</span>
              <h2>{season}</h2>
              <p>{seasonData.line}</p>
              <small>{seasonData.focus}</small>
            </article>

            <div className="season-tabs">
              {(["Foundation", "Build", "Peak", "Align"] as Season[]).map(s => (
                <button key={s} className={season === s ? "active" : ""} onClick={() => setSeason(s)}>{s}</button>
              ))}
            </div>

            <div className="section-title">
              <div><span className="eyebrow">Today</span><h3>{activeWorkout.title}</h3></div>
              <span>{activeWorkout.duration} min</span>
            </div>

            <article className="stone-card">
              <div className="card-header">
                <div>
                  <span className="eyebrow">{activeWorkout.day}</span>
                  <h3>{activeWorkout.title}</h3>
                </div>
                <button onClick={() => { setEditingWorkoutId(activeWorkout.id); setTab("plan"); }}>Edit</button>
              </div>

              <div className="exercise-stack">
                {activeWorkout.exercises.map((ex, index) => (
                  <div className="exercise-row" key={ex.id}>
                    <span className="number">{index + 1}</span>
                    <div>
                      <strong>{ex.name}</strong>
                      <small>{ex.sets} sets · {ex.repMin}–{ex.repMax} reps · {ex.weight} kg · RPE {ex.rpe}</small>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <section className="metric-grid">
              <Metric label="Weekly sets" value={String(weeklySets)} note="Across all sessions" />
              <Metric label="Recovery" value="82%" note="Well recovered" />
              <Metric label="Sleep" value="7h 48m" note="Consistent" />
            </section>
          </section>
        )}

        {tab === "plan" && (
          <section className="content page-section">
            <div className="page-heading">
              <div><span className="eyebrow">Planner</span><h2>Your week</h2></div>
              <button className="primary-btn" onClick={addWorkout}>+ Workout</button>
            </div>

            <div className="workout-list">
              {workouts.map(workout => {
                const isEditing = editingWorkoutId === workout.id;
                return (
                  <article className="stone-card workout-editor" key={workout.id}>
                    <div className="card-header">
                      <div className="workout-title-block">
                        {isEditing ? (
                          <>
                            <input value={workout.day} onChange={e => updateWorkout(workout.id, { day: e.target.value })} />
                            <input value={workout.title} onChange={e => updateWorkout(workout.id, { title: e.target.value })} />
                          </>
                        ) : (
                          <>
                            <span className="eyebrow">{workout.day}</span>
                            <h3>{workout.title}</h3>
                          </>
                        )}
                      </div>
                      <div className="editor-actions">
                        <button onClick={() => { setActiveWorkoutId(workout.id); setTab("today"); }}>Open</button>
                        <button onClick={() => setEditingWorkoutId(isEditing ? null : workout.id)}>{isEditing ? "Done" : "Edit"}</button>
                        <button className="danger" onClick={() => deleteWorkout(workout.id)}>Delete</button>
                      </div>
                    </div>

                    {isEditing && (
                      <label className="field">
                        <span>Duration</span>
                        <input type="number" value={workout.duration} onChange={e => updateWorkout(workout.id, { duration: Number(e.target.value) })} />
                      </label>
                    )}

                    <div className="exercise-editor-list">
                      {workout.exercises.map(ex => {
                        const editEx = editingExerciseId === ex.id;
                        return (
                          <div className="exercise-editor" key={ex.id}>
                            {editEx ? (
                              <>
                                <input className="full" value={ex.name} onChange={e => updateExercise(workout.id, ex.id, { name: e.target.value })} />
                                <div className="field-grid">
                                  <Field label="Sets" value={ex.sets} onChange={v => updateExercise(workout.id, ex.id, { sets: v })} />
                                  <Field label="Rep min" value={ex.repMin} onChange={v => updateExercise(workout.id, ex.id, { repMin: v })} />
                                  <Field label="Rep max" value={ex.repMax} onChange={v => updateExercise(workout.id, ex.id, { repMax: v })} />
                                  <Field label="Weight" value={ex.weight} onChange={v => updateExercise(workout.id, ex.id, { weight: v })} step="0.5" />
                                  <Field label="RPE" value={ex.rpe} onChange={v => updateExercise(workout.id, ex.id, { rpe: v })} />
                                </div>
                                <textarea placeholder="Notes" value={ex.notes} onChange={e => updateExercise(workout.id, ex.id, { notes: e.target.value })} />
                                <div className="editor-actions">
                                  <button onClick={() => setEditingExerciseId(null)}>Done</button>
                                  <button className="danger" onClick={() => deleteExercise(workout.id, ex.id)}>Delete</button>
                                </div>
                              </>
                            ) : (
                              <>
                                <div>
                                  <strong>{ex.name}</strong>
                                  <small>{ex.sets} × {ex.repMin}–{ex.repMax} · {ex.weight} kg · RPE {ex.rpe}</small>
                                </div>
                                <button onClick={() => setEditingExerciseId(ex.id)}>Edit</button>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <button className="secondary-btn" onClick={() => addExercise(workout.id)}>+ Add exercise</button>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {tab === "progress" && (
          <section className="content page-section">
            <span className="eyebrow">Progress</span>
            <h2>Strength over time</h2>
            <article className="ocean-card">
              <span>Bench Press estimated 1RM</span>
              <strong>94.6 kg</strong>
              <small>+7.5 kg this cycle</small>
              <div className="bars">
                {[22,28,35,41,49,55,62,69,77,86,94].map((h, i) => <i key={i} style={{height: `${h}%`}} />)}
              </div>
            </article>
          </section>
        )}

        {tab === "recovery" && (
          <section className="content page-section">
            <span className="eyebrow">Recovery</span>
            <h2>Ready to train</h2>
            <article className="ocean-card recovery-card">
              <div className="wave wave-a" />
              <div className="wave wave-b" />
              <strong>82%</strong>
              <small>Well recovered</small>
            </article>
            <section className="metric-grid">
              <Metric label="Stress" value="Low" note="Good" />
              <Metric label="Readiness" value="High" note="Train as planned" />
              <Metric label="Soreness" value="Mild" note="Normal" />
            </section>
          </section>
        )}

        <nav className="bottom-nav">
          {(["today","plan","progress","recovery"] as Tab[]).map(item => (
            <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>
              {item === "today" ? "Today" : item[0].toUpperCase() + item.slice(1)}
            </button>
          ))}
        </nav>
      </section>
    </main>
  );
}

function Field({ label, value, onChange, step = "1" }: { label: string; value: number; onChange: (value: number) => void; step?: string }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type="number" step={step} value={value} onChange={e => onChange(Number(e.target.value))} />
    </label>
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
