"use client";

import { useState } from "react";
import { ConnectEvents } from "@/components/cracker/ConnectEvents";
import { ConnectFacebookCta } from "@/components/cracker/ConnectFacebookCta";
import { ConnectIncluded } from "@/components/cracker/ConnectIncluded";
import {
  CONNECT_COPY,
  CONNECT_CRACKER_SPIRIT,
  CONNECT_FACEBOOK_USES,
  CONNECT_HERO_IMAGE,
} from "@/lib/connect";
import { loadConnectSubTab, saveConnectSubTab, type ConnectSubTab } from "@/lib/crackerNav";

type Props = {
  onOpenProfile: () => void;
  profileInitial: string;
  profilePhoto?: string;
};

const CONNECT_SUBTABS: { key: ConnectSubTab; label: string }[] = [
  { key: "community", label: "COMMUNITY" },
  { key: "events", label: "EVENTS" },
  { key: "included", label: "WHAT'S INCLUDED" },
];

export function CrackerConnect({ onOpenProfile, profileInitial, profilePhoto }: Props) {
  const [subTab, setSubTab] = useState<ConnectSubTab>(() => loadConnectSubTab());

  const selectSubTab = (tab: ConnectSubTab) => {
    setSubTab(tab);
    saveConnectSubTab(tab);
  };

  const heading =
    subTab === "events"
      ? CONNECT_COPY.eventsTitle
      : subTab === "included"
        ? CONNECT_COPY.includedTitle
        : CONNECT_COPY.supporting;
  const supporting =
    subTab === "events"
      ? CONNECT_COPY.eventsSupporting
      : subTab === "included"
        ? CONNECT_COPY.includedSupporting
        : null;

  return (
    <div className="screen cracker-screen cracker-connect">
      <header className="cracker-topbar">
        <div>
          <p className="cracker-screen-kicker">{CONNECT_COPY.title}</p>
          <h1 className="cracker-screen-title">{heading}</h1>
          {supporting ? <p className="cracker-edu-focus">{supporting}</p> : null}
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

      <nav className="move-subnav connect-subnav" aria-label="CONNECT sections">
        {CONNECT_SUBTABS.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={subTab === item.key}
            className={`move-subnav-btn${subTab === item.key ? " active" : ""}`}
            onClick={() => selectSubTab(item.key)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {subTab === "community" ? <ConnectCommunity /> : null}
      {subTab === "events" ? <ConnectEvents /> : null}
      {subTab === "included" ? <ConnectIncluded /> : null}
    </div>
  );
}

function ConnectCommunity() {
  return (
    <div className="connect-panel">
      <div
        className="cracker-hero-media cracker-hero-media--connect"
        style={{ backgroundImage: `url(${CONNECT_HERO_IMAGE})` }}
        role="img"
        aria-label="Life + Soul community throwing medicine balls"
      />

      <section className="cracker-gateway">
        <p className="eyebrow">{CONNECT_COPY.section}</p>
        <h2>{CONNECT_COPY.body}</h2>
        <ConnectFacebookCta label={CONNECT_COPY.cta} />
      </section>

      <article className="card nourish-hub-card">
        <p className="eyebrow">LIVE ON FACEBOOK</p>
        <p className="muted">{CONNECT_COPY.facebookLiveIntro}</p>
        <ul className="connect-live-list">
          {CONNECT_FACEBOOK_USES.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </article>

      <article className="card nourish-hub-card">
        <p className="eyebrow">{CONNECT_COPY.questionBombEyebrow}</p>
        <h2>{CONNECT_COPY.questionBombTitle}</h2>
        <p className="muted">{CONNECT_COPY.questionBombBody}</p>
        <ConnectFacebookCta label={CONNECT_COPY.questionBombCta} />
      </article>

      <article className="card nourish-hub-card">
        <p className="eyebrow">{CONNECT_COPY.crackerOfWeekEyebrow}</p>
        <h2>{CONNECT_COPY.crackerOfWeekTitle}</h2>
        <p className="muted">{CONNECT_COPY.crackerOfWeekBody}</p>
        <div className="connect-spirit-tags">
          {CONNECT_CRACKER_SPIRIT.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
        <ConnectFacebookCta label={CONNECT_COPY.crackerOfWeekCta} />
      </article>
    </div>
  );
}
