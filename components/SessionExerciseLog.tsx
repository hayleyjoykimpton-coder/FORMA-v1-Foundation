"use client";

import { useState } from "react";
import { exerciseCoaching, previousPerformance } from "@/lib/coach";
import { getRecommendation } from "@/lib/progression";
import type { PhaseDefinition } from "@/lib/program";
import type { Exercise, ExerciseResult, SetResult, WorkoutSession } from "@/lib/types";
import {
  swapCandidates,
  swapReasonLabel,
} from "@/lib/exerciseSwap";
import type { EquipmentAccess } from "@/lib/user";

type Props = {
  exercise: Exercise;
  result: ExerciseResult;
  exerciseIndex: number;
  history: WorkoutSession[];
  phaseDef: PhaseDefinition;
  mark?: string;
  equipmentAccess?: EquipmentAccess;
  onSwap: (candidateId: string, exerciseIndex: number) => void;
  onUpdateSet: (exerciseIndex: number, setIndex: number, patch: Partial<SetResult>) => void;
  onSkipSet: (exerciseIndex: number, setIndex: number) => void;
  onNote: (exerciseIndex: number, note: string) => void;
  onCompleteSet: (exerciseIndex: number, setIndex: number, nextComplete: boolean) => void;
  parseNumberInput: (raw: string) => number;
};

export function SessionExerciseLog({
  exercise,
  result,
  exerciseIndex,
  history,
  phaseDef,
  mark,
  equipmentAccess = "full_gym",
  onSwap,
  onUpdateSet,
  onSkipSet,
  onNote,
  onCompleteSet,
  parseNumberInput,
}: Props) {
  const [swapOpen, setSwapOpen] = useState(false);
  const recommendation = getRecommendation(exercise, history, phaseDef);
  const prev = previousPerformance(exercise, history);
  const coaching = exerciseCoaching(exercise);
  const candidates = swapCandidates(exercise.exerciseId, equipmentAccess);

  return (
    <div className="session-superset-leg">
      <div className="session-superset-leg-head">
        {mark ? <span className="session-superset-mark">{mark}</span> : null}
        <div>
          {mark ? <h2>{exercise.name}</h2> : null}
          <p className="session-meta">
            <span>{exercise.sets} sets</span>
            <span>{exercise.repMin}–{exercise.repMax} reps</span>
            <span>RPE {exercise.rpe}</span>
          </p>
        </div>
      </div>

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
        <div className="set-list">
          {result.sets.map((set, setIndex) => (
            <article
              className={`set-row ${set.complete ? "complete" : ""}${set.skipped && !set.complete ? " skipped" : ""}`}
              key={setIndex}
            >
              <strong>Set {setIndex + 1}</strong>
              <label>
                <span>kg</span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.5"
                  value={set.weight === 0 ? "" : set.weight}
                  placeholder="0"
                  onFocus={(event) => event.target.select()}
                  onChange={(event) =>
                    onUpdateSet(exerciseIndex, setIndex, {
                      weight: parseNumberInput(event.target.value),
                      skipped: false,
                    })
                  }
                />
              </label>
              <label>
                <span>reps</span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={set.reps === 0 ? "" : set.reps}
                  placeholder="0"
                  onFocus={(event) => event.target.select()}
                  onChange={(event) =>
                    onUpdateSet(exerciseIndex, setIndex, {
                      reps: parseNumberInput(event.target.value),
                      skipped: false,
                    })
                  }
                />
              </label>
              <label>
                <span>RPE</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="1"
                  max="10"
                  step="0.5"
                  value={set.rpe === 0 ? "" : set.rpe}
                  placeholder="0"
                  onFocus={(event) => event.target.select()}
                  onChange={(event) =>
                    onUpdateSet(exerciseIndex, setIndex, {
                      rpe: parseNumberInput(event.target.value),
                      skipped: false,
                    })
                  }
                />
              </label>
              <div className="set-row-actions">
                <button
                  type="button"
                  className="set-complete"
                  onClick={() => onCompleteSet(exerciseIndex, setIndex, !set.complete)}
                >
                  {set.complete ? "✓" : "Done"}
                </button>
                {!set.complete ? (
                  <button
                    type="button"
                    className="set-skip"
                    onClick={() => onSkipSet(exerciseIndex, setIndex)}
                  >
                    {set.skipped ? "Skipped" : "Skip"}
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>

        <label className="field session-note-field">
          <span>Note for this exercise</span>
          <input
            value={result.note ?? ""}
            onChange={(event) => onNote(exerciseIndex, event.target.value)}
            placeholder="Felt strong, form cue, leftover fatigue…"
          />
        </label>
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
        <a
          className="video-link-btn"
          href={coaching.videoUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Watch form · {coaching.videoLabel}
        </a>
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
        {candidates.length > 0 ? (
          <div className="swap-panel">
            <div className="swap-panel-head">
              <strong>Swap exercise</strong>
              <button type="button" className="text-btn" onClick={() => setSwapOpen((open) => !open)}>
                {swapOpen ? "Hide" : "Show options"}
              </button>
            </div>
            {swapOpen && (
              <div className="swap-options">
                {candidates.map((candidate) => (
                  <button
                    key={candidate.id}
                    type="button"
                    className="swap-option"
                    onClick={() => onSwap(candidate.id, exerciseIndex)}
                  >
                    <span>{candidate.name}</span>
                    <small>
                      {swapReasonLabel(candidate.reason)}
                      {candidate.preserveWeight ? " · keeps load" : " · reset load"}
                    </small>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </article>
    </div>
  );
}
