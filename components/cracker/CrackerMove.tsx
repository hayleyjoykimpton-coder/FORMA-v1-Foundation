"use client";

import { useEffect, useMemo, useState } from "react";
import {
  buildCrackerWorkouts,
  crackerEducationForWeek,
  crackerLevelFromExperience,
  crackerSessionIndex,
  CRACKER_WEEK_THEMES,
  type CrackerLevel,
} from "@/lib/crackerProgram";
import {
  getWeekChecklist,
  loadMoveChecklist,
  saveMoveChecklist,
  setWeekChecklist,
  type MoveChecklistState,
} from "@/lib/crackerMoveChecklist";
import { JessHeadTrainerCard } from "@/components/cracker/JessHeadTrainerCard";
import { InAppVideo } from "@/components/cracker/InAppVideo";
import { MoveFitnessTesting } from "@/components/cracker/MoveFitnessTesting";
import { MoveInBodyMeasurements } from "@/components/cracker/MoveInBodyMeasurements";
import { MoveLearnLibrary } from "@/components/cracker/MoveLearnLibrary";
import { MoveMyProgress } from "@/components/cracker/MoveMyProgress";
import { MoveProgressPhotos } from "@/components/cracker/MoveProgressPhotos";
import { MoveWorkoutRecap } from "@/components/cracker/MoveWorkoutRecap";
import {
  loadMoveSubTab,
  saveMoveSubTab,
  type MoveSubTab,
} from "@/lib/crackerNav";
import { moveImage, moveMediaForSession, moveWeekImage } from "@/lib/moveImages";
import { crackerWeeklyTrainingVideoUrl } from "@/lib/jessTrainer";
import type { ProgressPhoto } from "@/lib/progress";
import type { ExperienceLevel } from "@/lib/user";
import type { Workout, WorkoutSession } from "@/lib/types";

export type { MoveSubTab };

const MOVE_SUBTABS: { key: MoveSubTab; label: string }[] = [
  { key: "training", label: "TRAINING" },
  { key: "learn", label: "LEARN" },
  { key: "progress", label: "MY PROGRESS" },
  { key: "recap", label: "RECAP" },
  { key: "fitness", label: "FITNESS TESTING" },
  { key: "inbody", label: "INBODY + MEASUREMENTS" },
  { key: "photos", label: "PHOTOS" },
];

type Props = {
  currentWeek: number;
  experience: ExperienceLevel;
  liveWorkouts: Workout[];
  history: WorkoutSession[];
  onStart: (workout: Workout) => void;
  onOpenProfile: () => void;
  profileInitial: string;
  profilePhoto?: string;
  photos: ProgressPhoto[];
  onAddPhoto: (photo: ProgressPhoto) => void;
  onDeletePhoto: (id: string) => void;
};

function shortSummary(workout: Workout): string {
  const strength = workout.exercises.filter((e) => !/^WOD/i.test(e.name));
  const wod = workout.exercises.find((e) => /^WOD/i.test(e.name));
  const first = strength[0]?.name;
  const wodLabel = wod?.name.replace(/^WOD ·\s*/i, "") ?? "WOD";
  if (first) return `${strength.length} lifts · ${wodLabel}`;
  return wodLabel;
}

function isSessionDone(
  workout: Workout,
  viewWeek: number,
  level: CrackerLevel,
  history: WorkoutSession[],
): boolean {
  return history.some((session) => {
    if (session.week != null && session.week !== viewWeek) return false;
    if (session.crackerLevel && session.crackerLevel !== level) return false;
    const sameId = session.workoutId === workout.id;
    const sameTitle =
      session.workoutTitle.replace(/\s*·\s*Wk\d+/i, "").trim().toLowerCase() ===
      workout.title.toLowerCase();
    return sameId || (sameTitle && (session.week === viewWeek || session.week == null));
  });
}

function MoveSubNav({
  active,
  onChange,
}: {
  active: MoveSubTab;
  onChange: (tab: MoveSubTab) => void;
}) {
  return (
    <nav className="move-subnav" aria-label="MOVE sections">
      {MOVE_SUBTABS.map((item) => (
        <button
          key={item.key}
          type="button"
          role="tab"
          aria-selected={active === item.key}
          className={`move-subnav-btn${active === item.key ? " active" : ""}`}
          onClick={() => onChange(item.key)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}

export function CrackerMove({
  currentWeek,
  experience,
  liveWorkouts,
  history,
  onStart,
  onOpenProfile,
  profileInitial,
  profilePhoto,
  photos,
  onAddPhoto,
  onDeletePhoto,
}: Props) {
  const [subTab, setSubTab] = useState<MoveSubTab>(() => loadMoveSubTab());
  const [viewWeek, setViewWeek] = useState(currentWeek);
  const [checklist, setChecklist] = useState<MoveChecklistState>({ weeks: {} });
  const level: CrackerLevel = crackerLevelFromExperience(experience);
  const education = crackerEducationForWeek(viewWeek);
  const theme = CRACKER_WEEK_THEMES[viewWeek - 1];
  const weekChecks = getWeekChecklist(checklist, level, viewWeek);
  const weekBanner = moveWeekImage(viewWeek);
  const learnImage = moveImage("learnWithJess");
  const educationVideo = crackerWeeklyTrainingVideoUrl(viewWeek);

  useEffect(() => {
    setChecklist(loadMoveChecklist());
    setSubTab(loadMoveSubTab());
  }, []);

  useEffect(() => {
    setViewWeek(currentWeek);
  }, [currentWeek]);

  const selectSubTab = (tab: MoveSubTab) => {
    setSubTab(tab);
    saveMoveSubTab(tab);
  };

  const workouts = useMemo(() => {
    if (viewWeek === currentWeek && liveWorkouts.length) return liveWorkouts;
    return buildCrackerWorkouts(level, viewWeek);
  }, [viewWeek, currentWeek, liveWorkouts, level]);

  const ordered = useMemo(() => {
    return [...workouts].sort(
      (a, b) => crackerSessionIndex(a.title) - crackerSessionIndex(b.title),
    );
  }, [workouts]);

  const doneMap = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const workout of ordered) {
      map.set(workout.id, isSessionDone(workout, viewWeek, level, history));
    }
    return map;
  }, [ordered, viewWeek, level, history]);

  const patchChecklist = (patch: Partial<{ education: boolean; action: boolean }>) => {
    setChecklist((current) => {
      const next = setWeekChecklist(current, level, viewWeek, patch);
      saveMoveChecklist(next);
      return next;
    });
  };

  if (subTab === "learn") {
    return (
      <div className="cracker-move-with-subnav">
        <MoveSubNav active={subTab} onChange={selectSubTab} />
        <MoveLearnLibrary
          level={level}
          profileInitial={profileInitial}
          profilePhoto={profilePhoto}
          onOpenProfile={onOpenProfile}
        />
      </div>
    );
  }

  if (subTab === "progress") {
    return (
      <div className="cracker-move-with-subnav">
        <MoveSubNav active={subTab} onChange={selectSubTab} />
        <MoveMyProgress
          currentWeek={currentWeek}
          experience={experience}
          history={history}
          profileInitial={profileInitial}
          profilePhoto={profilePhoto}
          onOpenProfile={onOpenProfile}
        />
      </div>
    );
  }

  if (subTab === "recap") {
    return (
      <div className="cracker-move-with-subnav">
        <MoveSubNav active={subTab} onChange={selectSubTab} />
        <MoveWorkoutRecap
          history={history}
          profileInitial={profileInitial}
          profilePhoto={profilePhoto}
          onOpenProfile={onOpenProfile}
        />
      </div>
    );
  }

  if (subTab === "fitness") {
    return (
      <div className="cracker-move-with-subnav">
        <MoveSubNav active={subTab} onChange={selectSubTab} />
        <MoveFitnessTesting
          profileInitial={profileInitial}
          profilePhoto={profilePhoto}
          onOpenProfile={onOpenProfile}
        />
      </div>
    );
  }

  if (subTab === "inbody") {
    return (
      <div className="cracker-move-with-subnav">
        <MoveSubNav active={subTab} onChange={selectSubTab} />
        <MoveInBodyMeasurements
          profileInitial={profileInitial}
          profilePhoto={profilePhoto}
          onOpenProfile={onOpenProfile}
        />
      </div>
    );
  }

  if (subTab === "photos") {
    return (
      <div className="cracker-move-with-subnav">
        <MoveSubNav active={subTab} onChange={selectSubTab} />
        <MoveProgressPhotos
          currentWeek={currentWeek}
          photos={photos}
          onAddPhoto={onAddPhoto}
          onDeletePhoto={onDeletePhoto}
          profileInitial={profileInitial}
          profilePhoto={profilePhoto}
          onOpenProfile={onOpenProfile}
        />
      </div>
    );
  }

  return (
    <div className="cracker-move-with-subnav">
      <MoveSubNav active={subTab} onChange={selectSubTab} />
      <div className="screen cracker-screen cracker-move training-page">
        <header className="cracker-topbar">
          <div>
            <p className="cracker-screen-kicker">MOVE</p>
            <h1 className="cracker-screen-title">WEEK {viewWeek} OF 6</h1>
            <p className="cracker-level-pill">
              {level === "beginner" ? "BEGINNER PROGRAM" : "INTERMEDIATE PROGRAM"}
            </p>
            <p className="cracker-edu-focus">
              {theme} · {education.title}
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
              <strong>{theme}</strong>
            </div>
          </div>
        ) : (
          <div className="cracker-move-banner cracker-move-banner--neutral" aria-hidden="true">
            <div className="cracker-move-banner-overlay">
              <span>WEEK {viewWeek}</span>
              <strong>{theme}</strong>
            </div>
          </div>
        )}

        <section className="cracker-this-week" aria-label="This week">
          <p className="eyebrow">THIS WEEK</p>
          <ul className="cracker-week-checklist">
            {ordered.map((workout) => {
              const done = doneMap.get(workout.id);
              const idx = crackerSessionIndex(workout.title) || ordered.indexOf(workout) + 1;
              return (
                <li key={workout.id} className={done ? "is-done" : undefined}>
                  <span aria-hidden="true">{done ? "✓" : "○"}</span>
                  <span>
                    {workout.title}
                    <small>Session {idx} of 3</small>
                  </span>
                </li>
              );
            })}
            <li className={weekChecks.education ? "is-done" : undefined}>
              <button type="button" onClick={() => patchChecklist({ education: !weekChecks.education })}>
                <span aria-hidden="true">{weekChecks.education ? "✓" : "○"}</span>
                <span>
                  Watch Jess&apos;s training education
                  <small>{education.title}</small>
                </span>
              </button>
            </li>
            <li className={weekChecks.action ? "is-done" : undefined}>
              <button type="button" onClick={() => patchChecklist({ action: !weekChecks.action })}>
                <span aria-hidden="true">{weekChecks.action ? "✓" : "○"}</span>
                <span>
                  Complete this week&apos;s action
                  <small>Mark when done</small>
                </span>
              </button>
            </li>
          </ul>
        </section>

        <article className="cracker-learn-card">
          {educationVideo ? (
            <div className="cracker-learn-media cracker-learn-media--video">
              <InAppVideo url={educationVideo} title={`Learn with Jess · ${education.title}`} />
            </div>
          ) : learnImage ? (
            <div className="cracker-learn-media">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={learnImage} alt="" />
            </div>
          ) : null}
          <div className="cracker-learn-body">
            <p className="eyebrow">LEARN WITH JESS</p>
            <h2>{education.title}</h2>
            <p>{education.summary}</p>
            {educationVideo ? null : (
              <p className="muted">This week&apos;s video will play here once Jess&apos;s link is in.</p>
            )}
            <button
              type="button"
              className="secondary-btn"
              onClick={() => patchChecklist({ education: !weekChecks.education })}
            >
              {weekChecks.education ? "MARKED COMPLETE" : "MARK EDUCATION DONE"}
            </button>
          </div>
        </article>

        <JessHeadTrainerCard />

        <div className="cracker-workout-stack">
          {ordered.map((workout, orderIdx) => {
            const idx = crackerSessionIndex(workout.title) || orderIdx + 1;
            const done = doneMap.get(workout.id);
            const media = moveMediaForSession(workout.title);
            const startTarget =
              viewWeek === currentWeek
                ? liveWorkouts.find((live) => live.title === workout.title) ?? workout
                : workout;
            const cropMod = media.cropClass ? ` ${media.cropClass}` : "";

            return (
              <article
                key={workout.id}
                className={`cracker-workout-card${done ? " is-done" : ""}`}
              >
                {media.kind === "photo" && media.src ? (
                  <div
                    className={`cracker-workout-media cracker-workout-media--photo${cropMod}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={media.src} alt="" />
                    <span className="cracker-workout-chip">Session {idx} of 3</span>
                    {done ? <span className="cracker-workout-done">Done</span> : null}
                  </div>
                ) : (
                  <div
                    className={`cracker-workout-media cracker-workout-media--neutral accent-${media.label.toLowerCase()}`}
                  >
                    <span className="cracker-workout-neutral-label">{media.label}</span>
                    <span className="cracker-workout-chip">Session {idx} of 3</span>
                    {done ? <span className="cracker-workout-done">Done</span> : null}
                  </div>
                )}
                <div className="cracker-workout-body">
                  <p className="eyebrow">{workout.day}</p>
                  <h2>{workout.title.toUpperCase()}</h2>
                  <p className="muted">{shortSummary(workout)}</p>
                  <button type="button" className="cta-btn" onClick={() => onStart(startTarget)}>
                    {done ? "START AGAIN" : "START WORKOUT"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
