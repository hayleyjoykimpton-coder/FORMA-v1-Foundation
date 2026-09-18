"use client";

import { ExternalLinkIcon } from "@/components/cracker/icons";
import { NOURISH_COPY, NOURISH_HERO_IMAGE, NOURISH_PROGRAM_URL } from "@/lib/nourish";

type Props = {
  onOpenProfile: () => void;
  profileInitial: string;
  profilePhoto?: string;
};

export function CrackerNourish({ onOpenProfile, profileInitial, profilePhoto }: Props) {
  return (
    <div className="screen cracker-screen cracker-nourish">
      <header className="cracker-topbar">
        <div>
          <p className="cracker-screen-kicker">{NOURISH_COPY.title}</p>
          <h1 className="cracker-screen-title">{NOURISH_COPY.supporting}</h1>
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

      <div
        className="cracker-hero-media"
        style={{ backgroundImage: `url(${NOURISH_HERO_IMAGE})` }}
        role="img"
        aria-label="Fresh whole foods"
      />

      <section className="cracker-gateway">
        <p className="eyebrow">YOUR NUTRITION PROGRAM</p>
        <h2>{NOURISH_COPY.description}</h2>
        <a
          className="cta-btn cracker-external-cta"
          href={NOURISH_PROGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span>{NOURISH_COPY.ctaPrimary}</span>
          <ExternalLinkIcon size={18} />
        </a>
        <p className="muted cracker-gateway-note">{NOURISH_COPY.note}</p>
      </section>
    </div>
  );
}
