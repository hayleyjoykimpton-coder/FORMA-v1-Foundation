import type { Exercise, SetResult } from "./types";
import { formatMmSs, parseMmSs } from "./wod";

const HOLD_NAME =
  /\b((weighted|side|reverse|long)\s+)?plank\b|\bwall[\s-]?sit\b|\bdead[\s-]?hang\b|\bhollow\s*(hold|body)\b|\bl[\s-]?sit\b|\bfarmer'?s?\s*hold\b|\bstatic\s+hold\b|\bhanging\s+hold\b/i;

export function isHoldExercise(exercise: {
  name?: string;
  notes?: string;
  exerciseId?: string;
}): boolean {
  const name = exercise.name ?? "";
  const id = (exercise.exerciseId ?? "").replace(/_/g, " ");
  if (HOLD_NAME.test(name) || HOLD_NAME.test(id)) return true;
  return /\b\d+\s*(s|sec|secs|seconds)\s*holds?\b/i.test(`${name} ${exercise.notes ?? ""}`);
}

/** Target hold in seconds from the name or programmed notes, if present. */
export function parseHoldTargetSeconds(exercise: {
  name?: string;
  notes?: string;
}): number | undefined {
  const name = exercise.name ?? "";
  const notes = exercise.notes ?? "";
  const fromName = name.match(/(\d+)\s*(s|sec|secs|seconds)\b/i);
  if (fromName) return Number(fromName[1]);

  const weekMatch = notes.match(/\bWk\s*(\d+)\b/i);
  const week = weekMatch ? Number(weekMatch[1]) : undefined;
  const fromNotes = notes.match(/(\d+)\s*(s|sec|secs|seconds)\s*holds?\b/i);
  if (!fromNotes) return undefined;
  if (week != null && week < 4) return undefined;
  return Number(fromNotes[1]);
}

export function holdTargetLabel(exercise: Pick<Exercise, "name" | "notes" | "sets">): string {
  const target = parseHoldTargetSeconds(exercise);
  return target ? `${target}s hold` : "Hold for time";
}

export function formatHoldDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  if (s < 60) return `${s}s`;
  return formatMmSs(s);
}

export function setHoldSeconds(set: SetResult): number | undefined {
  if (set.holdSeconds != null && set.holdSeconds > 0) return set.holdSeconds;
  return undefined;
}

export function exerciseDoseLabel(
  exercise: Pick<Exercise, "name" | "notes" | "exerciseId" | "sets" | "repMin" | "repMax" | "rpe" | "weight">,
  options?: { includeWeight?: boolean },
): string {
  const parts = isHoldExercise(exercise)
    ? [`${exercise.sets} × ${holdTargetLabel(exercise)}`]
    : [`${exercise.sets} × ${exercise.repMin}–${exercise.repMax}`];
  if (options?.includeWeight && exercise.weight > 0) parts.push(`${exercise.weight} kg`);
  parts.push(`RPE ${exercise.rpe}`);
  return parts.join(" · ");
}

export { formatMmSs, parseMmSs };
