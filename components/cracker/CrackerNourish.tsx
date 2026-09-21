"use client";

import { ExternalLinkIcon } from "@/components/cracker/icons";
import {
  CRACKER_EXTERNAL_LINKS,
  CRACKER_NUTRITION_SUPPORT_EMAIL,
  configuredUrl,
  facebookCommunityUrl,
  isWellnessClub,
  nutritionEducationLinks,
  nutritionSupportMailto,
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
  const supportMail = nutritionSupportMailto();
  const facebook = facebookCommunityUrl();

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
        <p className="eyebrow">{NOURISH_COPY.supportEyebrow}</p>
        <h2>{NOURISH_COPY.supportTitle}</h2>
        <p className="muted">{NOURISH_COPY.supportBody}</p>
        <p className="profile-help-detail nourish-support-email">{CRACKER_NUTRITION_SUPPORT_EMAIL}</p>
        <ExternalCta href={supportMail} label={NOURISH_COPY.supportEmailCta} />
        <ExternalCta href={facebook} label={NOURISH_COPY.supportMessageCta} secondary />
      </article>

      <article className="card nourish-hub-card">
        <p className="eyebrow">OPTIONAL UPGRADE</p>
        <h2>WANT MORE SUPPORT?</h2>
        <p className="muted">Upgrade to Happy Healthy Nutrition with Jess Lowe.</p>
        <p className="nourish-price">
          {NOURISH_COPY.personalisedPrice}{" "}
          <span className="nourish-price-period">{NOURISH_COPY.pricePeriod}</span>
        </p>
        <ExternalCta href={personalised} label="UPGRADE TO HAPPY HEALTHY NUTRITION" />
      </article>

      {showWellness ? (
        <article className="card nourish-hub-card">
          <p className="eyebrow">OPTIONAL UPGRADE</p>
          <h2>ADD SOUL WELLNESS</h2>
          <p className="muted">Upgrade your CRACKER experience with Soul Wellness access.</p>
          <p className="nourish-price">
            {NOURISH_COPY.wellnessPrice}{" "}
            <span className="nourish-price-period">{NOURISH_COPY.pricePeriod}</span>
          </p>
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

function ExternalCta({
  href,
  label,
  secondary = false,
}: {
  href: string | null;
  label: string;
  secondary?: boolean;
}) {
  if (!href) {
    return (
      <button type="button" className="secondary-btn" disabled>
        COMING SOON
      </button>
    );
  }
  const isMail = href.startsWith("mailto:");
  return (
    <a
      className={`${secondary ? "secondary-btn" : "cta-btn"} cracker-external-cta`}
      href={href}
      target={isMail ? undefined : "_blank"}
      rel={isMail ? undefined : "noopener noreferrer"}
    >
      <span>{label}</span>
      <ExternalLinkIcon size={16} />
    </a>
  );
}
