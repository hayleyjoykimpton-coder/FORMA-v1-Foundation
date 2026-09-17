"use client";

import { ExternalLinkIcon } from "@/components/cracker/icons";
import { IMAGES } from "@/lib/content";
import { NOURISH_PROGRAM_URL } from "@/lib/nourish";

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
          <p className="cracker-screen-kicker">NOURISH</p>
          <h1 className="cracker-screen-title">Fuel your six weeks.</h1>
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
        style={{ backgroundImage: `url(${IMAGES.nutrition})` }}
        role="img"
        aria-label="Nutrition"
      />

      <section className="cracker-gateway">
        <p className="eyebrow">YOUR NUTRITION PROGRAM</p>
        <h2>Recipes, weekly guidance and resources.</h2>
        <a
          className="cta-btn cracker-external-cta"
          href={NOURISH_PROGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span>OPEN NUTRITION PROGRAM</span>
          <ExternalLinkIcon size={18} />
        </a>
      </section>
    </div>
  );
}
