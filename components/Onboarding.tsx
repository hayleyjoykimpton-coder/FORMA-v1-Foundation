"use client";

import { useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { heroImage, IMAGES } from "@/lib/content";
import { BRAND } from "@/lib/brand";
import {
  CLUB_LABELS,
  CLUBS,
  createProfile,
  EQUIPMENT_LABELS,
  EXPERIENCE_LABELS,
  GOAL_LABELS,
  GENDER_LABELS,
  LOCATION_LABELS,
  NUTRITION_LABELS,
} from "@/lib/user";
import type {
  EquipmentAccess,
  ExperienceLevel,
  Gender,
  Goal,
  LifeSoulClub,
  NutritionGoal,
  TrainingDays,
  UserProfile,
  WorkoutLocation,
} from "@/lib/user";
import type { InBodyDraft } from "@/lib/inbody";

type Choice<T> = { value: T; label: string; hint?: string };

const GOALS: Choice<Goal>[] = (Object.keys(GOAL_LABELS) as Goal[]).map((value) => ({ value, label: GOAL_LABELS[value] }));
const EXPERIENCE: Choice<ExperienceLevel>[] = [
  { value: "beginner", label: "Beginner", hint: "New to structured training" },
  { value: "intermediate", label: "Intermediate", hint: "Comfortable with the basics" },
  { value: "advanced", label: "Advanced", hint: "Years of consistent training" },
];
const DAYS: Choice<TrainingDays>[] = [
  { value: 3, label: "3 days", hint: "Full body" },
  { value: 4, label: "4 days", hint: "Upper / lower" },
  { value: 5, label: "5 days", hint: "Glute emphasis + upper" },
];
const LOCATIONS: Choice<WorkoutLocation>[] = (Object.keys(LOCATION_LABELS) as WorkoutLocation[]).map((value) => ({ value, label: LOCATION_LABELS[value] }));
const EQUIPMENT: Choice<EquipmentAccess>[] = (Object.keys(EQUIPMENT_LABELS) as EquipmentAccess[]).map((value) => ({ value, label: EQUIPMENT_LABELS[value] }));
const NUTRITION: Choice<NutritionGoal>[] = [
  { value: "maintain", label: NUTRITION_LABELS.maintain, hint: "Steady energy" },
  { value: "lose", label: NUTRITION_LABELS.lose, hint: "Calorie awareness" },
  { value: "gain", label: NUTRITION_LABELS.gain, hint: "Fuel for muscle" },
  { value: "recomp", label: NUTRITION_LABELS.recomp, hint: "High protein, near maintenance" },
];

const GENDERS: Choice<Gender>[] = [
  { value: "female", label: GENDER_LABELS.female, hint: "Personalised nutrition targets" },
  { value: "male", label: GENDER_LABELS.male, hint: "Personalised nutrition targets" },
  { value: "unspecified", label: GENDER_LABELS.unspecified, hint: "Skip for now" },
];

const CLUB_OPTIONS: Choice<LifeSoulClub>[] = CLUBS.map((value) => ({
  value,
  label: CLUB_LABELS[value],
  hint: "Your Life & Soul club",
}));

/** Welcome + 10 content steps (name → gender → club → … → lifestyle). */
const TOTAL_STEPS = 11;

export type OnboardingResult = {
  profile: UserProfile;
  /** Optional first InBody snapshot from day-one onboarding. */
  inbodyDraft?: InBodyDraft;
};

export function Onboarding({ onComplete }: { onComplete: (result: OnboardingResult) => void }) {
  const [step, setStep] = useState(0);
  const [firstName, setFirstName] = useState("");
  const [gender, setGender] = useState<Gender>("unspecified");
  const [club, setClub] = useState<LifeSoulClub | null>(null);
  const [goal, setGoal] = useState<Goal>("sculpt");
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>("beginner");
  const [trainingDays, setTrainingDays] = useState<TrainingDays>(3);
  const [workoutLocation, setWorkoutLocation] = useState<WorkoutLocation>("gym");
  const [equipmentAccess, setEquipmentAccess] = useState<EquipmentAccess>("full_gym");
  const [nutritionGoal, setNutritionGoal] = useState<NutritionGoal>("maintain");
  const [inWeight, setInWeight] = useState("");
  const [inSmm, setInSmm] = useState("");
  const [inFatPct, setInFatPct] = useState("");
  const [inLean, setInLean] = useState("");
  const [sleep, setSleep] = useState("");
  const [steps, setSteps] = useState("");
  const [stress, setStress] = useState("");

  const buildInBodyDraft = (): InBodyDraft | undefined => {
    if (!inWeight.trim() && !inSmm.trim() && !inFatPct.trim() && !inLean.trim()) return undefined;
    return {
      weightKg: inWeight.trim() || undefined,
      skeletalMuscleMassKg: inSmm.trim() || undefined,
      bodyFatPercent: inFatPct.trim() || undefined,
      leanBodyMassKg: inLean.trim() || undefined,
      notes: "Logged during onboarding",
    };
  };

  const finish = () => {
    const draft = buildInBodyDraft();
    const weightNum = inWeight.trim() ? Number(inWeight) : null;
    onComplete({
      profile: createProfile({
        firstName: firstName || "Friend",
        gender,
        club: club!,
        goal,
        experienceLevel,
        trainingDays,
        workoutLocation,
        equipmentAccess,
        nutritionGoal,
        weight: weightNum !== null && Number.isFinite(weightNum) ? weightNum : null,
        sleepAverage: sleep ? Number(sleep) : null,
        dailySteps: steps ? Number(steps) : null,
        lifestyle: stress,
      }),
      ...(draft ? { inbodyDraft: draft } : {}),
    });
  };

  const next = () => setStep((current) => Math.min(TOTAL_STEPS, current + 1));
  const back = () => setStep((current) => Math.max(0, current - 1));

  const nameReady = firstName.trim().length > 0;
  const clubReady = club !== null;

  return (
    <div className="app">
      <div className="shell">
        <div className="onboard-screen">
          {step > 0 && (
            <div className="onboard-top">
              <button className="ghost-btn" onClick={back}>‹ Back</button>
              <div className="onboard-progress" aria-hidden>
                {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
                  <span key={index} className={index < step ? "done" : ""} />
                ))}
              </div>
            </div>
          )}

          {step === 0 && (
            <div className="onboard-body">
              <BrandLogo />
              <div
                className="onboard-hero-img"
                style={{ backgroundImage: `linear-gradient(180deg, rgba(74,55,44,.04), rgba(74,55,44,.4)), url(${heroImage(gender === "male" ? "male" : gender === "female" ? "female" : undefined)})` }}
                aria-hidden
              />
              <h1>Welcome to {BRAND.name}</h1>
              <p className="onboard-lead">Your personalised strength and wellness journey begins here.</p>
              <div className="onboard-nav">
                <button className="cta-btn" onClick={next}>Begin</button>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="onboard-body">
              <span className="eyebrow">Step 1</span>
              <h1>What should we call you?</h1>
              <p className="onboard-lead">We&rsquo;ll use your name to personalise your coaching.</p>
              <div className="onboard-input field">
                <span>First name</span>
                <input value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="e.g. Emma" autoFocus />
              </div>
              <div className="onboard-nav">
                <button className="cta-btn" disabled={!nameReady} onClick={next}>Continue</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <StepChoice
              eyebrow="Step 2"
              title="Which best describes you?"
              lead="Helps us personalise nutrition and coaching for men and women in the challenge."
              options={GENDERS}
              selected={gender}
              onSelect={setGender}
              onNext={next}
            />
          )}

          {step === 3 && (
            <StepChoice
              eyebrow="Step 3"
              title="Which club are you in?"
              lead="For the 6-week challenge — pick your Life & Soul location."
              options={CLUB_OPTIONS}
              selected={club}
              onSelect={(value) => setClub(value)}
              onNext={next}
              continueDisabled={!clubReady}
            />
          )}

          {step === 4 && (
            <StepChoice
              eyebrow="Step 4"
              title="What's your main goal?"
              options={GOALS}
              selected={goal}
              onSelect={setGoal}
              onNext={next}
            />
          )}

          {step === 5 && (
            <StepChoice
              eyebrow="Step 5"
              title="Your experience level"
              options={EXPERIENCE}
              selected={experienceLevel}
              onSelect={setExperienceLevel}
              onNext={next}
            />
          )}

          {step === 6 && (
            <StepChoice
              eyebrow="Step 6"
              title="How many days a week?"
              options={DAYS}
              selected={trainingDays}
              onSelect={setTrainingDays}
              onNext={next}
            />
          )}

          {step === 7 && (
            <StepChoice
              eyebrow="Step 7"
              title="Where will you train?"
              options={LOCATIONS}
              selected={workoutLocation}
              onSelect={setWorkoutLocation}
              onNext={next}
            />
          )}

          {step === 8 && (
            <StepChoice
              eyebrow="Step 8"
              title="What equipment do you have?"
              options={EQUIPMENT}
              selected={equipmentAccess}
              onSelect={setEquipmentAccess}
              onNext={next}
            />
          )}

          {step === 9 && (
            <StepChoice
              eyebrow="Step 9"
              title="What's your nutrition goal?"
              lead="This sets your daily calorie and macro targets from day one."
              options={NUTRITION}
              selected={nutritionGoal}
              onSelect={setNutritionGoal}
              onNext={next}
            />
          )}

          {step === 10 && (
            <div className="onboard-body">
              <span className="eyebrow">Step 10 · Optional</span>
              <h1>Got a recent InBody?</h1>
              <p className="onboard-lead">
                Log a baseline now so Progress has somewhere to grow from. Skip if you don&rsquo;t have numbers yet.
              </p>
              <div className="onboard-input field">
                <span>Weight (kg)</span>
                <input type="number" step="0.1" inputMode="decimal" value={inWeight} onChange={(event) => setInWeight(event.target.value)} placeholder="e.g. 62.4" />
              </div>
              <div className="onboard-input field">
                <span>Skeletal muscle (kg)</span>
                <input type="number" step="0.1" inputMode="decimal" value={inSmm} onChange={(event) => setInSmm(event.target.value)} placeholder="e.g. 24.1" />
              </div>
              <div className="onboard-input field">
                <span>Body fat %</span>
                <input type="number" step="0.1" inputMode="decimal" value={inFatPct} onChange={(event) => setInFatPct(event.target.value)} placeholder="e.g. 28.5" />
              </div>
              <div className="onboard-input field">
                <span>Lean body mass (kg)</span>
                <input type="number" step="0.1" inputMode="decimal" value={inLean} onChange={(event) => setInLean(event.target.value)} placeholder="e.g. 44.6" />
              </div>
              <div className="onboard-nav">
                <button className="cta-btn" onClick={next}>
                  {inWeight || inSmm || inFatPct || inLean ? "Continue" : "Skip for now"}
                </button>
              </div>
            </div>
          )}

          {step === 11 && (
            <div className="onboard-body">
              <span className="eyebrow">Step 11 · Optional</span>
              <h1>A little about your lifestyle</h1>
              <p className="onboard-lead">This helps {BRAND.name} balance training and recovery. You can skip it.</p>
              <div className="onboard-input field">
                <span>Average sleep (hours)</span>
                <input type="number" value={sleep} onChange={(event) => setSleep(event.target.value)} placeholder="e.g. 7" />
              </div>
              <div className="onboard-input field">
                <span>Daily steps</span>
                <input type="number" value={steps} onChange={(event) => setSteps(event.target.value)} placeholder="e.g. 8000" />
              </div>
              <div className="onboard-input field">
                <span>Stress level</span>
                <input value={stress} onChange={(event) => setStress(event.target.value)} placeholder="e.g. Moderate" />
              </div>
              <div className="onboard-nav">
                <button className="cta-btn" onClick={finish}>Create my plan</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StepChoice<T extends string | number>({
  eyebrow,
  title,
  lead,
  options,
  selected,
  onSelect,
  onNext,
  continueDisabled = false,
}: {
  eyebrow: string;
  title: string;
  lead?: string;
  options: Choice<T>[];
  selected: T | null;
  onSelect: (value: T) => void;
  onNext: () => void;
  continueDisabled?: boolean;
}) {
  return (
    <div className="onboard-body">
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      {lead ? <p className="onboard-lead">{lead}</p> : null}
      <div className="choice-grid">
        {options.map((option) => (
          <button
            key={String(option.value)}
            className={`choice${selected === option.value ? " selected" : ""}`}
            onClick={() => onSelect(option.value)}
          >
            {option.label}
            {option.hint ? <small>{option.hint}</small> : null}
          </button>
        ))}
      </div>
      <div className="onboard-nav">
        <button className="cta-btn" disabled={continueDisabled} onClick={onNext}>Continue</button>
      </div>
    </div>
  );
}
