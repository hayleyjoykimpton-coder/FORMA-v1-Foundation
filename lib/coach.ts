/**
 * FORMA coach — the intelligence layer.
 *
 * Pure functions that turn raw workout/history/profile data into coaching:
 * previous performance, exercise guidance, readiness adjustments, post-workout
 * feedback, personal records, strength trends, a glute score, a coach dashboard
 * and an end-of-week review. No rendering, no side effects.
 */

import { EXERCISES, getExercise } from "./exercises";
import type { MovementPattern, MuscleGroup } from "./exercises";
import { estimate1RM } from "./progression";
import { muscleVolume, sessionVolume, weekSessionCount } from "./analytics";
import type { Exercise, ExerciseResult, WorkoutSession } from "./types";
import { GOAL_LABELS } from "./user";
import type { UserProfile } from "./user";

const DAY_MS = 86_400_000;

const MUSCLE_LABEL: Record<MuscleGroup, string> = {
  glutes: "Glutes",
  hamstrings: "Hamstrings",
  quads: "Quads",
  back: "Back",
  shoulders: "Shoulders",
  chest: "Chest",
  core: "Core",
  arms: "Arms",
  mobility: "Mobility",
  fullbody: "Full body",
};

function muscleList(muscles: MuscleGroup[]): string {
  return muscles.map((m) => MUSCLE_LABEL[m]).join(", ") || "—";
}

function matches(result: ExerciseResult, exercise: Exercise): boolean {
  if (exercise.exerciseId && result.libraryId && result.libraryId === exercise.exerciseId) return true;
  if (result.exerciseId === exercise.id) return true;
  return result.name === exercise.name;
}

// --------------------------------------------------------------------------
// 1. Previous performance & personal best (per exercise)
// --------------------------------------------------------------------------

export type PreviousPerformance = {
  hasData: boolean;
  weights: number[];
  reps: number[];
  setCount: number;
  avgRpe: number;
  volume: number;
  pbWeight: number;
  pbReps: number;
  pbE1RM: number;
};

export function previousPerformance(exercise: Exercise, history: WorkoutSession[]): PreviousPerformance {
  const empty: PreviousPerformance = {
    hasData: false,
    weights: [],
    reps: [],
    setCount: 0,
    avgRpe: 0,
    volume: 0,
    pbWeight: 0,
    pbReps: 0,
    pbE1RM: 0,
  };

  // Personal bests across all history.
  let pbWeight = 0;
  let pbReps = 0;
  let pbE1RM = 0;
  for (const session of history) {
    for (const result of session.exercises) {
      if (!matches(result, exercise)) continue;
      for (const set of result.sets) {
        if (!set.complete) continue;
        pbWeight = Math.max(pbWeight, set.weight);
        const e1rm = estimate1RM(set.weight, set.reps);
        if (e1rm > pbE1RM) {
          pbE1RM = e1rm;
          pbReps = set.reps;
        }
      }
    }
  }

  // Most recent session with completed sets for this exercise.
  for (let i = history.length - 1; i >= 0; i -= 1) {
    const result = history[i].exercises.find((entry) => matches(entry, exercise));
    if (!result) continue;
    const done = result.sets.filter((set) => set.complete);
    if (!done.length) continue;
    const weights = done.map((set) => set.weight);
    const reps = done.map((set) => set.reps);
    const avgRpe = done.reduce((sum, set) => sum + set.rpe, 0) / done.length;
    const volume = done.reduce((sum, set) => sum + set.weight * set.reps, 0);
    return {
      hasData: true,
      weights,
      reps,
      setCount: done.length,
      avgRpe: Math.round(avgRpe * 10) / 10,
      volume,
      pbWeight,
      pbReps,
      pbE1RM,
    };
  }

  return { ...empty, pbWeight, pbReps, pbE1RM };
}

// --------------------------------------------------------------------------
// 2. Exercise coaching (cues, mistakes, subs, tempo, muscles…)
// --------------------------------------------------------------------------

export type ExerciseCoaching = {
  primary: string;
  secondary: string;
  equipment: string;
  cues: string[];
  mistakes: string[];
  substitutions: string[];
  tempo: string;
  restSeconds: number;
};

function tempoFor(pattern: MovementPattern | undefined): string {
  switch (pattern) {
    case "hinge":
    case "squat":
    case "lunge":
    case "push":
    case "pull":
      return "3-1-1 · controlled down, brief pause, drive up";
    case "isolation":
      return "2-1-2 · smooth, squeeze, control";
    case "core":
      return "Slow & controlled";
    case "mobility":
      return "Flow with the breath";
    default:
      return "Controlled";
  }
}

export function exerciseCoaching(exercise: Exercise): ExerciseCoaching {
  const definition = getExercise(exercise.exerciseId) ?? getExercise(exercise.name.toLowerCase());
  const equipmentLabel = definition ? definition.equipment.replace(/_/g, " ") : "—";
  return {
    primary: definition ? muscleList(definition.primaryMuscles) : "—",
    secondary: definition ? muscleList(definition.secondaryMuscles) : "—",
    equipment: equipmentLabel.charAt(0).toUpperCase() + equipmentLabel.slice(1),
    cues: definition?.coachingCues ?? [],
    mistakes: definition?.commonMistakes ?? [],
    substitutions: (definition?.substitutions ?? []).map((id) => EXERCISES[id]?.name ?? id),
    tempo: tempoFor(definition?.movementPattern),
    restSeconds: exercise.restSeconds,
  };
}

// --------------------------------------------------------------------------
// 5. Readiness
// --------------------------------------------------------------------------

export type ReadinessInput = {
  sleep: number; // 1–5, higher = better
  energy: number; // 1–5
  stress: number; // 1–5, higher = worse
  soreness: number; // 1–5, higher = worse
  motivation: number; // 1–5
  pain: number; // 1–5, higher = worse
};

export type ReadinessBand = "low" | "moderate" | "high";

export type Readiness = {
  score: number; // 0–100
  band: ReadinessBand;
  note: string;
  setDelta: number; // sets to add/remove per exercise
  rpeDelta: number; // shift to target RPE
};

export const READINESS_METRICS: { key: keyof ReadinessInput; label: string; invert: boolean }[] = [
  { key: "sleep", label: "Sleep", invert: false },
  { key: "energy", label: "Energy", invert: false },
  { key: "stress", label: "Stress", invert: true },
  { key: "soreness", label: "Soreness", invert: true },
  { key: "motivation", label: "Motivation", invert: false },
  { key: "pain", label: "Pain", invert: true },
];

export function computeReadiness(input: ReadinessInput): Readiness {
  const normalised = READINESS_METRICS.map(({ key, invert }) => {
    const raw = input[key];
    const good = invert ? 6 - raw : raw; // 1–5 where 5 = best
    return (good - 1) / 4; // 0–1
  });
  const score = Math.round((normalised.reduce((sum, value) => sum + value, 0) / normalised.length) * 100);

  if (score >= 70) {
    return { score, band: "high", note: "You're primed — train as planned and chase the top of each range.", setDelta: 0, rpeDelta: 0 };
  }
  if (score >= 45) {
    return { score, band: "moderate", note: "Solid readiness. Hold your targets and keep effort honest.", setDelta: 0, rpeDelta: 0 };
  }
  return {
    score,
    band: "low",
    note: "Readiness is low — we've trimmed a set and eased the target RPE. Move well and keep it light.",
    setDelta: -1,
    rpeDelta: -1,
  };
}

/** Apply readiness adjustments to a freshly-built session draft. */
export function adjustResultsForReadiness(results: ExerciseResult[], readiness: Readiness): ExerciseResult[] {
  if (readiness.setDelta >= 0 && readiness.rpeDelta >= 0) return results;
  return results.map((result) => {
    let sets = result.sets;
    if (readiness.setDelta < 0 && sets.length > 2) {
      sets = sets.slice(0, Math.max(2, sets.length + readiness.setDelta));
    }
    if (readiness.rpeDelta < 0) {
      sets = sets.map((set) => ({ ...set, rpe: Math.max(5, set.rpe + readiness.rpeDelta) }));
    }
    return { ...result, sets };
  });
}

// --------------------------------------------------------------------------
// 6. Post-workout smart coaching
// --------------------------------------------------------------------------

function completionRate(session: WorkoutSession): number {
  const total = session.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0);
  if (!total) return 0;
  const done = session.exercises.reduce((sum, exercise) => sum + exercise.sets.filter((set) => set.complete).length, 0);
  return done / total;
}

export function postWorkoutSummary(session: WorkoutSession, history: WorkoutSession[]): string[] {
  const lines: string[] = [];
  const completion = completionRate(session);

  if (completion >= 1) {
    lines.push("You completed every working set. Strong, controlled work — consider adding load next session.");
  } else if (completion >= 0.6) {
    lines.push(`Solid effort — you finished ${Math.round(completion * 100)}% of your sets. Aim to close out the rest next time.`);
  } else if (completion > 0) {
    lines.push("Partial session logged — showing up on a tough day still counts. We'll build from here.");
  }

  // Glute volume trend this week vs. previous week.
  const now = Date.now();
  const priorHistory = history.filter((entry) => entry.id !== session.id);
  const thisWeek = muscleVolume([...priorHistory, session].filter((s) => now - new Date(s.completedAt).getTime() <= 7 * DAY_MS), "glutes");
  const lastWeek = muscleVolume(
    priorHistory.filter((s) => {
      const age = now - new Date(s.completedAt).getTime();
      return age > 7 * DAY_MS && age <= 14 * DAY_MS;
    }),
    "glutes",
  );
  if (lastWeek > 0 && thisWeek > lastWeek) {
    const pct = Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
    lines.push(`Excellent — you increased your weekly glute volume by ${pct}%.`);
  }

  const streak = currentStreak(history.concat(session));
  if (streak >= 3) lines.push(`Great consistency — that's a ${streak}-day streak. This is how change compounds.`);

  if ((session.readiness ?? 100) < 45) {
    lines.push("You trained through low readiness — prioritise sleep and nutrition tonight to bounce back.");
  }

  if (!lines.length) lines.push("Session logged. Consistency is the engine of progress — see you next time.");
  return lines;
}

// --------------------------------------------------------------------------
// Streaks
// --------------------------------------------------------------------------

function currentStreak(history: WorkoutSession[]): number {
  const days = new Set(history.map((session) => new Date(session.completedAt).toDateString()));
  const cursor = new Date();
  if (!days.has(cursor.toDateString())) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(cursor.toDateString())) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function longestStreak(history: WorkoutSession[]): number {
  const days = Array.from(new Set(history.map((session) => new Date(session.completedAt).toDateString())))
    .map((value) => new Date(value).getTime())
    .sort((a, b) => a - b);
  let best = 0;
  let run = 0;
  let prev = 0;
  for (const time of days) {
    if (prev && Math.round((time - prev) / DAY_MS) === 1) run += 1;
    else run = 1;
    best = Math.max(best, run);
    prev = time;
  }
  return best;
}

// --------------------------------------------------------------------------
// 7. Personal records
// --------------------------------------------------------------------------

export type PersonalRecords = {
  heaviestWeight: { value: number; name: string } | null;
  highestVolume: { value: number; date: string } | null;
  bestE1RM: { value: number; name: string } | null;
  longestStreak: number;
  mostImproved: { name: string; delta: number } | null;
};

export function personalRecords(history: WorkoutSession[]): PersonalRecords {
  let heaviest: { value: number; name: string } | null = null;
  let bestE1RM: { value: number; name: string } | null = null;
  let highestVolume: { value: number; date: string } | null = null;

  for (const session of history) {
    const volume = sessionVolume(session);
    if (volume > 0 && (!highestVolume || volume > highestVolume.value)) {
      highestVolume = { value: Math.round(volume), date: session.completedAt };
    }
    for (const result of session.exercises) {
      for (const set of result.sets) {
        if (!set.complete) continue;
        if (!heaviest || set.weight > heaviest.value) heaviest = { value: set.weight, name: result.name };
        const e1rm = estimate1RM(set.weight, set.reps);
        if (!bestE1RM || e1rm > bestE1RM.value) bestE1RM = { value: e1rm, name: result.name };
      }
    }
  }

  const trends = strengthTrends(history);
  const improved = trends
    .filter((trend) => trend.current > trend.previous)
    .map((trend) => ({ name: trend.name, delta: trend.current - trend.previous }))
    .sort((a, b) => b.delta - a.delta);

  return {
    heaviestWeight: heaviest,
    highestVolume,
    bestE1RM,
    longestStreak: longestStreak(history),
    mostImproved: improved[0] ?? null,
  };
}

// --------------------------------------------------------------------------
// 8. Strength trends (previous vs current per lift)
// --------------------------------------------------------------------------

export type StrengthTrend = {
  name: string;
  previous: number;
  current: number;
  trend: "improving" | "maintaining" | "declining";
};

export function strengthTrends(history: WorkoutSession[]): StrengthTrend[] {
  // Chronological top completed weight per exercise per session.
  const byKey = new Map<string, { name: string; series: number[] }>();
  for (const session of history) {
    for (const result of session.exercises) {
      const done = result.sets.filter((set) => set.complete);
      if (!done.length) continue;
      const top = Math.max(...done.map((set) => set.weight));
      const key = result.libraryId ?? result.name;
      const entry = byKey.get(key) ?? { name: result.name, series: [] };
      entry.series.push(top);
      byKey.set(key, entry);
    }
  }

  const trends: StrengthTrend[] = [];
  for (const { name, series } of byKey.values()) {
    if (!series.length) continue;
    const current = series[series.length - 1];
    const previous = series.length >= 2 ? series[series.length - 2] : current;
    const trend = current > previous ? "improving" : current < previous ? "declining" : "maintaining";
    trends.push({ name, previous, current, trend });
  }
  return trends.slice(0, 6);
}

// --------------------------------------------------------------------------
// 9. Glute score
// --------------------------------------------------------------------------

export type ScoreBand = "Excellent" | "Good" | "Needs Attention";

export type GluteScore = {
  score: number;
  band: ScoreBand;
  gluteSets: number;
  consistency: number;
  progression: number;
  recovery: number;
};

function bandFor(score: number): ScoreBand {
  if (score >= 75) return "Excellent";
  if (score >= 50) return "Good";
  return "Needs Attention";
}

export function gluteScore(history: WorkoutSession[], weeklyTarget = 3): GluteScore {
  const gluteSets = muscleVolume(history, "glutes", 7);
  const sessions = weekSessionCount(history);
  const improving = strengthTrends(history).filter((trend) => trend.trend === "improving").length;

  const recentReadiness = history
    .filter((session) => Date.now() - new Date(session.completedAt).getTime() <= 7 * DAY_MS)
    .map((session) => session.readiness)
    .filter((value): value is number => typeof value === "number");
  const recoveryAvg = recentReadiness.length
    ? recentReadiness.reduce((sum, value) => sum + value, 0) / recentReadiness.length
    : 70;

  const gluteComponent = Math.min(1, gluteSets / 12);
  const consistencyComponent = Math.min(1, sessions / weeklyTarget);
  const progressionComponent = Math.min(1, improving / 2);
  const recoveryComponent = Math.min(1, recoveryAvg / 100);

  const score = Math.round(
    100 * (0.35 * gluteComponent + 0.25 * consistencyComponent + 0.2 * progressionComponent + 0.2 * recoveryComponent),
  );

  return {
    score,
    band: bandFor(score),
    gluteSets,
    consistency: Math.round(consistencyComponent * 100),
    progression: improving,
    recovery: Math.round(recoveryAvg),
  };
}

// --------------------------------------------------------------------------
// 10. Coach dashboard
// --------------------------------------------------------------------------

export type CoachDashboard = {
  focus: string;
  strongestArea: string;
  needsImprovement: string;
  recoveryStatus: string;
  nextMilestone: string;
  weeklyCompletion: string;
  completionPct: number;
};

export function coachDashboard(profile: UserProfile, history: WorkoutSession[]): CoachDashboard {
  const areas: { label: string; volume: number }[] = [
    { label: "Glutes", volume: muscleVolume(history, "glutes", 28) },
    { label: "Upper body", volume: muscleVolume(history, "back", 28) + muscleVolume(history, "shoulders", 28) + muscleVolume(history, "chest", 28) },
    { label: "Core", volume: muscleVolume(history, "core", 28) },
    { label: "Legs", volume: muscleVolume(history, "quads", 28) + muscleVolume(history, "hamstrings", 28) },
  ];
  const sorted = [...areas].sort((a, b) => b.volume - a.volume);
  const strongest = sorted[0];
  const needs = sorted[sorted.length - 1];

  const sessions = weekSessionCount(history);
  const completionPct = Math.min(100, Math.round((sessions / profile.trainingDays) * 100));
  const streak = currentStreak(history);
  const readinessValues = history
    .filter((session) => Date.now() - new Date(session.completedAt).getTime() <= 7 * DAY_MS)
    .map((session) => session.readiness)
    .filter((value): value is number => typeof value === "number");
  const recovery = readinessValues.length
    ? Math.round(readinessValues.reduce((sum, value) => sum + value, 0) / readinessValues.length)
    : null;

  return {
    focus: `Foundation · ${GOAL_LABELS[profile.goal]}`,
    strongestArea: strongest && strongest.volume > 0 ? strongest.label : "Building your baseline",
    needsImprovement: needs && strongest.volume > 0 ? needs.label : "Log a few sessions to compare",
    recoveryStatus: recovery === null ? "Log a readiness check-in" : recovery >= 70 ? "Well recovered" : recovery >= 45 ? "Moderately recovered" : "Recovery is low",
    nextMilestone: streak >= 1 ? `Extend your ${streak}-day streak` : "Complete your first session this week",
    weeklyCompletion: `${sessions} / ${profile.trainingDays} sessions`,
    completionPct,
  };
}

// --------------------------------------------------------------------------
// 11. End-of-week review
// --------------------------------------------------------------------------

export type WeeklyReview = {
  workouts: number;
  consistency: number;
  volume: number;
  strengthGained: number;
  summary: string;
  nextGoal: string;
};

export function weeklyReview(profile: UserProfile, history: WorkoutSession[]): WeeklyReview {
  const now = Date.now();
  const week = history.filter((session) => now - new Date(session.completedAt).getTime() <= 7 * DAY_MS);
  const workouts = week.length;
  const consistency = Math.min(100, Math.round((workouts / profile.trainingDays) * 100));
  const volume = Math.round(week.reduce((sum, session) => sum + sessionVolume(session), 0));
  const strengthGained = strengthTrends(history).filter((trend) => trend.trend === "improving").length;

  let summary: string;
  if (workouts === 0) summary = "A quiet week. A single session is enough to restart the momentum.";
  else if (consistency >= 100) summary = `Complete week — all ${profile.trainingDays} sessions logged. Beautifully consistent.`;
  else summary = `You logged ${workouts} of ${profile.trainingDays} planned sessions. Keep the rhythm building.`;

  const nextGoal =
    consistency >= 100
      ? "Add a little load or one clean rep where effort felt easy."
      : `Aim for ${profile.trainingDays} sessions and hit every working set.`;

  return { workouts, consistency, volume, strengthGained, summary, nextGoal };
}
