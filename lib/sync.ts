/**
 * Cloud sync for FORMA accounts.
 * Local storage remains the offline cache; Supabase is the source of truth
 * when a user is signed in.
 */

import { getSupabase, isSupabaseConfigured } from "./supabase";
import type { UserProfile } from "./user";
import { createProfile } from "./user";
import type { Workout, WorkoutSession } from "./types";
import type { ProgressEntry, ProgressPhoto } from "./progress";
import type { SessionDraftStored } from "./migrations";
import { FORMA_PROGRAM } from "./program";
import { PROGRAM_SCHEMA_VERSION } from "./programGenerator";

export type CloudState = {
  profile: UserProfile | null;
  workouts: Workout[];
  history: WorkoutSession[];
  week: number;
  alignActive: boolean;
  /** Programme template version stored with cloud state (for refresh). */
  schemaVersion: number;
  progress: ProgressEntry[];
  photos: ProgressPhoto[];
  water: { date: string; count: number } | null;
  journal: Record<string, string>;
  sessionDraft: SessionDraftStored | null;
};

type ProfileRow = {
  id: string;
  first_name: string;
  email: string;
  profile_photo: string;
  age: number | null;
  height: number | null;
  weight: number | null;
  gender: string;
  goal: string;
  experience_level: string;
  training_days: number;
  equipment_access: string;
  workout_location: string;
  preferred_training_style: string;
  injuries: string;
  limitations: string;
  lifestyle: string;
  sleep_average: number | null;
  daily_steps: number | null;
  nutrition_goal: string;
  created_at: string;
};

type StateRow = {
  workouts: Workout[];
  history: WorkoutSession[];
  programme: {
    week?: number;
    programId?: string;
    schemaVersion?: number;
    alignActive?: boolean;
  };
  progress: ProgressEntry[];
  photos: ProgressPhoto[];
  water: { date?: string; count?: number };
  journal: Record<string, string>;
  session_draft: SessionDraftStored | null;
};

function rowToProfile(row: ProfileRow): UserProfile {
  return createProfile({
    id: row.id,
    firstName: row.first_name,
    email: row.email,
    profilePhoto: row.profile_photo,
    age: row.age,
    height: row.height == null ? null : Number(row.height),
    weight: row.weight == null ? null : Number(row.weight),
    gender: row.gender as UserProfile["gender"],
    goal: row.goal as UserProfile["goal"],
    experienceLevel: row.experience_level as UserProfile["experienceLevel"],
    trainingDays: row.training_days as UserProfile["trainingDays"],
    equipmentAccess: row.equipment_access as UserProfile["equipmentAccess"],
    workoutLocation: row.workout_location as UserProfile["workoutLocation"],
    preferredTrainingStyle: row.preferred_training_style as UserProfile["preferredTrainingStyle"],
    injuries: row.injuries,
    limitations: row.limitations,
    lifestyle: row.lifestyle,
    sleepAverage: row.sleep_average == null ? null : Number(row.sleep_average),
    dailySteps: row.daily_steps,
    nutritionGoal: row.nutrition_goal as UserProfile["nutritionGoal"],
    createdAt: row.created_at,
  });
}

function profileToRow(profile: UserProfile) {
  return {
    id: profile.id,
    first_name: profile.firstName,
    email: profile.email,
    profile_photo: profile.profilePhoto,
    age: profile.age,
    height: profile.height,
    weight: profile.weight,
    gender: profile.gender,
    goal: profile.goal,
    experience_level: profile.experienceLevel,
    training_days: profile.trainingDays,
    equipment_access: profile.equipmentAccess,
    workout_location: profile.workoutLocation,
    preferred_training_style: profile.preferredTrainingStyle,
    injuries: profile.injuries,
    limitations: profile.limitations,
    lifestyle: profile.lifestyle,
    sleep_average: profile.sleepAverage,
    daily_steps: profile.dailySteps,
    nutrition_goal: profile.nutritionGoal,
    created_at: profile.createdAt,
    updated_at: new Date().toISOString(),
  };
}

export async function getSessionUserId(): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

export async function pullCloudState(userId: string): Promise<CloudState | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const [{ data: profileRow }, { data: stateRow }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("user_state").select("*").eq("user_id", userId).maybeSingle(),
  ]);

  const profile = profileRow ? rowToProfile(profileRow as ProfileRow) : null;
  const state = (stateRow as StateRow | null) ?? null;

  return {
    profile,
    workouts: state?.workouts ?? [],
    history: state?.history ?? [],
    week: state?.programme?.week ?? 1,
    alignActive: Boolean(state?.programme?.alignActive),
    schemaVersion: state?.programme?.schemaVersion ?? 1,
    progress: state?.progress ?? [],
    photos: state?.photos ?? [],
    water: state?.water?.date
      ? { date: state.water.date, count: state.water.count ?? 0 }
      : null,
    journal: state?.journal ?? {},
    sessionDraft: state?.session_draft ?? null,
  };
}

export async function pushProfile(profile: UserProfile): Promise<{ error?: string }> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured()) return { error: "Cloud sync is not configured." };
  const userId = await getSessionUserId();
  if (!userId) return { error: "Not signed in." };

  const payload = { ...profileToRow({ ...profile, id: userId }) };
  const { error } = await supabase.from("profiles").upsert(payload);
  return error ? { error: error.message } : {};
}

export async function pushUserState(input: {
  workouts: Workout[];
  history: WorkoutSession[];
  week: number;
  alignActive?: boolean;
  progress: ProgressEntry[];
  photos: ProgressPhoto[];
  water: { date: string; count: number };
  journal: Record<string, string>;
  sessionDraft: SessionDraftStored | null;
}): Promise<{ error?: string }> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured()) return { error: "Cloud sync is not configured." };
  const userId = await getSessionUserId();
  if (!userId) return { error: "Not signed in." };

  const { error } = await supabase.from("user_state").upsert({
    user_id: userId,
    workouts: input.workouts,
    history: input.history,
    programme: {
      week: input.week,
      programId: FORMA_PROGRAM.id,
      schemaVersion: PROGRAM_SCHEMA_VERSION,
      alignActive: Boolean(input.alignActive),
    },
    progress: input.progress,
    photos: input.photos,
    water: input.water,
    journal: input.journal,
    session_draft: input.sessionDraft,
    updated_at: new Date().toISOString(),
  });

  return error ? { error: error.message } : {};
}

export async function signUp(email: string, password: string, firstName: string) {
  const supabase = getSupabase();
  if (!supabase) return { error: "Cloud sync is not configured. Add Supabase keys to continue." };
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { data: { first_name: firstName.trim() } },
  });
  return { data, error: error?.message };
}

export async function signIn(email: string, password: string) {
  const supabase = getSupabase();
  if (!supabase) return { error: "Cloud sync is not configured. Add Supabase keys to continue." };
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  return { data, error: error?.message };
}

export async function signOut() {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.auth.signOut();
}
