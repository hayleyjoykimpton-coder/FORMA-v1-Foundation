"use client";

import { useEffect, useMemo, useState } from "react";
import { CrackerResumeCard } from "@/components/cracker/CrackerResumeCard";
import { WorkoutSessionPreview } from "@/components/cracker/WorkoutSessionPreview";
import {
  buildCrackerWods,
  crackerLevelFromExperience,
  crackerSessionIndex,
  CRACKER_WEEK_THEMES,
  type CrackerLevel,
} from "@/lib/crackerProgram";
import { moveMediaForSession, moveWeekImage } from "@/lib/moveImages";
import type { ExperienceLevel } from "@/lib/user";
import type { Workout, WorkoutSession } from "@/lib/types";
import { isOptionalCrackerWod } from "@/lib/wod";

type Props = {
  currentWeek: number;
  experience: ExperienceLevel;
  history: WorkoutSession[];
  onStart: (workout: Workout) => void;
  profileInitial: string;
  profilePhoto?: string;
  onOpenProfile: () => void;
  pausedTitle?: string | null;
  onResumeWorkout?: () => void;
  onDiscardWorkout?: () => void;
};

function isWodLogged(
  workout: Workout,
  viewWeek: number,
  level: CrackerLevel,
  history: WorkoutSession[],
): boolean {
  return history.some((session) => {
    if (!isOptionalCrackerWod({ id: session.workoutId, title: session.workoutTitle })) {
      return false;
    }
    if (session.week != null && session.week !== viewWeek) return false;
    if (session.crackerLevel && session.crackerLevel !== level) return false;
    const sameId = session.workoutId === workout.id;
    const sameTitle =
      session.workoutTitle
        .replace(/\s*·\s*Wk\d+.*$/i, "")
        .trim()
        .toLowerCase() === workout.title.toLowerCase();
    return sameId || (sameTitle && (session.week === viewWeek || session.week == null));
  });
}

export function MoveWods({
  currentWeek,
  experience,
  history,
  onStart,
  profileInitial,
  profilePhoto,
  onOpenProfile,
  pausedTitle,
  onResumeWorkout,
  onDiscardWorkout,
}: Props) {
  const [viewWeek, setViewWeek] = useState(currentWeek);
  const level: CrackerLevel = crackerLevelFromExperience(experience);
  const theme = CRACKER_WEEK_THEMES[viewWeek - 1];
  const weekBanner = moveWeekImage(viewWeek);
  const showResume =
    Boolean(pausedTitle && isOptionalCrackerWod({ title: pausedTitle })) &&
    Boolean(onResumeWorkout && onDiscardWorkout);

  useEffect(() => {
    setViewWeek(currentWeek);
  }, [currentWeek]);

  const wods = useMemo(
    () =>
      [...buildCrackerWods(level, viewWeek)].sort(
        (a, b) => crackerSessionIndex(a.title) - crackerSessionIndex(b.title),
      ),
    [level, viewWeek],
  );

  return (
    <div className="screen cracker-screen cracker-move training-page training-layout">
      <header className="cracker-topbar">
        <div>
          <p className="cracker-screen-kicker">MOVE</p>
          <h1 className="cracker-screen-title">OPTIONAL WODS</h1>
          <p className="cracker-level-pill">WEEK {viewWeek} OF 6 · DOES NOT COUNT TOWARD PROGRESS</p>
          <p className="cracker-edu-focus">{theme} · extra work if you want it</p>
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
            W{w}
          </button>
        ))}
      </div>

      {weekBanner ? (
        <div className="cracker-move-banner">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={weekBanner} alt="" className="cracker-move-banner-image" />
          <div className="cracker-move-banner-overlay">
            <span>WEEK {viewWeek}</span>
            <strong>OPTIONAL WODS</strong>
          </div>
        </div>
      ) : (
        <div className="cracker-move-banner cracker-move-banner--neutral" aria-hidden="true">
          <div className="cracker-move-banner-overlay">
            <span>WEEK {viewWeek}</span>
            <strong>OPTIONAL WODS</strong>
          </div>
        </div>
      )}

      {showResume ? (
        <CrackerResumeCard
          title={pausedTitle ?? ""}
          onResume={onResumeWorkout!}
          onDiscard={onDiscardWorkout!}
        />
      ) : null}

      <article className="cracker-tyg-note">
        <p className="eyebrow">OPTIONAL</p>
        <p>
          Do these on their own, any day you like. They do not count toward your 3 sessions this
          week or the 18-workout challenge.
        </p>
      </article>

      <div className="cracker-workout-stack">
        {wods.map((workout) => {
          const done = isWodLogged(workout, viewWeek, level, history);
          const media = moveMediaForSession(workout.title);
          const cropMod = media.cropClass ? ` ${media.cropClass}` : "";

          return (
            <article
              key={workout.id}
              className={`cracker-workout-card${done ? " is-done" : ""}`}
            >
              {media.kind === "photo" && media.src ? (
                <div className={`cracker-workout-media cracker-workout-media--photo${cropMod}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={media.src} alt="" />
                  <span className="cracker-workout-chip is-optional">Optional</span>
                  {done ? <span className="cracker-workout-done">Logged</span> : null}
                </div>
              ) : (
                <div
                  className={`cracker-workout-media cracker-workout-media--neutral accent-${media.label.toLowerCase()}`}
                >
                  <span className="cracker-workout-neutral-label">{media.label}</span>
                  <span className="cracker-workout-chip is-optional">Optional</span>
                  {done ? <span className="cracker-workout-done">Logged</span> : null}
                </div>
              )}
              <div className="cracker-workout-body">
                <p className="eyebrow">{workout.day}</p>
                <h2>{workout.title.toUpperCase()}</h2>
                <WorkoutSessionPreview workout={workout} />
                <button type="button" className="cta-btn" onClick={() => onStart(workout)}>
                  {pausedTitle && workout.title === pausedTitle
                    ? "CONTINUE WOD"
                    : done
                      ? "START AGAIN"
                      : "START WOD"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
