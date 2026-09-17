"use client";

import { useMemo, useState } from "react";
import { imageForWorkout } from "@/lib/content";
import {
  buildCrackerWorkouts,
  crackerLevelFromExperience,
  type CrackerLevel,
} from "@/lib/crackerProgram";
import type { ExperienceLevel } from "@/lib/user";
import type { Workout } from "@/lib/types";

type Props = {
  currentWeek: number;
  experience: ExperienceLevel;
  liveWorkouts: Workout[];
  completedIds: Set<string>;
  onStart: (workout: Workout) => void;
  onOpenProfile: () => void;
  profileInitial: string;
  profilePhoto?: string;
};

function workoutType(title: string): string {
  const t = title.toLowerCase();
  if (/lower/.test(t)) return "Lower";
  if (/upper/.test(t)) return "Upper";
  if (/full/.test(t)) return "Full body";
  return "Training";
}

export function CrackerMove({
  currentWeek,
  experience,
  liveWorkouts,
  completedIds,
  onStart,
  onOpenProfile,
  profileInitial,
  profilePhoto,
}: Props) {
  const [viewWeek, setViewWeek] = useState(currentWeek);
  const level: CrackerLevel = crackerLevelFromExperience(experience);

  const workouts = useMemo(() => {
    if (viewWeek === currentWeek && liveWorkouts.length) return liveWorkouts;
    return buildCrackerWorkouts(level, viewWeek);
  }, [viewWeek, currentWeek, liveWorkouts, level]);

  return (
    <div className="screen cracker-screen cracker-move">
      <header className="cracker-topbar">
        <div>
          <p className="cracker-screen-kicker">MOVE</p>
          <h1 className="cracker-screen-title">This week&apos;s training.</h1>
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

      <div className="cracker-week-chips" role="tablist" aria-label="Programme week">
        {[1, 2, 3, 4, 5, 6].map((w) => (
          <button
            key={w}
            type="button"
            role="tab"
            aria-selected={viewWeek === w}
            className={`cracker-week-chip${viewWeek === w ? " active" : ""}${
              w === currentWeek ? " is-programme" : ""
            }`}
            onClick={() => setViewWeek(w)}
          >
            WEEK {w}
          </button>
        ))}
      </div>

      <div className="cracker-workout-stack">
        {workouts.map((workout) => {
          const liveMatch =
            viewWeek === currentWeek
              ? liveWorkouts.find((live) => live.title === workout.title)
              : undefined;
          const startTarget = liveMatch ?? workout;
          const isDone =
            viewWeek === currentWeek &&
            (completedIds.has(startTarget.id) ||
              (liveMatch ? completedIds.has(liveMatch.id) : false) ||
              completedIds.has(workout.id));

          return (
            <article
              key={`${viewWeek}-${workout.title}-${workout.day}`}
              className={`cracker-workout-card${isDone ? " is-done" : ""}`}
            >
              <div
                className="cracker-workout-media"
                style={{ backgroundImage: `url(${imageForWorkout(workout.title)})` }}
              >
                <span className="cracker-workout-chip">{workout.duration} min</span>
                {isDone ? <span className="cracker-workout-done">Done</span> : null}
              </div>
              <div className="cracker-workout-body">
                <p className="eyebrow">{workoutType(workout.title)}</p>
                <h2>{workout.title}</h2>
                <p className="muted">{workout.day}</p>
                <button type="button" className="cta-btn" onClick={() => onStart(startTarget)}>
                  {isDone ? "START AGAIN" : "START WORKOUT"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
