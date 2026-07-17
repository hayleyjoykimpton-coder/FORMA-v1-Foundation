/**
 * FORMA user profile model & persistence.
 *
 * User data lives in its own storage key (`forma-profile-v1`), fully separate
 * from workout data (`forma-workouts-v12`) and progress data
 * (`forma-history-v12`). This keeps a clean boundary so a real authentication
 * layer can later own the profile without touching training data.
 */

export type Goal = "sculpt" | "glutes" | "fitness" | "strength" | "health";
export type ExperienceLevel = "beginner" | "intermediate" | "advanced";
export type TrainingDays = 3 | 4 | 5;
export type WorkoutLocation = "gym" | "home" | "both";
export type EquipmentAccess = "full_gym" | "dumbbells" | "bands" | "bodyweight";
export type TrainingStyle = "strength" | "hypertrophy" | "pilates" | "mixed";
export type Gender = "female" | "male" | "other" | "unspecified";
export type NutritionGoal = "maintain" | "lose" | "gain" | "recomp";

export type UserProfile = {
  id: string;
  firstName: string;
  email: string;
  profilePhoto: string;
  age: number | null;
  height: number | null;
  weight: number | null;
  gender: Gender;
  goal: Goal;
  experienceLevel: ExperienceLevel;
  trainingDays: TrainingDays;
  equipmentAccess: EquipmentAccess;
  workoutLocation: WorkoutLocation;
  preferredTrainingStyle: TrainingStyle;
  injuries: string;
  limitations: string;
  lifestyle: string;
  sleepAverage: number | null;
  dailySteps: number | null;
  nutritionGoal: NutritionGoal;
  createdAt: string;
};

export const PROFILE_STORAGE = "forma-profile-v1";

export const GOAL_LABELS: Record<Goal, string> = {
  sculpt: "Sculpt and strengthen",
  glutes: "Build glutes",
  fitness: "Improve fitness",
  strength: "Increase strength",
  health: "Feel healthier",
};

export const EXPERIENCE_LABELS: Record<ExperienceLevel, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export const EQUIPMENT_LABELS: Record<EquipmentAccess, string> = {
  full_gym: "Full gym",
  dumbbells: "Dumbbells",
  bands: "Bands",
  bodyweight: "Bodyweight",
};

export const LOCATION_LABELS: Record<WorkoutLocation, string> = {
  gym: "Gym",
  home: "Home",
  both: "Both",
};

export const STYLE_LABELS: Record<TrainingStyle, string> = {
  strength: "Strength",
  hypertrophy: "Hypertrophy",
  pilates: "Pilates",
  mixed: "Mixed",
};

export const GENDER_LABELS: Record<Gender, string> = {
  female: "Female",
  male: "Male",
  other: "Other",
  unspecified: "Prefer not to say",
};

export const NUTRITION_LABELS: Record<NutritionGoal, string> = {
  maintain: "Maintain",
  lose: "Lose fat",
  gain: "Build muscle",
  recomp: "Recomposition",
};

const uid = () => Math.random().toString(36).slice(2, 10);

/** Build a complete profile from partial input, filling sensible defaults. */
export function createProfile(input: Partial<UserProfile> & { firstName: string }): UserProfile {
  return {
    id: input.id ?? uid(),
    firstName: input.firstName.trim(),
    email: input.email ?? "",
    profilePhoto: input.profilePhoto ?? "",
    age: input.age ?? null,
    height: input.height ?? null,
    weight: input.weight ?? null,
    gender: input.gender ?? "female",
    goal: input.goal ?? "sculpt",
    experienceLevel: input.experienceLevel ?? "beginner",
    trainingDays: input.trainingDays ?? 3,
    equipmentAccess: input.equipmentAccess ?? "full_gym",
    workoutLocation: input.workoutLocation ?? "gym",
    preferredTrainingStyle: input.preferredTrainingStyle ?? "strength",
    injuries: input.injuries ?? "",
    limitations: input.limitations ?? "",
    lifestyle: input.lifestyle ?? "",
    sleepAverage: input.sleepAverage ?? null,
    dailySteps: input.dailySteps ?? null,
    nutritionGoal: input.nutritionGoal ?? "maintain",
    createdAt: input.createdAt ?? new Date().toISOString(),
  };
}

export function loadProfile(): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PROFILE_STORAGE);
    if (!raw) return null;
    return createProfile(JSON.parse(raw) as UserProfile);
  } catch {
    return null;
  }
}

export function saveProfile(profile: UserProfile): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PROFILE_STORAGE, JSON.stringify(profile));
}

export function clearProfile(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PROFILE_STORAGE);
}
