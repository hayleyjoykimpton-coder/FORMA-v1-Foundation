"use client";

import { useEffect, useRef, useState } from "react";
import {
  CRACKER_CHALLENGE_MILESTONES,
  isMilestonePast,
  nextChallengeMilestone,
} from "@/lib/challengeDates";

export function ChallengeTimeline({ now = new Date() }: { now?: Date }) {
  const [open, setOpen] = useState(false);
  const next = nextChallengeMilestone(now);
  const trackRef = useRef<HTMLDivElement>(null);
  const nextCardRef = useRef<HTMLButtonElement>(null);
  const allPast = isMilestonePast(next, now);

  useEffect(() => {
    const card = nextCardRef.current;
    const track = trackRef.current;
    if (!card || !track) return;
    const left = card.offsetLeft - 18;
    track.scrollTo({ left: Math.max(0, left), behavior: "auto" });
  }, [next.id]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <section className="cracker-timeline" aria-label="Challenge dates">
      <article className="cracker-next-milestone">
        <p className="eyebrow">{allPast ? "LAST MILESTONE" : "NEXT UP"}</p>
        <h2>{next.label}</h2>
        <p className="cracker-next-milestone-date">{next.dateShort}</p>
      </article>

      <p className="eyebrow">CHALLENGE TIMELINE</p>
      <div className="cracker-timeline-track" ref={trackRef} tabIndex={0} aria-label="Swipe challenge dates">
        {CRACKER_CHALLENGE_MILESTONES.map((item) => {
          const isNext = item.id === next.id && !allPast;
          const past = isMilestonePast(item, now);
          return (
            <button
              key={item.id}
              type="button"
              ref={isNext ? nextCardRef : undefined}
              className={`cracker-timeline-card${isNext ? " is-next" : ""}${past ? " is-past" : ""}`}
              onClick={() => setOpen(true)}
              aria-label={`${item.dateShort} · ${item.label}`}
            >
              {item.kicker ? <span className="cracker-timeline-kicker-label">{item.kicker}</span> : null}
              <strong>{item.dateShort}</strong>
              <span>{item.timelineLabel}</span>
            </button>
          );
        })}
      </div>

      <button type="button" className="cracker-view-all-dates" onClick={() => setOpen(true)}>
        VIEW ALL DATES
      </button>

      {open ? <DatesSheet onClose={() => setOpen(false)} nextId={next.id} /> : null}
    </section>
  );
}

function DatesSheet({ onClose, nextId }: { onClose: () => void; nextId: string }) {
  return (
    <div className="cracker-dates-backdrop" role="presentation" onClick={onClose}>
      <div
        className="cracker-dates-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cracker-dates-sheet-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="cracker-dates-sheet-head">
          <h2 id="cracker-dates-sheet-title">Challenge dates</h2>
          <button type="button" className="text-btn" onClick={onClose}>
            Close
          </button>
        </div>
        <ol className="cracker-dates-sheet-list">
          {CRACKER_CHALLENGE_MILESTONES.map((item) => (
            <li key={item.id} className={item.id === nextId ? "is-next" : undefined}>
              <strong>{item.label}</strong>
              <span>{item.dateLabel}</span>
              {item.note ? <em>{item.note}</em> : null}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
