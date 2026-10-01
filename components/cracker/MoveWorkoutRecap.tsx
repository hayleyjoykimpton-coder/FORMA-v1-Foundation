"use client";

import { useEffect, useMemo, useState } from "react";
import { takeRecapFocus } from "@/lib/crackerNav";
import { buildWorkoutRecaps, type WorkoutRecap } from "@/lib/workoutRecap";
import type { WorkoutSession } from "@/lib/types";

type Props = {
  history: WorkoutSession[];
  profileInitial: string;
  profilePhoto?: string;
  onOpenProfile: () => void;
};

function RecapCard({
  recap,
  open,
  onToggle,
}: {
  recap: WorkoutRecap;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <article className={`cracker-recap-card${open ? " is-open" : ""}`}>
      <button type="button" className="cracker-recap-summary" onClick={onToggle}>
        <span className="eyebrow">
          {recap.dateLabel} · {recap.weekLabel}
        </span>
        <strong>{recap.session.workoutTitle}</strong>
        <p>
          {recap.setsDone}/{recap.setsTotal} sets
          {recap.volumeKg > 0 ? ` · ${recap.volumeKg.toLocaleString()} kg volume` : ""}
        </p>
        {recap.volumeVsLast ? <small>{recap.volumeVsLast}</small> : null}
      </button>
      {open ? (
        <div className="cracker-recap-detail">
          {recap.lifts.length ? (
            <ul className="cracker-recap-lifts">
              {recap.lifts.map((lift) => (
                <li key={lift.name}>
                  <span>{lift.name}</span>
                  <strong>{lift.best}</strong>
                  {lift.vsLast ? <small>{lift.vsLast}</small> : null}
                </li>
              ))}
            </ul>
          ) : null}
          {recap.wods.length ? (
            <ul className="cracker-recap-wods">
              {recap.wods.map((wod) => (
                <li key={wod.name}>
                  <span>WOD · {wod.name}</span>
                  <strong>{wod.score}</strong>
                </li>
              ))}
            </ul>
          ) : null}
          {recap.coachLines.length ? (
            <div className="cracker-recap-notes">
              {recap.coachLines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

export function MoveWorkoutRecap({
  history,
  profileInitial,
  profilePhoto,
  onOpenProfile,
}: Props) {
  const recaps = useMemo(() => buildWorkoutRecaps(history), [history]);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    const focus = takeRecapFocus();
    if (focus && recaps.some((item) => item.session.id === focus)) {
      setOpenId(focus);
      return;
    }
    setOpenId((current) => {
      if (current && recaps.some((item) => item.session.id === current)) return current;
      return recaps[0]?.session.id ?? null;
    });
  }, [recaps]);

  return (
    <div className="screen cracker-screen cracker-move cracker-move-panel move-recap-screen">
      <header className="cracker-topbar">
        <div>
          <p className="cracker-screen-kicker">MOVE</p>
          <h1 className="cracker-screen-title">WORKOUT RECAP</h1>
          <p className="cracker-edu-focus">See what you lifted, how the WOD went, and how it compares to last time.</p>
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

      {recaps.length === 0 ? (
        <article className="card cracker-recap-empty">
          <span className="eyebrow">No sessions yet</span>
          <p>Finish a workout and your recap will land here — loads, WOD scores, and progress versus last time.</p>
        </article>
      ) : (
        <div className="cracker-recap-stack">
          {recaps.map((recap) => (
            <RecapCard
              key={recap.session.id}
              recap={recap}
              open={openId === recap.session.id}
              onToggle={() => setOpenId((current) => (current === recap.session.id ? null : recap.session.id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
