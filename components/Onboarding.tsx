"use client";

import { useState } from "react";
import { IMAGES } from "@/lib/content";
import {
  createProfile,
  EQUIPMENT_LABELS,
  EXPERIENCE_LABELS,
  GOAL_LABELS,
  LOCATION_LABELS,
} from "@/lib/user";
import type {
  EquipmentAccess,
  ExperienceLevel,
  Goal,
  TrainingDays,
  UserProfile,
  WorkoutLocation,
} from "@/lib/user";

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

const TOTAL_STEPS = 7;

export function Onboarding({ onComplete }: { onComplete: (profile: UserProfile) => void }) {
  const [step, setStep] = useState(0);
  const [firstName, setFirstName] = useState("");
  const [goal, setGoal] = useState<Goal>("sculpt");
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>("beginner");
  const [trainingDays, setTrainingDays] = useState<TrainingDays>(3);
  const [workoutLocation, setWorkoutLocation] = useState<WorkoutLocation>("gym");
  const [equipmentAccess, setEquipmentAccess] = useState<EquipmentAccess>("full_gym");
  const [sleep, setSleep] = useState("");
  const [steps, setSteps] = useState("");
  const [stress, setStress] = useState("");

  const finish = () => {
    onComplete(
      createProfile({
        firstName: firstName || "Friend",
        goal,
        experienceLevel,
        trainingDays,
        workoutLocation,
        equipmentAccess,
        sleepAverage: sleep ? Number(sleep) : null,
        dailySteps: steps ? Number(steps) : null,
        lifestyle: stress,
      }),
    );
  };

  const next = () => setStep((current) => Math.min(TOTAL_STEPS, current + 1));
  const back = () => setStep((current) => Math.max(0, current - 1));

  const nameReady = firstName.trim().length > 0;

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
              <span className="wordmark">FORMA</span>
              <div
                className="onboard-hero-img"
                style={{ backgroundImage: `linear-gradient(180deg, rgba(58,42,32,.04), rgba(58,42,32,.4)), url(${IMAGES.hero})` }}
                aria-hidden
              />
              <h1>Welcome to FORMA</h1>
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
              title="What's your main goal?"
              options={GOALS}
              selected={goal}
              onSelect={setGoal}
              onNext={next}
            />
          )}

          {step === 3 && (
            <StepChoice
              eyebrow="Step 3"
              title="Your experience level"
              options={EXPERIENCE}
              selected={experienceLevel}
              onSelect={setExperienceLevel}
              onNext={next}
            />
          )}

          {step === 4 && (
            <StepChoice
              eyebrow="Step 4"
              title="How many days a week?"
              options={DAYS}
              selected={trainingDays}
              onSelect={setTrainingDays}
              onNext={next}
            />
          )}

          {step === 5 && (
            <StepChoice
              eyebrow="Step 5"
              title="Where will you train?"
              options={LOCATIONS}
              selected={workoutLocation}
              onSelect={setWorkoutLocation}
              onNext={next}
            />
          )}

          {step === 6 && (
            <StepChoice
              eyebrow="Step 6"
              title="What equipment do you have?"
              options={EQUIPMENT}
              selected={equipmentAccess}
              onSelect={setEquipmentAccess}
              onNext={next}
            />
          )}

          {step === 7 && (
            <div className="onboard-body">
              <span className="eyebrow">Step 7 · Optional</span>
              <h1>A little about your lifestyle</h1>
              <p className="onboard-lead">This helps FORMA balance training and recovery. You can skip it.</p>
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
  options,
  selected,
  onSelect,
  onNext,
}: {
  eyebrow: string;
  title: string;
  options: Choice<T>[];
  selected: T;
  onSelect: (value: T) => void;
  onNext: () => void;
}) {
  return (
    <div className="onboard-body">
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
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
        <button className="cta-btn" onClick={onNext}>Continue</button>
      </div>
    </div>
  );
}
