"use client";

import { useEffect, useMemo, useState } from "react";
import { DEFAULT_WORKOUTS } from "@/lib/defaults";
import type {
  Exercise,
  ExerciseResult,
  Season,
  SetResult,
  Workout,
  WorkoutSession,
} from "@/lib/types";

type Tab = "today" | "training" | "progress" | "recovery";
type SessionDraft = {
  workoutId: string;
  exerciseIndex: number;
  results: ExerciseResult[];
};

const STORAGE = {
  workouts: "forma-workouts-v11",
  history: "forma-history-v11",
  season: "forma-season-v11",
};

const seasonCopy: Record<Season, { line: string; focus: string; className: string }> = {
  Foundation: { line: "Build the base.", focus: "Movement · Capacity · Consistency", className: "foundation" },
  Build: { line: "Stronger every session.", focus: "Strength · Hypertrophy · Progression", className: "build" },
  Peak: { line: "Express your strength.", focus: "Performance · Power · Precision", className: "peak" },
  Align: { line: "Recover to grow.", focus: "Recovery · Mobility · Readiness", className: "align" },
};

const uid = () => Math.random().toString(36).slice(2, 10);

function normalizeExercise(exercise: Exercise): Exercise {
  return {
    ...exercise,
    increment: exercise.increment ?? 2.5,
    restSeconds: exercise.restSeconds ?? 90,
  };
}

function normalizeWorkouts(workouts: Workout[]): Workout[] {
  return workouts.map((workout) => ({
    ...workout,
    exercises: workout.exercises.map(normalizeExercise),
  }));
}

function createResults(workout: Workout): ExerciseResult[] {
  return workout.exercises.map((exercise) => ({
    exerciseId: exercise.id,
    name: exercise.name,
    repMin: exercise.repMin,
    repMax: exercise.repMax,
    increment: exercise.increment,
    sets: Array.from({ length: exercise.sets }, () => ({
      reps: exercise.repMin,
      weight: exercise.weight,
      rpe: exercise.rpe,
      complete: false,
    })),
  }));
}

function getRecommendation(exercise: Exercise, history: WorkoutSession[]) {
  const previous = history
    .flatMap((session) => session.exercises)
    .filter((result) => result.exerciseId === exercise.id || result.name === exercise.name)
    .at(-1);

  if (!previous) {
    return {
      title: "Establish your baseline",
      detail: `${exercise.weight} kg for ${exercise.repMin}–${exercise.repMax} reps at about RPE ${exercise.rpe}.`,
      targetWeight: exercise.weight,
    };
  }

  const completed = previous.sets.filter((set) => set.complete);
  if (!completed.length) {
    return {
      title: "Repeat the planned target",
      detail: "The previous session was not completed.",
      targetWeight: exercise.weight,
    };
  }

  const allTopRange = completed.every((set) => set.reps >= exercise.repMax);
  const averageRpe = completed.reduce((sum, set) => sum + set.rpe, 0) / completed.length;
  const previousWeight = completed[0]?.weight ?? exercise.weight;

  if (allTopRange && averageRpe <= 8.5) {
    const next = previousWeight + exercise.increment;
    return {
      title: `Increase to ${next} kg`,
      detail: `You reached the top of the rep range with manageable effort.`,
      targetWeight: next,
    };
  }

  if (averageRpe >= 9.5) {
    const next = Math.max(0, previousWeight - exercise.increment);
    return {
      title: `Reduce to ${next} kg`,
      detail: "Effort was very high. Reduce the load and rebuild clean reps.",
      targetWeight: next,
    };
  }

  return {
    title: `Stay at ${previousWeight} kg`,
    detail: `Add reps until every completed set reaches ${exercise.repMax}.`,
    targetWeight: previousWeight,
  };
}

export default function FormaApp() {
  const [tab, setTab] = useState<Tab>("today");
  const [season, setSeason] = useState<Season>("Build");
  const [workouts, setWorkouts] = useState<Workout[]>(DEFAULT_WORKOUTS);
  const [history, setHistory] = useState<WorkoutSession[]>([]);
  const [activeWorkoutId, setActiveWorkoutId] = useState(DEFAULT_WORKOUTS[0].id);
  const [editingWorkoutId, setEditingWorkoutId] = useState<string | null>(null);
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);
  const [session, setSession] = useState<SessionDraft | null>(null);
  const [restRemaining, setRestRemaining] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const savedWorkouts = window.localStorage.getItem(STORAGE.workouts);
      const savedHistory = window.localStorage.getItem(STORAGE.history);
      const savedSeason = window.localStorage.getItem(STORAGE.season) as Season | null;

      if (savedWorkouts) {
        const parsed = normalizeWorkouts(JSON.parse(savedWorkouts) as Workout[]);
        if (parsed.length) {
          setWorkouts(parsed);
          setActiveWorkoutId(parsed[0].id);
        }
      }
      if (savedHistory) setHistory(JSON.parse(savedHistory) as WorkoutSession[]);
      if (savedSeason && seasonCopy[savedSeason]) setSeason(savedSeason);
    } catch {
      // Keep safe defaults when older browser data cannot be read.
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE.workouts, JSON.stringify(workouts));
    window.localStorage.setItem(STORAGE.history, JSON.stringify(history));
    window.localStorage.setItem(STORAGE.season, season);
  }, [workouts, history, season, hydrated]);

  useEffect(() => {
    if (restRemaining <= 0) return;
    const timer = window.setInterval(() => {
      setRestRemaining((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [restRemaining]);

  const activeWorkout = workouts.find((workout) => workout.id === activeWorkoutId) ?? workouts[0];
  const seasonData = seasonCopy[season];
  const weeklySets = useMemo(
    () => workouts.reduce((total, workout) => total + workout.exercises.reduce((sum, exercise) => sum + exercise.sets, 0), 0),
    [workouts],
  );

  const startWorkout = (workout: Workout) => {
    const recommendations = workout.exercises.map((exercise) => getRecommendation(exercise, history));
    const results = createResults(workout).map((result, index) => ({
      ...result,
      sets: result.sets.map((set) => ({ ...set, weight: recommendations[index].targetWeight })),
    }));
    setActiveWorkoutId(workout.id);
    setSession({ workoutId: workout.id, exerciseIndex: 0, results });
    setTab("today");
    setRestRemaining(0);
  };

  const finishWorkout = () => {
    if (!session || !activeWorkout) return;
    const completed: WorkoutSession = {
      id: uid(),
      workoutId: activeWorkout.id,
      workoutTitle: activeWorkout.title,
      completedAt: new Date().toISOString(),
      season,
      exercises: session.results,
    };
    setHistory((current) => [...current, completed]);
    setSession(null);
    setRestRemaining(0);
    setTab("progress");
  };

  const updateWorkout = (id: string, patch: Partial<Workout>) => {
    setWorkouts((current) => current.map((workout) => workout.id === id ? { ...workout, ...patch } : workout));
  };

  const addWorkout = () => {
    const workout: Workout = {
      id: uid(),
      day: "Saturday",
      title: "New Workout",
      duration: 45,
      exercises: [],
    };
    setWorkouts((current) => [...current, workout]);
    setActiveWorkoutId(workout.id);
    setEditingWorkoutId(workout.id);
    setTab("training");
  };

  const duplicateWorkout = (workout: Workout) => {
    const copy: Workout = {
      ...workout,
      id: uid(),
      title: `${workout.title} Copy`,
      exercises: workout.exercises.map((exercise) => ({ ...exercise, id: uid() })),
    };
    setWorkouts((current) => [...current, copy]);
  };

  const deleteWorkout = (id: string) => {
    setWorkouts((current) => {
      const next = current.filter((workout) => workout.id !== id);
      if (activeWorkoutId === id && next[0]) setActiveWorkoutId(next[0].id);
      return next.length ? next : DEFAULT_WORKOUTS;
    });
  };

  const moveWorkout = (id: string, direction: -1 | 1) => {
    setWorkouts((current) => {
      const index = current.findIndex((workout) => workout.id === id);
      const destination = index + direction;
      if (index < 0 || destination < 0 || destination >= current.length) return current;
      const next = [...current];
      [next[index], next[destination]] = [next[destination], next[index]];
      return next;
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
      increment: 2.5,
      restSeconds: 90,
    };
    setWorkouts((current) => current.map((workout) =>
      workout.id === workoutId ? { ...workout, exercises: [...workout.exercises, exercise] } : workout
    ));
    setEditingExerciseId(exercise.id);
  };

  const updateExercise = (workoutId: string, exerciseId: string, patch: Partial<Exercise>) => {
    setWorkouts((current) => current.map((workout) =>
      workout.id === workoutId
        ? { ...workout, exercises: workout.exercises.map((exercise) => exercise.id === exerciseId ? { ...exercise, ...patch } : exercise) }
        : workout
    ));
  };

  const deleteExercise = (workoutId: string, exerciseId: string) => {
    setWorkouts((current) => current.map((workout) =>
      workout.id === workoutId
        ? { ...workout, exercises: workout.exercises.filter((exercise) => exercise.id !== exerciseId) }
        : workout
    ));
  };

  const moveExercise = (workoutId: string, exerciseId: string, direction: -1 | 1) => {
    setWorkouts((current) => current.map((workout) => {
      if (workout.id !== workoutId) return workout;
      const index = workout.exercises.findIndex((exercise) => exercise.id === exerciseId);
      const destination = index + direction;
      if (index < 0 || destination < 0 || destination >= workout.exercises.length) return workout;
      const exercises = [...workout.exercises];
      [exercises[index], exercises[destination]] = [exercises[destination], exercises[index]];
      return { ...workout, exercises };
    }));
  };

  const updateSet = (exerciseIndex: number, setIndex: number, patch: Partial<SetResult>) => {
    setSession((current) => {
      if (!current) return current;
      return {
        ...current,
        results: current.results.map((exercise, exIndex) =>
          exIndex === exerciseIndex
            ? { ...exercise, sets: exercise.sets.map((set, sIndex) => sIndex === setIndex ? { ...set, ...patch } : set) }
            : exercise
        ),
      };
    });
  };

  if (!hydrated) {
    return <main className="app-canvas"><section className="phone loading">Preparing FORMA…</section></main>;
  }

  if (session && activeWorkout) {
    const exercise = activeWorkout.exercises[session.exerciseIndex];
    const result = session.results[session.exerciseIndex];
    const recommendation = getRecommendation(exercise, history);
    const allComplete = session.results.every((item) => item.sets.every((set) => set.complete));
    const minutes = Math.floor(restRemaining / 60);
    const seconds = String(restRemaining % 60).padStart(2, "0");

    return (
      <main className="app-canvas">
        <section className="phone">
          <div className="textile-layer linen" />
          <div className="textile-layer contour" />
          <div className="textile-layer travertine" />

          <header className="session-header">
            <button onClick={() => setSession(null)}>‹ Exit</button>
            <div>
              <span className="eyebrow">{activeWorkout.title}</span>
              <strong>{session.exerciseIndex + 1} / {activeWorkout.exercises.length}</strong>
            </div>
            <button onClick={finishWorkout} disabled={!allComplete}>Finish</button>
          </header>

          <section className="session-hero">
            <span className="eyebrow light">{season} · Primary target</span>
            <h1>{exercise.name}</h1>
            <p>{recommendation.title}</p>
            <small>{recommendation.detail}</small>
          </section>

          <section className="stone-card session-card">
            <div className="session-meta">
              <span>{exercise.sets} sets</span>
              <span>{exercise.repMin}–{exercise.repMax} reps</span>
              <span>RPE {exercise.rpe}</span>
            </div>

            <div className="set-list">
              {result.sets.map((set, setIndex) => (
                <article className={`set-row ${set.complete ? "complete" : ""}`} key={setIndex}>
                  <strong>Set {setIndex + 1}</strong>
                  <label>
                    <span>kg</span>
                    <input type="number" step="0.5" value={set.weight} onChange={(event) => updateSet(session.exerciseIndex, setIndex, { weight: Number(event.target.value) })} />
                  </label>
                  <label>
                    <span>reps</span>
                    <input type="number" value={set.reps} onChange={(event) => updateSet(session.exerciseIndex, setIndex, { reps: Number(event.target.value) })} />
                  </label>
                  <label>
                    <span>RPE</span>
                    <input type="number" min="1" max="10" step="0.5" value={set.rpe} onChange={(event) => updateSet(session.exerciseIndex, setIndex, { rpe: Number(event.target.value) })} />
                  </label>
                  <button
                    className="set-complete"
                    onClick={() => {
                      const nextComplete = !set.complete;
                      updateSet(session.exerciseIndex, setIndex, { complete: nextComplete });
                      if (nextComplete) setRestRemaining(exercise.restSeconds);
                    }}
                  >
                    {set.complete ? "✓" : "Done"}
                  </button>
                </article>
              ))}
            </div>

            {exercise.notes && <p className="exercise-note">{exercise.notes}</p>}
          </section>

          <section className="rest-card">
            <div>
              <span className="eyebrow">Rest timer</span>
              <strong>{minutes}:{seconds}</strong>
            </div>
            <button onClick={() => setRestRemaining(exercise.restSeconds)}>Restart</button>
            <button onClick={() => setRestRemaining(0)}>Skip</button>
          </section>

          <div className="session-nav">
            <button disabled={session.exerciseIndex === 0} onClick={() => setSession({ ...session, exerciseIndex: session.exerciseIndex - 1 })}>Previous</button>
            <button
              disabled={session.exerciseIndex === activeWorkout.exercises.length - 1}
              onClick={() => setSession({ ...session, exerciseIndex: session.exerciseIndex + 1 })}
            >
              Next exercise
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="app-canvas">
      <section className="phone">
        <div className="textile-layer linen" />
        <div className="textile-layer contour" />
        <div className="textile-layer travertine" />

        <header className="topbar">
          <div>
            <span className="eyebrow">Your practice,</span>
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
              {(["Foundation", "Build", "Peak", "Align"] as Season[]).map((item) => (
                <button key={item} className={season === item ? "active" : ""} onClick={() => setSeason(item)}>{item}</button>
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
                <button onClick={() => { setEditingWorkoutId(activeWorkout.id); setTab("training"); }}>Edit</button>
              </div>

              <div className="exercise-stack">
                {activeWorkout.exercises.map((exercise, index) => {
                  const recommendation = getRecommendation(exercise, history);
                  return (
                    <div className="exercise-row recommendation-row" key={exercise.id}>
                      <span className="number">{index + 1}</span>
                      <div>
                        <strong>{exercise.name}</strong>
                        <small>{exercise.sets} sets · {exercise.repMin}–{exercise.repMax} reps · RPE {exercise.rpe}</small>
                        <em>{recommendation.title}</em>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button className="start-button" disabled={!activeWorkout.exercises.length} onClick={() => startWorkout(activeWorkout)}>
                Start workout
              </button>
            </article>

            <section className="metric-grid">
              <Metric label="Weekly sets" value={String(weeklySets)} note="Across all sessions" />
              <Metric label="Sessions" value={String(history.length)} note="Saved locally" />
              <Metric label="Recovery" value="82%" note="Nervous system settled" />
            </section>
          </section>
        )}

        {tab === "training" && (
          <section className="content page-section">
            <div className="page-heading">
              <div><span className="eyebrow">Training</span><h2>Your week</h2></div>
              <button className="primary-btn" onClick={addWorkout}>+ Workout</button>
            </div>

            <div className="workout-list">
              {workouts.map((workout) => {
                const isEditing = editingWorkoutId === workout.id;
                return (
                  <article className="stone-card workout-editor" key={workout.id}>
                    <div className="card-header">
                      <div className="workout-title-block">
                        {isEditing ? (
                          <>
                            <input value={workout.day} onChange={(event) => updateWorkout(workout.id, { day: event.target.value })} />
                            <input value={workout.title} onChange={(event) => updateWorkout(workout.id, { title: event.target.value })} />
                          </>
                        ) : (
                          <>
                            <span className="eyebrow">{workout.day}</span>
                            <h3>{workout.title}</h3>
                          </>
                        )}
                      </div>
                      <div className="editor-actions compact">
                        <button onClick={() => moveWorkout(workout.id, -1)}>↑</button>
                        <button onClick={() => moveWorkout(workout.id, 1)}>↓</button>
                        <button onClick={() => startWorkout(workout)}>Start</button>
                      </div>
                    </div>

                    <div className="editor-actions toolbar">
                      <button onClick={() => setEditingWorkoutId(isEditing ? null : workout.id)}>{isEditing ? "Done editing" : "Edit workout"}</button>
                      <button onClick={() => duplicateWorkout(workout)}>Duplicate</button>
                      <button className="danger" onClick={() => deleteWorkout(workout.id)}>Delete</button>
                    </div>

                    {isEditing && (
                      <label className="field">
                        <span>Duration</span>
                        <input type="number" value={workout.duration} onChange={(event) => updateWorkout(workout.id, { duration: Number(event.target.value) })} />
                      </label>
                    )}

                    <div className="exercise-editor-list">
                      {workout.exercises.map((exercise) => {
                        const isExerciseEditing = editingExerciseId === exercise.id;
                        return (
                          <div className="exercise-editor" key={exercise.id}>
                            {isExerciseEditing ? (
                              <>
                                <input className="full" value={exercise.name} onChange={(event) => updateExercise(workout.id, exercise.id, { name: event.target.value })} />
                                <div className="field-grid">
                                  <Field label="Sets" value={exercise.sets} onChange={(value) => updateExercise(workout.id, exercise.id, { sets: value })} />
                                  <Field label="Rep min" value={exercise.repMin} onChange={(value) => updateExercise(workout.id, exercise.id, { repMin: value })} />
                                  <Field label="Rep max" value={exercise.repMax} onChange={(value) => updateExercise(workout.id, exercise.id, { repMax: value })} />
                                  <Field label="Weight" value={exercise.weight} onChange={(value) => updateExercise(workout.id, exercise.id, { weight: value })} step="0.5" />
                                  <Field label="RPE" value={exercise.rpe} onChange={(value) => updateExercise(workout.id, exercise.id, { rpe: value })} step="0.5" />
                                  <Field label="Load increase" value={exercise.increment} onChange={(value) => updateExercise(workout.id, exercise.id, { increment: value })} step="0.5" />
                                  <Field label="Rest seconds" value={exercise.restSeconds} onChange={(value) => updateExercise(workout.id, exercise.id, { restSeconds: value })} />
                                </div>
                                <textarea placeholder="Exercise notes" value={exercise.notes} onChange={(event) => updateExercise(workout.id, exercise.id, { notes: event.target.value })} />
                                <div className="editor-actions">
                                  <button onClick={() => setEditingExerciseId(null)}>Done</button>
                                  <button className="danger" onClick={() => deleteExercise(workout.id, exercise.id)}>Delete</button>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="exercise-summary">
                                  <div className="reorder-buttons">
                                    <button onClick={() => moveExercise(workout.id, exercise.id, -1)}>↑</button>
                                    <button onClick={() => moveExercise(workout.id, exercise.id, 1)}>↓</button>
                                  </div>
                                  <div>
                                    <strong>{exercise.name}</strong>
                                    <small>{exercise.sets} × {exercise.repMin}–{exercise.repMax} · {exercise.weight} kg · RPE {exercise.rpe}</small>
                                  </div>
                                </div>
                                <button onClick={() => setEditingExerciseId(exercise.id)}>Edit</button>
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
            <h2>Your training history</h2>

            <article className="material-card progress-summary">
              <div>
                <span className="eyebrow">Completed sessions</span>
                <strong>{history.length}</strong>
              </div>
              <div>
                <span className="eyebrow">Completed sets</span>
                <strong>{history.reduce((total, item) => total + item.exercises.reduce((sum, exercise) => sum + exercise.sets.filter((set) => set.complete).length, 0), 0)}</strong>
              </div>
            </article>

            <div className="history-list">
              {[...history].reverse().map((item) => (
                <article className="stone-card history-card" key={item.id}>
                  <div className="card-header">
                    <div>
                      <span className="eyebrow">{new Date(item.completedAt).toLocaleDateString()}</span>
                      <h3>{item.workoutTitle}</h3>
                    </div>
                    <span className="season-pill">{item.season}</span>
                  </div>
                  {item.exercises.map((exercise) => {
                    const completed = exercise.sets.filter((set) => set.complete);
                    return (
                      <p key={exercise.exerciseId}>
                        <strong>{exercise.name}</strong>
                        <span>{completed.map((set) => `${set.weight}kg × ${set.reps}`).join(" · ") || "Not completed"}</span>
                      </p>
                    );
                  })}
                </article>
              ))}
              {!history.length && <article className="stone-card empty-state">Complete your first workout to build your progress history.</article>}
            </div>
          </section>
        )}

        {tab === "recovery" && (
          <section className="content page-section">
            <span className="eyebrow">Recovery</span>
            <h2>Return to balance</h2>
            <article className="material-card recovery-card">
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
          {(["today", "training", "progress", "recovery"] as Tab[]).map((item) => (
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
      <input type="number" step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
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
