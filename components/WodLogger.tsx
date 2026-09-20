"use client";

import { useEffect, useState } from "react";
import type { Exercise, ExerciseResult } from "@/lib/types";
import {
  ensureWodResult,
  formatMmSs,
  formatWodScore,
  isWodResultComplete,
  parseMmSs,
  type WodLoad,
  type WodResult,
} from "@/lib/wod";

function LoadsEditor({
  loads,
  onChange,
}: {
  loads: WodLoad[];
  onChange: (loads: WodLoad[]) => void;
}) {
  return (
    <div className="wod-loads">
      <span className="eyebrow">Loads</span>
      {loads.map((load, index) => (
        <label key={`${load.label}-${index}`} className="field">
          <span>{load.label} (kg)</span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step={0.5}
            value={load.kg ?? ""}
            placeholder="—"
            onChange={(event) => {
              const next = [...loads];
              const kg = event.target.value === "" ? undefined : Number(event.target.value);
              next[index] = { ...load, kg: Number.isFinite(kg) ? kg : undefined };
              onChange(next);
            }}
          />
        </label>
      ))}
    </div>
  );
}

function TimerDisplay({ seconds, running }: { seconds: number; running: boolean }) {
  return (
    <div className={`wod-timer${running ? " running" : ""}`} aria-live="polite">
      <span className="eyebrow">{running ? "Timer" : "Clock"}</span>
      <strong>{formatMmSs(seconds)}</strong>
    </div>
  );
}

export function WodLogger({
  exercise,
  result,
  previousScore,
  onChange,
}: {
  exercise: Exercise;
  result: ExerciseResult;
  previousScore?: string;
  onChange: (wodResult: WodResult) => void;
}) {
  const wod = ensureWodResult(result.wodResult, exercise.name, exercise.notes);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const started = Date.now() - elapsed * 1000;
    const id = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - started) / 1000));
    }, 250);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- restart only when running flips
  }, [running]);

  const patch = (next: WodResult) => onChange(next);
  const saveStamp = () => new Date().toISOString();

  const saveAmrap = () => {
    if (wod.kind !== "amrap") return;
    patch({
      ...wod,
      durationSeconds: wod.durationSeconds ?? (elapsed > 0 ? elapsed : undefined),
      completedAt: saveStamp(),
    });
  };

  const saveForTime = () => {
    if (wod.kind !== "for_time" && wod.kind !== "ladder") return;
    const secs = wod.kind === "for_time" ? wod.completionSeconds : wod.completionSeconds;
    const fromTimer = elapsed > 0 ? elapsed : secs;
    if (wod.kind === "for_time") {
      patch({ ...wod, completionSeconds: fromTimer, completedAt: saveStamp() });
    } else {
      patch({ ...wod, completionSeconds: fromTimer, completed: true, completedAt: saveStamp() });
    }
  };

  return (
    <article className="card session-card wod-logger">
      <div className="session-meta">
        <span>WOD</span>
        <span>{wod.kind.replace(/_/g, " ").toUpperCase()}</span>
      </div>

      {exercise.notes ? (
        <p className="wod-prescription muted">{exercise.notes}</p>
      ) : null}

      {previousScore ? (
        <p className="wod-compare">
          <span className="eyebrow">Earlier score</span> {previousScore}
        </p>
      ) : null}

      {(wod.kind === "amrap" ||
        wod.kind === "for_time" ||
        wod.kind === "ladder" ||
        wod.kind === "interval") && (
        <div className="wod-timer-row">
          <TimerDisplay seconds={elapsed} running={running} />
          <div className="wod-timer-actions">
            <button type="button" className="secondary-btn" onClick={() => setRunning((r) => !r)}>
              {running ? "Pause" : "Start"}
            </button>
            <button
              type="button"
              className="ghost-btn"
              onClick={() => {
                setRunning(false);
                setElapsed(0);
              }}
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {wod.kind === "amrap" && (
        <>
          <div className="wod-grid-2">
            <label className="field">
              <span>Rounds</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={wod.rounds ?? ""}
                onChange={(e) =>
                  patch({
                    ...wod,
                    rounds: e.target.value === "" ? undefined : Number(e.target.value),
                  })
                }
              />
            </label>
            <label className="field">
              <span>Extra reps</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={wod.extraReps ?? ""}
                onChange={(e) =>
                  patch({
                    ...wod,
                    extraReps: e.target.value === "" ? undefined : Number(e.target.value),
                  })
                }
              />
            </label>
          </div>
          <LoadsEditor loads={wod.loads} onChange={(loads) => patch({ ...wod, loads })} />
          <p className="wod-score-preview">{formatWodScore(wod)}</p>
          <button type="button" className="cta-btn" onClick={saveAmrap} disabled={wod.rounds == null}>
            Save score
          </button>
        </>
      )}

      {(wod.kind === "for_time" || wod.kind === "ladder") && (
        <>
          <label className="field">
            <span>Time (MM:SS)</span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="5:48"
              value={
                wod.completionSeconds != null && wod.completionSeconds > 0
                  ? formatMmSs(wod.completionSeconds)
                  : ""
              }
              onChange={(e) => {
                const secs = parseMmSs(e.target.value);
                patch({ ...wod, completionSeconds: secs });
              }}
            />
          </label>
          <button
            type="button"
            className="secondary-btn"
            onClick={() => {
              setRunning(false);
              patch({ ...wod, completionSeconds: elapsed || wod.completionSeconds });
            }}
          >
            Use timer time
          </button>
          <LoadsEditor loads={wod.loads} onChange={(loads) => patch({ ...wod, loads })} />
          <p className="wod-score-preview">{formatWodScore(wod)}</p>
          <button
            type="button"
            className="cta-btn"
            onClick={saveForTime}
            disabled={!(wod.completionSeconds || elapsed)}
          >
            Save score
          </button>
        </>
      )}

      {wod.kind === "emom" && (
        <>
          <label className="field">
            <span>Rounds completed (optional)</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={wod.roundsCompleted ?? ""}
              onChange={(e) =>
                patch({
                  ...wod,
                  roundsCompleted: e.target.value === "" ? undefined : Number(e.target.value),
                })
              }
            />
          </label>
          <LoadsEditor loads={wod.loads} onChange={(loads) => patch({ ...wod, loads })} />
          <label className="field">
            <span>Notes</span>
            <input
              type="text"
              value={wod.notes ?? ""}
              onChange={(e) => patch({ ...wod, notes: e.target.value })}
            />
          </label>
          <button
            type="button"
            className="cta-btn"
            onClick={() => patch({ ...wod, completed: true, completedAt: saveStamp() })}
          >
            Mark completed
          </button>
        </>
      )}

      {wod.kind === "death_by" && (
        <>
          <label className="field">
            <span>Last fully completed minute</span>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              value={wod.lastCompletedMinute ?? ""}
              onChange={(e) =>
                patch({
                  ...wod,
                  lastCompletedMinute: e.target.value === "" ? undefined : Number(e.target.value),
                })
              }
            />
          </label>
          <label className="field">
            <span>Reps in incomplete round (optional)</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={wod.repsInIncompleteRound ?? ""}
              onChange={(e) =>
                patch({
                  ...wod,
                  repsInIncompleteRound: e.target.value === "" ? undefined : Number(e.target.value),
                })
              }
            />
          </label>
          <LoadsEditor loads={wod.loads} onChange={(loads) => patch({ ...wod, loads })} />
          <p className="wod-score-preview">{formatWodScore(wod)}</p>
          <button
            type="button"
            className="cta-btn"
            disabled={wod.lastCompletedMinute == null}
            onClick={() => patch({ ...wod, completedAt: saveStamp() })}
          >
            Save score
          </button>
        </>
      )}

      {wod.kind === "tabata" && (
        <>
          <LoadsEditor loads={wod.loads} onChange={(loads) => patch({ ...wod, loads })} />
          <label className="field">
            <span>Score (only if programme defines one)</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={wod.score ?? ""}
              onChange={(e) =>
                patch({
                  ...wod,
                  score: e.target.value === "" ? undefined : Number(e.target.value),
                })
              }
            />
          </label>
          <button
            type="button"
            className="cta-btn"
            onClick={() => patch({ ...wod, completed: true, completedAt: saveStamp() })}
          >
            Mark completed
          </button>
        </>
      )}

      {wod.kind === "interval" && (
        <>
          <span className="eyebrow">Set times</span>
          <div className="wod-interval-sets">
            {wod.setTimesSeconds.map((secs, index) => (
              <label key={index} className="field">
                <span>Set {index + 1} (MM:SS)</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="1:28"
                  value={secs > 0 ? formatMmSs(secs) : ""}
                  onChange={(e) => {
                    const next = [...wod.setTimesSeconds];
                    next[index] = parseMmSs(e.target.value) ?? 0;
                    patch({ ...wod, setTimesSeconds: next });
                  }}
                />
              </label>
            ))}
          </div>
          <LoadsEditor loads={wod.loads} onChange={(loads) => patch({ ...wod, loads })} />
          <p className="wod-score-preview">{formatWodScore(wod)}</p>
          <button
            type="button"
            className="cta-btn"
            disabled={!wod.setTimesSeconds.every((s) => s > 0)}
            onClick={() => patch({ ...wod, completedAt: saveStamp() })}
          >
            Save score
          </button>
        </>
      )}

      {wod.kind === "unknown" && (
        <>
          <LoadsEditor loads={wod.loads} onChange={(loads) => patch({ ...wod, loads })} />
          <label className="field">
            <span>Notes</span>
            <input
              type="text"
              value={wod.notes ?? ""}
              onChange={(e) => patch({ ...wod, notes: e.target.value })}
            />
          </label>
          <button
            type="button"
            className="cta-btn"
            onClick={() => patch({ ...wod, completed: true, completedAt: saveStamp() })}
          >
            Mark completed
          </button>
        </>
      )}

      {isWodResultComplete(result.wodResult) ? (
        <p className="wod-saved">Saved · {formatWodScore(result.wodResult)}</p>
      ) : null}
    </article>
  );
}
