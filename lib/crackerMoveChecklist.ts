/**
 * MOVE weekly checklist + Jess education completion (local).
 * Workout completion still comes from workout history.
 */

const KEY = "forma-cracker-move-checklist-v1";

export type MoveChecklistWeek = {
  education: boolean;
  action: boolean;
};

export type MoveChecklistState = {
  /** keyed by `${level}-w${week}` */
  weeks: Record<string, MoveChecklistWeek>;
};

function emptyWeek(): MoveChecklistWeek {
  return { education: false, action: false };
}

export function checklistKey(level: "beginner" | "intermediate", week: number): string {
  return `${level}-w${Math.min(6, Math.max(1, week))}`;
}

export function loadMoveChecklist(): MoveChecklistState {
  if (typeof window === "undefined") return { weeks: {} };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { weeks: {} };
    const parsed = JSON.parse(raw) as MoveChecklistState;
    return { weeks: parsed?.weeks && typeof parsed.weeks === "object" ? parsed.weeks : {} };
  } catch {
    return { weeks: {} };
  }
}

export function saveMoveChecklist(state: MoveChecklistState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export function getWeekChecklist(
  state: MoveChecklistState,
  level: "beginner" | "intermediate",
  week: number,
): MoveChecklistWeek {
  return state.weeks[checklistKey(level, week)] ?? emptyWeek();
}

export function setWeekChecklist(
  state: MoveChecklistState,
  level: "beginner" | "intermediate",
  week: number,
  patch: Partial<MoveChecklistWeek>,
): MoveChecklistState {
  const key = checklistKey(level, week);
  const current = state.weeks[key] ?? emptyWeek();
  return {
    weeks: {
      ...state.weeks,
      [key]: { ...current, ...patch },
    },
  };
}
