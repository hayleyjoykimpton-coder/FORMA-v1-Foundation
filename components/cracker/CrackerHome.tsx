"use client";

import { useEffect, useMemo, useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { InAppVideo } from "@/components/cracker/InAppVideo";
import { CRACKER_DATES_LABEL } from "@/lib/challengeMode";
import { ChallengeTimeline } from "@/components/cracker/ChallengeTimeline";
import { CONNECT_HERO_IMAGE } from "@/lib/connect";
import { crackerMotivationalLine } from "@/lib/crackerUi";
import {
  loadMoveChecklist,
  saveMoveChecklist,
  setIntroWatched,
  type MoveChecklistState,
} from "@/lib/crackerMoveChecklist";
import { crackerIntroVideoUrl } from "@/lib/jessTrainer";
import { JESS_LAS_PORTRAIT, moveImage } from "@/lib/moveImages";
import { NOURISH_HERO_IMAGE } from "@/lib/nourish";
import type { CrackerTab } from "@/components/cracker/types";
import { crackerLevelFromExperience } from "@/lib/crackerProgram";
import { buildChallengeProgress } from "@/lib/crackerProgress";
import { loadMoveCheckIns } from "@/lib/crackerMoveCheckIns";
import type { ExperienceLevel } from "@/lib/user";
import type { WorkoutSession } from "@/lib/types";

type Props = {
  week: number;
  totalWeeks?: number;
  sessionsDone: number;
  sessionsTarget: number;
  profileInitial: string;
  profilePhoto?: string;
  onOpenProfile: () => void;
  onNavigate: (tab: CrackerTab) => void;
  onOpenProgress: () => void;
  history: WorkoutSession[];
  experience: ExperienceLevel;
};

const PILLARS: {
  key: CrackerTab;
  title: string;
  line: string;
  cta: string;
  image: string;
  mediaClass?: string;
}[] = [
  {
    key: "move",
    title: "MOVE",
    line: "Your training for the week.",
    cta: "VIEW TRAINING",
    // Real Jess Life & Soul portrait (face + headroom) — not /img stock squat
    image: moveImage("hero") ?? JESS_LAS_PORTRAIT,
    mediaClass: "cracker-pillar-media--move-hero",
  },
  {
    key: "nourish",
    title: "NOURISH",
    line: "Fuel your six weeks.",
    cta: "OPEN NUTRITION",
    image: NOURISH_HERO_IMAGE,
  },
  {
    key: "connect",
    title: "CONNECT",
    line: "Events, updates and community.",
    cta: "VIEW COMMUNITY",
    image: CONNECT_HERO_IMAGE,
    mediaClass: "cracker-pillar-media--connect-hero",
  },
];

export function CrackerHome({
  week,
  totalWeeks = 6,
  sessionsDone,
  sessionsTarget,
  profileInitial,
  profilePhoto,
  onOpenProfile,
  onNavigate,
  onOpenProgress,
  history,
  experience,
}: Props) {
  const weekProgress =
    sessionsTarget > 0 ? Math.min(100, Math.round((sessionsDone / sessionsTarget) * 100)) : 0;
  const [checklist, setChecklist] = useState<MoveChecklistState>({ weeks: {} });
  const [checkIns, setCheckIns] = useState(() => loadMoveCheckIns());
  const introUrl = crackerIntroVideoUrl();
  const challenge = useMemo(
    () =>
      buildChallengeProgress({
        history,
        checklist,
        checkIns,
        level: crackerLevelFromExperience(experience),
      }),
    [history, checklist, checkIns, experience],
  );

  useEffect(() => {
    setChecklist(loadMoveChecklist());
    setCheckIns(loadMoveCheckIns());
  }, []);

  const toggleIntro = () => {
    setChecklist((current) => {
      const next = setIntroWatched(current, !current.intro);
      saveMoveChecklist(next);
      return next;
    });
  };

  return (
    <div className="screen cracker-screen cracker-home">
      <header className="cracker-topbar">
        <BrandLogo variant="cracker" size="header" className="cracker-home-logo" />
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

      <section className="cracker-week-hero">
        <p className="cracker-week-kicker">WEEK {week} OF {totalWeeks}</p>
        <p className="cracker-dates">{CRACKER_DATES_LABEL}</p>
        <h1 className="cracker-week-line">{crackerMotivationalLine(week)}</h1>
        <div className="cracker-progress" aria-label={`Week progress ${weekProgress}%`}>
          <span style={{ width: `${weekProgress}%` }} />
        </div>
        <p className="cracker-progress-meta">
          {sessionsDone}/{sessionsTarget || "—"} sessions this week
        </p>
      </section>

      <article className="card cracker-intro-card" aria-label="Jess intro video">
        <p className="eyebrow">WATCH JESS</p>
        <h2>Intro to CRACKER training</h2>
        <p className="muted">
          Start here. Jess walks you through how the six weeks work.
        </p>
        {introUrl ? (
          <InAppVideo url={introUrl} title="Jess intro to CRACKER training" />
        ) : (
          <p className="auth-info">Intro video will play here once we have Jess&apos;s link.</p>
        )}
        <button type="button" className="secondary-btn" onClick={toggleIntro}>
          {checklist.intro ? "INTRO WATCHED" : "MARK INTRO WATCHED"}
        </button>
      </article>

      <button type="button" className="card cracker-home-progress" onClick={onOpenProgress}>
        <p className="eyebrow">MY PROGRESS</p>
        <div className="cracker-progress" aria-label={`${challenge.percent}% complete`}>
          <span style={{ width: `${challenge.percent}%` }} />
        </div>
        <p className="cracker-home-progress-meta">
          {challenge.percent}% complete · {challenge.workoutsDone}/{challenge.workoutsTarget} workouts
        </p>
        <span className="cracker-home-progress-cta">VIEW MY PROGRESS</span>
      </button>

      <ChallengeTimeline />

      <div className="cracker-pillar-stack">
        {PILLARS.map((pillar) => (
          <article key={pillar.key} className="cracker-pillar-card">
            <div
              className={`cracker-pillar-media${pillar.mediaClass ? ` ${pillar.mediaClass}` : ""}`}
              style={{ backgroundImage: `url(${pillar.image})` }}
              aria-hidden="true"
            />
            <div className="cracker-pillar-body">
              <h2>{pillar.title}</h2>
              <p>{pillar.line}</p>
              <button type="button" className="cta-btn" onClick={() => onNavigate(pillar.key)}>
                {pillar.cta}
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
