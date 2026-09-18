"use client";

import { BrandLogo } from "@/components/BrandLogo";
import { IMAGES } from "@/lib/content";
import { CRACKER_DATES_LABEL } from "@/lib/challengeMode";
import { crackerMotivationalLine } from "@/lib/crackerUi";
import { JESS_LAS_PORTRAIT, moveImage } from "@/lib/moveImages";
import { NOURISH_HERO_IMAGE } from "@/lib/nourish";
import type { CrackerTab } from "@/components/cracker/types";

type Props = {
  week: number;
  totalWeeks?: number;
  sessionsDone: number;
  sessionsTarget: number;
  profileInitial: string;
  profilePhoto?: string;
  onOpenProfile: () => void;
  onNavigate: (tab: CrackerTab) => void;
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
    image: IMAGES.running,
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
}: Props) {
  const progress =
    sessionsTarget > 0 ? Math.min(100, Math.round((sessionsDone / sessionsTarget) * 100)) : 0;

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
        <div className="cracker-progress" aria-label={`Week progress ${progress}%`}>
          <span style={{ width: `${progress}%` }} />
        </div>
        <p className="cracker-progress-meta">
          {sessionsDone}/{sessionsTarget || "—"} sessions this week
        </p>
      </section>

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
