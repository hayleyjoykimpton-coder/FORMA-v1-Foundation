/**
 * Cloud sync for FORMA accounts.
 * Local storage remains the offline cache; Supabase is the source of truth
 * when a user is signed in.
 */

import { keepExistingIfIncomingEmpty } from "./cloudGuard";
import { getSupabase, isSupabaseConfigured } from "./supabase";
import type { UserProfile } from "./user";
import { createProfile } from "./user";
import type { Workout, WorkoutSession } from "./types";
import type { ProgressEntry, ProgressPhoto } from "./progress";
import type { SessionDraftStored } from "./migrations";
import { FORMA_PROGRAM } from "./program";
import { PROGRAM_SCHEMA_VERSION } from "./programGenerator";
import { normalizeWellness, type WellnessState } from "./wellness";
import { normalizeMeals, type MealsState } from "./meals";
import { normalizeInBody, type InBodyState } from "./inbody";
import {
  emptyMoveCheckIns,
  normalizeMoveCheckIns,
  type CrackerMoveCheckIns,
} from "./crackerMoveCheckIns";
import {
  emptyMoveChecklist,
  normalizeMoveChecklist,
  type MoveChecklistState,
} from "./crackerMoveChecklist";

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
  wellness: WellnessState;
  meals: MealsState;
  inbody: InBodyState;
  /** Christmas Cracker MOVE fitness / InBody / measurements check-ins. */
  crackerMoveCheckIns: CrackerMoveCheckIns;
  /** Learn with Jess / intro ticks. */
  moveChecklist: MoveChecklistState;
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
  club: string;
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
    wellness?: WellnessState;
    meals?: MealsState;
    inbody?: InBodyState;
    crackerMoveCheckIns?: CrackerMoveCheckIns;
    moveChecklist?: MoveChecklistState;
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
    club: (row.club as UserProfile["club"]) || "",
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
    club: profile.club || "",
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

export type PullCloudResult =
  | {
      ok: true;
      cloud: CloudState;
      profileExists: boolean;
      stateExists: boolean;
    }
  | { ok: false; error: string };

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function cloudFromRows(
  profileRow: ProfileRow | null,
  stateRow: StateRow | null,
): CloudState {
  const profile = profileRow ? rowToProfile(profileRow) : null;
  const state = stateRow;
  return {
    profile,
    workouts: asArray<Workout>(state?.workouts),
    history: asArray<WorkoutSession>(state?.history),
    week: state?.programme?.week ?? 1,
    alignActive: Boolean(state?.programme?.alignActive),
    schemaVersion: state?.programme?.schemaVersion ?? 1,
    progress: asArray<ProgressEntry>(state?.progress),
    photos: asArray<ProgressPhoto>(state?.photos),
    water: state?.water?.date
      ? { date: state.water.date, count: state.water.count ?? 0 }
      : null,
    journal: state?.journal ?? {},
    wellness: normalizeWellness(state?.programme?.wellness),
    meals: normalizeMeals(state?.programme?.meals),
    inbody: normalizeInBody(state?.programme?.inbody),
    crackerMoveCheckIns: state?.programme?.crackerMoveCheckIns
      ? normalizeMoveCheckIns(state.programme.crackerMoveCheckIns)
      : emptyMoveCheckIns(),
    moveChecklist: state?.programme?.moveChecklist
      ? normalizeMoveChecklist(state.programme.moveChecklist)
      : emptyMoveChecklist(),
    sessionDraft: state?.session_draft ?? null,
  };
}

export async function pullCloudState(userId: string): Promise<PullCloudResult> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: "Cloud sync is not configured." };

  const [profileRes, stateRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("user_state").select("*").eq("user_id", userId).maybeSingle(),
  ]);

  if (profileRes.error) return { ok: false, error: profileRes.error.message };
  if (stateRes.error) return { ok: false, error: stateRes.error.message };

  const profileRow = (profileRes.data as ProfileRow | null) ?? null;
  const stateRow = (stateRes.data as StateRow | null) ?? null;
  return {
    ok: true,
    cloud: cloudFromRows(profileRow, stateRow),
    profileExists: Boolean(profileRow),
    stateExists: Boolean(stateRow),
  };
}

export async function pushProfile(profile: UserProfile): Promise<{ error?: string }> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured()) return { error: "Cloud sync is not configured." };
  const userId = await getSessionUserId();
  if (!userId) return { error: "Not signed in." };

  const payload = { ...profileToRow({ ...profile, id: userId }) };
  const first = await supabase.from("profiles").upsert(payload);
  if (!first.error) return {};
  // Live projects that have not run the `club` alter still accept every other column.
  if (/club/i.test(first.error.message)) {
    const { club: _club, ...withoutClub } = payload;
    const retry = await supabase.from("profiles").upsert(withoutClub);
    return retry.error ? { error: retry.error.message } : {};
  }
  return { error: first.error.message };
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
  wellness: WellnessState;
  meals: MealsState;
  inbody: InBodyState;
  crackerMoveCheckIns?: CrackerMoveCheckIns;
  moveChecklist?: MoveChecklistState;
  sessionDraft: SessionDraftStored | null;
  /** Only Profile → Reset history may push an empty log. */
  allowEmptyHistory?: boolean;
  allowEmptyWorkouts?: boolean;
}): Promise<{ error?: string; warning?: string }> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured()) return { error: "Cloud sync is not configured." };
  const userId = await getSessionUserId();
  if (!userId) return { error: "Not signed in." };

  const existingRes = await supabase
    .from("user_state")
    .select("history, workouts, progress, photos")
    .eq("user_id", userId)
    .maybeSingle();
  if (existingRes.error) return { error: existingRes.error.message };

  const existing = existingRes.data as {
    history?: WorkoutSession[];
    workouts?: Workout[];
    progress?: ProgressEntry[];
    photos?: ProgressPhoto[];
  } | null;

  const history = keepExistingIfIncomingEmpty(
    input.history,
    existing?.history,
    Boolean(input.allowEmptyHistory),
  );
  const workouts = keepExistingIfIncomingEmpty(
    input.workouts,
    existing?.workouts,
    Boolean(input.allowEmptyWorkouts),
  );
  const progress = keepExistingIfIncomingEmpty(input.progress, existing?.progress, false);

  const programme = {
    week: input.week,
    programId: FORMA_PROGRAM.id,
    schemaVersion: PROGRAM_SCHEMA_VERSION,
    alignActive: Boolean(input.alignActive),
    wellness: normalizeWellness(input.wellness),
    meals: normalizeMeals(input.meals),
    inbody: normalizeInBody(input.inbody),
    crackerMoveCheckIns: normalizeMoveCheckIns(
      input.crackerMoveCheckIns ?? emptyMoveCheckIns(),
    ),
    moveChecklist: normalizeMoveChecklist(input.moveChecklist ?? emptyMoveChecklist()),
  };

  const core = {
    user_id: userId,
    workouts,
    history,
    programme,
    progress,
    water: input.water,
    journal: input.journal,
    session_draft: input.sessionDraft,
    updated_at: new Date().toISOString(),
  };

  const full = { ...core, photos: input.photos };
  const first = await supabase.from("user_state").upsert(full, { onConflict: "user_id" });
  if (!first.error) return {};

  const tooLarge = /payload|too large|bytes|entity too large|413|json/i.test(first.error.message);
  if (tooLarge) {
    const retry = await supabase.from("user_state").upsert(
      { ...core, photos: existing?.photos ?? [] },
      { onConflict: "user_id" },
    );
    if (!retry.error) {
      return { warning: "Workouts saved. Progress photos were too large to sync this time." };
    }
    return { error: retry.error.message };
  }

  return { error: first.error.message };
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

export function isPasswordRecoveryRedirect(): boolean {
  if (typeof window === "undefined") return false;
  const hash = window.location.hash.replace(/^#/, "");
  const search = window.location.search.replace(/^\?/, "");
  const fromHash = new URLSearchParams(hash).get("type");
  const fromSearch = new URLSearchParams(search).get("type");
  return fromHash === "recovery" || fromSearch === "recovery";
}

export async function requestPasswordReset(email: string) {
  const supabase = getSupabase();
  if (!supabase) return { error: "Cloud sync is not configured. Add Supabase keys to continue." };
  const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/` : undefined;
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo,
  });
  return { error: error?.message };
}

export async function updatePassword(password: string) {
  const supabase = getSupabase();
  if (!supabase) return { error: "Cloud sync is not configured. Add Supabase keys to continue." };
  const { error } = await supabase.auth.updateUser({ password });
  return { error: error?.message };
}

export async function signOut() {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.auth.signOut();
}
