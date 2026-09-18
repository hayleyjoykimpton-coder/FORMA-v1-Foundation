"use client";

import { ExternalLinkIcon } from "@/components/cracker/icons";
import {
  crackerWeeklyTrainingVideoUrl,
  JESS_HEAD_TRAINER,
} from "@/lib/jessTrainer";

type Props = {
  week: number;
};

export function JessHeadTrainerCard({ week }: Props) {
  const videoUrl = crackerWeeklyTrainingVideoUrl(week);

  return (
    <article className="cracker-jess-card" aria-label="Head trainer Jess McKee">
      <div className="cracker-jess-media">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={JESS_HEAD_TRAINER.imageSrc}
          alt={JESS_HEAD_TRAINER.imageAlt}
          className="cracker-jess-image"
        />
      </div>
      <div className="cracker-jess-body">
        <p className="eyebrow">{JESS_HEAD_TRAINER.eyebrow}</p>
        <h2>{JESS_HEAD_TRAINER.name}</h2>
        <p className="cracker-jess-tagline">{JESS_HEAD_TRAINER.tagline}</p>
        <p className="muted">{JESS_HEAD_TRAINER.body}</p>
        <div className="cracker-jess-actions">
          <a
            className="cta-btn cracker-external-cta"
            href={JESS_HEAD_TRAINER.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>{JESS_HEAD_TRAINER.followLabel}</span>
            <ExternalLinkIcon size={16} />
          </a>
          {videoUrl ? (
            <a
              className="secondary-btn cracker-jess-video"
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>{JESS_HEAD_TRAINER.watchLabel}</span>
              <ExternalLinkIcon size={16} />
            </a>
          ) : (
            <button type="button" className="secondary-btn" disabled>
              {JESS_HEAD_TRAINER.comingSoonLabel}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
