"use client";

import { ExternalLinkIcon } from "@/components/cracker/icons";
import {
  CRACKER_EXTERNAL_LINKS,
  configuredUrl,
  isWellnessClub,
  nutritionEducationLinks,
  personalisedNutritionUrl,
  wellnessUpgradeUrl,
} from "@/lib/crackerLinks";
import { CLUB_LABELS, type LifeSoulClub } from "@/lib/user";
import { NOURISH_COPY, NOURISH_HERO_IMAGE } from "@/lib/nourish";

type Props = {
  club: LifeSoulClub;
  onOpenProfile: () => void;
  profileInitial: string;
  profilePhoto?: string;
};

export function CrackerNourish({
  club,
  onOpenProfile,
  profileInitial,
  profilePhoto,
}: Props) {
  const nutritionUrl = configuredUrl(CRACKER_EXTERNAL_LINKS.nutritionProgram);
  const personalised = personalisedNutritionUrl();
  const showWellness = isWellnessClub(club);
  const wellnessUrl = showWellness ? wellnessUpgradeUrl(club) : null;
  const education = nutritionEducationLinks();

  return (
    <div className="screen cracker-screen cracker-nourish">
      <header className="cracker-topbar">
        <div>
          <p className="cracker-screen-kicker">{NOURISH_COPY.title}</p>
          <h1 className="cracker-screen-title">{NOURISH_COPY.supporting}</h1>
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
        style={{ backgroundImage: `url(${NOURISH_HERO_IMAGE})` }}
        role="img"
        aria-label="Fresh whole foods"
      />

      <article className="card nourish-hub-card">
        <h2>YOUR 6-WEEK NUTRITION PROGRAM</h2>
        <p className="muted">
          Your base nutrition plan, recipes and weekly nutrition education with Naomi Gillespie.
        </p>
        <ExternalCta href={nutritionUrl} label="OPEN NUTRITION PROGRAM" />
      </article>

      <article className="card nourish-hub-card">
        <p className="eyebrow">OPTIONAL UPGRADE</p>
        <h2>WANT MORE SUPPORT?</h2>
        <p className="muted">Upgrade to personalised nutrition coaching with Jess Lowe.</p>
        <ExternalCta href={personalised} label="UPGRADE NUTRITION" />
      </article>

      {showWellness ? (
        <article className="card nourish-hub-card">
          <p className="eyebrow">OPTIONAL UPGRADE</p>
          <h2>ADD SOUL WELLNESS</h2>
          <p className="muted">Upgrade your CRACKER experience with Soul Wellness access.</p>
          <p className="nourish-price">$10</p>
          <p className="muted">
            Fremantle · Broome · Karratha
            <br />
            Available at participating clubs only.
            {club ? ` Your club: ${CLUB_LABELS[club]}.` : ""}
          </p>
          <ExternalCta href={wellnessUrl} label="ADD WELLNESS" />
        </article>
      ) : null}

      {education.length ? (
        <section className="nourish-hub-education" aria-label="Nutrition education">
          <p className="eyebrow">NUTRITION EDUCATION</p>
          {education.map((item) => (
            <ExternalCta key={item.url} href={item.url} label={item.title} />
          ))}
        </section>
      ) : null}
    </div>
  );
}

function ExternalCta({ href, label }: { href: string | null; label: string }) {
  if (!href) {
    return (
      <button type="button" className="secondary-btn" disabled>
        COMING SOON
      </button>
    );
  }
  return (
    <a className="cta-btn cracker-external-cta" href={href} target="_blank" rel="noopener noreferrer">
      <span>{label}</span>
      <ExternalLinkIcon size={16} />
    </a>
  );
}
