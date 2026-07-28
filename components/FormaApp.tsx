"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  COACH_REMINDERS,
  HYDRATION_GOAL,
  IMAGES,
  NUTRITION_TARGETS,
  PHASES,
  imageForExercise,
  imageForWorkout,
  phaseCopy,
} from "@/lib/content";
import type {
  Exercise,
  ExerciseResult,
  SetResult,
  Workout,
  WorkoutSession,
} from "@/lib/types";
import {
  CYCLE_WEEKS,
  buildWorkoutsForWeek,
  cycleWeek,
  getPhaseForWeek,
  nextLinearPhase,
  nextProgrammeWeek,
  phaseJourneyStatuses,
  pickTodaysWorkout,
  resolveActivePhase,
  startWeekForPhase,
  FORMA_PROGRAM,
} from "@/lib/program";
import type { PhaseId } from "@/lib/program";
import {
  applyProgressionCuesToWorkout,
  createSessionResults,
  getRecommendation,
  progressionActionLabel,
  sessionProgressionCues,
  uid,
} from "@/lib/progression";
import {
  buildVolumeSeries,
  computeStreak,
  computeStrengthProgress,
  plannedWeeklySets,
  totalCompletedSets,
  weekSessionCount,
} from "@/lib/analytics";
import { STORAGE, loadForma, persistSessionDraft, type SessionDraftStored } from "@/lib/migrations";
import { GOAL_LABELS, loadProfile, saveProfile } from "@/lib/user";
import type { UserProfile } from "@/lib/user";
import {
  generateProgram,
  PROGRAM_SCHEMA_VERSION,
  programmeNeedsUpgrade,
} from "@/lib/programGenerator";
import { ensureHayleyData, transferExerciseWeights } from "@/lib/hayleySeed";
import { fileToResizedDataUrl } from "@/lib/images";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  getSessionUserId,
  pullCloudState,
  pushProfile,
  pushUserState,
  signOut,
} from "@/lib/sync";
import {
  applyExerciseSwap,
  swapCandidates,
  swapReasonLabel,
} from "@/lib/exerciseSwap";
import {
  adjustResultsForReadiness,
  coachDashboard,
  exerciseCoaching,
  gluteScore,
  personalRecords,
  postWorkoutSummary,
  previousPerformance,
  strengthTrends,
  weeklyReview,
} from "@/lib/coach";
import type { Readiness } from "@/lib/coach";
import { loadPhotos, loadProgress, savePhotos, saveProgress } from "@/lib/progress";
import type { ProgressEntry, ProgressPhoto } from "@/lib/progress";
import { AuthScreen } from "@/components/AuthScreen";
import { Onboarding } from "@/components/Onboarding";
import { ProfileScreen } from "@/components/ProfileScreen";
import { ReadinessCheck } from "@/components/Readiness";
import { ProgressPanel } from "@/components/ProgressPanel";
import {
  Eyebrow,
  Field,
  PhaseJourney,
  SectionHeading,
  StatTile,
  WeeklySchedule,
} from "@/components/ui";

type Tab = "today" | "training" | "progress" | "recovery";
type SessionDraft = {
  workoutId: string;
  exerciseIndex: number;
  results: ExerciseResult[];
  readiness?: number;
};
type AuthMode = "booting" | "gate" | "local" | "cloud";

const LOCAL_ONLY_KEY = "forma-local-only-v1";

const TABS: { key: Tab; label: string }[] = [
  { key: "today", label: "Home" },
  { key: "training", label: "Training" },
  { key: "progress", label: "Progress" },
  { key: "recovery", label: "Recovery" },
];

/** Seed workouts for the current programme (used before hydration and as a fallback). */
const INITIAL_WORKOUTS: Workout[] = buildWorkoutsForWeek(1);

function greetingFor(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function FormaApp() {
  const [tab, setTab] = useState<Tab>("today");
  const [week, setWeek] = useState(1);
  const [alignActive, setAlignActive] = useState(false);
  const [workouts, setWorkouts] = useState<Workout[]>(INITIAL_WORKOUTS);
  const [history, setHistory] = useState<WorkoutSession[]>([]);
  const [activeWorkoutId, setActiveWorkoutId] = useState(INITIAL_WORKOUTS[0]?.id ?? "");
  const [editingWorkoutId, setEditingWorkoutId] = useState<string | null>(null);
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);
  const [swappingExerciseId, setSwappingExerciseId] = useState<string | null>(null);
  const [sessionSwapOpen, setSessionSwapOpen] = useState(false);
  const [session, setSession] = useState<SessionDraft | null>(null);
  const [restRemaining, setRestRemaining] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [water, setWater] = useState(0);
  const [journal, setJournal] = useState<Record<string, string>>({});
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [readinessWorkout, setReadinessWorkout] = useState<Workout | null>(null);
  const [progressEntries, setProgressEntries] = useState<ProgressEntry[]>([]);
  const [progressPhotos, setProgressPhotos] = useState<ProgressPhoto[]>([]);
  const [pausedDraft, setPausedDraft] = useState<SessionDraftStored | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>("booting");
  const [cloudUserId, setCloudUserId] = useState<string | null>(null);
  const [syncNote, setSyncNote] = useState<string | null>(null);
  const [cueSessionId, setCueSessionId] = useState<string | null>(null);
  const heroPhotoInputRef = useRef<HTMLInputElement>(null);

  const applyLocalBundle = (opts?: { seedHayley?: boolean }) => {
    const state = loadForma();
    const savedProfile = opts?.seedHayley === false ? loadProfile() : ensureHayleyData();
    let nextWorkouts = state.workouts;

    // Rebuild when schema is behind OR workouts still use legacy titles (Full Body A/B).
    const storedSchema = state.needsProgramRefresh ? 0 : PROGRAM_SCHEMA_VERSION;
    if (savedProfile && programmeNeedsUpgrade(state.workouts, savedProfile, storedSchema)) {
      nextWorkouts = transferExerciseWeights(
        state.workouts,
        generateProgram(savedProfile, { week: state.week, alignActive: state.alignActive }),
      );
    }

    setWorkouts(nextWorkouts.length ? nextWorkouts : INITIAL_WORKOUTS);
    setHistory(state.history);
    setWeek(cycleWeek(state.week));
    setAlignActive(state.alignActive);
    setWater(state.water);
    setJournal(state.journal);
    setProfile(savedProfile);
    setProgressEntries(loadProgress());
    setProgressPhotos(loadPhotos());

    const today = pickTodaysWorkout(nextWorkouts.length ? nextWorkouts : INITIAL_WORKOUTS);
    setActiveWorkoutId(today?.id ?? nextWorkouts[0]?.id ?? INITIAL_WORKOUTS[0]?.id ?? "");

    const draft = state.sessionDraft;
    if (draft && nextWorkouts.some((workout) => workout.id === draft.workoutId)) {
      setPausedDraft(draft);
    } else if (draft) {
      persistSessionDraft(null);
      setPausedDraft(null);
    }
  };

  const applyCloudBundle = async (userId: string) => {
    const cloud = await pullCloudState(userId);
    const local = loadForma();
    const localProfile = loadProfile();

    // Prefer cloud when it has a profile; otherwise keep local and upload.
    if (cloud?.profile) {
      const sourceWorkouts = cloud.workouts.length ? cloud.workouts : local.workouts;
      let nextWorkouts = sourceWorkouts;
      let didUpgrade = false;
      if (programmeNeedsUpgrade(sourceWorkouts, cloud.profile, cloud.schemaVersion)) {
        nextWorkouts = transferExerciseWeights(
          sourceWorkouts,
          generateProgram(cloud.profile, {
            week: cloud.week,
            alignActive: cloud.alignActive,
          }),
        );
        didUpgrade = true;
      }
      setProfile(cloud.profile);
      setWorkouts(nextWorkouts);
      setHistory(cloud.history);
      setWeek(cycleWeek(cloud.week));
      setAlignActive(cloud.alignActive);
      setProgressEntries(cloud.progress);
      setProgressPhotos(cloud.photos);
      setJournal(cloud.journal);
      if (cloud.water?.date === new Date().toDateString()) setWater(cloud.water.count);
      else setWater(0);
      const today = pickTodaysWorkout(nextWorkouts);
      setActiveWorkoutId(today?.id ?? nextWorkouts[0]?.id ?? "");
      if (cloud.sessionDraft && nextWorkouts.some((w) => w.id === cloud.sessionDraft!.workoutId)) {
        setPausedDraft(cloud.sessionDraft);
      }
      saveProfile(cloud.profile);
      window.localStorage.setItem(STORAGE.workouts, JSON.stringify(nextWorkouts));
      window.localStorage.setItem(STORAGE.history, JSON.stringify(cloud.history));
      window.localStorage.setItem(
        STORAGE.program,
        JSON.stringify({
          week: cloud.week,
          programId: FORMA_PROGRAM.id,
          schemaVersion: PROGRAM_SCHEMA_VERSION,
          alignActive: cloud.alignActive,
        }),
      );
      saveProgress(cloud.progress);
      savePhotos(cloud.photos);

      // Persist upgraded programme immediately so the next boot does not re-load legacy titles.
      if (didUpgrade) {
        await pushUserState({
          workouts: nextWorkouts,
          history: cloud.history,
          week: cloud.week,
          alignActive: cloud.alignActive,
          progress: cloud.progress,
          photos: cloud.photos,
          water: cloud.water ?? { date: new Date().toDateString(), count: 0 },
          journal: cloud.journal,
          sessionDraft: cloud.sessionDraft,
        });
      }
    } else {
      applyLocalBundle({ seedHayley: !localProfile });
      const profileToSave = loadProfile();
      if (profileToSave) {
        await pushProfile({ ...profileToSave, id: userId, email: profileToSave.email || "" });
      }
      await pushUserState({
        workouts: local.workouts,
        history: local.history,
        week: local.week,
        alignActive: local.alignActive,
        progress: loadProgress(),
        photos: loadPhotos(),
        water: { date: new Date().toDateString(), count: local.water },
        journal: local.journal,
        sessionDraft: local.sessionDraft,
      });
    }

    setCloudUserId(userId);
    setAuthMode("cloud");
    window.localStorage.removeItem(LOCAL_ONLY_KEY);
    setSyncNote("Synced to your account");
  };

  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      try {
        if (!isSupabaseConfigured()) {
          applyLocalBundle({ seedHayley: true });
          if (!cancelled) setAuthMode("local");
          return;
        }

        const userId = await getSessionUserId();
        if (cancelled) return;

        if (userId) {
          await applyCloudBundle(userId);
          return;
        }

        if (window.localStorage.getItem(LOCAL_ONLY_KEY) === "1") {
          applyLocalBundle({ seedHayley: true });
          setAuthMode("local");
          return;
        }

        // Show account gate; keep any local cache warm underneath.
        applyLocalBundle({ seedHayley: false });
        setAuthMode("gate");
      } catch {
        applyLocalBundle({ seedHayley: true });
        if (!cancelled) setAuthMode("local");
      } finally {
        if (!cancelled) setHydrated(true);
      }
    };

    void boot();

    const supabase = getSupabase();
    const subscription = supabase?.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        setCloudUserId(null);
        setAuthMode(window.localStorage.getItem(LOCAL_ONLY_KEY) === "1" ? "local" : "gate");
        return;
      }
      if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session?.user.id) {
        await applyCloudBundle(session.user.id);
        setHydrated(true);
      }
    });

    return () => {
      cancelled = true;
      subscription?.data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE.workouts, JSON.stringify(workouts));
    window.localStorage.setItem(STORAGE.history, JSON.stringify(history));
    window.localStorage.setItem(
      STORAGE.program,
      JSON.stringify({
        week,
        programId: FORMA_PROGRAM.id,
        schemaVersion: PROGRAM_SCHEMA_VERSION,
        alignActive,
      }),
    );
  }, [workouts, history, week, alignActive, hydrated]);

  // Autosave live session so a mid-workout crash does not wipe progress.
  useEffect(() => {
    if (!hydrated || !session) return;
    persistSessionDraft({ ...session, restRemaining });
    setPausedDraft({ ...session, restRemaining });
  }, [session, restRemaining, hydrated]);

  // Cloud sync (debounced) whenever signed-in state changes.
  useEffect(() => {
    if (!hydrated || authMode !== "cloud" || !cloudUserId || !profile) return;
    const timer = window.setTimeout(() => {
      void (async () => {
        const profileResult = await pushProfile(profile);
        const stateResult = await pushUserState({
          workouts,
          history,
          week,
          alignActive,
          progress: progressEntries,
          photos: progressPhotos,
          water: { date: new Date().toDateString(), count: water },
          journal,
          sessionDraft: pausedDraft,
        });
        if (profileResult.error || stateResult.error) {
          setSyncNote(profileResult.error || stateResult.error || "Sync failed");
        } else {
          setSyncNote("Synced just now");
        }
      })();
    }, 900);
    return () => window.clearTimeout(timer);
  }, [
    authMode,
    cloudUserId,
    profile,
    workouts,
    history,
    week,
    alignActive,
    progressEntries,
    progressPhotos,
    water,
    journal,
    pausedDraft,
    hydrated,
  ]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(
      STORAGE.water,
      JSON.stringify({ date: new Date().toDateString(), count: water }),
    );
  }, [water, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE.journal, JSON.stringify(journal));
  }, [journal, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    saveProgress(progressEntries);
  }, [progressEntries, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    savePhotos(progressPhotos);
  }, [progressPhotos, hydrated]);

  useEffect(() => {
    if (restRemaining <= 0) return;
    const timer = window.setInterval(() => {
      setRestRemaining((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [restRemaining]);

  const activeWorkout = workouts.find((workout) => workout.id === activeWorkoutId) ?? workouts[0];
  const todaysWorkout = useMemo(() => pickTodaysWorkout(workouts), [workouts]);
  const weeklySets = useMemo(() => plannedWeeklySets(workouts), [workouts]);
  const streak = useMemo(() => computeStreak(history), [history]);
  const completedSets = useMemo(() => totalCompletedSets(history), [history]);
  const weekSessions = useMemo(() => weekSessionCount(history), [history]);
  const volumeSeries = useMemo(() => buildVolumeSeries(history), [history]);
  const strengthProgress = useMemo(() => computeStrengthProgress(workouts, history), [workouts, history]);
  const dashboard = useMemo(() => (profile ? coachDashboard(profile, history) : null), [profile, history]);
  const records = useMemo(() => personalRecords(history), [history]);
  const trends = useMemo(() => strengthTrends(history), [history]);
  const glute = useMemo(() => gluteScore(history), [history]);
  const review = useMemo(() => (profile ? weeklyReview(profile, history) : null), [profile, history]);
  const latestSummary = useMemo(
    () => (history.length ? postWorkoutSummary(history[history.length - 1], history) : []),
    [history],
  );
  const latestSession = history.length ? history[history.length - 1] : null;
  // The weekly schedule reflects the user's actual (personalised) plan.
  const weeklySchedule = useMemo(
    () =>
      workouts.map((workout) => ({
        day: workout.day,
        short: workout.day.slice(0, 3),
        focus: workout.title,
        image: imageForWorkout(workout.title),
      })),
    [workouts],
  );

  const phaseDef = resolveActivePhase(week, alignActive);
  const season = phaseDef.id;
  const weekInCycle = cycleWeek(week);
  const linearPhase = getPhaseForWeek(weekInCycle);
  const journeyStatuses = phaseJourneyStatuses(weekInCycle, alignActive);
  const upcomingPhase = nextLinearPhase(linearPhase.id);
  const sessionsThisWeek = history.filter((entry) => cycleWeek(entry.week ?? 1) === weekInCycle).length;
  const weekComplete =
    !!profile && !alignActive && sessionsThisWeek >= profile.trainingDays;

  const progressionCues = useMemo(() => {
    if (!latestSession) return [];
    const workout = workouts.find((item) => item.id === latestSession.workoutId);
    if (!workout) return [];
    return sessionProgressionCues(workout, history, phaseDef, {
      compoundsOnly: true,
      limit: 4,
    });
  }, [history, workouts, latestSession, phaseDef]);
  const showProgressionCues =
    !!latestSession && (!cueSessionId || cueSessionId === latestSession.id);

  const applyGeneratedProgram = (
    nextProfile: UserProfile,
    options?: { week?: number; alignActive?: boolean; phaseId?: PhaseId },
  ) => {
    const nextWeek = cycleWeek(options?.week ?? week);
    const nextAlign = options?.alignActive ?? alignActive;
    const generated = transferExerciseWeights(
      workouts,
      generateProgram(nextProfile, {
        week: nextWeek,
        alignActive: nextAlign,
        phaseId: options?.phaseId,
      }),
    );
    setWorkouts(generated);
    const today = pickTodaysWorkout(generated);
    setActiveWorkoutId(today?.id ?? generated[0]?.id ?? "");
    // New workout ids invalidate any in-progress draft.
    persistSessionDraft(null);
    setPausedDraft(null);
    setSession(null);
  };

  const advanceProgrammeWeek = () => {
    if (!profile || alignActive) return;
    const { week: nextWeek, rolled } = nextProgrammeWeek(weekInCycle);
    const crossedPhase = getPhaseForWeek(nextWeek).id !== getPhaseForWeek(weekInCycle).id;
    setWeek(nextWeek);
    // Leaving Align week clears any sticky early-deload flag.
    setAlignActive(false);
    applyGeneratedProgram(profile, { week: nextWeek, alignActive: false });
    setSyncNote(
      rolled
        ? "New 12-week cycle · Foundation week 1"
        : crossedPhase
          ? `Welcome to ${getPhaseForWeek(nextWeek).id} · week ${nextWeek} of ${CYCLE_WEEKS}`
          : `Advanced to week ${nextWeek} of ${CYCLE_WEEKS}`,
    );
  };

  const enterPhase = (phaseId: PhaseId) => {
    if (!profile) return;
    const nextWeek = startWeekForPhase(phaseId);
    setAlignActive(false);
    setWeek(nextWeek);
    applyGeneratedProgram(profile, { week: nextWeek, alignActive: false, phaseId });
    setSyncNote(`${phaseId} · week ${nextWeek} of ${CYCLE_WEEKS}`);
  };

  const toggleAlignBlock = () => {
    if (!profile) return;
    // Week 12 is already Align — no need for the early override.
    if (linearPhase.id === "Align" && !alignActive) {
      setSyncNote("Week 12 is already your Align recovery week");
      return;
    }
    const next = !alignActive;
    setAlignActive(next);
    applyGeneratedProgram(profile, { week: weekInCycle, alignActive: next });
    setSyncNote(next ? "Early Align recovery on" : "Back to your main phase");
  };

  const handleOnboardingComplete = (nextProfile: UserProfile) => {
    saveProfile(nextProfile);
    setProfile(nextProfile);
    applyGeneratedProgram(nextProfile, { week: 1, alignActive: false });
    setTab("today");
  };

  const handleProfileSave = (updated: UserProfile) => {
    const trainingChanged =
      !profile ||
      profile.goal !== updated.goal ||
      profile.experienceLevel !== updated.experienceLevel ||
      profile.trainingDays !== updated.trainingDays ||
      profile.equipmentAccess !== updated.equipmentAccess;
    const weightChanged = !!profile && profile.weight !== updated.weight && typeof updated.weight === "number";
    saveProfile(updated);
    setProfile(updated);
    if (trainingChanged) applyGeneratedProgram(updated);
    // Keep the progress log in sync so profile weight edits appear in Progress.
    if (weightChanged) {
      const last = progressEntries[progressEntries.length - 1];
      setProgressEntries((current) => [
        ...current,
        {
          id: uid(),
          date: new Date().toISOString(),
          weight: updated.weight,
          measurements: last?.measurements ?? {},
          notes: "Updated in profile",
        },
      ]);
    }
    setProfileOpen(false);
  };

  const handleSaveProgressEntry = (entry: ProgressEntry) => {
    setProgressEntries((current) => [...current, entry]);
    if (typeof entry.weight === "number" && profile) {
      const synced = { ...profile, weight: entry.weight };
      saveProfile(synced);
      setProfile(synced);
    }
  };

  const handleAddPhoto = (photo: ProgressPhoto) => setProgressPhotos((current) => [...current, photo]);
  const handleDeletePhoto = (id: string) => setProgressPhotos((current) => current.filter((photo) => photo.id !== id));

  const handleHeroPhoto = async (file: File | null) => {
    if (!file || !profile) return;
    try {
      const profilePhoto = await fileToResizedDataUrl(file, 1400, 0.78);
      const updated = { ...profile, profilePhoto };
      saveProfile(updated);
      setProfile(updated);
    } catch {
      // Ignore unreadable images; keep the current cover.
    }
  };

  const clearHeroPhoto = () => {
    if (!profile) return;
    const updated = { ...profile, profilePhoto: "" };
    saveProfile(updated);
    setProfile(updated);
  };

  const startWorkout = (workout: Workout) => {
    setReadinessWorkout(workout);
  };

  const beginSession = (workout: Workout, readiness: Readiness) => {
    const base = createSessionResults(workout, history, phaseDef);
    const results = adjustResultsForReadiness(base, readiness);
    setActiveWorkoutId(workout.id);
    setSession({ workoutId: workout.id, exerciseIndex: 0, results, readiness: readiness.score });
    setPausedDraft(null);
    setReadinessWorkout(null);
    setTab("today");
    setRestRemaining(0);
  };

  const exitSession = () => {
    if (session) {
      const draft = { ...session, restRemaining };
      persistSessionDraft(draft);
      setPausedDraft(draft);
    }
    setSession(null);
    setRestRemaining(0);
  };

  const resumePausedSession = () => {
    if (!pausedDraft) return;
    const workout = workouts.find((item) => item.id === pausedDraft.workoutId);
    if (!workout) {
      persistSessionDraft(null);
      setPausedDraft(null);
      return;
    }
    setActiveWorkoutId(workout.id);
    setSession({
      workoutId: pausedDraft.workoutId,
      exerciseIndex: pausedDraft.exerciseIndex,
      results: pausedDraft.results,
      readiness: pausedDraft.readiness,
    });
    setRestRemaining(pausedDraft.restRemaining ?? 0);
    setTab("today");
  };

  const discardPausedSession = () => {
    persistSessionDraft(null);
    setPausedDraft(null);
    setSession(null);
    setRestRemaining(0);
  };

  const finishWorkout = () => {
    if (!session || !activeWorkout) return;
    const exercises = session.results.map((result) => ({
      ...result,
      sets: result.sets.map((set) => ({ ...set, skipped: !set.complete })),
    }));
    const completed: WorkoutSession = {
      id: uid(),
      workoutId: activeWorkout.id,
      workoutTitle: activeWorkout.title,
      completedAt: new Date().toISOString(),
      season,
      week: weekInCycle,
      readiness: session.readiness,
      exercises,
    };
    setHistory((current) => [...current, completed]);
    setCueSessionId(completed.id);
    persistSessionDraft(null);
    setPausedDraft(null);
    setSession(null);
    setRestRemaining(0);
    setTab("progress");
  };

  const applyProgressionCues = () => {
    if (!latestSession || !progressionCues.length) return;
    setWorkouts((current) =>
      current.map((workout) =>
        workout.id === latestSession.workoutId
          ? applyProgressionCuesToWorkout(workout, progressionCues)
          : workout,
      ),
    );
    setSyncNote("Next-session loads updated on your programme");
  };

  const parseNumberInput = (raw: string): number => {
    if (raw.trim() === "") return 0;
    const value = Number(raw);
    return Number.isFinite(value) ? value : 0;
  };

  const updateWorkout = (id: string, patch: Partial<Workout>) => {
    setWorkouts((current) => current.map((workout) => workout.id === id ? { ...workout, ...patch } : workout));
  };

  const addWorkout = () => {
    const workout: Workout = {
      id: uid(),
      day: "Saturday",
      title: "New Workout",
      duration: 45,
      exercises: [],
    };
    setWorkouts((current) => [...current, workout]);
    setActiveWorkoutId(workout.id);
    setEditingWorkoutId(workout.id);
    setTab("training");
  };

  const duplicateWorkout = (workout: Workout) => {
    const copy: Workout = {
      ...workout,
      id: uid(),
      title: `${workout.title} Copy`,
      exercises: workout.exercises.map((exercise) => ({ ...exercise, id: uid() })),
    };
    setWorkouts((current) => [...current, copy]);
  };

  const deleteWorkout = (id: string) => {
    setWorkouts((current) => {
      const next = current.filter((workout) => workout.id !== id);
      if (activeWorkoutId === id && next[0]) setActiveWorkoutId(next[0].id);
      return next.length ? next : INITIAL_WORKOUTS;
    });
  };

  const moveWorkout = (id: string, direction: -1 | 1) => {
    setWorkouts((current) => {
      const index = current.findIndex((workout) => workout.id === id);
      const destination = index + direction;
      if (index < 0 || destination < 0 || destination >= current.length) return current;
      const next = [...current];
      [next[index], next[destination]] = [next[destination], next[index]];
      return next;
    });
  };

  const addExercise = (workoutId: string) => {
    const exercise: Exercise = {
      id: uid(),
      name: "New Exercise",
      sets: 3,
      repMin: 8,
      repMax: 10,
      weight: 0,
      rpe: 8,
      notes: "",
      increment: 2.5,
      restSeconds: 90,
    };
    setWorkouts((current) => current.map((workout) =>
      workout.id === workoutId ? { ...workout, exercises: [...workout.exercises, exercise] } : workout
    ));
    setEditingExerciseId(exercise.id);
  };

  const updateExercise = (workoutId: string, exerciseId: string, patch: Partial<Exercise>) => {
    setWorkouts((current) => current.map((workout) =>
      workout.id === workoutId
        ? { ...workout, exercises: workout.exercises.map((exercise) => exercise.id === exerciseId ? { ...exercise, ...patch } : exercise) }
        : workout
    ));
  };

  const swapExerciseInWorkout = (workoutId: string, exerciseId: string, candidateId: string) => {
    setWorkouts((current) =>
      current.map((workout) => {
        if (workout.id !== workoutId) return workout;
        return {
          ...workout,
          exercises: workout.exercises.map((exercise) =>
            exercise.id === exerciseId ? applyExerciseSwap(exercise, candidateId) : exercise,
          ),
        };
      }),
    );
    setSwappingExerciseId(null);
  };

  /** Mid-session swap: update programme row + live set log together. */
  const swapExerciseInSession = (candidateId: string) => {
    if (!session || !activeWorkout) return;
    const current = activeWorkout.exercises[session.exerciseIndex];
    if (!current) return;
    const swapped = applyExerciseSwap(current, candidateId);

    setWorkouts((workoutsCurrent) =>
      workoutsCurrent.map((workout) =>
        workout.id === activeWorkout.id
          ? {
              ...workout,
              exercises: workout.exercises.map((exercise) =>
                exercise.id === current.id ? swapped : exercise,
              ),
            }
          : workout,
      ),
    );

    setSession((currentSession) => {
      if (!currentSession) return currentSession;
      return {
        ...currentSession,
        results: currentSession.results.map((result, index) => {
          if (index !== currentSession.exerciseIndex) return result;
          return {
            ...result,
            libraryId: swapped.exerciseId,
            name: swapped.name,
            repMin: swapped.repMin,
            repMax: swapped.repMax,
            increment: swapped.increment,
            note: swapped.notes,
            sets: result.sets.map((set) => ({
              ...set,
              weight: swapped.weight,
            })),
          };
        }),
      };
    });
    setSessionSwapOpen(false);
    setRestRemaining(0);
  };

  const deleteExercise = (workoutId: string, exerciseId: string) => {
    setWorkouts((current) => current.map((workout) =>
      workout.id === workoutId
        ? { ...workout, exercises: workout.exercises.filter((exercise) => exercise.id !== exerciseId) }
        : workout
    ));
  };

  const moveExercise = (workoutId: string, exerciseId: string, direction: -1 | 1) => {
    setWorkouts((current) => current.map((workout) => {
      if (workout.id !== workoutId) return workout;
      const index = workout.exercises.findIndex((exercise) => exercise.id === exerciseId);
      const destination = index + direction;
      if (index < 0 || destination < 0 || destination >= workout.exercises.length) return workout;
      const exercises = [...workout.exercises];
      [exercises[index], exercises[destination]] = [exercises[destination], exercises[index]];
      return { ...workout, exercises };
    }));
  };

  const updateSet = (exerciseIndex: number, setIndex: number, patch: Partial<SetResult>) => {
    setSession((current) => {
      if (!current) return current;
      return {
        ...current,
        results: current.results.map((exercise, exIndex) =>
          exIndex === exerciseIndex
            ? { ...exercise, sets: exercise.sets.map((set, sIndex) => sIndex === setIndex ? { ...set, ...patch } : set) }
            : exercise
        ),
      };
    });
  };

  if (!hydrated || authMode === "booting") {
    return (
      <div className="app">
        <div className="shell">
          <div className="loading">
            <span className="wordmark">FORMA</span>
            <p>Preparing your practice…</p>
          </div>
        </div>
      </div>
    );
  }

  if (authMode === "gate") {
    return (
      <AuthScreen
        onAuthenticated={() => {
          // Auth listener will pull cloud state and set authMode to cloud.
          setHydrated(true);
        }}
        onContinueLocal={() => {
          window.localStorage.setItem(LOCAL_ONLY_KEY, "1");
          applyLocalBundle({ seedHayley: true });
          setAuthMode("local");
        }}
      />
    );
  }

  if (!profile) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  if (profileOpen) {
    return (
      <ProfileScreen
        profile={profile}
        onSave={handleProfileSave}
        onClose={() => setProfileOpen(false)}
        onViewProgress={() => { setProfileOpen(false); setTab("progress"); }}
        onRebuildProgramme={() => {
          applyGeneratedProgram(profile);
          setProfileOpen(false);
          setTab("training");
          setSyncNote("Programme rebuilt");
        }}
        accountMode={authMode}
        syncNote={syncNote}
        onSignOut={async () => {
          await signOut();
          window.localStorage.removeItem(LOCAL_ONLY_KEY);
          setCloudUserId(null);
          setAuthMode("gate");
          setProfileOpen(false);
        }}
        onSignIn={() => {
          window.localStorage.removeItem(LOCAL_ONLY_KEY);
          setAuthMode("gate");
          setProfileOpen(false);
        }}
      />
    );
  }

  if (readinessWorkout && !session) {
    return (
      <ReadinessCheck
        workout={readinessWorkout}
        onSubmit={(readiness) => beginSession(readinessWorkout, readiness)}
        onCancel={() => setReadinessWorkout(null)}
      />
    );
  }

  if (session && activeWorkout) {
    const exercise = activeWorkout.exercises[session.exerciseIndex];
    const result = session.results[session.exerciseIndex];
    const recommendation = getRecommendation(exercise, history, phaseDef);
    const prev = previousPerformance(exercise, history);
    const coaching = exerciseCoaching(exercise);
    const minutes = Math.floor(restRemaining / 60);
    const seconds = String(restRemaining % 60).padStart(2, "0");
    const setsDone = result.sets.filter((set) => set.complete).length;
    const progressPct = Math.round((setsDone / result.sets.length) * 100);

    return (
      <div className="app">
        <div className="shell">
          <div className="screen session-screen">
            <header className="session-top">
              <button className="ghost-btn" onClick={exitSession}>‹ Exit</button>
              <div className="session-count">
                <span className="eyebrow">{activeWorkout.title}</span>
                <strong>{session.exerciseIndex + 1} / {activeWorkout.exercises.length}</strong>
              </div>
              <button className="ghost-btn strong" onClick={finishWorkout}>Finish</button>
            </header>

            <section
              className="session-hero"
              style={{ backgroundImage: `linear-gradient(180deg, rgba(74,55,44,.12), rgba(74,55,44,.62)), url(${imageForWorkout(activeWorkout.title)})` }}
            >
              <span className="eyebrow light">{season} · Primary target</span>
              <h1>{exercise.name}</h1>
              <p>{recommendation.title}</p>
              <small>{recommendation.detail}</small>
              <div className="session-progress">
                <span style={{ width: `${progressPct}%` }} />
              </div>
            </section>

            <article className="card coach-prev">
              <div className="coach-prev-head">
                <span className="eyebrow">Last session</span>
                {prev.pbWeight > 0 && <span className="season-pill">PB {prev.pbWeight}kg × {prev.pbReps}</span>}
              </div>
              {prev.hasData ? (
                <div className="coach-prev-stats">
                  <div><small>Weight</small><strong>{Math.max(...prev.weights)}kg</strong></div>
                  <div><small>Reps</small><strong>{prev.reps.join(" / ")}</strong></div>
                  <div><small>Avg RPE</small><strong>{prev.avgRpe}</strong></div>
                  <div><small>Volume</small><strong>{Math.round(prev.volume)}kg</strong></div>
                </div>
              ) : (
                <p className="muted">First time logging this exercise — today sets your baseline.</p>
              )}
              <p className="coach-prev-rec"><strong>Today:</strong> {recommendation.title}. {recommendation.detail}</p>
            </article>

            <article className="card session-card">
              <div className="session-meta">
                <span>{exercise.sets} sets</span>
                <span>{exercise.repMin}–{exercise.repMax} reps</span>
                <span>RPE {exercise.rpe}</span>
              </div>

              <div className="set-list">
                {result.sets.map((set, setIndex) => (
                  <article className={`set-row ${set.complete ? "complete" : ""}`} key={setIndex}>
                    <strong>Set {setIndex + 1}</strong>
                    <label>
                      <span>kg</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.5"
                        value={set.weight === 0 ? "" : set.weight}
                        placeholder="0"
                        onFocus={(event) => event.target.select()}
                        onChange={(event) => updateSet(session.exerciseIndex, setIndex, { weight: parseNumberInput(event.target.value) })}
                      />
                    </label>
                    <label>
                      <span>reps</span>
                      <input
                        type="number"
                        inputMode="numeric"
                        value={set.reps === 0 ? "" : set.reps}
                        placeholder="0"
                        onFocus={(event) => event.target.select()}
                        onChange={(event) => updateSet(session.exerciseIndex, setIndex, { reps: parseNumberInput(event.target.value) })}
                      />
                    </label>
                    <label>
                      <span>RPE</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        min="1"
                        max="10"
                        step="0.5"
                        value={set.rpe === 0 ? "" : set.rpe}
                        placeholder="0"
                        onFocus={(event) => event.target.select()}
                        onChange={(event) => updateSet(session.exerciseIndex, setIndex, { rpe: parseNumberInput(event.target.value) })}
                      />
                    </label>
                    <button
                      className="set-complete"
                      onClick={() => {
                        const nextComplete = !set.complete;
                        updateSet(session.exerciseIndex, setIndex, { complete: nextComplete });
                        if (nextComplete) setRestRemaining(exercise.restSeconds);
                      }}
                    >
                      {set.complete ? "✓" : "Done"}
                    </button>
                  </article>
                ))}
              </div>

              {exercise.notes && <p className="exercise-note">{exercise.notes}</p>}
            </article>

            <article className="card coach-guide">
              <span className="eyebrow">Coaching · {exercise.name}</span>
              <div className="coach-guide-meta">
                <span>{coaching.primary}</span>
                <span>{coaching.equipment}</span>
                <span>Tempo {coaching.tempo.split(" · ")[0]}</span>
                <span>Rest {coaching.restSeconds}s</span>
              </div>
              {coaching.secondary !== "—" ? <p className="muted coach-guide-sub">Secondary: {coaching.secondary}</p> : null}
              {coaching.cues.length > 0 && (
                <div className="coach-block">
                  <strong>Focus</strong>
                  <ul className="coach-list">
                    {coaching.cues.map((cue) => <li key={cue}>{cue}</li>)}
                  </ul>
                </div>
              )}
              {coaching.mistakes.length > 0 && (
                <div className="coach-block">
                  <strong>Avoid</strong>
                  <ul className="coach-list">
                    {coaching.mistakes.map((mistake) => <li key={mistake}>{mistake}</li>)}
                  </ul>
                </div>
              )}
              {(() => {
                const candidates = swapCandidates(
                  exercise.exerciseId,
                  profile?.equipmentAccess ?? "full_gym",
                );
                if (candidates.length === 0) return null;
                return (
                  <div className="swap-panel">
                    <div className="swap-panel-head">
                      <strong>Swap exercise</strong>
                      <button
                        type="button"
                        className="text-btn"
                        onClick={() => setSessionSwapOpen((open) => !open)}
                      >
                        {sessionSwapOpen ? "Hide" : "Show options"}
                      </button>
                    </div>
                    {sessionSwapOpen && (
                      <div className="swap-options">
                        {candidates.map((candidate) => (
                          <button
                            key={candidate.id}
                            type="button"
                            className="swap-option"
                            onClick={() => swapExerciseInSession(candidate.id)}
                          >
                            <span>{candidate.name}</span>
                            <small>
                              {swapReasonLabel(candidate.reason)}
                              {candidate.preserveWeight ? " · keeps load" : " · reset load"}
                            </small>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </article>

            <article className="card rest-card">
              <div>
                <span className="eyebrow">Rest timer</span>
                <strong>{minutes}:{seconds}</strong>
              </div>
              <div className="rest-actions">
                <button onClick={() => setRestRemaining(exercise.restSeconds)}>Restart</button>
                <button onClick={() => setRestRemaining(0)}>Skip</button>
              </div>
            </article>

            <div className="session-nav">
              <button
                disabled={session.exerciseIndex === 0}
                onClick={() => {
                  setSessionSwapOpen(false);
                  setSession({ ...session, exerciseIndex: session.exerciseIndex - 1 });
                }}
              >
                Previous
              </button>
              <button
                disabled={session.exerciseIndex === activeWorkout.exercises.length - 1}
                onClick={() => {
                  setSessionSwapOpen(false);
                  setSession({ ...session, exerciseIndex: session.exerciseIndex + 1 });
                }}
              >
                Next exercise
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const greeting = greetingFor(new Date().getHours());
  const todayName = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const todayISO = new Date().toISOString().slice(0, 10);
  const focusExercise = todaysWorkout?.exercises[0];
  const focusRec = focusExercise ? getRecommendation(focusExercise, history, phaseDef) : null;
  const goalLabel = GOAL_LABELS[profile.goal];
  const goalLower = goalLabel.toLowerCase();
  const encouragement =
    history.length === 0
      ? `Welcome to ${season}, ${profile.firstName}. Your ${profile.trainingDays}-day plan is built to ${goalLower} — begin gently and let consistency lead.`
      : streak >= 3
        ? `A ${streak}-day rhythm, ${profile.firstName} — this is exactly how you ${goalLower}. Keep it flowing.`
        : `Consistency over intensity. Today's session moves you toward "${goalLower}".`;

  return (
    <div className="app">
      <div className="shell">
        {tab === "today" && (
          <div className="screen home-screen">
            <header className="topbar">
              <span className="wordmark">FORMA</span>
              <button
                className={`avatar ${profile.profilePhoto ? "has-photo" : ""}`}
                onClick={() => setProfileOpen(true)}
                aria-label="Open profile"
                style={profile.profilePhoto ? { backgroundImage: `url(${profile.profilePhoto})` } : undefined}
              >
                {profile.profilePhoto ? "" : profile.firstName.charAt(0)}
              </button>
            </header>

            <section
              className="home-hero"
              style={{
                backgroundImage: `linear-gradient(180deg, rgba(74,55,44,.04) 30%, rgba(74,55,44,.58)), url(${profile.profilePhoto || IMAGES.hero})`,
              }}
            >
              <input
                ref={heroPhotoInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(event) => {
                  void handleHeroPhoto(event.target.files?.[0] ?? null);
                  event.target.value = "";
                }}
              />
              <div className="hero-photo-actions">
                <button
                  type="button"
                  className="hero-photo-btn"
                  onClick={() => heroPhotoInputRef.current?.click()}
                >
                  {profile.profilePhoto ? "Change photo" : "Add photo"}
                </button>
                {profile.profilePhoto ? (
                  <button type="button" className="hero-photo-btn ghost" onClick={clearHeroPhoto}>
                    Reset
                  </button>
                ) : null}
              </div>
              <div className="home-hero-copy">
                <span className="eyebrow light">{greeting},</span>
                <h1 className="hero-name">{profile.firstName}</h1>
                <div className="hero-tags">
                  <span className="hero-chip">{season} · Week {weekInCycle}/{CYCLE_WEEKS}</span>
                  <span className="hero-chip subtle">
                    Today · {todaysWorkout ? todaysWorkout.title : "Rest"}
                  </span>
                </div>
              </div>
            </section>

            {pausedDraft && (
              <article className="card resume-card">
                <div>
                  <span className="eyebrow">Unfinished session</span>
                  <strong>
                    {workouts.find((workout) => workout.id === pausedDraft.workoutId)?.title ?? "Workout"} saved
                  </strong>
                  <p className="muted">Your sets are still here — pick up where you left off.</p>
                </div>
                <div className="resume-actions">
                  <button className="primary-btn" onClick={resumePausedSession}>Resume</button>
                  <button className="ghost-btn" onClick={discardPausedSession}>Discard</button>
                </div>
              </article>
            )}

            <div className="stat-grid three">
              <StatTile label="Day streak" value={String(streak)} note="Keep it going" />
              <StatTile label="Sessions" value={String(history.length)} note="All time" />
              <StatTile label="Weekly sets" value={String(weeklySets)} note="Planned" />
            </div>

            {todaysWorkout ? (
              <>
            <SectionHeading eyebrow="Today's workout" title={todaysWorkout.title} />
            <article className="card workout-today">
              <div className="workout-today-media" style={{ backgroundImage: `url(${imageForWorkout(todaysWorkout.title)})` }}>
                <span className="media-chip">{todaysWorkout.duration} min</span>
                <button className="media-edit" onClick={() => { setEditingWorkoutId(todaysWorkout.id); setTab("training"); }}>Edit</button>
              </div>
              <div className="workout-today-body">
                <span className="eyebrow">{todaysWorkout.day} · {season}</span>
                <ul className="exercise-preview">
                  {todaysWorkout.exercises.map((item, index) => {
                    const recommendation = getRecommendation(item, history, phaseDef);
                    return (
                      <li key={item.id}>
                        <span className="ep-index">{index + 1}</span>
                        <div>
                          <strong>{item.name}</strong>
                          <small>{item.sets} × {item.repMin}–{item.repMax} · RPE {item.rpe}</small>
                          <em>{recommendation.title}</em>
                        </div>
                      </li>
                    );
                  })}
                  {!todaysWorkout.exercises.length && <li className="ep-empty">No exercises yet — add some in Training.</li>}
                </ul>
                <button className="cta-btn" disabled={!todaysWorkout.exercises.length} onClick={() => startWorkout(todaysWorkout)}>
                  Start workout
                </button>
              </div>
            </article>
              </>
            ) : (
              <>
                <SectionHeading eyebrow="Today" title="Rest day" />
                <article className="card">
                  <p className="muted">
                    No recorded session today — recover, walk, or take an optional mobility / Pilates class if you feel like it. It doesn&apos;t need to be logged.
                  </p>
                </article>
              </>
            )}

            <SectionHeading eyebrow="Your coach" title="Daily note" />
            <article className="card coach-card">
              <div className="coach-top">
                <div className="coach-avatar">F</div>
                <div>
                  <strong>Coach FORMA</strong>
                  <small>{goalLabel} · {season}</small>
                </div>
              </div>
              <p className="coach-message">{encouragement}</p>
              {focusRec && focusExercise && (
                <div className="coach-rec">
                  <span className="eyebrow">Progressive overload</span>
                  <strong>{focusExercise.name}</strong>
                  <p>{focusRec.title}. {focusRec.detail}</p>
                </div>
              )}
              <div className="coach-reminders">
                {COACH_REMINDERS.map((reminder) => (
                  <div className={`reminder accent-${reminder.accent}`} key={reminder.title}>
                    <strong>{reminder.title}</strong>
                    <small>{reminder.text}</small>
                  </div>
                ))}
              </div>
            </article>

            <SectionHeading eyebrow="Nutrition" title="Fuel your day" />
            <div className="stat-grid three">
              {NUTRITION_TARGETS.map((target) => (
                <StatTile key={target.label} label={target.label} value={target.value} note={target.unit} accent={target.accent} />
              ))}
            </div>
            <article
              className="card image-card"
              style={{ backgroundImage: `linear-gradient(180deg, rgba(74,55,44,.02) 40%, rgba(74,55,44,.5)), url(${IMAGES.nutrition})` }}
            >
              <div className="image-card-copy">
                <span className="eyebrow light">Meals</span>
                <h3>Balanced, protein-led plates</h3>
                <span className="link-cue">Bright greens · lean protein · slow carbs</span>
              </div>
            </article>

            <SectionHeading eyebrow="Hydration" title="Water intake" />
            <article className="card hydration-card">
              <div className="hydration-head">
                <div>
                  <strong className="hydration-count">{water}<small> / {HYDRATION_GOAL} glasses</small></strong>
                  <small className="muted">{water >= HYDRATION_GOAL ? "Goal reached — beautifully done." : "Small sips, all day long."}</small>
                </div>
                <div className="hydration-controls">
                  <button onClick={() => setWater((current) => Math.max(0, current - 1))} aria-label="Remove a glass">−</button>
                  <button onClick={() => setWater((current) => Math.min(HYDRATION_GOAL, current + 1))} aria-label="Add a glass">+</button>
                </div>
              </div>
              <div className="hydration-track">
                {Array.from({ length: HYDRATION_GOAL }).map((_, index) => (
                  <span key={index} className={`drop${index < water ? " filled" : ""}`} />
                ))}
              </div>
            </article>

            <SectionHeading eyebrow="Wellbeing" title="Recovery & progress" />
            <div className="dual-grid">
              <article
                className="card image-card tall"
                style={{ backgroundImage: `linear-gradient(180deg, rgba(74,55,44,.02) 35%, rgba(74,55,44,.55)), url(${IMAGES.recovery})` }}
                role="button"
                tabIndex={0}
                onClick={() => setTab("recovery")}
                onKeyDown={(event) => { if (event.key === "Enter") setTab("recovery"); }}
              >
                <div className="image-card-copy">
                  <span className="eyebrow light">Recovery</span>
                  <h3>82% recovered</h3>
                  <span className="link-cue">Return to balance ›</span>
                </div>
              </article>
              <article className="card progress-preview" role="button" tabIndex={0} onClick={() => setTab("progress")} onKeyDown={(event) => { if (event.key === "Enter") setTab("progress"); }}>
                <Eyebrow>Progress</Eyebrow>
                <strong className="progress-preview-value">{history.length}</strong>
                <small className="muted">sessions logged</small>
                <div className="progress-preview-meta">
                  <span>{streak} day streak</span>
                  <span>{completedSets} sets</span>
                </div>
                <span className="link-cue">View journey ›</span>
              </article>
            </div>

            <SectionHeading eyebrow="Your phase" title={season} />
            <article className="card phase-card">
              <p className="muted">
                {phaseCopy[season].line} {phaseCopy[season].focus}
              </p>
              <p className="muted phase-week-meta">
                {alignActive
                  ? "Early Align recovery — lower volume until you exit."
                  : `Week ${weekInCycle} of ${CYCLE_WEEKS} · ${linearPhase.name} · RPE ${phaseDef.rpeMin}–${phaseDef.rpeMax}`}
                {!alignActive && profile
                  ? ` · ${sessionsThisWeek}/${profile.trainingDays} sessions this week`
                  : null}
              </p>
              <PhaseJourney phases={PHASES} statuses={journeyStatuses} />
              <div className="phase-actions">
                {weekComplete && (
                  <button type="button" className="cta-btn" onClick={advanceProgrammeWeek}>
                    {weekInCycle >= CYCLE_WEEKS
                      ? "Finish Align · start new cycle"
                      : `Complete week ${weekInCycle} →`}
                  </button>
                )}
                {!alignActive && !weekComplete && (
                  <button type="button" className="secondary-btn" onClick={advanceProgrammeWeek}>
                    {weekInCycle >= CYCLE_WEEKS
                      ? "Start new cycle · Foundation"
                      : `Advance to week ${weekInCycle + 1} of ${CYCLE_WEEKS}`}
                  </button>
                )}
                {upcomingPhase && !alignActive && (
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => enterPhase(upcomingPhase)}
                  >
                    Jump to {upcomingPhase}
                  </button>
                )}
                {linearPhase.id !== "Align" && (
                  <button type="button" className="text-btn" onClick={toggleAlignBlock}>
                    {alignActive ? "Exit early Align · return to programme" : "Start early Align recovery"}
                  </button>
                )}
              </div>
            </article>

            <SectionHeading eyebrow="Journal" title="Today's reflection" />
            <article className="card journal-card">
              <textarea
                value={journal[todayISO] ?? ""}
                onChange={(event) => setJournal((current) => ({ ...current, [todayISO]: event.target.value }))}
                placeholder="How did today feel? A word or two is enough."
              />
            </article>

            <SectionHeading eyebrow="This week" title="Weekly schedule" />
            <WeeklySchedule schedule={weeklySchedule} todayName={todayName} />
          </div>
        )}

        {tab === "training" && (
          <div className="screen">
            <header className="topbar">
              <div>
                <span className="eyebrow">Training</span>
                <h2>Your workouts</h2>
              </div>
              <button className="pill-btn" onClick={addWorkout}>+ Workout</button>
            </header>

            <SectionHeading eyebrow="This week" title="Weekly schedule" />
            <WeeklySchedule schedule={weeklySchedule} todayName={todayName} />

            <div className="workout-list">
              {workouts.map((workout) => {
                const isEditing = editingWorkoutId === workout.id;
                return (
                  <article className="card workout-card" key={workout.id}>
                    <div className="workout-card-head">
                      <div className="workout-title-block">
                        {isEditing ? (
                          <>
                            <input value={workout.day} onChange={(event) => updateWorkout(workout.id, { day: event.target.value })} />
                            <input value={workout.title} onChange={(event) => updateWorkout(workout.id, { title: event.target.value })} />
                          </>
                        ) : (
                          <>
                            <span className="eyebrow">{workout.day}</span>
                            <h3>{workout.title}</h3>
                          </>
                        )}
                      </div>
                      <div className="editor-actions compact">
                        <button onClick={() => moveWorkout(workout.id, -1)} aria-label="Move up">↑</button>
                        <button onClick={() => moveWorkout(workout.id, 1)} aria-label="Move down">↓</button>
                        <button className="pill-btn small" onClick={() => startWorkout(workout)}>Start</button>
                      </div>
                    </div>

                    <div className="editor-actions toolbar">
                      <button onClick={() => setEditingWorkoutId(isEditing ? null : workout.id)}>{isEditing ? "Done editing" : "Edit workout"}</button>
                      <button onClick={() => duplicateWorkout(workout)}>Duplicate</button>
                      <button className="danger" onClick={() => deleteWorkout(workout.id)}>Delete</button>
                    </div>

                    {isEditing && (
                      <label className="field">
                        <span>Duration</span>
                        <input type="number" value={workout.duration} onChange={(event) => updateWorkout(workout.id, { duration: Number(event.target.value) })} />
                      </label>
                    )}

                    <div className="exercise-editor-list">
                      {workout.exercises.map((exercise) => {
                        const isExerciseEditing = editingExerciseId === exercise.id;
                        const isSwapping = swappingExerciseId === exercise.id;
                        const candidates = isSwapping
                          ? swapCandidates(exercise.exerciseId, profile.equipmentAccess)
                          : [];
                        return (
                          <div className="exercise-editor" key={exercise.id}>
                            {isExerciseEditing ? (
                              <>
                                <input className="full" value={exercise.name} onChange={(event) => updateExercise(workout.id, exercise.id, { name: event.target.value })} />
                                <div className="field-grid">
                                  <Field label="Sets" value={exercise.sets} onChange={(value) => updateExercise(workout.id, exercise.id, { sets: value })} />
                                  <Field label="Rep min" value={exercise.repMin} onChange={(value) => updateExercise(workout.id, exercise.id, { repMin: value })} />
                                  <Field label="Rep max" value={exercise.repMax} onChange={(value) => updateExercise(workout.id, exercise.id, { repMax: value })} />
                                  <Field label="Weight" value={exercise.weight} onChange={(value) => updateExercise(workout.id, exercise.id, { weight: value })} step="0.5" />
                                  <Field label="RPE" value={exercise.rpe} onChange={(value) => updateExercise(workout.id, exercise.id, { rpe: value })} step="0.5" />
                                  <Field label="Load increase" value={exercise.increment} onChange={(value) => updateExercise(workout.id, exercise.id, { increment: value })} step="0.5" />
                                  <Field label="Rest seconds" value={exercise.restSeconds} onChange={(value) => updateExercise(workout.id, exercise.id, { restSeconds: value })} />
                                </div>
                                <textarea placeholder="Exercise notes" value={exercise.notes} onChange={(event) => updateExercise(workout.id, exercise.id, { notes: event.target.value })} />
                                <div className="editor-actions">
                                  <button className="pill-btn small" onClick={() => setEditingExerciseId(null)}>Done</button>
                                  <button className="danger" onClick={() => deleteExercise(workout.id, exercise.id)}>Delete</button>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="exercise-summary">
                                  <div className="exercise-thumb" style={{ backgroundImage: `url(${imageForExercise(exercise.name)})` }} aria-hidden />
                                  <div className="reorder-buttons">
                                    <button onClick={() => moveExercise(workout.id, exercise.id, -1)} aria-label="Move exercise up">↑</button>
                                    <button onClick={() => moveExercise(workout.id, exercise.id, 1)} aria-label="Move exercise down">↓</button>
                                  </div>
                                  <div>
                                    <strong>{exercise.name}</strong>
                                    <small>{exercise.sets} × {exercise.repMin}–{exercise.repMax} · {exercise.weight} kg · RPE {exercise.rpe}</small>
                                  </div>
                                </div>
                                <div className="editor-actions compact">
                                  <button className="text-btn" onClick={() => setEditingExerciseId(exercise.id)}>Edit</button>
                                  <button
                                    className="text-btn"
                                    onClick={() =>
                                      setSwappingExerciseId((current) =>
                                        current === exercise.id ? null : exercise.id,
                                      )
                                    }
                                  >
                                    {isSwapping ? "Close swaps" : "Swap"}
                                  </button>
                                </div>
                                {isSwapping && (
                                  <div className="swap-options">
                                    {candidates.map((candidate) => (
                                      <button
                                        key={candidate.id}
                                        type="button"
                                        className="swap-option"
                                        onClick={() =>
                                          swapExerciseInWorkout(workout.id, exercise.id, candidate.id)
                                        }
                                      >
                                        <span>{candidate.name}</span>
                                        <small>
                                          {swapReasonLabel(candidate.reason)}
                                          {candidate.preserveWeight ? " · keeps load" : " · reset load"}
                                        </small>
                                      </button>
                                    ))}
                                    {candidates.length === 0 && (
                                      <p className="muted">No swaps available for this exercise.</p>
                                    )}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <button className="secondary-btn" onClick={() => addExercise(workout.id)}>+ Add exercise</button>
                  </article>
                );
              })}
            </div>
          </div>
        )}

        {tab === "progress" && (
          <div className="screen">
            <header className="topbar">
              <div>
                <span className="eyebrow">Progress</span>
                <h2>Your journey</h2>
              </div>
            </header>

            <div className="stat-grid four">
              <StatTile label="Sessions" value={String(history.length)} accent="pink" />
              <StatTile label="Sets" value={String(completedSets)} accent="mocha" />
              <StatTile label="Streak" value={`${streak}d`} accent="green" />
              <StatTile label="This week" value={`${weekSessions}/5`} accent="sage" />
            </div>

            {dashboard && (
              <>
                <SectionHeading eyebrow="Coach" title="This week's focus" />
                <article className="card coach-card">
                  {latestSummary.length > 0 && <p className="coach-message">{latestSummary[0]}</p>}
                  <div className="dash-grid">
                    <div className="dash-row"><span>Focus</span><strong>{dashboard.focus}</strong></div>
                    <div className="dash-row"><span>Strongest</span><strong>{dashboard.strongestArea}</strong></div>
                    <div className="dash-row"><span>Needs work</span><strong>{dashboard.needsImprovement}</strong></div>
                    <div className="dash-row"><span>Recovery</span><strong>{dashboard.recoveryStatus}</strong></div>
                    <div className="dash-row"><span>Next milestone</span><strong>{dashboard.nextMilestone}</strong></div>
                    <div className="dash-row"><span>Completion</span><strong>{dashboard.weeklyCompletion}</strong></div>
                  </div>
                  {latestSummary.length > 1 && (
                    <div className="coach-rec">
                      <span className="eyebrow">Coach note</span>
                      <p>{latestSummary.slice(1).join(" ")}</p>
                    </div>
                  )}
                </article>
              </>
            )}

            {showProgressionCues && progressionCues.length > 0 && (
              <>
                <SectionHeading eyebrow="Next session" title="Progression cues" />
                <article className="card progression-cues-card">
                  <p className="muted">
                    Based on {latestSession?.workoutTitle ?? "your last session"} — what to do next time.
                  </p>
                  <div className="progression-cue-list">
                    {progressionCues.map(({ exercise, recommendation }) => (
                      <div className={`progression-cue action-${recommendation.action}`} key={exercise.id}>
                        <div className="progression-cue-head">
                          <strong>{exercise.name}</strong>
                          <span className={`cue-pill action-${recommendation.action}`}>
                            {progressionActionLabel(recommendation.action)}
                          </span>
                        </div>
                        <p>{recommendation.title}</p>
                        <small className="muted">{recommendation.detail}</small>
                        <div className="progression-cue-meta">
                          {typeof recommendation.previousWeight === "number" ? (
                            <span>{recommendation.previousWeight} kg →</span>
                          ) : null}
                          <strong>{recommendation.targetWeight} kg</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button type="button" className="secondary-btn" onClick={applyProgressionCues}>
                    Apply loads to programme
                  </button>
                </article>
              </>
            )}

            <SectionHeading eyebrow="Physique" title="Glute score" />
            <article className="card glute-card">
              <div className="glute-score">
                <strong>{glute.score}</strong>
                <span className={`score-badge band-${glute.band.replace(/\s/g, "").toLowerCase()}`}>{glute.band}</span>
              </div>
              <div className="dash-grid">
                <div className="dash-row"><span>Glute sets · 7d</span><strong>{glute.gluteSets}</strong></div>
                <div className="dash-row"><span>Consistency</span><strong>{glute.consistency}%</strong></div>
                <div className="dash-row"><span>Improving lifts</span><strong>{glute.progression}</strong></div>
                <div className="dash-row"><span>Recovery</span><strong>{glute.recovery}</strong></div>
              </div>
            </article>

            <SectionHeading eyebrow="Charts" title="Training volume" />
            <article className="card chart-card">
              {volumeSeries.length ? (
                <div className="bar-chart">
                  {volumeSeries.map((point, index) => {
                    const max = Math.max(1, ...volumeSeries.map((entry) => entry.value));
                    const height = Math.max(6, Math.round((point.value / max) * 100));
                    return (
                      <div className="bar-col" key={index}>
                        <span className="bar" style={{ height: `${height}%` }} />
                        <small>{point.label}</small>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="muted centered">Complete a workout to see your training volume grow.</p>
              )}
            </article>

            <SectionHeading eyebrow="Strength" title="Strength progress" />
            <article className="card">
              <div className="strength-list">
                {strengthProgress.map((entry) => {
                  const delta = entry.current - entry.base;
                  return (
                    <div className="strength-row" key={entry.name}>
                      <div>
                        <strong>{entry.name}</strong>
                        <small>{entry.current} kg working weight</small>
                      </div>
                      <span className={`delta ${delta > 0 ? "up" : delta < 0 ? "down" : "flat"}`}>
                        {delta > 0 ? `+${delta}` : delta < 0 ? `${delta}` : "—"} kg
                      </span>
                    </div>
                  );
                })}
                {!strengthProgress.length && <p className="muted centered">Add exercises to track strength progress.</p>}
              </div>
            </article>

            <SectionHeading eyebrow="Trends" title="Strength trends" />
            <article className="card">
              <div className="strength-list">
                {trends.map((entry) => (
                  <div className="strength-row" key={entry.name}>
                    <div>
                      <strong>{entry.name}</strong>
                      <small>{entry.previous}kg → {entry.current}kg</small>
                    </div>
                    <span className={`delta ${entry.trend === "improving" ? "up" : entry.trend === "declining" ? "down" : "flat"}`}>
                      {entry.trend === "improving" ? "Improving" : entry.trend === "declining" ? "Declining" : "Maintaining"}
                    </span>
                  </div>
                ))}
                {!trends.length && <p className="muted centered">Log a few sessions to reveal your strength trends.</p>}
              </div>
            </article>

            <SectionHeading eyebrow="Records" title="Personal records" />
            <div className="stat-grid four">
              <StatTile label="Heaviest" value={records.heaviestWeight ? `${records.heaviestWeight.value}kg` : "—"} note={records.heaviestWeight?.name ?? "Log a set"} accent="pink" />
              <StatTile label="Best e1RM" value={records.bestE1RM ? `${records.bestE1RM.value}kg` : "—"} note={records.bestE1RM?.name ?? "—"} accent="mocha" />
              <StatTile label="Top volume" value={records.highestVolume ? String(records.highestVolume.value) : "—"} note="single session" accent="sage" />
              <StatTile label="Longest streak" value={`${records.longestStreak}d`} note={records.mostImproved ? `Most improved · ${records.mostImproved.name}` : "—"} accent="green" />
            </div>

            <ProgressPanel
              profile={profile}
              entries={progressEntries}
              photos={progressPhotos}
              onSaveEntry={handleSaveProgressEntry}
              onAddPhoto={handleAddPhoto}
              onDeletePhoto={handleDeletePhoto}
            />

            {review && (
              <>
                <SectionHeading eyebrow="Sunday" title="Weekly review" />
                <article className="card coach-card">
                  <p className="coach-message">{review.summary}</p>
                  <div className="stat-grid four">
                    <StatTile label="Workouts" value={String(review.workouts)} accent="pink" />
                    <StatTile label="Consistency" value={`${review.consistency}%`} accent="sage" />
                    <StatTile label="Volume" value={String(review.volume)} accent="mocha" />
                    <StatTile label="Lifts up" value={String(review.strengthGained)} accent="green" />
                  </div>
                  <div className="coach-rec">
                    <span className="eyebrow">Goal for next week</span>
                    <p>{review.nextGoal}</p>
                  </div>
                </article>
              </>
            )}

            <SectionHeading eyebrow="History" title="Recent sessions" />
            <div className="history-list">
              {[...history].reverse().map((item) => (
                <article className="card history-card" key={item.id}>
                  <div className="workout-card-head">
                    <div>
                      <span className="eyebrow">{new Date(item.completedAt).toLocaleDateString()}</span>
                      <h3>{item.workoutTitle}</h3>
                    </div>
                    <span className="season-pill">{item.season}</span>
                  </div>
                  {item.exercises.map((exercise) => {
                    const completed = exercise.sets.filter((set) => set.complete);
                    return (
                      <p key={exercise.exerciseId}>
                        <strong>{exercise.name}</strong>
                        <span>{completed.map((set) => `${set.weight}kg × ${set.reps}`).join(" · ") || "Not completed"}</span>
                      </p>
                    );
                  })}
                </article>
              ))}
              {!history.length && <article className="card empty-state">Complete your first workout to build your progress history.</article>}
            </div>
          </div>
        )}

        {tab === "recovery" && (
          <div className="screen">
            <header className="topbar">
              <div>
                <span className="eyebrow">Recovery</span>
                <h2>Return to balance</h2>
              </div>
            </header>

            <article
              className="card image-card tall recovery-hero"
              style={{ backgroundImage: `linear-gradient(180deg, rgba(74,55,44,.02) 30%, rgba(74,55,44,.5)), url(${IMAGES.recovery})` }}
            >
              <div className="image-card-copy">
                <span className="eyebrow light">Readiness</span>
                <h3 className="recovery-score">82%</h3>
                <span className="link-cue">Well recovered — train as planned</span>
              </div>
            </article>

            <div className="stat-grid three">
              <StatTile label="Stress" value="Low" note="Settled" accent="sage" />
              <StatTile label="Readiness" value="High" note="Go" accent="green" />
              <StatTile label="Soreness" value="Mild" note="Normal" accent="pink" />
            </div>

            <SectionHeading eyebrow="Tonight" title="Wind-down ritual" />
            <article className="card coach-card">
              <p className="coach-message">Dim the lights an hour before bed, stretch gently, and let your nervous system settle. Rest is where your {season} work takes hold.</p>
              <div className="coach-reminders">
                <div className="reminder accent-blue"><strong>Hydrate</strong><small>A final glass of water to close the day.</small></div>
                <div className="reminder accent-mocha"><strong>Nourish</strong><small>A little protein supports overnight recovery.</small></div>
                <div className="reminder accent-sage"><strong>Sleep</strong><small>Aim for 8 restful hours tonight.</small></div>
              </div>
            </article>
          </div>
        )}

        <nav className="tabbar">
          {TABS.map((item) => (
            <button key={item.key} className={tab === item.key ? "active" : ""} onClick={() => setTab(item.key)}>
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
