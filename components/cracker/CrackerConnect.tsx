"use client";

import { ExternalLinkIcon } from "@/components/cracker/icons";
import { IMAGES } from "@/lib/content";
import { CONNECT_COPY, CRACKER_FACEBOOK_URL } from "@/lib/connect";

type Props = {
  onOpenProfile: () => void;
  profileInitial: string;
  profilePhoto?: string;
};

export function CrackerConnect({ onOpenProfile, profileInitial, profilePhoto }: Props) {
  return (
    <div className="screen cracker-screen cracker-connect">
      <header className="cracker-topbar">
        <div>
          <p className="cracker-screen-kicker">{CONNECT_COPY.title}</p>
          <h1 className="cracker-screen-title">{CONNECT_COPY.supporting}</h1>
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
        style={{ backgroundImage: `url(${IMAGES.running})` }}
        role="img"
        aria-label="Community"
      />

      <section className="cracker-gateway">
        <p className="eyebrow">{CONNECT_COPY.section}</p>
        <h2>{CONNECT_COPY.body}</h2>
        <a
          className="cta-btn cracker-external-cta"
          href={CRACKER_FACEBOOK_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span>{CONNECT_COPY.cta}</span>
          <ExternalLinkIcon size={18} />
        </a>
      </section>
    </div>
  );
}
