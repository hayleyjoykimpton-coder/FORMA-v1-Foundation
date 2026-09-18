"use client";

import { useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { CRACKER_DATES_LABEL } from "@/lib/challengeMode";
import {
  CLUB_LABELS,
  createProfile,
  EXPERIENCE_LABELS,
  LIFE_SOUL_CLUBS,
} from "@/lib/user";
import type { ExperienceLevel, LifeSoulClub, UserProfile } from "@/lib/user";

type Choice<T> = { value: T; label: string; hint?: string };

const CLUBS: Choice<Exclude<LifeSoulClub, "">>[] = LIFE_SOUL_CLUBS.map((value) => ({
  value,
  label: CLUB_LABELS[value],
}));

/** Beginner | Intermediate only — advanced maps to intermediate at save. */
const EXPERIENCE: Choice<"beginner" | "intermediate">[] = [
  {
    value: "beginner",
    label: EXPERIENCE_LABELS.beginner,
    hint: "New to the gym floor or back after a break",
  },
  {
    value: "intermediate",
    label: EXPERIENCE_LABELS.intermediate,
    hint: "Comfortable with machines and free weights",
  },
];

/** Concise challenge summary dates for the ready-step white card. */
const CHALLENGE_DATES_DISPLAY = CRACKER_DATES_LABEL.toUpperCase().replace("–", "—");

/** Club → training level → ready */
const TOTAL_STEPS = 3;

export type CrackerOnboardingResult = {
  profile: UserProfile;
  joinCracker: true;
};

export function CrackerOnboarding({
  onComplete,
}: {
  onComplete: (result: CrackerOnboardingResult) => void;
}) {
  const [step, setStep] = useState(0);
  const [club, setClub] = useState<Exclude<LifeSoulClub, ""> | "">("");
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>("beginner");

  const next = () => setStep((current) => Math.min(TOTAL_STEPS - 1, current + 1));
  const back = () => setStep((current) => Math.max(0, current - 1));

  const finish = () => {
    onComplete({
      joinCracker: true,
      profile: createProfile({
        firstName: "Friend",
        club: club || "",
        experienceLevel: experienceLevel === "advanced" ? "intermediate" : experienceLevel,
        trainingDays: 3,
        workoutLocation: "gym",
        equipmentAccess: "full_gym",
        nutritionGoal: "maintain",
        goal: "fitness",
      }),
    });
  };

  const clubReady = club !== "";

  return (
    <div className="app challenge-cracker cracker-onboard-app">
      <div className="shell">
        <div className="onboard-screen cracker-onboard-screen">
          <div className="onboard-top">
            {step > 0 ? (
              <button type="button" className="ghost-btn" onClick={back}>
                ‹ Back
              </button>
            ) : (
              <span />
            )}
            <div className="onboard-progress" aria-hidden>
              {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
                <span key={index} className={index <= step ? "done" : ""} />
              ))}
            </div>
          </div>

          {step === 0 ? (
            <div className="onboard-body">
              <BrandLogo variant="duo" size="mark" />
              <span className="eyebrow">Member · Club</span>
              <h1>Where do you train?</h1>
              <p className="onboard-lead">
                Confirm your Life & Soul club so we can keep you with your community.
              </p>
              <div className="choice-grid cracker-club-grid">
                {CLUBS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`choice${club === option.value ? " selected" : ""}`}
                    onClick={() => setClub(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <div className="onboard-nav">
                <button type="button" className="cta-btn" disabled={!clubReady} onClick={next}>
                  Continue
                </button>
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="onboard-body">
              <BrandLogo variant="duo" size="mark" />
              <span className="eyebrow">Training level</span>
              <h1>What feels right for you?</h1>
              <p className="onboard-lead">
                This chooses your Beginner or Intermediate Cracker programme — you can change it later
                in Profile.
              </p>
              <div className="choice-grid">
                {EXPERIENCE.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`choice${experienceLevel === option.value ? " selected" : ""}`}
                    onClick={() => setExperienceLevel(option.value)}
                  >
                    {option.label}
                    {option.hint ? <small>{option.hint}</small> : null}
                  </button>
                ))}
              </div>
              <div className="onboard-nav">
                <button type="button" className="cta-btn" onClick={next}>
                  Continue
                </button>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="onboard-body cracker-ready">
              <span className="eyebrow">Ready to go</span>
              <h1>Your Cracker is set</h1>
              <p className="onboard-lead">
                {club ? `${CLUB_LABELS[club]} · ` : ""}
                {EXPERIENCE_LABELS[experienceLevel === "advanced" ? "intermediate" : experienceLevel]}{" "}
                programme. Training lives in FORMA — nutrition is on the CRACKER Nutrition platform.
              </p>
              <article className="card cracker-challenge-pick">
                <BrandLogo variant="cracker" size="mark" />
                <p className="cracker-challenge-pick-dates">{CHALLENGE_DATES_DISPLAY}</p>
                <p className="cracker-challenge-pick-pillars">MOVE · NOURISH · CONNECT</p>
                <p className="cracker-challenge-pick-note">
                  Beginner + Intermediate training available
                </p>
              </article>
              <div className="onboard-nav">
                <button type="button" className="cta-btn" onClick={finish}>
                  Start Cracker
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
