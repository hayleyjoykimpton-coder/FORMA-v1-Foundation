"use client";

import { useState, type ReactNode } from "react";

/** Progressive disclosure for secondary Home / Progress sections. */
export function CollapsibleSection({
  eyebrow,
  title,
  summary,
  defaultOpen = false,
  children,
}: {
  eyebrow: string;
  title: string;
  /** One-line teaser when collapsed */
  summary?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className={`collapsible-section${open ? " open" : ""}`}>
      <button
        type="button"
        className="collapsible-head"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <div className="collapsible-copy">
          <span className="eyebrow">{eyebrow}</span>
          <strong>{title}</strong>
          {!open && summary ? <small className="muted">{summary}</small> : null}
        </div>
        <span className="collapsible-chevron" aria-hidden>
          {open ? "−" : "+"}
        </span>
      </button>
      {open ? <div className="collapsible-body">{children}</div> : null}
    </section>
  );
}

export function ScoreExplainer({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="score-explainer">
      <button type="button" className="score-explainer-toggle" onClick={() => setOpen((v) => !v)}>
        {open ? "Hide" : "How this works"} · {title}
      </button>
      {open ? <div className="score-explainer-body">{children}</div> : null}
    </div>
  );
}
