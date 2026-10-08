"use client";

import { useEffect, useMemo, useState } from "react";
import { InAppVideo } from "@/components/cracker/InAppVideo";
import { JessHeadTrainerCard } from "@/components/cracker/JessHeadTrainerCard";
import {
  CRACKER_TRAINING_EDUCATION,
  type CrackerLevel,
} from "@/lib/crackerProgram";
import {
  getWeekChecklist,
  loadMoveChecklist,
  MOVE_CHECKLIST_CHANGED_EVENT,
  saveMoveChecklist,
  setIntroWatched,
  setWeekChecklist,
  type MoveChecklistState,
} from "@/lib/crackerMoveChecklist";
import {
  crackerIntroVideoUrl,
  crackerSessionDemosForWeek,
  crackerWeeklyTrainingDemoSourceWeek,
  crackerWeeklyTrainingVideoUrl,
} from "@/lib/jessTrainer";
import { moveWeekImage } from "@/lib/moveImages";

type Props = {
  level: CrackerLevel;
  profileInitial: string;
  profilePhoto?: string;
  onOpenProfile: () => void;
};

export function MoveLearnLibrary({
  level,
  profileInitial,
  profilePhoto,
  onOpenProfile,
}: Props) {
  const [checklist, setChecklist] = useState<MoveChecklistState>({ weeks: {} });

  useEffect(() => {
    const refresh = () => setChecklist(loadMoveChecklist());
    refresh();
    window.addEventListener(MOVE_CHECKLIST_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(MOVE_CHECKLIST_CHANGED_EVENT, refresh);
  }, []);

  const markWatched = (week: number, watched: boolean) => {
    setChecklist((current) => {
      const next = setWeekChecklist(current, level, week, { education: watched });
      saveMoveChecklist(next);
      return next;
    });
  };

  const toggleIntro = () => {
    setChecklist((current) => {
      const next = setIntroWatched(current, !current.intro);
      saveMoveChecklist(next);
      return next;
    });
  };

  const weeks = useMemo(() => CRACKER_TRAINING_EDUCATION, []);
  const introUrl = crackerIntroVideoUrl();

  return (
    <div className="screen cracker-screen cracker-move cracker-move-panel move-learn-screen">
      <header className="cracker-topbar">
        <div>
          <p className="cracker-screen-kicker">MOVE</p>
          <h1 className="cracker-screen-title">LEARN WITH JESS</h1>
          <p className="cracker-edu-focus">
            Start with Jess&apos;s intro, then six weeks of practical training education.
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

      <article className="card cracker-intro-card" aria-label="Jess intro video">
        <p className="eyebrow">START HERE</p>
        <h2>Intro to CRACKER training</h2>
        <p className="muted">Jess walks you through how the six weeks work.</p>
        {introUrl ? (
          <InAppVideo url={introUrl} title="Jess intro to CRACKER training" />
        ) : (
          <p className="auth-info">Intro video will play here once we have Jess&apos;s link.</p>
        )}
        <button type="button" className="secondary-btn" onClick={toggleIntro}>
          {checklist.intro ? "INTRO WATCHED" : "MARK INTRO WATCHED"}
        </button>
      </article>

      <JessHeadTrainerCard />

      <div className="move-learn-stack">
        {weeks.map((item) => {
          const watched = getWeekChecklist(checklist, level, item.week).education;
          const video = crackerWeeklyTrainingVideoUrl(item.week);
          const demoSourceWeek = crackerWeeklyTrainingDemoSourceWeek(item.week);
          const sessionDemos = crackerSessionDemosForWeek(level, item.week);
          const cover = moveWeekImage(item.week);
          return (
            <article key={item.week} className="card move-learn-card">
              {cover ? (
                <div className="move-learn-cover">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={cover} alt="" />
                </div>
              ) : null}
              <div className="move-learn-body">
                <p className="eyebrow">WEEK {item.week}</p>
                <h2>{item.title.toUpperCase()}</h2>
                <p className="muted">{item.summary}</p>
                {demoSourceWeek !== item.week ? (
                  <p className="muted">Same training demo as week {demoSourceWeek}.</p>
                ) : null}
                {video ? (
                  <InAppVideo url={video} title={`Learn with Jess · ${item.title}`} />
                ) : sessionDemos.length === 0 ? (
                  <p className="auth-info">COMING SOON</p>
                ) : null}
                {sessionDemos.map((demo) => (
                  <div key={demo.key} className="move-learn-session-demo">
                    <p className="eyebrow">{demo.title} DEMO</p>
                    {demo.sourceWeek !== item.week ? (
                      <p className="muted">Same training demo as week {demo.sourceWeek}.</p>
                    ) : null}
                    <InAppVideo
                      url={demo.url}
                      title={`Learn with Jess · ${demo.title} · Week ${item.week}`}
                    />
                  </div>
                ))}
                <p className={`move-learn-status${watched ? " is-watched" : ""}`}>
                  {watched ? "✓ WATCHED" : "NOT WATCHED"}
                </p>
                <button
                  type="button"
                  className={watched ? "secondary-btn" : "cta-btn"}
                  onClick={() => markWatched(item.week, !watched)}
                >
                  {watched ? "MARKED AS WATCHED" : "MARK AS WATCHED"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
