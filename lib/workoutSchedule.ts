import type { Workout } from "./types";

/** Canonical weekday labels used by programme generation and schedule UI. */
export const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export type Weekday = (typeof WEEKDAYS)[number];

function weekdayRank(day: string): number {
  const index = WEEKDAYS.indexOf(day as Weekday);
  return index === -1 ? 99 : index;
}

/** Keep Training list + weekly strip in calendar order. */
export function sortWorkoutsByWeekday(workouts: Workout[]): Workout[] {
  return [...workouts].sort((a, b) => weekdayRank(a.day) - weekdayRank(b.day));
}

/**
 * Reorder two adjacent workouts and swap their day labels so the weekly
 * schedule stays coherent (missed Monday → nudge Glute Strength onto Tuesday).
 */
export function moveWorkoutWithDays(
  workouts: Workout[],
  id: string,
  direction: -1 | 1,
): Workout[] {
  const index = workouts.findIndex((workout) => workout.id === id);
  const destination = index + direction;
  if (index < 0 || destination < 0 || destination >= workouts.length) return workouts;

  const next = [...workouts];
  const a = next[index];
  const b = next[destination];
  next[index] = { ...b, day: a.day };
  next[destination] = { ...a, day: b.day };
  return next;
}

/**
 * Put a workout onto a target weekday. If another session already owns that
 * day, swap day labels so nothing is left orphaned. List is re-sorted by day.
 */
export function putWorkoutOnDay(
  workouts: Workout[],
  id: string,
  targetDay: string,
): Workout[] {
  const index = workouts.findIndex((workout) => workout.id === id);
  if (index < 0) return workouts;
  const current = workouts[index];
  if (current.day === targetDay) return workouts;

  const occupant = workouts.findIndex(
    (workout, i) => i !== index && workout.day === targetDay,
  );

  const next = workouts.map((workout, i) => {
    if (i === index) return { ...workout, day: targetDay };
    if (i === occupant) return { ...workout, day: current.day };
    return workout;
  });

  return sortWorkoutsByWeekday(next);
}
