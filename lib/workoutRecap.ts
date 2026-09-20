import { sessionVolume } from "@/lib/analytics";
import { postWorkoutSummary } from "@/lib/coach";
import type { ExerciseResult, WorkoutSession } from "@/lib/types";
import { formatWodScore, isWodExerciseName } from "@/lib/wod";

export type RecapLift = {
  name: string;
  best: string;
  vsLast?: string;
};

export type RecapWod = {
  name: string;
  score: string;
};

export type WorkoutRecap = {
  session: WorkoutSession;
  dateLabel: string;
  weekLabel: string;
  setsDone: number;
  setsTotal: number;
  volumeKg: number;
  lifts: RecapLift[];
  wods: RecapWod[];
  coachLines: string[];
  volumeVsLast?: string;
};

function bestCompleteSet(exercise: ExerciseResult): { weight: number; reps: number; rpe: number } | null {
  const complete = exercise.sets.filter((set) => set.complete);
  if (!complete.length) return null;
  return complete.reduce((best, set) => {
    if (set.weight > best.weight) return set;
    if (set.weight === best.weight && set.reps > best.reps) return set;
    return best;
  });
}

function formatBest(set: { weight: number; reps: number; rpe: number }): string {
  const load = set.weight > 0 ? `${set.weight} kg × ${set.reps}` : `${set.reps} reps`;
  return set.rpe ? `${load} · RPE ${set.rpe}` : load;
}

function previousSameWorkout(
  session: WorkoutSession,
  history: WorkoutSession[],
): WorkoutSession | undefined {
  const others = history
    .filter((entry) => entry.id !== session.id)
    .filter(
      (entry) =>
        entry.workoutId === session.workoutId ||
        entry.workoutTitle.replace(/\s*·\s*Wk\d+/i, "").trim().toLowerCase() ===
          session.workoutTitle.replace(/\s*·\s*Wk\d+/i, "").trim().toLowerCase(),
    )
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt));
  return others[0];
}

function liftDelta(
  current: { weight: number; reps: number },
  previous: ExerciseResult | undefined,
): string | undefined {
  const prior = previous ? bestCompleteSet(previous) : null;
  if (!prior) return undefined;
  const kg = current.weight - prior.weight;
  const reps = current.reps - prior.reps;
  if (kg === 0 && reps === 0) return "same as last time";
  const parts: string[] = [];
  if (kg !== 0) parts.push(`${kg > 0 ? "+" : ""}${kg} kg`);
  if (reps !== 0) parts.push(`${reps > 0 ? "+" : ""}${reps} reps`);
  return `vs last: ${parts.join(", ")}`;
}

export function buildWorkoutRecap(session: WorkoutSession, history: WorkoutSession[]): WorkoutRecap {
  const setsDone = session.exercises.reduce(
    (sum, exercise) => sum + exercise.sets.filter((set) => set.complete).length,
    0,
  );
  const setsTotal = session.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0);
  const volumeKg = Math.round(sessionVolume(session));
  const previous = previousSameWorkout(session, history);
  const priorByName = new Map((previous?.exercises ?? []).map((exercise) => [exercise.name.toLowerCase(), exercise]));

  const lifts: RecapLift[] = [];
  const wods: RecapWod[] = [];
  for (const exercise of session.exercises) {
    if (isWodExerciseName(exercise.name) || exercise.wodResult) {
      wods.push({
        name: exercise.name.replace(/^WOD\s*·\s*/i, ""),
        score: formatWodScore(exercise.wodResult),
      });
      continue;
    }
    const best = bestCompleteSet(exercise);
    if (!best) continue;
    lifts.push({
      name: exercise.name,
      best: formatBest(best),
      vsLast: liftDelta(best, priorByName.get(exercise.name.toLowerCase())),
    });
  }

  let volumeVsLast: string | undefined;
  if (previous) {
    const delta = volumeKg - Math.round(sessionVolume(previous));
    if (delta !== 0) volumeVsLast = `${delta > 0 ? "+" : ""}${delta} kg vs last ${previous.workoutTitle}`;
    else volumeVsLast = "Same volume as last time";
  }

  const date = new Date(session.completedAt);
  const dateLabel = Number.isFinite(date.getTime())
    ? date.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })
    : "Session";

  return {
    session,
    dateLabel,
    weekLabel: session.week ? `Week ${session.week}` : "Session",
    setsDone,
    setsTotal,
    volumeKg,
    lifts,
    wods,
    coachLines: postWorkoutSummary(session, history),
    volumeVsLast,
  };
}

export function buildWorkoutRecaps(history: WorkoutSession[]): WorkoutRecap[] {
  const sorted = [...history].sort((a, b) => b.completedAt.localeCompare(a.completedAt));
  return sorted.map((session) => buildWorkoutRecap(session, history));
}
