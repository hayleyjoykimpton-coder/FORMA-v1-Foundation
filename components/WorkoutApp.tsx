"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_STATE } from "@/lib/defaults";
import type {
  ActiveWorkout,
  AppState,
  Exercise,
  ProgressionMode,
  SetLog,
  Workout,
  WorkoutHistory,
} from "@/lib/types";

const STORAGE_KEY = "forma-next-workout-v1";
const DAYS = ["Unscheduled","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2,8)}`;
const deepCopy = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

type ProgressionAdvice = {
  targetWeight: string;
  headline: string;
  detail: string;
  status: "baseline" | "progress" | "hold" | "recover" | "manual";
  previousSets: string;
};

const parseRepRange = (range: string) => {
  const numbers = range.match(/\d+/g)?.map(Number) ?? [];
  if (!numbers.length) return null;
  const min = numbers[0];
  const max = numbers.length > 1 ? numbers[1] : numbers[0];
  return { min: Math.min(min, max), max: Math.max(min, max) };
};

const roundToIncrement = (value: number, increment: number) =>
  increment > 0 ? Math.round(value / increment) * increment : value;

function progressionAdvice(
  workoutId: string,
  exercise: Exercise,
  history: WorkoutHistory[]
): ProgressionAdvice {
  const mode: ProgressionMode = exercise.progressionMode ?? "hypertrophy";
  const range = parseRepRange(exercise.repRange);
  const previous = history
    .find(entry => entry.workoutId === workoutId)
    ?.exercises.find(item => item.id === exercise.id);

  const completed = previous?.sets.filter(set => set.done) ?? [];
  const previousSets = completed.length
    ? completed.map(set => `${set.weight || "BW"} × ${set.reps || "—"}`).join(" · ")
    : "No completed sets yet";

  if (mode === "manual" || !range) {
    return {
      targetWeight: exercise.previousWeight,
      headline: "Follow today’s class prescription",
      detail: "FORMA will record this session but will not override programmed class targets.",
      status: "manual",
      previousSets,
    };
  }

  if (!completed.length) {
    return {
      targetWeight: exercise.previousWeight,
      headline: exercise.previousWeight ? `Start at ${exercise.previousWeight} kg` : "Set your baseline today",
      detail: `Stay inside ${exercise.repRange} with about ${exercise.targetRpe || "8"} RPE. FORMA will calculate next session from these results.`,
      status: "baseline",
      previousSets,
    };
  }

  const reps = completed.map(set => Number(set.reps)).filter(Number.isFinite);
  const rpes = completed.map(set => Number(set.rpe)).filter(Number.isFinite);
  const weights = completed.map(set => Number(set.weight)).filter(value => Number.isFinite(value) && value > 0);
  const workingWeight = weights.at(-1) ?? (Number(exercise.previousWeight) || 0);
  const allAtTop = reps.length === completed.length && reps.every(rep => rep >= range.max);
  const belowBottom = reps.filter(rep => rep < range.min).length;
  const averageRpe = rpes.length ? rpes.reduce((sum, value) => sum + value, 0) / rpes.length : 8;
  const increment = exercise.loadIncrement ?? (mode === "conditioning" ? 1 : 2.5);

  if (mode === "bodyweight") {
    if (allAtTop && averageRpe <= 9) {
      return {
        targetWeight: "",
        headline: "Progress the bodyweight variation",
        detail: "You reached the top of the rep range. Add a small external load or choose a slightly harder variation.",
        status: "progress",
        previousSets,
      };
    }
    return {
      targetWeight: "",
      headline: `Beat last session by 1–2 total reps`,
      detail: `Keep the same variation until every working set reaches ${range.max} controlled reps.`,
      status: "hold",
      previousSets,
    };
  }

  if (mode === "assisted") {
    if (allAtTop && averageRpe <= 9 && workingWeight > 0) {
      const target = Math.max(0, roundToIncrement(workingWeight - increment, increment));
      return {
        targetWeight: String(target),
        headline: `Reduce assistance to ${target} kg`,
        detail: `You reached the top of the range on every set, so use ${increment} kg less assistance.`,
        status: "progress",
        previousSets,
      };
    }
  }

  if (belowBottom >= Math.ceil(completed.length / 2) || averageRpe >= 9.5) {
    return {
      targetWeight: workingWeight ? String(workingWeight) : exercise.previousWeight,
      headline: "Hold the load and rebuild reps",
      detail: `Keep this load until most sets reach at least ${range.min} reps with cleaner effort. Do not force an increase this week.`,
      status: "recover",
      previousSets,
    };
  }

  if (allAtTop && averageRpe <= 9 && workingWeight > 0) {
    const target = roundToIncrement(workingWeight + increment, increment);
    return {
      targetWeight: String(target),
      headline: `Increase to ${target} kg`,
      detail: `You reached ${range.max} reps on every completed set. Increase by ${increment} kg and restart near the bottom of the range.`,
      status: "progress",
      previousSets,
    };
  }

  return {
    targetWeight: workingWeight ? String(workingWeight) : exercise.previousWeight,
    headline: "Keep the load and add reps",
    detail: `Use the same load and aim to beat last session’s total reps while staying inside ${exercise.repRange}.`,
    status: "hold",
    previousSets,
  };
}

function migrateState(raw: unknown): AppState {
  const fallback = deepCopy(DEFAULT_STATE);
  if (!raw || typeof raw !== "object") return fallback;
  const value = raw as Partial<AppState>;
  return {
    workouts: (Array.isArray(value.workouts) ? value.workouts : fallback.workouts).map(workout => ({
      ...workout,
      exercises: workout.exercises.map(exercise => ({
        progressionMode: "hypertrophy" as ProgressionMode,
        loadIncrement: 2.5,
        ...exercise,
      })),
    })),
    activeWorkout: value.activeWorkout ?? null,
    history: Array.isArray(value.history) ? value.history : [],
  };
}

export default function WorkoutApp() {
  const [state, setState] = useState<AppState>(deepCopy(DEFAULT_STATE));
  const [hydrated, setHydrated] = useState(false);
  const [tab, setTab] = useState<"today"|"library"|"history">("today");
  const [restSeconds, setRestSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      setState(saved ? migrateState(JSON.parse(saved)) : deepCopy(DEFAULT_STATE));
    } catch {
      setState(deepCopy(DEFAULT_STATE));
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const todayName = new Intl.DateTimeFormat("en-AU", { weekday: "long" }).format(new Date());
  const todayWorkout = state.workouts.find(w => w.day === todayName);
  const active = state.activeWorkout;

  const completion = useMemo(() => {
    if (!active) return {done:0,total:0,pct:0};
    const sets = active.exercises.flatMap(e => e.sets);
    const done = sets.filter(s => s.done).length;
    return {done,total:sets.length,pct:sets.length ? Math.round(done/sets.length*100) : 0};
  }, [active]);

  const update = (fn: (draft: AppState) => void) => {
    setState(previous => {
      const draft = deepCopy(previous);
      fn(draft);
      return draft;
    });
  };

  const startWorkout = (workout: Workout) => {
    const started: ActiveWorkout = {
      workoutId: workout.id,
      name: workout.name,
      startedAt: new Date().toISOString(),
      notes: "",
      exercises: workout.exercises.map(exercise => {
        const advice = progressionAdvice(workout.id, exercise, state.history);
        return {
          ...exercise,
          sets: Array.from({length: exercise.targetSets}, () => ({
            id: uid(),
            weight: advice.targetWeight,
            reps: "",
            rpe: exercise.targetRpe,
            done: false,
          })),
        };
      }),
    };
    update(d => { d.activeWorkout = started; });
    setTab("today");
  };

  const changeSet = (
    exerciseId: string,
    setId: string,
    field: keyof SetLog,
    value: string | boolean
  ) => {
    update(d => {
      const exercise = d.activeWorkout?.exercises.find(e => e.id === exerciseId);
      const set = exercise?.sets.find(s => s.id === setId);
      if (!set) return;

      switch (field) {
        case "weight":
          set.weight = String(value);
          break;
        case "reps":
          set.reps = String(value);
          break;
        case "rpe":
          set.rpe = String(value);
          break;
        case "done":
          set.done = Boolean(value);
          break;
        case "id":
          set.id = String(value);
          break;
      }
    });
  };

  const addSet = (exerciseId: string) => update(d => {
    const exercise = d.activeWorkout?.exercises.find(e => e.id === exerciseId);
    if (exercise) exercise.sets.push({
      id: uid(),
      weight: exercise.sets.at(-1)?.weight || exercise.previousWeight,
      reps: "",
      rpe: exercise.targetRpe,
      done: false,
    });
  });

  const removeSet = (exerciseId: string, setId: string) => update(d => {
    const exercise = d.activeWorkout?.exercises.find(e => e.id === exerciseId);
    if (exercise) exercise.sets = exercise.sets.filter(s => s.id !== setId);
  });

  const startTimer = (seconds: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setRestSeconds(seconds);
    timerRef.current = setInterval(() => {
      setRestSeconds(current => {
        if (current <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = null;
          if (navigator.vibrate) navigator.vibrate([120,80,120]);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
  };

  const finishWorkout = () => {
    if (!active) return;
    const started = new Date(active.startedAt).getTime();
    const durationMinutes = Math.max(1, Math.round((Date.now()-started)/60000));
    update(d => {
      const current = d.activeWorkout;
      if (!current) return;
      const sets = current.exercises.flatMap(e => e.sets);
      d.history.unshift({
        id: uid(),
        workoutId: current.workoutId,
        name: current.name,
        date: new Date().toISOString(),
        durationMinutes,
        completedSets: sets.filter(s => s.done).length,
        totalSets: sets.length,
        notes: current.notes,
        exercises: current.exercises,
      });
      const template = d.workouts.find(w => w.id === current.workoutId);
      if (template) {
        current.exercises.forEach(logged => {
          const original = template.exercises.find(e => e.id === logged.id);
          const last = [...logged.sets].reverse().find(s => s.done && s.weight);
          if (original && last) original.previousWeight = last.weight;
        });
      }
      d.activeWorkout = null;
    });
  };

  const addWorkout = () => update(d => d.workouts.push({
    id: uid(), name:"New Workout", day:"Unscheduled", duration:50, focus:"", exercises:[]
  }));

  const patchWorkout = (id: string, patch: Partial<Workout>) => update(d => {
    const workout = d.workouts.find(w => w.id === id);
    if (workout) Object.assign(workout, patch);
  });

  const deleteWorkout = (id: string) => {
    if (confirm("Remove this workout?")) update(d => { d.workouts = d.workouts.filter(w => w.id !== id); });
  };

  const addExercise = (workoutId: string) => update(d => {
    d.workouts.find(w => w.id === workoutId)?.exercises.push({
      id:uid(), name:"New Exercise", targetSets:3, repRange:"8–12", targetRpe:"8", notes:"", previousWeight:"", progressionMode:"hypertrophy", loadIncrement:2.5
    });
  });

  const patchExercise = (workoutId: string, exerciseId: string, patch: Partial<Exercise>) => update(d => {
    const exercise = d.workouts.find(w => w.id === workoutId)?.exercises.find(e => e.id === exerciseId);
    if (exercise) Object.assign(exercise, patch);
  });

  const deleteExercise = (workoutId: string, exerciseId: string) => update(d => {
    const workout = d.workouts.find(w => w.id === workoutId);
    if (workout) workout.exercises = workout.exercises.filter(e => e.id !== exerciseId);
  });

  const resetData = () => {
    if (confirm("Reset FORMA workouts and erase local workout history?")) setState(deepCopy(DEFAULT_STATE));
  };

  const timerText = `${String(Math.floor(restSeconds/60)).padStart(2,"0")}:${String(restSeconds%60).padStart(2,"0")}`;

  if (!hydrated) return <div className="loading">Loading FORMA…</div>;

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brandMark">F</div>
        <div><h1>FORMA</h1><p>Strength. Beautifully tracked.</p></div>
      </header>

      <main>
        <section className="hero">
          <span>WATER · WINTER</span>
          <h2>Your strength practice.</h2>
          <p>Train with intention. Record what matters. Progress without pressure.</p>
        </section>

        <nav className="segmented">
          <button className={tab==="today"?"active":""} onClick={()=>setTab("today")}>Today</button>
          <button className={tab==="library"?"active":""} onClick={()=>setTab("library")}>Workouts</button>
          <button className={tab==="history"?"active":""} onClick={()=>setTab("history")}>History</button>
        </nav>

        {tab === "today" && (
          <section className="page">
            {!active ? (
              <>
                <article className="card feature">
                  <div>
                    <span className="eyebrow">{todayName}</span>
                    <h3>{todayWorkout?.name ?? "Recovery day"}</h3>
                    <p>{todayWorkout?.focus ?? "No workout is assigned to today."}</p>
                    {todayWorkout && <p className="meta">{todayWorkout.duration} min · {todayWorkout.exercises.length} exercises</p>}
                  </div>
                  {todayWorkout
                    ? <button className="primary" onClick={()=>startWorkout(todayWorkout)}>Start workout</button>
                    : <button className="secondary" onClick={()=>setTab("library")}>Edit schedule</button>}
                </article>

                <div className="sectionHead"><div><span className="eyebrow">Your week</span><h3>Training schedule</h3></div></div>
                <div className="schedule">
                  {DAYS.slice(1).map(day => {
                    const sessions = state.workouts.filter(w=>w.day===day);
                    return <article className="dayCard" key={day}>
                      <span>{day.slice(0,3)}</span>
                      {sessions.length ? sessions.map(w=><button key={w.id} onClick={()=>startWorkout(w)}>{w.name}</button>) : <em>Rest</em>}
                    </article>
                  })}
                </div>
              </>
            ) : (
              <>
                <article className="card sessionHeader">
                  <div>
                    <span className="eyebrow">Live workout</span>
                    <h3>{active.name}</h3>
                    <p>{completion.done} of {completion.total} sets complete</p>
                  </div>
                  <div className="progressRing" style={{"--pct":`${completion.pct*3.6}deg`} as React.CSSProperties}><strong>{completion.pct}%</strong></div>
                </article>

                <article className="timerCard">
                  <div><span className="eyebrow">Rest timer</span><strong>{timerText}</strong></div>
                  <div className="timerButtons">
                    {[60,90,120,180].map(s=><button key={s} onClick={()=>startTimer(s)}>{s<120?`${s}s`:`${s/60}m`}</button>)}
                  </div>
                </article>

                <div className="exerciseList">
                  {active.exercises.map((exercise, exerciseIndex) => (
                    <article className="exerciseCard" key={exercise.id}>
                      <div className="exerciseHeader">
                        <div><span className="exerciseNumber">{String(exerciseIndex+1).padStart(2,"0")}</span><h3>{exercise.name}</h3></div>
                        <p>{exercise.repRange} · target RPE {exercise.targetRpe || "—"} {exercise.previousWeight && `· previous ${exercise.previousWeight} kg`}</p>
                      </div>
                      {(() => {
                        const advice = progressionAdvice(active.workoutId, exercise, state.history);
                        return (
                          <div className={`coachTarget ${advice.status}`}>
                            <div>
                              <span className="coachLabel">FORMA target</span>
                              <strong>{advice.headline}</strong>
                              <p>{advice.detail}</p>
                            </div>
                            <div className="previousPerformance">
                              <span>Last session</span>
                              <b>{advice.previousSets}</b>
                            </div>
                          </div>
                        );
                      })()}
                      <div className="setLabels"><span>Set</span><span>kg</span><span>Reps</span><span>RPE</span><span>Done</span></div>
                      {exercise.sets.map((set, setIndex) => (
                        <div className={`setRow ${set.done?"complete":""}`} key={set.id}>
                          <span>{setIndex+1}</span>
                          <input inputMode="decimal" value={set.weight} onChange={e=>changeSet(exercise.id,set.id,"weight",e.target.value)} aria-label="Weight"/>
                          <input inputMode="numeric" value={set.reps} onChange={e=>changeSet(exercise.id,set.id,"reps",e.target.value)} aria-label="Repetitions"/>
                          <input inputMode="decimal" value={set.rpe} onChange={e=>changeSet(exercise.id,set.id,"rpe",e.target.value)} aria-label="RPE"/>
                          <label className="check"><input type="checkbox" checked={set.done} onChange={e=>changeSet(exercise.id,set.id,"done",e.target.checked)}/><i>✓</i></label>
                          <button className="removeSet" onClick={()=>removeSet(exercise.id,set.id)} aria-label="Remove set">×</button>
                        </div>
                      ))}
                      <button className="textButton" onClick={()=>addSet(exercise.id)}>＋ Add set</button>
                    </article>
                  ))}
                </div>

                <article className="card">
                  <label className="field"><span>Session notes</span><textarea value={active.notes} onChange={e=>update(d=>{if(d.activeWorkout)d.activeWorkout.notes=e.target.value})} placeholder="Technique, energy, pain, wins, next-session notes…"/></label>
                  <div className="finishActions">
                    <button className="secondary" onClick={()=>update(d=>{d.activeWorkout=null})}>End without saving</button>
                    <button className="primary" onClick={finishWorkout}>Complete workout</button>
                  </div>
                </article>
              </>
            )}
          </section>
        )}

        {tab === "library" && (
          <section className="page">
            <div className="sectionHead">
              <div><span className="eyebrow">Workout builder</span><h3>Edit your training week</h3></div>
              <button className="primary" onClick={addWorkout}>＋ Add workout</button>
            </div>
            <div className="builderList">
              {state.workouts.map(workout => (
                <article className="builderCard" key={workout.id}>
                  <div className="builderTop">
                    <label><span>Workout title</span><input value={workout.name} onChange={e=>patchWorkout(workout.id,{name:e.target.value})}/></label>
                    <label><span>Day</span><select value={workout.day} onChange={e=>patchWorkout(workout.id,{day:e.target.value})}>{DAYS.map(d=><option key={d}>{d}</option>)}</select></label>
                    <label><span>Minutes</span><input type="number" value={workout.duration} onChange={e=>patchWorkout(workout.id,{duration:Number(e.target.value)})}/></label>
                    <button className="danger" onClick={()=>deleteWorkout(workout.id)}>Remove</button>
                  </div>
                  <label className="field"><span>Focus</span><input value={workout.focus} onChange={e=>patchWorkout(workout.id,{focus:e.target.value})}/></label>
                  <div className="builderLabels progressionBuilderLabels"><span>Exercise</span><span>Sets</span><span>Reps</span><span>RPE</span><span>Previous kg</span><span>Mode</span><span>Step kg</span><span></span></div>
                  {workout.exercises.map(exercise => (
                    <div className="builderExercise" key={exercise.id}>
                      <input value={exercise.name} onChange={e=>patchExercise(workout.id,exercise.id,{name:e.target.value})}/>
                      <input type="number" value={exercise.targetSets} onChange={e=>patchExercise(workout.id,exercise.id,{targetSets:Number(e.target.value)})}/>
                      <input value={exercise.repRange} onChange={e=>patchExercise(workout.id,exercise.id,{repRange:e.target.value})}/>
                      <input value={exercise.targetRpe} onChange={e=>patchExercise(workout.id,exercise.id,{targetRpe:e.target.value})}/>
                      <input inputMode="decimal" value={exercise.previousWeight} onChange={e=>patchExercise(workout.id,exercise.id,{previousWeight:e.target.value})}/>
                      <select value={exercise.progressionMode ?? "hypertrophy"} onChange={e=>patchExercise(workout.id,exercise.id,{progressionMode:e.target.value as ProgressionMode})}>
                        <option value="hypertrophy">Hypertrophy</option>
                        <option value="strength">Strength</option>
                        <option value="conditioning">Conditioning</option>
                        <option value="bodyweight">Bodyweight</option>
                        <option value="assisted">Assisted</option>
                        <option value="manual">Manual</option>
                      </select>
                      <input type="number" step="0.5" value={exercise.loadIncrement ?? 2.5} onChange={e=>patchExercise(workout.id,exercise.id,{loadIncrement:Number(e.target.value)})}/>
                      <button onClick={()=>deleteExercise(workout.id,exercise.id)}>×</button>
                    </div>
                  ))}
                  <div className="builderActions">
                    <button className="secondary" onClick={()=>addExercise(workout.id)}>＋ Add exercise</button>
                    <button className="primary" onClick={()=>startWorkout(workout)}>Start workout</button>
                  </div>
                </article>
              ))}
            </div>
            <button className="reset" onClick={resetData}>Reset all workout data</button>
          </section>
        )}

        {tab === "history" && (
          <section className="page">
            <div className="sectionHead"><div><span className="eyebrow">Progress</span><h3>Workout history</h3></div></div>
            {state.history.length === 0 ? <article className="empty">Your completed workouts will appear here.</article> :
              <div className="historyList">{state.history.map(entry => (
                <article className="historyCard" key={entry.id}>
                  <div><span className="eyebrow">{new Date(entry.date).toLocaleDateString("en-AU",{day:"numeric",month:"short",year:"numeric"})}</span><h3>{entry.name}</h3><p>{entry.completedSets}/{entry.totalSets} sets · {entry.durationMinutes} min</p></div>
                  {entry.notes && <p className="historyNotes">{entry.notes}</p>}
                </article>
              ))}</div>}
          </section>
        )}
      </main>
    </div>
  );
}
