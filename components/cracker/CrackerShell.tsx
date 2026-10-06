"use client";

import { useEffect, useState } from "react";
import { CrackerConnect } from "@/components/cracker/CrackerConnect";
import { CrackerHome } from "@/components/cracker/CrackerHome";
import { CrackerMove } from "@/components/cracker/CrackerMove";
import { CrackerNourish } from "@/components/cracker/CrackerNourish";
import { CrackerTabBar } from "@/components/cracker/CrackerTabBar";
import type { CrackerTab } from "@/components/cracker/types";
import { loadCrackerTab, saveCrackerTab, saveMoveSubTab, type MoveSubTab } from "@/lib/crackerNav";
import type { ProgressPhoto } from "@/lib/progress";
import type { ExperienceLevel, LifeSoulClub } from "@/lib/user";
import type { Workout, WorkoutSession } from "@/lib/types";

type Props = {
  week: number;
  sessionsDone: number;
  sessionsTarget: number;
  experience: ExperienceLevel;
  workouts: Workout[];
  history: WorkoutSession[];
  completedIds: Set<string>;
  profileInitial: string;
  profilePhoto?: string;
  onOpenProfile: () => void;
  onStartWorkout: (workout: Workout) => void;
  photos: ProgressPhoto[];
  onAddPhoto: (photo: ProgressPhoto) => void;
  onDeletePhoto: (id: string) => void;
  club: LifeSoulClub;
  pausedTitle?: string | null;
  onResumeWorkout?: () => void;
  onDiscardWorkout?: () => void;
};

export function CrackerShell({
  week,
  sessionsDone,
  sessionsTarget,
  experience,
  workouts,
  history,
  completedIds,
  profileInitial,
  profilePhoto,
  onOpenProfile,
  onStartWorkout,
  photos,
  onAddPhoto,
  onDeletePhoto,
  club,
  pausedTitle,
  onResumeWorkout,
  onDiscardWorkout,
}: Props) {
  const [tab, setTab] = useState<CrackerTab>("home");
  const [moveOpenSignal, setMoveOpenSignal] = useState(0);

  useEffect(() => {
    setTab(loadCrackerTab());
  }, []);

  const selectTab = (next: CrackerTab, moveSubTab?: MoveSubTab) => {
    if (next === "move") {
      saveMoveSubTab(moveSubTab ?? "training");
      setMoveOpenSignal((value) => value + 1);
    }
    setTab(next);
    saveCrackerTab(next);
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };

  return (
    <div className="shell cracker-shell">
      {tab === "home" ? (
        <CrackerHome
          week={week}
          sessionsDone={sessionsDone}
          sessionsTarget={sessionsTarget}
          profileInitial={profileInitial}
          profilePhoto={profilePhoto}
          onOpenProfile={onOpenProfile}
          onNavigate={selectTab}
          onOpenLearn={() => {
            selectTab("move", "learn");
          }}
          onOpenProgress={() => {
            selectTab("move", "progress");
          }}
          history={history}
          experience={experience}
          pausedTitle={pausedTitle}
          onResumeWorkout={onResumeWorkout}
          onDiscardWorkout={onDiscardWorkout}
        />
      ) : null}

      {tab === "move" ? (
        <CrackerMove
          currentWeek={week}
          experience={experience}
          liveWorkouts={workouts}
          history={history}
          onStart={onStartWorkout}
          onOpenProfile={onOpenProfile}
          profileInitial={profileInitial}
          profilePhoto={profilePhoto}
          photos={photos}
          onAddPhoto={onAddPhoto}
          onDeletePhoto={onDeletePhoto}
          pausedTitle={pausedTitle}
          onResumeWorkout={onResumeWorkout}
          onDiscardWorkout={onDiscardWorkout}
          openSignal={moveOpenSignal}
        />
      ) : null}

      {tab === "nourish" ? (
        <CrackerNourish
          club={club}
          onOpenProfile={onOpenProfile}
          profileInitial={profileInitial}
          profilePhoto={profilePhoto}
        />
      ) : null}

      {tab === "connect" ? (
        <CrackerConnect
          onOpenProfile={onOpenProfile}
          profileInitial={profileInitial}
          profilePhoto={profilePhoto}
        />
      ) : null}

      <CrackerTabBar tab={tab} onChange={selectTab} />
    </div>
  );
}
