"use client";

import { ExternalLinkIcon } from "@/components/cracker/icons";
import { JESS_HEAD_TRAINER, crackerJessInstagramUrl } from "@/lib/jessTrainer";
import { moveImage } from "@/lib/moveImages";

export function JessHeadTrainerCard() {
  const imageSrc = moveImage("headTrainer") ?? JESS_HEAD_TRAINER.imageSrc;
  const instagram = crackerJessInstagramUrl();

  return (
    <article className="cracker-jess-card" aria-label="Head trainer Jess McKee">
      <div className="cracker-jess-media">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrc}
          alt={JESS_HEAD_TRAINER.imageAlt}
          className="cracker-jess-image"
        />
      </div>
      <div className="cracker-jess-body">
        <p className="eyebrow">{JESS_HEAD_TRAINER.eyebrow}</p>
        <h2>{JESS_HEAD_TRAINER.name}</h2>
        <p className="cracker-jess-tagline">{JESS_HEAD_TRAINER.tagline}</p>
        <p className="muted">{JESS_HEAD_TRAINER.body}</p>
        {instagram ? (
          <div className="cracker-jess-actions">
            <a
              className="cta-btn cracker-external-cta"
              href={instagram}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>{JESS_HEAD_TRAINER.followLabel}</span>
              <ExternalLinkIcon size={16} />
            </a>
          </div>
        ) : null}
      </div>
    </article>
  );
}
