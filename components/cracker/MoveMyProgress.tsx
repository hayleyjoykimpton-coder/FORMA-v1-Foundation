"use client";

import { useEffect, useMemo, useState } from "react";
import {
  formatSeconds,
  hasFitnessData,
  hasInBodyData,
  hasMeasurementsData,
  loadMoveCheckIns,
  numericalChange,
  MOVE_CHECKINS_CHANGED_EVENT,
  type CrackerMoveCheckIns,
} from "@/lib/crackerMoveCheckIns";
import {
  loadMoveChecklist,
  MOVE_CHECKLIST_CHANGED_EVENT,
  type MoveChecklistState,
} from "@/lib/crackerMoveChecklist";
import { crackerLevelFromExperience } from "@/lib/crackerProgram";
import { buildChallengeProgress } from "@/lib/crackerProgress";
import type { ExperienceLevel } from "@/lib/user";
import type { WorkoutSession } from "@/lib/types";

type Props = {
  currentWeek: number;
  experience: ExperienceLevel;
  history: WorkoutSession[];
  profileInitial: string;
  profilePhoto?: string;
  onOpenProfile: () => void;
};

export function MoveMyProgress({
  currentWeek,
  experience,
  history,
  profileInitial,
  profilePhoto,
  onOpenProfile,
}: Props) {
  const [checkIns, setCheckIns] = useState<CrackerMoveCheckIns>({});
  const [checklist, setChecklist] = useState<MoveChecklistState>({ weeks: {} });
  const level = crackerLevelFromExperience(experience);

  useEffect(() => {
    const refresh = () => {
      setCheckIns(loadMoveCheckIns());
      setChecklist(loadMoveChecklist());
    };
    refresh();
    window.addEventListener(MOVE_CHECKINS_CHANGED_EVENT, refresh);
    window.addEventListener(MOVE_CHECKLIST_CHANGED_EVENT, refresh);
    return () => {
      window.removeEventListener(MOVE_CHECKINS_CHANGED_EVENT, refresh);
      window.removeEventListener(MOVE_CHECKLIST_CHANGED_EVENT, refresh);
    };
  }, []);

  const summary = useMemo(
    () => buildChallengeProgress({ history, checklist, checkIns, level }),
    [history, checklist, checkIns, level],
  );

  const fitnessInitial = hasFitnessData(checkIns.fitness_initial);
  const fitnessFinal = hasFitnessData(checkIns.fitness_final);
  const inbodyInitial = hasInBodyData(checkIns.inbody_initial);
  const inbodyFinal = hasInBodyData(checkIns.inbody_final);
  const measInitial = hasMeasurementsData(checkIns.measurements_initial);
  const measFinal = hasMeasurementsData(checkIns.measurements_final);

  const cardioLabel =
    checkIns.fitness_final?.cardio500Mode === "ski" ||
    checkIns.fitness_initial?.cardio500Mode === "ski"
      ? "500M SKI"
      : checkIns.fitness_final?.cardio500Mode === "row" ||
          checkIns.fitness_initial?.cardio500Mode === "row"
        ? "500M ROW"
        : "500M SKI / ROW";

  return (
    <div className="screen cracker-screen cracker-move cracker-move-panel move-progress-screen">
      <header className="cracker-topbar">
        <div>
          <p className="cracker-screen-kicker">MOVE</p>
          <h1 className="cracker-screen-title">MY PROGRESS</h1>
          <p className="cracker-level-pill">
            WEEK {currentWeek} OF 6 · {level === "beginner" ? "BEGINNER PROGRAM" : "INTERMEDIATE PROGRAM"}
          </p>
        </div>
        <button
          type="button"
          className={`avatar cracker-avatar${profilePhoto ? " has-photo" : ""}`}
          onClick={onOpenProfile}
          aria-label="Open profile"
          style={profilePhoto ? { backgroundImage: `url(${profilePhoto})` } : undefined}
        >
          {profilePhoto ? "" : profileInitial}
        </button>
      </header>

      <article className="card move-progress-card">
        <p className="eyebrow">CHALLENGE PROGRESS</p>
        <div className="cracker-progress" aria-label={`${summary.percent}% complete`}>
          <span style={{ width: `${summary.percent}%` }} />
        </div>
        <p className="move-progress-percent">{summary.percent}% COMPLETE</p>
        <p className="muted">
          Counted from workouts, Jess education, fitness check-ins, InBody and measurements you have
          already logged.
        </p>
      </article>

      <article className="card move-progress-card">
        <p className="eyebrow">TRAINING</p>
        <p className="move-progress-stat">
          {summary.workoutsDone} / {summary.workoutsTarget}
        </p>
        <p className="muted">Workouts completed</p>
        <div className="cracker-progress" aria-hidden="true">
          <span
            style={{
              width: `${Math.round((summary.workoutsDone / summary.workoutsTarget) * 100)}%`,
            }}
          />
        </div>
        <p className="move-progress-line">Current week: Week {currentWeek}</p>
        <p className="move-progress-line">
          This week: {Math.min(summary.thisWeekDone, summary.thisWeekTarget)} / {summary.thisWeekTarget}{" "}
          sessions complete
        </p>
      </article>

      <article className="card move-progress-card">
        <p className="eyebrow">FITNESS CHECK-IN</p>
        {!fitnessInitial ? (
          <p className="muted">Log your initial check-in in Fitness Testing.</p>
        ) : !fitnessFinal ? (
          <>
            <p className="move-progress-flag">INITIAL COMPLETE</p>
            <p className="muted">Your final check-in will unlock your comparison.</p>
          </>
        ) : (
          <div className="move-progress-compare-list">
            <CompareRow
              label="DEADLIFT"
              left={formatNumber(checkIns.fitness_initial?.deadliftReps)}
              right={formatNumber(checkIns.fitness_final?.deadliftReps)}
              change={numericalChange(
                checkIns.fitness_initial?.deadliftReps,
                checkIns.fitness_final?.deadliftReps,
                { unit: " reps" },
              ).text}
            />
            <CompareRow
              label={cardioLabel}
              left={formatSeconds(checkIns.fitness_initial?.cardio500Seconds)}
              right={formatSeconds(checkIns.fitness_final?.cardio500Seconds)}
              change={numericalChange(
                checkIns.fitness_initial?.cardio500Seconds,
                checkIns.fitness_final?.cardio500Seconds,
                { asTime: true },
              ).text}
            />
            <CompareRow
              label="PUSH-UPS"
              left={formatNumber(checkIns.fitness_initial?.pushupReps)}
              right={formatNumber(checkIns.fitness_final?.pushupReps)}
              change={numericalChange(
                checkIns.fitness_initial?.pushupReps,
                checkIns.fitness_final?.pushupReps,
                { unit: " reps" },
              ).text}
            />
            <CompareRow
              label="AB MAT SIT-UPS"
              left={formatNumber(checkIns.fitness_initial?.situpReps)}
              right={formatNumber(checkIns.fitness_final?.situpReps)}
              change={numericalChange(
                checkIns.fitness_initial?.situpReps,
                checkIns.fitness_final?.situpReps,
                { unit: " reps" },
              ).text}
            />
            <CompareRow
              label="GYM CONFIDENCE"
              left={formatNumber(checkIns.fitness_initial?.gymConfidence)}
              right={formatNumber(checkIns.fitness_final?.gymConfidence)}
              change={numericalChange(
                checkIns.fitness_initial?.gymConfidence,
                checkIns.fitness_final?.gymConfidence,
              ).text}
            />
            <CompareRow
              label="FOR-TIME BENCHMARK"
              left={formatSeconds(checkIns.fitness_initial?.finisherSeconds)}
              right={formatSeconds(checkIns.fitness_final?.finisherSeconds)}
              change={numericalChange(
                checkIns.fitness_initial?.finisherSeconds,
                checkIns.fitness_final?.finisherSeconds,
                { asTime: true },
              ).text}
            />
          </div>
        )}
      </article>

      <article className="card move-progress-card">
        <p className="eyebrow">INBODY</p>
        {!inbodyInitial ? (
          <p className="muted">Log your pre-challenge scan in InBody + Measurements.</p>
        ) : (
          <>
            <MetricTriple
              label="Skeletal Muscle Mass"
              start={formatKg(checkIns.inbody_initial?.skeletalMuscleMassKg)}
              end={inbodyFinal ? formatKg(checkIns.inbody_final?.skeletalMuscleMassKg) : "—"}
              change={
                inbodyFinal
                  ? numericalChange(
                      checkIns.inbody_initial?.skeletalMuscleMassKg,
                      checkIns.inbody_final?.skeletalMuscleMassKg,
                      { unit: " kg" },
                    ).text
                  : "—"
              }
            />
            <MetricTriple
              label="Body Fat %"
              start={formatPct(checkIns.inbody_initial?.bodyFatPercent)}
              end={inbodyFinal ? formatPct(checkIns.inbody_final?.bodyFatPercent) : "—"}
              change={
                inbodyFinal
                  ? numericalChange(
                      checkIns.inbody_initial?.bodyFatPercent,
                      checkIns.inbody_final?.bodyFatPercent,
                      { unit: "%" },
                    ).text
                  : "—"
              }
            />
            <MetricTriple
              label="Visceral Fat"
              start={formatNumber(checkIns.inbody_initial?.visceralFat)}
              end={inbodyFinal ? formatNumber(checkIns.inbody_final?.visceralFat) : "—"}
              change={
                inbodyFinal
                  ? numericalChange(
                      checkIns.inbody_initial?.visceralFat,
                      checkIns.inbody_final?.visceralFat,
                    ).text
                  : "—"
              }
            />
            {inbodyFinal ? null : (
              <p className="muted">Final scan coming at the end of CRACKER.</p>
            )}
          </>
        )}
      </article>

      <article className="card move-progress-card">
        <p className="eyebrow">MEASUREMENTS</p>
        {!measInitial ? (
          <p className="muted">Log your starting measurements in InBody + Measurements.</p>
        ) : (
          <>
            <MetricTriple
              label="Chest"
              start={formatCm(checkIns.measurements_initial?.chestCm)}
              end={measFinal ? formatCm(checkIns.measurements_final?.chestCm) : "—"}
              change={
                measFinal
                  ? numericalChange(
                      checkIns.measurements_initial?.chestCm,
                      checkIns.measurements_final?.chestCm,
                      { unit: " cm" },
                    ).text
                  : "—"
              }
            />
            <MetricTriple
              label="Waist"
              start={formatCm(checkIns.measurements_initial?.waistCm)}
              end={measFinal ? formatCm(checkIns.measurements_final?.waistCm) : "—"}
              change={
                measFinal
                  ? numericalChange(
                      checkIns.measurements_initial?.waistCm,
                      checkIns.measurements_final?.waistCm,
                      { unit: " cm" },
                    ).text
                  : "—"
              }
            />
            <MetricTriple
              label="Hips"
              start={formatCm(checkIns.measurements_initial?.hipsCm)}
              end={measFinal ? formatCm(checkIns.measurements_final?.hipsCm) : "—"}
              change={
                measFinal
                  ? numericalChange(
                      checkIns.measurements_initial?.hipsCm,
                      checkIns.measurements_final?.hipsCm,
                      { unit: " cm" },
                    ).text
                  : "—"
              }
            />
            {measFinal ? null : (
              <p className="muted">Final measurements coming at the end of CRACKER.</p>
            )}
          </>
        )}
      </article>
    </div>
  );
}

function formatNumber(value?: number): string {
  return value == null ? "—" : String(value);
}

function formatKg(value?: number): string {
  return value == null ? "—" : `${value} kg`;
}

function formatPct(value?: number): string {
  return value == null ? "—" : `${value}%`;
}

function formatCm(value?: number): string {
  return value == null ? "—" : `${value} cm`;
}

function CompareRow({
  label,
  left,
  right,
  change,
}: {
  label: string;
  left: string;
  right: string;
  change: string;
}) {
  if (left === "—" && right === "—") return null;
  return (
    <div className="move-progress-compare">
      <p className="eyebrow">{label}</p>
      <p>
        {left} → {right}
      </p>
      <span>{change}</span>
    </div>
  );
}

function MetricTriple({
  label,
  start,
  end,
  change,
}: {
  label: string;
  start: string;
  end: string;
  change: string;
}) {
  return (
    <div className="move-progress-triple">
      <p className="eyebrow">{label}</p>
      <div className="move-progress-triple-grid">
        <span>
          <small>Start</small>
          {start}
        </span>
        <span>
          <small>Final</small>
          {end}
        </span>
        <span>
          <small>Change</small>
          {change}
        </span>
      </div>
    </div>
  );
}
