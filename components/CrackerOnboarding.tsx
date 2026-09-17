"use client";

import { useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import {
  CLUB_LABELS,
  createProfile,
  EXPERIENCE_LABELS,
  LIFE_SOUL_CLUBS,
  NUTRITION_LABELS,
} from "@/lib/user";
import type {
  ExperienceLevel,
  LifeSoulClub,
  NutritionGoal,
  UserProfile,
} from "@/lib/user";

type Choice<T> = { value: T; label: string; hint?: string };

const CLUBS: Choice<Exclude<LifeSoulClub, "">>[] = LIFE_SOUL_CLUBS.map((value) => ({
  value,
  label: CLUB_LABELS[value],
}));

const EXPERIENCE: Choice<ExperienceLevel>[] = [
  { value: "beginner", label: EXPERIENCE_LABELS.beginner, hint: "New to the gym floor or back after a break" },
  { value: "intermediate", label: EXPERIENCE_LABELS.intermediate, hint: "Comfortable with machines and free weights" },
  { value: "advanced", label: EXPERIENCE_LABELS.advanced, hint: "Training consistently — we'll use the intermediate plan" },
];

const NUTRITION: Choice<NutritionGoal>[] = [
  { value: "maintain", label: NUTRITION_LABELS.maintain, hint: "Steady energy through the six weeks" },
  { value: "lose", label: NUTRITION_LABELS.lose, hint: "Support fat loss without crash dieting" },
  { value: "gain", label: NUTRITION_LABELS.gain, hint: "Fuel harder training weeks" },
  { value: "recomp", label: NUTRITION_LABELS.recomp, hint: "High protein, near maintenance" },
];

/** Welcome → name → club → experience → challenge → nutrition */
const TOTAL_STEPS = 5;

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
  const [firstName, setFirstName] = useState("");
  const [club, setClub] = useState<Exclude<LifeSoulClub, ""> | "">("");
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>("beginner");
  const [nutritionGoal, setNutritionGoal] = useState<NutritionGoal>("maintain");

  const next = () => setStep((current) => Math.min(TOTAL_STEPS, current + 1));
  const back = () => setStep((current) => Math.max(0, current - 1));

  const finish = () => {
    onComplete({
      joinCracker: true,
      profile: createProfile({
        firstName: firstName.trim() || "Friend",
        club: club || "",
        experienceLevel: experienceLevel === "advanced" ? "intermediate" : experienceLevel,
        trainingDays: 3,
        workoutLocation: "gym",
        equipmentAccess: "full_gym",
        nutritionGoal,
        goal: "fitness",
      }),
    });
  };

  const nameReady = firstName.trim().length > 0;
  const clubReady = club !== "";

  return (
    <div className="app challenge-cracker cracker-onboard-app">
      <div className="shell">
        <div className="onboard-screen cracker-onboard-screen">
          {step > 0 ? (
            <div className="onboard-top">
              <button type="button" className="ghost-btn" onClick={back}>
                ‹ Back
              </button>
              <div className="onboard-progress" aria-hidden>
                {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
                  <span key={index} className={index < step ? "done" : ""} />
                ))}
              </div>
            </div>
          ) : null}

          {step === 0 ? (
            <div className="onboard-body cracker-welcome">
              <BrandLogo variant="duo" size="hero" />
              <p className="cracker-welcome-kicker">Life & Soul · 2026</p>
              <h1>Christmas Cracker</h1>
              <p className="onboard-lead">
                Six weeks of training, fuel and wellness — built for real life at your club.
              </p>
              <ul className="cracker-welcome-points">
                <li>Lower · Upper · Full Body + weekly WOD</li>
                <li>Recipe & food guide with Base / Training serves</li>
                <li>Weekly wellness topics and Week 1 / 6 fitness test</li>
              </ul>
              <div className="onboard-nav">
                <button type="button" className="cta-btn" onClick={next}>
                  Get started
                </button>
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="onboard-body">
              <BrandLogo variant="duo" size="mark" />
              <span className="eyebrow">About you</span>
              <h1>What should we call you?</h1>
              <p className="onboard-lead">We’ll use your first name across your Cracker home screen.</p>
              <div className="onboard-input field">
                <span>First name</span>
                <input
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  placeholder="e.g. Jess"
                  autoFocus
                />
              </div>
              <div className="onboard-nav">
                <button type="button" className="cta-btn" disabled={!nameReady} onClick={next}>
                  Continue
                </button>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="onboard-body">
              <BrandLogo variant="duo" size="mark" />
              <span className="eyebrow">Your club</span>
              <h1>Where do you train?</h1>
              <p className="onboard-lead">Pick your Life & Soul location so we can keep you with your community.</p>
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

          {step === 3 ? (
            <div className="onboard-body">
              <BrandLogo variant="duo" size="mark" />
              <span className="eyebrow">Training level</span>
              <h1>What feels right for you?</h1>
              <p className="onboard-lead">
                This chooses your beginner or intermediate Cracker programme — you can rebuild later in Profile.
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

          {step === 4 ? (
            <div className="onboard-body">
              <BrandLogo variant="duo" size="hero" />
              <span className="eyebrow">Your challenge</span>
              <h1>Join the 6-week Christmas Cracker</h1>
              <p className="onboard-lead">
                {firstName.trim() ? `${firstName.trim()}, y` : "Y"}ou’re signing up for the Life & Soul Christmas
                Cracker{club ? ` at ${CLUB_LABELS[club]}` : ""}.
              </p>
              <article className="card cracker-challenge-pick">
                <BrandLogo size="mark" />
                <div>
                  <strong>Christmas Cracker 2026</strong>
                  <p className="muted">
                    12 Oct – 22 Nov · 3 gym sessions a week · wellness + recipes · fitness test Week 1 &amp; 6
                  </p>
                </div>
              </article>
              <div className="onboard-nav">
                <button type="button" className="cta-btn" onClick={next}>
                  Join Christmas Cracker
                </button>
              </div>
            </div>
          ) : null}

          {step === 5 ? (
            <div className="onboard-body">
              <BrandLogo variant="duo" size="mark" />
              <span className="eyebrow">Fuel</span>
              <h1>Nutrition focus</h1>
              <p className="onboard-lead">
                Sets your meal-log targets. The full Recipe & Food Guide unlocks on Home once you’re in.
              </p>
              <div className="choice-grid">
                {NUTRITION.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`choice${nutritionGoal === option.value ? " selected" : ""}`}
                    onClick={() => setNutritionGoal(option.value)}
                  >
                    {option.label}
                    {option.hint ? <small>{option.hint}</small> : null}
                  </button>
                ))}
              </div>
              <div className="onboard-nav">
                <button type="button" className="cta-btn" onClick={finish}>
                  Enter my Cracker home
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
