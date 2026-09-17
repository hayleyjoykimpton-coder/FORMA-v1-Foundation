"use client";

import { useState } from "react";
import { CrackerConnect } from "@/components/cracker/CrackerConnect";
import { CrackerHome } from "@/components/cracker/CrackerHome";
import { CrackerMove } from "@/components/cracker/CrackerMove";
import { CrackerNourish } from "@/components/cracker/CrackerNourish";
import { CrackerTabBar } from "@/components/cracker/CrackerTabBar";
import type { CrackerTab } from "@/components/cracker/types";
import type { ExperienceLevel } from "@/lib/user";
import type { Workout } from "@/lib/types";

type Props = {
  week: number;
  sessionsDone: number;
  sessionsTarget: number;
  experience: ExperienceLevel;
  workouts: Workout[];
  completedIds: Set<string>;
  profileInitial: string;
  profilePhoto?: string;
  onOpenProfile: () => void;
  onStartWorkout: (workout: Workout) => void;
};

export function CrackerShell({
  week,
  sessionsDone,
  sessionsTarget,
  experience,
  workouts,
  completedIds,
  profileInitial,
  profilePhoto,
  onOpenProfile,
  onStartWorkout,
}: Props) {
  const [tab, setTab] = useState<CrackerTab>("home");

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
          onNavigate={setTab}
        />
      ) : null}

      {tab === "move" ? (
        <CrackerMove
          currentWeek={week}
          experience={experience}
          liveWorkouts={workouts}
          completedIds={completedIds}
          onStart={onStartWorkout}
          onOpenProfile={onOpenProfile}
          profileInitial={profileInitial}
          profilePhoto={profilePhoto}
        />
      ) : null}

      {tab === "nourish" ? (
        <CrackerNourish
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

      <CrackerTabBar tab={tab} onChange={setTab} />
    </div>
  );
}
