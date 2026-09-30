"use client";

type Props = {
  title: string;
  onResume: () => void;
  onDiscard: () => void;
};

export function CrackerResumeCard({ title, onResume, onDiscard }: Props) {
  return (
    <article className="card resume-card cracker-resume-card" aria-label="Unfinished workout">
      <div>
        <p className="eyebrow">UNFINISHED WORKOUT</p>
        <strong>{title}</strong>
        <p className="muted">Your sets are still saved. Continue where you left off.</p>
      </div>
      <div className="resume-actions">
        <button type="button" className="cta-btn" onClick={onResume}>
          CONTINUE WORKOUT
        </button>
        <button type="button" className="secondary-btn" onClick={onDiscard}>
          DISCARD
        </button>
      </div>
    </article>
  );
}
