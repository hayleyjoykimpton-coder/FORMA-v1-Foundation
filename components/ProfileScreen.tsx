"use client";

import { useRef, useState } from "react";
import { BRAND } from "@/lib/brand";
import {
  EQUIPMENT_LABELS,
  EXPERIENCE_LABELS,
  GENDER_LABELS,
  GOAL_LABELS,
  LOCATION_LABELS,
  NUTRITION_LABELS,
  STYLE_LABELS,
} from "@/lib/user";
import type {
  EquipmentAccess,
  ExperienceLevel,
  Gender,
  Goal,
  NutritionGoal,
  TrainingDays,
  TrainingStyle,
  UserProfile,
  WorkoutLocation,
} from "@/lib/user";
import { fileToResizedDataUrl } from "@/lib/images";

function numberOrNull(value: string): number | null {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function ProfileScreen({
  profile,
  onSave,
  onClose,
  onViewProgress,
  onRebuildProgramme,
  reminderPrefs,
  onReminderPrefsChange,
  accountMode = "local",
  syncNote = null,
  onSignOut,
  onSignIn,
}: {
  profile: UserProfile;
  onSave: (profile: UserProfile) => void;
  onClose: () => void;
  onViewProgress: () => void;
  onRebuildProgramme?: () => void;
  reminderPrefs?: { enabled: boolean; browserNotify: boolean };
  onReminderPrefsChange?: (prefs: { enabled: boolean; browserNotify: boolean }) => void;
  accountMode?: "local" | "cloud" | "gate" | "booting";
  syncNote?: string | null;
  onSignOut?: () => void | Promise<void>;
  onSignIn?: () => void;
}) {
  const [draft, setDraft] = useState<UserProfile>(profile);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof UserProfile>(key: K, value: UserProfile[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const handlePhoto = async (file: File | null) => {
    if (!file) return;
    try {
      const profilePhoto = await fileToResizedDataUrl(file, 1400, 0.78);
      set("profilePhoto", profilePhoto);
    } catch {
      // Keep current photo if the file cannot be read.
    }
  };

  return (
    <div className="app">
      <div className="shell">
        <div className="profile-screen">
          <div className="profile-head">
            <button className="ghost-btn" onClick={onClose}>‹ Close</button>
            <button className="pill-btn small" onClick={() => onSave(draft)}>Save</button>
          </div>

          <div className="profile-identity">
            <button
              type="button"
              className={`profile-photo ${draft.profilePhoto ? "has-photo" : ""}`}
              style={draft.profilePhoto ? { backgroundImage: `url(${draft.profilePhoto})` } : undefined}
              onClick={() => photoInputRef.current?.click()}
              aria-label="Change cover photo"
            >
              {draft.profilePhoto ? "" : draft.firstName.charAt(0) || "F"}
            </button>
            <div>
              <span className="eyebrow">Your profile</span>
              <h2>{draft.firstName || "Your name"}</h2>
              <div className="profile-photo-actions">
                <button type="button" className="ghost-btn" onClick={() => photoInputRef.current?.click()}>
                  {draft.profilePhoto ? "Change cover photo" : "Add cover photo"}
                </button>
                {draft.profilePhoto ? (
                  <button type="button" className="ghost-btn" onClick={() => set("profilePhoto", "")}>
                    Remove
                  </button>
                ) : null}
              </div>
            </div>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(event) => {
                void handlePhoto(event.target.files?.[0] ?? null);
                event.target.value = "";
              }}
            />
          </div>

          <button className="secondary-btn" onClick={onViewProgress}>View Progress ›</button>

          <article className="card profile-section">
            <span className="eyebrow">Account</span>
            <p className="muted">
              {accountMode === "cloud"
                ? "Signed in — your programme and progress sync across devices."
                : "This device only — create an account to sync across phone and laptop."}
            </p>
            {syncNote && accountMode === "cloud" ? <p className="auth-info">{syncNote}</p> : null}
            {accountMode === "cloud" && onSignOut ? (
              <button className="secondary-btn" onClick={() => void onSignOut()}>Sign out</button>
            ) : null}
            {accountMode === "local" && onSignIn ? (
              <button className="cta-btn" onClick={onSignIn}>Sign in / create account</button>
            ) : null}
          </article>

          <article className="card profile-section">
            <span className="eyebrow">Name</span>
            <label className="field">
              <span>First name</span>
              <input value={draft.firstName} onChange={(event) => set("firstName", event.target.value)} />
            </label>
            <label className="field">
              <span>Email (optional)</span>
              <input value={draft.email} onChange={(event) => set("email", event.target.value)} placeholder="you@example.com" />
            </label>
          </article>

          <article className="card profile-section">
            <span className="eyebrow">Goal</span>
            <ChoiceRow
              options={(Object.keys(GOAL_LABELS) as Goal[]).map((v) => ({ value: v, label: GOAL_LABELS[v] }))}
              selected={draft.goal}
              onSelect={(v) => set("goal", v)}
            />
          </article>

          <article className="card profile-section">
            <span className="eyebrow">Training</span>
            <label className="mini-label">Experience</label>
            <ChoiceRow
              options={(Object.keys(EXPERIENCE_LABELS) as ExperienceLevel[]).map((v) => ({ value: v, label: EXPERIENCE_LABELS[v] }))}
              selected={draft.experienceLevel}
              onSelect={(v) => set("experienceLevel", v)}
            />
            <label className="mini-label">Days per week</label>
            <ChoiceRow
              options={([3, 4, 5] as TrainingDays[]).map((v) => ({ value: v, label: `${v} days` }))}
              selected={draft.trainingDays}
              onSelect={(v) => set("trainingDays", v)}
            />
            {onRebuildProgramme ? (
              <button
                type="button"
                className="secondary-btn"
                style={{ marginTop: 12 }}
                onClick={onRebuildProgramme}
              >
                Rebuild this week&apos;s programme
              </button>
            ) : null}
            <label className="mini-label">Equipment</label>
            <ChoiceRow
              options={(Object.keys(EQUIPMENT_LABELS) as EquipmentAccess[]).map((v) => ({ value: v, label: EQUIPMENT_LABELS[v] }))}
              selected={draft.equipmentAccess}
              onSelect={(v) => set("equipmentAccess", v)}
            />
            <label className="mini-label">Location</label>
            <ChoiceRow
              options={(Object.keys(LOCATION_LABELS) as WorkoutLocation[]).map((v) => ({ value: v, label: LOCATION_LABELS[v] }))}
              selected={draft.workoutLocation}
              onSelect={(v) => set("workoutLocation", v)}
            />
          </article>

          <article className="card profile-section">
            <span className="eyebrow">Body stats</span>
            <div className="profile-fields">
              <label className="field">
                <span>Age</span>
                <input type="number" value={draft.age ?? ""} onChange={(event) => set("age", numberOrNull(event.target.value))} />
              </label>
              <label className="field">
                <span>Height (cm)</span>
                <input type="number" value={draft.height ?? ""} onChange={(event) => set("height", numberOrNull(event.target.value))} />
              </label>
              <label className="field">
                <span>Weight (kg)</span>
                <input type="number" value={draft.weight ?? ""} onChange={(event) => set("weight", numberOrNull(event.target.value))} />
              </label>
            </div>
            <label className="mini-label">Gender</label>
            <ChoiceRow
              options={(Object.keys(GENDER_LABELS) as Gender[]).map((v) => ({ value: v, label: GENDER_LABELS[v] }))}
              selected={draft.gender}
              onSelect={(v) => set("gender", v)}
            />
          </article>

          <article className="card profile-section">
            <span className="eyebrow">Preferences</span>
            <label className="mini-label">Preferred style</label>
            <ChoiceRow
              options={(Object.keys(STYLE_LABELS) as TrainingStyle[]).map((v) => ({ value: v, label: STYLE_LABELS[v] }))}
              selected={draft.preferredTrainingStyle}
              onSelect={(v) => set("preferredTrainingStyle", v)}
            />
            <label className="mini-label">Nutrition goal</label>
            <ChoiceRow
              options={(Object.keys(NUTRITION_LABELS) as NutritionGoal[]).map((v) => ({ value: v, label: NUTRITION_LABELS[v] }))}
              selected={draft.nutritionGoal}
              onSelect={(v) => set("nutritionGoal", v)}
            />
            {reminderPrefs && onReminderPrefsChange ? (
              <>
                <label className="mini-label">Reminders</label>
                <ChoiceRow
                  options={[
                    { value: "on", label: "Training day reminders on" },
                    { value: "off", label: "Reminders off" },
                  ]}
                  selected={reminderPrefs.enabled ? "on" : "off"}
                  onSelect={(v) =>
                    onReminderPrefsChange({ ...reminderPrefs, enabled: v === "on" })
                  }
                />
                <ChoiceRow
                  options={[
                    { value: "on", label: "Browser notify while open" },
                    { value: "off", label: "No browser notify" },
                  ]}
                  selected={reminderPrefs.browserNotify ? "on" : "off"}
                  onSelect={(v) =>
                    onReminderPrefsChange({ ...reminderPrefs, browserNotify: v === "on" })
                  }
                />
                <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>
                  In-app nudges on gym days. Browser notify only works while {BRAND.name} is open — no account spam.
                </p>
              </>
            ) : null}
            <div className="profile-fields">
              <label className="field">
                <span>Sleep (hrs)</span>
                <input type="number" value={draft.sleepAverage ?? ""} onChange={(event) => set("sleepAverage", numberOrNull(event.target.value))} />
              </label>
              <label className="field">
                <span>Daily steps</span>
                <input type="number" value={draft.dailySteps ?? ""} onChange={(event) => set("dailySteps", numberOrNull(event.target.value))} />
              </label>
            </div>
            <label className="field">
              <span>Injuries</span>
              <textarea value={draft.injuries} onChange={(event) => set("injuries", event.target.value)} placeholder="Anything we should train around?" />
            </label>
            <label className="field">
              <span>Limitations</span>
              <textarea value={draft.limitations} onChange={(event) => set("limitations", event.target.value)} placeholder="Movements to avoid, time constraints…" />
            </label>
          </article>

          <button className="cta-btn" onClick={() => onSave(draft)}>Save profile</button>
        </div>
      </div>
    </div>
  );
}

function ChoiceRow<T extends string | number>({
  options,
  selected,
  onSelect,
}: {
  options: { value: T; label: string }[];
  selected: T;
  onSelect: (value: T) => void;
}) {
  return (
    <div className="choice-row">
      {options.map((option) => (
        <button
          key={String(option.value)}
          className={`choice mini${selected === option.value ? " selected" : ""}`}
          onClick={() => onSelect(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
