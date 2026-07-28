/**
 * Exercise swaps — pick a scientifically related alternative and apply it
 * to a programmed exercise while keeping the instance id stable.
 */

import {
  ALL_EXERCISE_IDS,
  EXERCISES,
  defaultIncrement,
  getExercise,
} from "./exercises";
import type { Equipment } from "./exercises";
import type { Exercise } from "./types";
import type { EquipmentAccess } from "./user";

export type SwapReason = "substitution" | "same_pattern" | "same_muscle";

export type SwapCandidate = {
  id: string;
  name: string;
  reason: SwapReason;
  /** Keep programmed load when the movement family is close enough. */
  preserveWeight: boolean;
};

function allowedEquipment(access: EquipmentAccess): Equipment[] {
  switch (access) {
    case "full_gym":
      return ["barbell", "dumbbell", "machine", "cable", "bodyweight", "band", "none"];
    case "dumbbells":
      return ["dumbbell", "bodyweight", "band", "none"];
    case "bands":
      return ["band", "bodyweight", "none"];
    case "bodyweight":
      return ["bodyweight", "none"];
    default:
      return ["bodyweight", "none"];
  }
}

function isFamilyMatch(fromId: string, toId: string): boolean {
  const from = EXERCISES[fromId];
  const to = EXERCISES[toId];
  if (!from || !to) return false;
  if (from.substitutions.includes(toId) || to.substitutions.includes(fromId)) return true;
  const sharedMuscle = from.primaryMuscles.some((m) => to.primaryMuscles.includes(m));
  return from.movementPattern === to.movementPattern && sharedMuscle;
}

/**
 * Ranked swap options for an exercise.
 * Prefer explicit substitutions, then same pattern + muscle, then muscle-only.
 */
export function swapCandidates(
  exerciseId: string | undefined,
  equipmentAccess: EquipmentAccess = "full_gym",
): SwapCandidate[] {
  if (!exerciseId) return [];
  const definition = EXERCISES[exerciseId];
  if (!definition) return [];

  const allowed = allowedEquipment(equipmentAccess);
  const seen = new Set<string>([exerciseId]);
  const out: SwapCandidate[] = [];

  const push = (id: string, reason: SwapReason) => {
    if (seen.has(id)) return;
    const candidate = EXERCISES[id];
    if (!candidate) return;
    if (!allowed.includes(candidate.equipment)) return;
    seen.add(id);
    out.push({
      id,
      name: candidate.name,
      reason,
      preserveWeight: isFamilyMatch(exerciseId, id),
    });
  };

  for (const id of definition.substitutions) push(id, "substitution");

  for (const id of ALL_EXERCISE_IDS) {
    const candidate = EXERCISES[id];
    if (!candidate) continue;
    if (candidate.movementPattern !== definition.movementPattern) continue;
    if (!candidate.primaryMuscles.some((m) => definition.primaryMuscles.includes(m))) continue;
    push(id, "same_pattern");
  }

  for (const id of ALL_EXERCISE_IDS) {
    const candidate = EXERCISES[id];
    if (!candidate) continue;
    if (!candidate.primaryMuscles.some((m) => definition.primaryMuscles.includes(m))) continue;
    push(id, "same_muscle");
  }

  return out.slice(0, 8);
}

/** Apply a library swap onto an exercise instance (keeps instance `id`). */
export function applyExerciseSwap(exercise: Exercise, candidateId: string): Exercise {
  const fromId = exercise.exerciseId;
  const candidate = getExercise(candidateId);
  if (!candidate) return exercise;

  const preserveWeight = fromId ? isFamilyMatch(fromId, candidateId) : false;
  const cue = candidate.coachingCues[0] ?? exercise.notes;

  return {
    ...exercise,
    exerciseId: candidate.id,
    name: candidate.name,
    repMin: candidate.repRange.min,
    repMax: candidate.repRange.max,
    restSeconds: candidate.restSeconds,
    increment: defaultIncrement(candidate.equipment),
    weight: preserveWeight ? exercise.weight : 0,
    notes: cue,
    videoUrl: undefined,
  };
}

export function swapReasonLabel(reason: SwapReason): string {
  switch (reason) {
    case "substitution":
      return "Direct swap";
    case "same_pattern":
      return "Same pattern";
    case "same_muscle":
      return "Same focus";
  }
}
