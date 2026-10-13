import type { Exercise, ExerciseResult } from "./types";
import { isWodExerciseName } from "./wod";

export type SessionBlock = {
  kind: "single" | "superset";
  letter: string;
  indices: number[];
};

const SUPERSET_MARK = /(?:\bSS\b|\(SS\s*w\/|superset)/i;

export function exerciseIsSupersetMember(exercise: Exercise): boolean {
  if (isWodExerciseName(exercise.name)) return false;
  if (exercise.supersetKey) return true;
  return SUPERSET_MARK.test(exercise.notes ?? "");
}

export function buildSessionBlocks(exercises: Exercise[]): SessionBlock[] {
  const blocks: SessionBlock[] = [];
  let i = 0;
  while (i < exercises.length) {
    const current = exercises[i];
    if (current && exerciseIsSupersetMember(current)) {
      const key = current.supersetKey;
      const group = [i];
      let j = i + 1;
      while (j < exercises.length) {
        const next = exercises[j];
        if (!next || isWodExerciseName(next.name)) break;
        if (key) {
          if (next.supersetKey !== key) break;
        } else if (!exerciseIsSupersetMember(next)) {
          break;
        }
        group.push(j);
        j += 1;
      }
      if (group.length >= 2) {
        blocks.push({ kind: "superset", letter: "", indices: group });
        i = j;
        continue;
      }
    }
    blocks.push({ kind: "single", letter: "", indices: [i] });
    i += 1;
  }

  return blocks.map((block, index) => {
    const letter = block.indices
      .map((idx) => exercises[idx]?.supersetKey)
      .find((value) => value?.trim())
      ?.trim()
      .charAt(0)
      .toUpperCase() || String.fromCharCode(65 + index);
    return { ...block, letter };
  });
}

export function blockContaining(blocks: SessionBlock[], exerciseIndex: number): SessionBlock {
  return (
    blocks.find((block) => block.indices.includes(exerciseIndex)) ??
    blocks[0] ?? { kind: "single", letter: "A", indices: [exerciseIndex] }
  );
}

export function blockIndexOf(blocks: SessionBlock[], exerciseIndex: number): number {
  const index = blocks.findIndex((block) => block.indices.includes(exerciseIndex));
  return index >= 0 ? index : 0;
}

export function supersetMarkFor(exercise: Exercise, letter: string, position: number): string {
  const existing = exercise.supersetMark?.trim();
  if (existing) return existing.toUpperCase();
  return `${letter}${position}`;
}

export function sharedSupersetRestSeconds(exercises: Exercise[]): number {
  const lead = exercises[0]?.restSeconds ?? 0;
  const parsed = exercises
    .map((exercise) => exercise.notes.match(/(\d+)\s*[–-]\s*(\d+)\s*s/i))
    .find((match): match is RegExpMatchArray => Boolean(match));
  if (parsed) {
    const low = Number(parsed[1]);
    const high = Number(parsed[2]);
    if (Number.isFinite(low) && Number.isFinite(high)) {
      return Math.round((low + high) / 2);
    }
  }
  return lead || exercises[exercises.length - 1]?.restSeconds || 70;
}

export function sharedSupersetRestLabel(exercises: Exercise[]): string {
  const fromNotes = exercises
    .map((exercise) => exercise.notes.match(/(\d+)\s*[–-]\s*(\d+)\s*s/i))
    .find((match): match is RegExpMatchArray => Boolean(match));
  if (fromNotes) {
    return `Rest ${fromNotes[1]}–${fromNotes[2]} sec after completing both exercises`;
  }
  const seconds = sharedSupersetRestSeconds(exercises);
  return `Rest ${seconds} sec after completing both exercises`;
}

export function blockIsComplete(
  block: SessionBlock,
  exercises: Exercise[],
  results: ExerciseResult[],
  isWodComplete: (result: ExerciseResult) => boolean,
): boolean {
  return block.indices.every((index) => {
    const exercise = exercises[index];
    const result = results[index];
    if (!exercise || !result) return false;
    if (isWodExerciseName(exercise.name)) return isWodComplete(result);
    return result.sets.length > 0 && result.sets.every((set) => set.complete || set.skipped);
  });
}

export function blockProgressPct(
  block: SessionBlock,
  exercises: Exercise[],
  results: ExerciseResult[],
  isWodComplete: (result: ExerciseResult) => boolean,
): number {
  let done = 0;
  let total = 0;
  for (const index of block.indices) {
    const exercise = exercises[index];
    const result = results[index];
    if (!exercise || !result) continue;
    if (isWodExerciseName(exercise.name)) {
      total += 1;
      if (isWodComplete(result)) done += 1;
      continue;
    }
    total += result.sets.length;
    done += result.sets.filter((set) => set.complete || set.skipped).length;
  }
  return total ? Math.round((done / total) * 100) : 0;
}

export function stampSupersetFields(exercises: Exercise[]): Exercise[] {
  const blocks = buildSessionBlocks(exercises);
  return exercises.map((exercise, index) => {
    const block = blocks.find((item) => item.indices.includes(index));
    if (!block || block.kind !== "superset") return exercise;
    const position = block.indices.indexOf(index) + 1;
    return {
      ...exercise,
      supersetKey: block.letter,
      supersetMark: `${block.letter}${position}`,
    };
  });
}
