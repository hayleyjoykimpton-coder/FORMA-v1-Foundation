"use client";

import { NOURISH_COPY, NOURISH_PROGRAM_URL } from "@/lib/nourish";

type Variant = "section" | "home";

type Props = {
  variant?: Variant;
};

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M6.5 3.5H4.2A1.7 1.7 0 0 0 2.5 5.2v6.6A1.7 1.7 0 0 0 4.2 13.5h6.6a1.7 1.7 0 0 0 1.7-1.7V9.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M9.5 2.5H13.5V6.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.5 8.5L13.2 2.8"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Polished NOURISH pillar — opens the live Nutrition program externally. */
export function NourishCard({ variant = "section" }: Props) {
  const cta = variant === "home" ? NOURISH_COPY.ctaHome : NOURISH_COPY.ctaPrimary;

  return (
    <article className={`nourish-card nourish-card--${variant}`} aria-label="Nourish">
      <div className="nourish-card-glow" aria-hidden="true" />
      <div className="nourish-card-body">
        <span className="eyebrow">Christmas Cracker · Pillar</span>
        <h2 className="nourish-card-title">{NOURISH_COPY.title}</h2>
        <p className="nourish-card-supporting">{NOURISH_COPY.supporting}</p>
        {variant === "section" ? (
          <p className="nourish-card-desc muted">{NOURISH_COPY.description}</p>
        ) : null}
        <a
          className="cta-btn nourish-cta"
          href={NOURISH_PROGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span>{cta}</span>
          <ExternalLinkIcon className="nourish-external-icon" />
        </a>
        <p className="nourish-card-note muted">
          Opens the Christmas Cracker Nutrition platform in a new tab.
        </p>
      </div>
    </article>
  );
}
