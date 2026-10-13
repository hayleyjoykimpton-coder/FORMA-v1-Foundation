"use client";

import { useEffect, useState } from "react";
import { exerciseCoaching, previousPerformance } from "@/lib/coach";
import {
  formatHoldDuration,
  formatMmSs,
  holdTargetLabel,
  isHoldExercise,
  parseMmSs,
} from "@/lib/holdExercise";
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

function HoldTimer({
  elapsed,
  running,
  targetLabel,
  activeSetIndex,
  onToggle,
  onLog,
  onReset,
}: {
  elapsed: number;
  running: boolean;
  targetLabel: string;
  activeSetIndex: number | null;
  onToggle: () => void;
  onLog: () => void;
  onReset: () => void;
}) {
  const canLog = elapsed > 0 && activeSetIndex != null;
  return (
    <div className="hold-timer-block">
      <div className="wod-timer-row">
        <div className={`wod-timer${running ? " running" : ""}`} aria-live="polite">
          <span className="eyebrow">{running ? "Holding" : "Hold timer"}</span>
          <strong>{formatMmSs(elapsed)}</strong>
        </div>
        <div className="wod-timer-actions">
          <button type="button" className="secondary-btn" onClick={onToggle}>
            {running ? "Pause" : "Start"}
          </button>
          <button type="button" className="hold-log-btn" disabled={!canLog} onClick={onLog}>
            Stop & log
          </button>
          <button type="button" className="ghost-btn" onClick={onReset}>
            Reset
          </button>
        </div>
      </div>
      <p className="hold-timer-hint">
        {activeSetIndex != null
          ? `Start when you are in position. Stop & log saves the time into set ${activeSetIndex + 1} (${targetLabel}).`
          : "All sets are logged. Reset if you need to recapture a hold."}
      </p>
    </div>
  );
}

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
  const [holdElapsed, setHoldElapsed] = useState(0);
  const [holdRunning, setHoldRunning] = useState(false);
  const recommendation = getRecommendation(exercise, history, phaseDef);
  const prev = previousPerformance(exercise, history);
  const coaching = exerciseCoaching(exercise);
  const candidates = swapCandidates(exercise.exerciseId, equipmentAccess);
  const timedHold = isHoldExercise(exercise);
  const activeHoldSet = timedHold
    ? result.sets.findIndex((set) => !set.complete && !set.skipped)
    : -1;

  useEffect(() => {
    setHoldRunning(false);
    setHoldElapsed(0);
  }, [exercise.id]);

  useEffect(() => {
    if (!holdRunning) return;
    const started = Date.now() - holdElapsed * 1000;
    const id = window.setInterval(() => {
      setHoldElapsed(Math.floor((Date.now() - started) / 1000));
    }, 250);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- restart only when running flips
  }, [holdRunning]);

  const resetHoldTimer = () => {
    setHoldRunning(false);
    setHoldElapsed(0);
  };

  const logHold = (setIndex: number, seconds: number) => {
    onUpdateSet(exerciseIndex, setIndex, {
      holdSeconds: seconds,
      reps: 0,
      skipped: false,
    });
    onCompleteSet(exerciseIndex, setIndex, true);
    resetHoldTimer();
  };

  const pbLabel = timedHold
    ? prev.pbHoldSeconds > 0
      ? `PB ${prev.pbWeight > 0 ? `${prev.pbWeight}kg · ` : ""}${formatHoldDuration(prev.pbHoldSeconds)}`
      : prev.pbWeight > 0
        ? `PB ${prev.pbWeight}kg`
        : null
    : prev.pbWeight > 0
      ? `PB ${prev.pbWeight}kg × ${prev.pbReps}`
      : null;

  return (
    <div className="session-superset-leg">
      <div className="session-superset-leg-head">
        {mark ? <span className="session-superset-mark">{mark}</span> : null}
        <div>
          {mark ? <h2>{exercise.name}</h2> : null}
          <p className="session-meta">
            <span>{exercise.sets} sets</span>
            <span>{timedHold ? holdTargetLabel(exercise) : `${exercise.repMin}–${exercise.repMax} reps`}</span>
            <span>RPE {exercise.rpe}</span>
          </p>
        </div>
      </div>

      <article className="card coach-prev">
        <div className="coach-prev-head">
          <span className="eyebrow">Last session</span>
          {pbLabel ? <span className="season-pill">{pbLabel}</span> : null}
        </div>
        {prev.hasData ? (
          <div className="coach-prev-stats">
            <div><small>Weight</small><strong>{Math.max(...prev.weights)}kg</strong></div>
            {timedHold ? (
              <div>
                <small>Time</small>
                <strong>{prev.holds.length ? prev.holds.map(formatHoldDuration).join(" / ") : "—"}</strong>
              </div>
            ) : (
              <div><small>Reps</small><strong>{prev.reps.join(" / ")}</strong></div>
            )}
            <div><small>Avg RPE</small><strong>{prev.avgRpe}</strong></div>
            {timedHold ? (
              <div>
                <small>Longest</small>
                <strong>{prev.pbHoldSeconds > 0 ? formatHoldDuration(prev.pbHoldSeconds) : "—"}</strong>
              </div>
            ) : (
              <div><small>Volume</small><strong>{Math.round(prev.volume)}kg</strong></div>
            )}
          </div>
        ) : (
          <p className="muted">First time logging this exercise — today sets your baseline.</p>
        )}
        <p className="coach-prev-rec"><strong>Today:</strong> {recommendation.title}. {recommendation.detail}</p>
      </article>

      <article className="card session-card">
        {timedHold ? (
          <HoldTimer
            elapsed={holdElapsed}
            running={holdRunning}
            targetLabel={holdTargetLabel(exercise)}
            activeSetIndex={activeHoldSet >= 0 ? activeHoldSet : null}
            onToggle={() => setHoldRunning((value) => !value)}
            onLog={() => {
              if (activeHoldSet < 0 || holdElapsed <= 0) return;
              logHold(activeHoldSet, holdElapsed);
            }}
            onReset={resetHoldTimer}
          />
        ) : null}
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
              {timedHold ? (
                <label>
                  <span>sec</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    step="1"
                    value={set.holdSeconds ? set.holdSeconds : ""}
                    placeholder="0"
                    onFocus={(event) => event.target.select()}
                    onChange={(event) => {
                      const seconds = parseMmSs(event.target.value);
                      onUpdateSet(exerciseIndex, setIndex, {
                        holdSeconds: seconds,
                        reps: 0,
                        skipped: false,
                      });
                    }}
                  />
                </label>
              ) : (
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
              )}
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
                  onClick={() => {
                    if (timedHold && !set.complete) {
                      const seconds = set.holdSeconds || (holdElapsed > 0 ? holdElapsed : undefined);
                      if (seconds) {
                        logHold(setIndex, seconds);
                        return;
                      }
                    }
                    onCompleteSet(exerciseIndex, setIndex, !set.complete);
                  }}
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
