import type { WorkoutSession } from "./types";

/**
 * Union workout histories by session id. Prefer the richer / newer copy when
 * both sides have the same id — never let a shorter cloud array wipe local logs.
 */
export function mergeHistories(
  local: WorkoutSession[],
  cloud: WorkoutSession[],
): WorkoutSession[] {
  const byId = new Map<string, WorkoutSession>();

  const prefer = (a: WorkoutSession, b: WorkoutSession): WorkoutSession => {
    const aSets = a.exercises.reduce(
      (n, ex) => n + ex.sets.filter((set) => set.complete || set.skipped).length,
      0,
    );
    const bSets = b.exercises.reduce(
      (n, ex) => n + ex.sets.filter((set) => set.complete || set.skipped).length,
      0,
    );
    if (aSets !== bSets) return aSets > bSets ? a : b;
    return a.completedAt >= b.completedAt ? a : b;
  };

  for (const session of [...cloud, ...local]) {
    if (!session?.id) continue;
    const existing = byId.get(session.id);
    byId.set(session.id, existing ? prefer(existing, session) : session);
  }

  return Array.from(byId.values()).sort((a, b) =>
    a.completedAt.localeCompare(b.completedAt),
  );
}

/** Monday 00:00 local time for the week containing `date`. */
export function startOfWeekMonday(date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0 Sun … 6 Sat
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

/** Workout ids completed during the current Mon–Sun calendar week. */
export function completedWorkoutIdsThisWeek(
  history: WorkoutSession[],
  workouts: { id: string; title: string }[],
  now = new Date(),
): Set<string> {
  const start = startOfWeekMonday(now).getTime();
  const end = start + 7 * 24 * 60 * 60 * 1000;
  const ids = new Set<string>();

  for (const session of history) {
    const at = new Date(session.completedAt).getTime();
    if (!Number.isFinite(at) || at < start || at >= end) continue;
    if (session.workoutId) ids.add(session.workoutId);
    const byTitle = workouts.find((workout) => workout.title === session.workoutTitle);
    if (byTitle) ids.add(byTitle.id);
  }

  return ids;
}
