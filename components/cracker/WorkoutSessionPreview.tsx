"use client";

import { exerciseDoseLabel, isHoldExercise } from "@/lib/holdExercise";
import { buildSessionBlocks, supersetMarkFor } from "@/lib/superset";
import type { Exercise, Workout } from "@/lib/types";
import { isWodExerciseName } from "@/lib/wod";

function dose(exercise: Exercise): string {
  if (isHoldExercise(exercise)) {
    return exerciseDoseLabel(exercise).replace(/\s·\sRPE\s+\d+(\.\d+)?$/i, "");
  }
  if (exercise.repMin === exercise.repMax) {
    return `${exercise.sets} × ${exercise.repMin}`;
  }
  return `${exercise.sets} × ${exercise.repMin}–${exercise.repMax}`;
}

function wodLines(exercise: Exercise): { title: string; detail: string } {
  const title = exercise.name.replace(/^WOD\s*·\s*/i, "WOD · ");
  const detail = (exercise.notes ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)[0] ?? "";
  return { title, detail };
}

export function WorkoutSessionPreview({ workout }: { workout: Workout }) {
  const blocks = buildSessionBlocks(workout.exercises);
  const strengthCount = workout.exercises.filter((exercise) => !isWodExerciseName(exercise.name)).length;
  const wod = workout.exercises.find((exercise) => isWodExerciseName(exercise.name));
  const wodLabel = wod ? wod.name.replace(/^WOD\s*·\s*/i, "") : null;
  const summary =
    strengthCount > 0
      ? `${strengthCount} lift${strengthCount === 1 ? "" : "s"}${wodLabel ? ` · ${wodLabel}` : ""}`
      : wodLabel ?? "Session preview";

  return (
    <details className="workout-preview">
      <summary>
        <span className="eyebrow">What you’ll do</span>
        <strong>{summary}</strong>
      </summary>
      <ol className="workout-preview-list">
        {blocks.map((block) => {
          const exercises = block.indices
            .map((index) => workout.exercises[index])
            .filter((exercise): exercise is Exercise => Boolean(exercise));
          if (exercises.length === 0) return null;

          if (exercises.length === 1 && isWodExerciseName(exercises[0].name)) {
            const line = wodLines(exercises[0]);
            return (
              <li key={exercises[0].id} className="workout-preview-wod">
                <strong>{line.title}</strong>
                {line.detail ? <span>{line.detail}</span> : null}
              </li>
            );
          }

          if (block.kind === "superset") {
            return (
              <li key={`ss-${block.letter}-${block.indices[0]}`} className="workout-preview-superset">
                <p className="eyebrow">Superset {block.letter}</p>
                <ul>
                  {exercises.map((exercise, position) => (
                    <li key={exercise.id}>
                      <strong>
                        {supersetMarkFor(exercise, block.letter, position + 1)} {exercise.name}
                      </strong>
                      <span>{dose(exercise)}</span>
                    </li>
                  ))}
                </ul>
              </li>
            );
          }

          return (
            <li key={exercises[0].id}>
              <strong>{exercises[0].name}</strong>
              <span>{dose(exercises[0])}</span>
            </li>
          );
        })}
      </ol>
    </details>
  );
}
