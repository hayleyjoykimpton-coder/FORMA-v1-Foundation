"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ACTIVE_PHASE,
  COACH_REMINDERS,
  HYDRATION_GOAL,
  IMAGES,
  MEASUREMENTS,
  NUTRITION_TARGETS,
  PHASES,
  PROGRESS_GALLERY,
  phaseCopy,
} from "@/lib/content";
import type {
  Exercise,
  ExerciseResult,
  SetResult,
  Workout,
  WorkoutSession,
} from "@/lib/types";
import { buildWorkoutsForWeek, getPhaseForWeek } from "@/lib/program";
import { createSessionResults, getRecommendation, uid } from "@/lib/progression";
import {
  buildVolumeSeries,
  computeStreak,
  computeStrengthProgress,
  plannedWeeklySets,
  totalCompletedSets,
  weekSessionCount,
} from "@/lib/analytics";
import { STORAGE, loadForma } from "@/lib/migrations";
import { GOAL_LABELS, loadProfile, saveProfile } from "@/lib/user";
import type { UserProfile } from "@/lib/user";
import { generateProgram } from "@/lib/programGenerator";
import {
  adjustResultsForReadiness,
  coachDashboard,
  exerciseCoaching,
  gluteScore,
  personalRecords,
  postWorkoutSummary,
  previousPerformance,
  strengthTrends,
  weeklyReview,
} from "@/lib/coach";
import type { Readiness } from "@/lib/coach";
import { Onboarding } from "@/components/Onboarding";
import { ProfileScreen } from "@/components/ProfileScreen";
import { ReadinessCheck } from "@/components/Readiness";
import {
  Eyebrow,
  Field,
  PhaseJourney,
  SectionHeading,
  StatTile,
  WeeklySchedule,
} from "@/components/ui";

type Tab = "today" | "training" | "progress" | "recovery";
type SessionDraft = {
  workoutId: string;
  exerciseIndex: number;
  results: ExerciseResult[];
  readiness?: number;
};

const TABS: { key: Tab; label: string }[] = [
  { key: "today", label: "Home" },
  { key: "training", label: "Training" },
  { key: "progress", label: "Progress" },
  { key: "recovery", label: "Recovery" },
];

/** Seed workouts for the current programme (used before hydration and as a fallback). */
const INITIAL_WORKOUTS: Workout[] = buildWorkoutsForWeek(1);

function greetingFor(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function FormaApp() {
  const [tab, setTab] = useState<Tab>("today");
  const [week, setWeek] = useState(1);
  const [workouts, setWorkouts] = useState<Workout[]>(INITIAL_WORKOUTS);
  const [history, setHistory] = useState<WorkoutSession[]>([]);
  const [activeWorkoutId, setActiveWorkoutId] = useState(INITIAL_WORKOUTS[0]?.id ?? "");
  const [editingWorkoutId, setEditingWorkoutId] = useState<string | null>(null);
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);
  const [session, setSession] = useState<SessionDraft | null>(null);
  const [restRemaining, setRestRemaining] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [water, setWater] = useState(0);
  const [journal, setJournal] = useState<Record<string, string>>({});
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [readinessWorkout, setReadinessWorkout] = useState<Workout | null>(null);

  useEffect(() => {
    try {
      const state = loadForma();
      setWorkouts(state.workouts);
      setActiveWorkoutId(state.workouts[0]?.id ?? "");
      setHistory(state.history);
      setWeek(state.week);
      setWater(state.water);
      setJournal(state.journal);
      setProfile(loadProfile());
    } catch {
      // Keep safe defaults when stored data cannot be read.
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE.workouts, JSON.stringify(workouts));
    window.localStorage.setItem(STORAGE.history, JSON.stringify(history));
    window.localStorage.setItem(STORAGE.program, JSON.stringify({ week }));
  }, [workouts, history, week, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(
      STORAGE.water,
      JSON.stringify({ date: new Date().toDateString(), count: water }),
    );
  }, [water, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE.journal, JSON.stringify(journal));
  }, [journal, hydrated]);

  useEffect(() => {
    if (restRemaining <= 0) return;
    const timer = window.setInterval(() => {
      setRestRemaining((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [restRemaining]);

  const activeWorkout = workouts.find((workout) => workout.id === activeWorkoutId) ?? workouts[0];
  const weeklySets = useMemo(() => plannedWeeklySets(workouts), [workouts]);
  const streak = useMemo(() => computeStreak(history), [history]);
  const completedSets = useMemo(() => totalCompletedSets(history), [history]);
  const weekSessions = useMemo(() => weekSessionCount(history), [history]);
  const volumeSeries = useMemo(() => buildVolumeSeries(history), [history]);
  const strengthProgress = useMemo(() => computeStrengthProgress(workouts, history), [workouts, history]);
  const dashboard = useMemo(() => (profile ? coachDashboard(profile, history) : null), [profile, history]);
  const records = useMemo(() => personalRecords(history), [history]);
  const trends = useMemo(() => strengthTrends(history), [history]);
  const glute = useMemo(() => gluteScore(history), [history]);
  const review = useMemo(() => (profile ? weeklyReview(profile, history) : null), [profile, history]);
  const latestSummary = useMemo(
    () => (history.length ? postWorkoutSummary(history[history.length - 1], history) : []),
    [history],
  );
  // The weekly schedule reflects the user's actual (personalised) plan.
  const weeklySchedule = useMemo(
    () =>
      workouts.map((workout) => ({
        day: workout.day,
        short: workout.day.slice(0, 3),
        focus: workout.title,
        image: /pilates|movement|mobility|recovery/i.test(workout.title) ? IMAGES.pilates : IMAGES.strength,
      })),
    [workouts],
  );

  const phaseDef = getPhaseForWeek(week);
  const season = phaseDef.id;

  const applyGeneratedProgram = (nextProfile: UserProfile) => {
    const generated = generateProgram(nextProfile);
    setWorkouts(generated);
    setActiveWorkoutId(generated[0]?.id ?? "");
  };

  const handleOnboardingComplete = (nextProfile: UserProfile) => {
    saveProfile(nextProfile);
    setProfile(nextProfile);
    applyGeneratedProgram(nextProfile);
    setTab("today");
  };

  const handleProfileSave = (updated: UserProfile) => {
    const trainingChanged =
      !profile ||
      profile.goal !== updated.goal ||
      profile.experienceLevel !== updated.experienceLevel ||
      profile.trainingDays !== updated.trainingDays ||
      profile.equipmentAccess !== updated.equipmentAccess;
    saveProfile(updated);
    setProfile(updated);
    if (trainingChanged) applyGeneratedProgram(updated);
    setProfileOpen(false);
  };

  const startWorkout = (workout: Workout) => {
    setReadinessWorkout(workout);
  };

  const beginSession = (workout: Workout, readiness: Readiness) => {
    const base = createSessionResults(workout, history, phaseDef);
    const results = adjustResultsForReadiness(base, readiness);
    setActiveWorkoutId(workout.id);
    setSession({ workoutId: workout.id, exerciseIndex: 0, results, readiness: readiness.score });
    setReadinessWorkout(null);
    setTab("today");
    setRestRemaining(0);
  };

  const finishWorkout = () => {
    if (!session || !activeWorkout) return;
    const exercises = session.results.map((result) => ({
      ...result,
      sets: result.sets.map((set) => ({ ...set, skipped: !set.complete })),
    }));
    const completed: WorkoutSession = {
      id: uid(),
      workoutId: activeWorkout.id,
      workoutTitle: activeWorkout.title,
      completedAt: new Date().toISOString(),
      season,
      week,
      readiness: session.readiness,
      exercises,
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
      return next.length ? next : INITIAL_WORKOUTS;
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
    return (
      <div className="app">
        <div className="shell">
          <div className="loading">
            <span className="wordmark">FORMA</span>
            <p>Preparing your practice…</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  if (profileOpen) {
    return <ProfileScreen profile={profile} onSave={handleProfileSave} onClose={() => setProfileOpen(false)} />;
  }

  if (readinessWorkout && !session) {
    return (
      <ReadinessCheck
        workout={readinessWorkout}
        onSubmit={(readiness) => beginSession(readinessWorkout, readiness)}
        onCancel={() => setReadinessWorkout(null)}
      />
    );
  }

  if (session && activeWorkout) {
    const exercise = activeWorkout.exercises[session.exerciseIndex];
    const result = session.results[session.exerciseIndex];
    const recommendation = getRecommendation(exercise, history, phaseDef);
    const prev = previousPerformance(exercise, history);
    const coaching = exerciseCoaching(exercise);
    const minutes = Math.floor(restRemaining / 60);
    const seconds = String(restRemaining % 60).padStart(2, "0");
    const setsDone = result.sets.filter((set) => set.complete).length;
    const progressPct = Math.round((setsDone / result.sets.length) * 100);

    return (
      <div className="app">
        <div className="shell">
          <div className="screen session-screen">
            <header className="session-top">
              <button className="ghost-btn" onClick={() => setSession(null)}>‹ Exit</button>
              <div className="session-count">
                <span className="eyebrow">{activeWorkout.title}</span>
                <strong>{session.exerciseIndex + 1} / {activeWorkout.exercises.length}</strong>
              </div>
              <button className="ghost-btn strong" onClick={finishWorkout}>Finish</button>
            </header>

            <section
              className="session-hero"
              style={{ backgroundImage: `linear-gradient(180deg, rgba(58,42,32,.12), rgba(58,42,32,.62)), url(${IMAGES.strength})` }}
            >
              <span className="eyebrow light">Foundation · Primary target</span>
              <h1>{exercise.name}</h1>
              <p>{recommendation.title}</p>
              <small>{recommendation.detail}</small>
              <div className="session-progress">
                <span style={{ width: `${progressPct}%` }} />
              </div>
            </section>

            <article className="card coach-prev">
              <div className="coach-prev-head">
                <span className="eyebrow">Last session</span>
                {prev.pbWeight > 0 && <span className="season-pill">PB {prev.pbWeight}kg × {prev.pbReps}</span>}
              </div>
              {prev.hasData ? (
                <div className="coach-prev-stats">
                  <div><small>Weight</small><strong>{Math.max(...prev.weights)}kg</strong></div>
                  <div><small>Reps</small><strong>{prev.reps.join(" / ")}</strong></div>
                  <div><small>Avg RPE</small><strong>{prev.avgRpe}</strong></div>
                  <div><small>Volume</small><strong>{Math.round(prev.volume)}kg</strong></div>
                </div>
              ) : (
                <p className="muted">First time logging this exercise — today sets your baseline.</p>
              )}
              <p className="coach-prev-rec"><strong>Today:</strong> {recommendation.title}. {recommendation.detail}</p>
            </article>

            <article className="card session-card">
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
            </article>

            <article className="card coach-guide">
              <span className="eyebrow">Coaching · {exercise.name}</span>
              <div className="coach-guide-meta">
                <span>{coaching.primary}</span>
                <span>{coaching.equipment}</span>
                <span>Tempo {coaching.tempo.split(" · ")[0]}</span>
                <span>Rest {coaching.restSeconds}s</span>
              </div>
              {coaching.secondary !== "—" ? <p className="muted coach-guide-sub">Secondary: {coaching.secondary}</p> : null}
              {coaching.cues.length > 0 && (
                <div className="coach-block">
                  <strong>Focus</strong>
                  <ul className="coach-list">
                    {coaching.cues.map((cue) => <li key={cue}>{cue}</li>)}
                  </ul>
                </div>
              )}
              {coaching.mistakes.length > 0 && (
                <div className="coach-block">
                  <strong>Avoid</strong>
                  <ul className="coach-list">
                    {coaching.mistakes.map((mistake) => <li key={mistake}>{mistake}</li>)}
                  </ul>
                </div>
              )}
              {coaching.substitutions.length > 0 && (
                <p className="muted coach-guide-sub">Swaps: {coaching.substitutions.join(" · ")}</p>
              )}
            </article>

            <article className="card rest-card">
              <div>
                <span className="eyebrow">Rest timer</span>
                <strong>{minutes}:{seconds}</strong>
              </div>
              <div className="rest-actions">
                <button onClick={() => setRestRemaining(exercise.restSeconds)}>Restart</button>
                <button onClick={() => setRestRemaining(0)}>Skip</button>
              </div>
            </article>

            <div className="session-nav">
              <button disabled={session.exerciseIndex === 0} onClick={() => setSession({ ...session, exerciseIndex: session.exerciseIndex - 1 })}>Previous</button>
              <button
                disabled={session.exerciseIndex === activeWorkout.exercises.length - 1}
                onClick={() => setSession({ ...session, exerciseIndex: session.exerciseIndex + 1 })}
              >
                Next exercise
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const greeting = greetingFor(new Date().getHours());
  const todayName = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const todayISO = new Date().toISOString().slice(0, 10);
  const focusExercise = activeWorkout?.exercises[0];
  const focusRec = focusExercise ? getRecommendation(focusExercise, history, phaseDef) : null;
  const goalLabel = GOAL_LABELS[profile.goal];
  const goalLower = goalLabel.toLowerCase();
  const encouragement =
    history.length === 0
      ? `Welcome to Foundation, ${profile.firstName}. Your ${profile.trainingDays}-day plan is built to ${goalLower} — begin gently and let consistency lead.`
      : streak >= 3
        ? `A ${streak}-day rhythm, ${profile.firstName} — this is exactly how you ${goalLower}. Keep it flowing.`
        : `Consistency over intensity. Today's session moves you toward "${goalLower}".`;

  return (
    <div className="app">
      <div className="shell">
        {tab === "today" && activeWorkout && (
          <div className="screen home-screen">
            <header className="topbar">
              <span className="wordmark">FORMA</span>
              <button className="avatar" onClick={() => setProfileOpen(true)} aria-label="Open profile">{profile.firstName.charAt(0)}</button>
            </header>

            <section
              className="home-hero"
              style={{ backgroundImage: `linear-gradient(180deg, rgba(58,42,32,.04) 30%, rgba(58,42,32,.58)), url(${IMAGES.hero})` }}
            >
              <div className="home-hero-copy">
                <span className="eyebrow light">{greeting},</span>
                <h1 className="hero-name">{profile.firstName}</h1>
                <div className="hero-tags">
                  <span className="hero-chip">Foundation Phase</span>
                  <span className="hero-chip subtle">Today · {activeWorkout.title}</span>
                </div>
              </div>
            </section>

            <div className="stat-grid three">
              <StatTile label="Day streak" value={String(streak)} note="Keep it going" />
              <StatTile label="Sessions" value={String(history.length)} note="All time" />
              <StatTile label="Weekly sets" value={String(weeklySets)} note="Planned" />
            </div>

            <SectionHeading eyebrow="Today's workout" title={activeWorkout.title} />
            <article className="card workout-today">
              <div className="workout-today-media" style={{ backgroundImage: `url(${IMAGES.strength})` }}>
                <span className="media-chip">{activeWorkout.duration} min</span>
                <button className="media-edit" onClick={() => { setEditingWorkoutId(activeWorkout.id); setTab("training"); }}>Edit</button>
              </div>
              <div className="workout-today-body">
                <span className="eyebrow">{activeWorkout.day} · Foundation</span>
                <ul className="exercise-preview">
                  {activeWorkout.exercises.map((item, index) => {
                    const recommendation = getRecommendation(item, history, phaseDef);
                    return (
                      <li key={item.id}>
                        <span className="ep-index">{index + 1}</span>
                        <div>
                          <strong>{item.name}</strong>
                          <small>{item.sets} × {item.repMin}–{item.repMax} · RPE {item.rpe}</small>
                          <em>{recommendation.title}</em>
                        </div>
                      </li>
                    );
                  })}
                  {!activeWorkout.exercises.length && <li className="ep-empty">No exercises yet — add some in Training.</li>}
                </ul>
                <button className="cta-btn" disabled={!activeWorkout.exercises.length} onClick={() => startWorkout(activeWorkout)}>
                  Start workout
                </button>
              </div>
            </article>

            <SectionHeading eyebrow="Your coach" title="Daily note" />
            <article className="card coach-card">
              <div className="coach-top">
                <div className="coach-avatar">F</div>
                <div>
                  <strong>Coach FORMA</strong>
                  <small>{goalLabel} · Foundation</small>
                </div>
              </div>
              <p className="coach-message">{encouragement}</p>
              {focusRec && focusExercise && (
                <div className="coach-rec">
                  <span className="eyebrow">Progressive overload</span>
                  <strong>{focusExercise.name}</strong>
                  <p>{focusRec.title}. {focusRec.detail}</p>
                </div>
              )}
              <div className="coach-reminders">
                {COACH_REMINDERS.map((reminder) => (
                  <div className={`reminder accent-${reminder.accent}`} key={reminder.title}>
                    <strong>{reminder.title}</strong>
                    <small>{reminder.text}</small>
                  </div>
                ))}
              </div>
            </article>

            <SectionHeading eyebrow="Nutrition" title="Fuel your day" />
            <div className="stat-grid three">
              {NUTRITION_TARGETS.map((target) => (
                <StatTile key={target.label} label={target.label} value={target.value} note={target.unit} accent={target.accent} />
              ))}
            </div>
            <article
              className="card image-card"
              style={{ backgroundImage: `linear-gradient(180deg, rgba(58,42,32,.02) 40%, rgba(58,42,32,.5)), url(${IMAGES.nutrition})` }}
            >
              <div className="image-card-copy">
                <span className="eyebrow light">Meals</span>
                <h3>Balanced, protein-led plates</h3>
                <span className="link-cue">Bright greens · lean protein · slow carbs</span>
              </div>
            </article>

            <SectionHeading eyebrow="Hydration" title="Water intake" />
            <article className="card hydration-card">
              <div className="hydration-head">
                <div>
                  <strong className="hydration-count">{water}<small> / {HYDRATION_GOAL} glasses</small></strong>
                  <small className="muted">{water >= HYDRATION_GOAL ? "Goal reached — beautifully done." : "Small sips, all day long."}</small>
                </div>
                <div className="hydration-controls">
                  <button onClick={() => setWater((current) => Math.max(0, current - 1))} aria-label="Remove a glass">−</button>
                  <button onClick={() => setWater((current) => Math.min(HYDRATION_GOAL, current + 1))} aria-label="Add a glass">+</button>
                </div>
              </div>
              <div className="hydration-track">
                {Array.from({ length: HYDRATION_GOAL }).map((_, index) => (
                  <span key={index} className={`drop${index < water ? " filled" : ""}`} />
                ))}
              </div>
            </article>

            <SectionHeading eyebrow="Wellbeing" title="Recovery & progress" />
            <div className="dual-grid">
              <article
                className="card image-card tall"
                style={{ backgroundImage: `linear-gradient(180deg, rgba(58,42,32,.02) 35%, rgba(58,42,32,.55)), url(${IMAGES.recovery})` }}
                role="button"
                tabIndex={0}
                onClick={() => setTab("recovery")}
                onKeyDown={(event) => { if (event.key === "Enter") setTab("recovery"); }}
              >
                <div className="image-card-copy">
                  <span className="eyebrow light">Recovery</span>
                  <h3>82% recovered</h3>
                  <span className="link-cue">Return to balance ›</span>
                </div>
              </article>
              <article className="card progress-preview" role="button" tabIndex={0} onClick={() => setTab("progress")} onKeyDown={(event) => { if (event.key === "Enter") setTab("progress"); }}>
                <Eyebrow>Progress</Eyebrow>
                <strong className="progress-preview-value">{history.length}</strong>
                <small className="muted">sessions logged</small>
                <div className="progress-preview-meta">
                  <span>{streak} day streak</span>
                  <span>{completedSets} sets</span>
                </div>
                <span className="link-cue">View journey ›</span>
              </article>
            </div>

            <SectionHeading eyebrow="Your phase" title="Foundation" />
            <article className="card phase-card">
              <p className="muted">{phaseCopy.Foundation.line} {phaseCopy.Foundation.focus}</p>
              <PhaseJourney phases={PHASES} active={ACTIVE_PHASE} />
            </article>

            <SectionHeading eyebrow="Journal" title="Today's reflection" />
            <article className="card journal-card">
              <textarea
                value={journal[todayISO] ?? ""}
                onChange={(event) => setJournal((current) => ({ ...current, [todayISO]: event.target.value }))}
                placeholder="How did today feel? A word or two is enough."
              />
            </article>

            <SectionHeading eyebrow="This week" title="Weekly schedule" />
            <WeeklySchedule schedule={weeklySchedule} todayName={todayName} />
          </div>
        )}

        {tab === "training" && (
          <div className="screen">
            <header className="topbar">
              <div>
                <span className="eyebrow">Training</span>
                <h2>Your workouts</h2>
              </div>
              <button className="pill-btn" onClick={addWorkout}>+ Workout</button>
            </header>

            <SectionHeading eyebrow="This week" title="Weekly schedule" />
            <WeeklySchedule schedule={weeklySchedule} todayName={todayName} />

            <div className="workout-list">
              {workouts.map((workout) => {
                const isEditing = editingWorkoutId === workout.id;
                return (
                  <article className="card workout-card" key={workout.id}>
                    <div className="workout-card-head">
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
                        <button onClick={() => moveWorkout(workout.id, -1)} aria-label="Move up">↑</button>
                        <button onClick={() => moveWorkout(workout.id, 1)} aria-label="Move down">↓</button>
                        <button className="pill-btn small" onClick={() => startWorkout(workout)}>Start</button>
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
                                  <button className="pill-btn small" onClick={() => setEditingExerciseId(null)}>Done</button>
                                  <button className="danger" onClick={() => deleteExercise(workout.id, exercise.id)}>Delete</button>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="exercise-summary">
                                  <div className="exercise-thumb" style={{ backgroundImage: `url(${IMAGES.strength})` }} aria-hidden />
                                  <div className="reorder-buttons">
                                    <button onClick={() => moveExercise(workout.id, exercise.id, -1)} aria-label="Move exercise up">↑</button>
                                    <button onClick={() => moveExercise(workout.id, exercise.id, 1)} aria-label="Move exercise down">↓</button>
                                  </div>
                                  <div>
                                    <strong>{exercise.name}</strong>
                                    <small>{exercise.sets} × {exercise.repMin}–{exercise.repMax} · {exercise.weight} kg · RPE {exercise.rpe}</small>
                                  </div>
                                </div>
                                <button className="text-btn" onClick={() => setEditingExerciseId(exercise.id)}>Edit</button>
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
          </div>
        )}

        {tab === "progress" && (
          <div className="screen">
            <header className="topbar">
              <div>
                <span className="eyebrow">Progress</span>
                <h2>Your journey</h2>
              </div>
            </header>

            <div className="stat-grid four">
              <StatTile label="Sessions" value={String(history.length)} accent="pink" />
              <StatTile label="Sets" value={String(completedSets)} accent="mocha" />
              <StatTile label="Streak" value={`${streak}d`} accent="green" />
              <StatTile label="This week" value={`${weekSessions}/5`} accent="sage" />
            </div>

            {dashboard && (
              <>
                <SectionHeading eyebrow="Coach" title="This week's focus" />
                <article className="card coach-card">
                  {latestSummary.length > 0 && <p className="coach-message">{latestSummary[0]}</p>}
                  <div className="dash-grid">
                    <div className="dash-row"><span>Focus</span><strong>{dashboard.focus}</strong></div>
                    <div className="dash-row"><span>Strongest</span><strong>{dashboard.strongestArea}</strong></div>
                    <div className="dash-row"><span>Needs work</span><strong>{dashboard.needsImprovement}</strong></div>
                    <div className="dash-row"><span>Recovery</span><strong>{dashboard.recoveryStatus}</strong></div>
                    <div className="dash-row"><span>Next milestone</span><strong>{dashboard.nextMilestone}</strong></div>
                    <div className="dash-row"><span>Completion</span><strong>{dashboard.weeklyCompletion}</strong></div>
                  </div>
                  {latestSummary.length > 1 && (
                    <div className="coach-rec">
                      <span className="eyebrow">Coach note</span>
                      <p>{latestSummary.slice(1).join(" ")}</p>
                    </div>
                  )}
                </article>
              </>
            )}

            <SectionHeading eyebrow="Physique" title="Glute score" />
            <article className="card glute-card">
              <div className="glute-score">
                <strong>{glute.score}</strong>
                <span className={`score-badge band-${glute.band.replace(/\s/g, "").toLowerCase()}`}>{glute.band}</span>
              </div>
              <div className="dash-grid">
                <div className="dash-row"><span>Glute sets · 7d</span><strong>{glute.gluteSets}</strong></div>
                <div className="dash-row"><span>Consistency</span><strong>{glute.consistency}%</strong></div>
                <div className="dash-row"><span>Improving lifts</span><strong>{glute.progression}</strong></div>
                <div className="dash-row"><span>Recovery</span><strong>{glute.recovery}</strong></div>
              </div>
            </article>

            <SectionHeading eyebrow="Charts" title="Training volume" />
            <article className="card chart-card">
              {volumeSeries.length ? (
                <div className="bar-chart">
                  {volumeSeries.map((point, index) => {
                    const max = Math.max(1, ...volumeSeries.map((entry) => entry.value));
                    const height = Math.max(6, Math.round((point.value / max) * 100));
                    return (
                      <div className="bar-col" key={index}>
                        <span className="bar" style={{ height: `${height}%` }} />
                        <small>{point.label}</small>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="muted centered">Complete a workout to see your training volume grow.</p>
              )}
            </article>

            <SectionHeading eyebrow="Strength" title="Strength progress" />
            <article className="card">
              <div className="strength-list">
                {strengthProgress.map((entry) => {
                  const delta = entry.current - entry.base;
                  return (
                    <div className="strength-row" key={entry.name}>
                      <div>
                        <strong>{entry.name}</strong>
                        <small>{entry.current} kg working weight</small>
                      </div>
                      <span className={`delta ${delta > 0 ? "up" : delta < 0 ? "down" : "flat"}`}>
                        {delta > 0 ? `+${delta}` : delta < 0 ? `${delta}` : "—"} kg
                      </span>
                    </div>
                  );
                })}
                {!strengthProgress.length && <p className="muted centered">Add exercises to track strength progress.</p>}
              </div>
            </article>

            <SectionHeading eyebrow="Trends" title="Strength trends" />
            <article className="card">
              <div className="strength-list">
                {trends.map((entry) => (
                  <div className="strength-row" key={entry.name}>
                    <div>
                      <strong>{entry.name}</strong>
                      <small>{entry.previous}kg → {entry.current}kg</small>
                    </div>
                    <span className={`delta ${entry.trend === "improving" ? "up" : entry.trend === "declining" ? "down" : "flat"}`}>
                      {entry.trend === "improving" ? "Improving" : entry.trend === "declining" ? "Declining" : "Maintaining"}
                    </span>
                  </div>
                ))}
                {!trends.length && <p className="muted centered">Log a few sessions to reveal your strength trends.</p>}
              </div>
            </article>

            <SectionHeading eyebrow="Records" title="Personal records" />
            <div className="stat-grid four">
              <StatTile label="Heaviest" value={records.heaviestWeight ? `${records.heaviestWeight.value}kg` : "—"} note={records.heaviestWeight?.name ?? "Log a set"} accent="pink" />
              <StatTile label="Best e1RM" value={records.bestE1RM ? `${records.bestE1RM.value}kg` : "—"} note={records.bestE1RM?.name ?? "—"} accent="mocha" />
              <StatTile label="Top volume" value={records.highestVolume ? String(records.highestVolume.value) : "—"} note="single session" accent="sage" />
              <StatTile label="Longest streak" value={`${records.longestStreak}d`} note={records.mostImproved ? `Most improved · ${records.mostImproved.name}` : "—"} accent="green" />
            </div>

            <div className="dual-grid">
              <article className="card measurements-card">
                <Eyebrow>Measurements</Eyebrow>
                <div className="measurement-list">
                  {MEASUREMENTS.map((item) => (
                    <div className="measurement-row" key={item.label}>
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                    </div>
                  ))}
                </div>
              </article>
              <article className="card photos-card">
                <Eyebrow>Progress photos</Eyebrow>
                <div className="photo-strip">
                  {PROGRESS_GALLERY.map((src, index) => (
                    <div className="photo-thumb" key={index} style={{ backgroundImage: `url(${src})` }} aria-hidden />
                  ))}
                </div>
                <small className="muted">A gentle visual record of your progress.</small>
              </article>
            </div>

            {review && (
              <>
                <SectionHeading eyebrow="Sunday" title="Weekly review" />
                <article className="card coach-card">
                  <p className="coach-message">{review.summary}</p>
                  <div className="stat-grid four">
                    <StatTile label="Workouts" value={String(review.workouts)} accent="pink" />
                    <StatTile label="Consistency" value={`${review.consistency}%`} accent="sage" />
                    <StatTile label="Volume" value={String(review.volume)} accent="mocha" />
                    <StatTile label="Lifts up" value={String(review.strengthGained)} accent="green" />
                  </div>
                  <div className="coach-rec">
                    <span className="eyebrow">Goal for next week</span>
                    <p>{review.nextGoal}</p>
                  </div>
                </article>
              </>
            )}

            <SectionHeading eyebrow="History" title="Recent sessions" />
            <div className="history-list">
              {[...history].reverse().map((item) => (
                <article className="card history-card" key={item.id}>
                  <div className="workout-card-head">
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
              {!history.length && <article className="card empty-state">Complete your first workout to build your progress history.</article>}
            </div>
          </div>
        )}

        {tab === "recovery" && (
          <div className="screen">
            <header className="topbar">
              <div>
                <span className="eyebrow">Recovery</span>
                <h2>Return to balance</h2>
              </div>
            </header>

            <article
              className="card image-card tall recovery-hero"
              style={{ backgroundImage: `linear-gradient(180deg, rgba(58,42,32,.02) 30%, rgba(58,42,32,.5)), url(${IMAGES.recovery})` }}
            >
              <div className="image-card-copy">
                <span className="eyebrow light">Readiness</span>
                <h3 className="recovery-score">82%</h3>
                <span className="link-cue">Well recovered — train as planned</span>
              </div>
            </article>

            <div className="stat-grid three">
              <StatTile label="Stress" value="Low" note="Settled" accent="sage" />
              <StatTile label="Readiness" value="High" note="Go" accent="green" />
              <StatTile label="Soreness" value="Mild" note="Normal" accent="pink" />
            </div>

            <SectionHeading eyebrow="Tonight" title="Wind-down ritual" />
            <article className="card coach-card">
              <p className="coach-message">Dim the lights an hour before bed, stretch gently, and let your nervous system settle. Rest is where your Foundation work takes hold.</p>
              <div className="coach-reminders">
                <div className="reminder accent-blue"><strong>Hydrate</strong><small>A final glass of water to close the day.</small></div>
                <div className="reminder accent-mocha"><strong>Nourish</strong><small>A little protein supports overnight recovery.</small></div>
                <div className="reminder accent-sage"><strong>Sleep</strong><small>Aim for 8 restful hours tonight.</small></div>
              </div>
            </article>
          </div>
        )}

        <nav className="tabbar">
          {TABS.map((item) => (
            <button key={item.key} className={tab === item.key ? "active" : ""} onClick={() => setTab(item.key)}>
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
