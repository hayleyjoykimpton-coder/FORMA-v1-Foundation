"use client";

import { NOURISH_COPY, NOURISH_PROGRAM_URL } from "@/lib/nourish";

export type CrackerPillarId = "move" | "nourish" | "connect";

type Props = {
  active?: CrackerPillarId;
  onMove?: () => void;
  onConnect?: () => void;
};

function ExternalIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M6.5 3.5H4.2A1.7 1.7 0 0 0 2.5 5.2v6.6A1.7 1.7 0 0 0 4.2 13.5h6.6a1.7 1.7 0 0 0 1.7-1.7V9.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M9.5 2.5H13.5V6.5M7.5 8.5L13.2 2.8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Official Christmas Cracker pillars — MOVE · NOURISH · CONNECT.
 * Nourish opens the live Nutrition site externally.
 */
export function CrackerPillars({ active, onMove, onConnect }: Props) {
  return (
    <nav className="cracker-pillars" aria-label="Christmas Cracker pillars">
      <p className="cracker-pillars-label">
        <span>MOVE</span>
        <span aria-hidden="true">·</span>
        <span>NOURISH</span>
        <span aria-hidden="true">·</span>
        <span>CONNECT</span>
      </p>
      <div className="cracker-pillars-grid">
        <button
          type="button"
          className={`cracker-pillar${active === "move" ? " is-active" : ""}`}
          onClick={onMove}
        >
          <span className="cracker-pillar-name">MOVE</span>
          <span className="cracker-pillar-copy">Train your six weeks.</span>
        </button>

        <a
          className={`cracker-pillar cracker-pillar-link${active === "nourish" ? " is-active" : ""}`}
          href={NOURISH_PROGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="cracker-pillar-name">
            {NOURISH_COPY.title}
            <ExternalIcon />
          </span>
          <span className="cracker-pillar-copy">{NOURISH_COPY.supporting}</span>
          <span className="cracker-pillar-cta">{NOURISH_COPY.ctaHome}</span>
        </a>

        <button
          type="button"
          className={`cracker-pillar${active === "connect" ? " is-active" : ""}`}
          onClick={onConnect}
        >
          <span className="cracker-pillar-name">CONNECT</span>
          <span className="cracker-pillar-copy">Club, wellness &amp; community.</span>
        </button>
      </div>
    </nav>
  );
}
