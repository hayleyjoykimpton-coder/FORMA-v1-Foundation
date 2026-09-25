/**
 * MOVE weekly checklist + Jess education / intro completion.
 * Local cache: forma-cracker-move-checklist-v1.
 * Cloud: programme.moveChecklist (same user_state blob as workouts).
 * Workout completion still comes from workout history.
 */

const KEY = "forma-cracker-move-checklist-v1";
/** Fired after local checklist save so signed-in cloud sync can pick it up. */
export const MOVE_CHECKLIST_CHANGED_EVENT = "forma-move-checklist-changed";

export type MoveChecklistWeek = {
  education: boolean;
  action: boolean;
  educationAt?: string;
  actionAt?: string;
};

export type MoveChecklistState = {
  /** keyed by `${level}-w${week}` */
  weeks: Record<string, MoveChecklistWeek>;
  intro?: boolean;
  introAt?: string;
};

function emptyWeek(): MoveChecklistWeek {
  return { education: false, action: false };
}

export function emptyMoveChecklist(): MoveChecklistState {
  return { weeks: {} };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stampWhen(on: boolean, previous?: string): string | undefined {
  if (!on) return undefined;
  return previous || new Date().toISOString();
}

function normalizeWeek(raw: unknown): MoveChecklistWeek {
  if (!isRecord(raw)) return emptyWeek();
  const education = Boolean(raw.education);
  const action = Boolean(raw.action);
  return {
    education,
    action,
    educationAt: education && typeof raw.educationAt === "string" ? raw.educationAt : undefined,
    actionAt: action && typeof raw.actionAt === "string" ? raw.actionAt : undefined,
  };
}

export function normalizeMoveChecklist(raw: unknown): MoveChecklistState {
  if (!isRecord(raw)) return emptyMoveChecklist();
  const weeks: Record<string, MoveChecklistWeek> = {};
  if (isRecord(raw.weeks)) {
    for (const [key, value] of Object.entries(raw.weeks)) {
      weeks[key] = normalizeWeek(value);
    }
  }
  const intro = Boolean(raw.intro);
  return {
    weeks,
    intro: intro || undefined,
    introAt: intro && typeof raw.introAt === "string" ? raw.introAt : undefined,
  };
}

export function checklistKey(level: "beginner" | "intermediate", week: number): string {
  return `${level}-w${Math.min(6, Math.max(1, week))}`;
}

export function loadMoveChecklist(): MoveChecklistState {
  if (typeof window === "undefined") return emptyMoveChecklist();
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? normalizeMoveChecklist(JSON.parse(raw)) : emptyMoveChecklist();
  } catch {
    return emptyMoveChecklist();
  }
}

export function saveMoveChecklist(state: MoveChecklistState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(normalizeMoveChecklist(state)));
    window.dispatchEvent(new Event(MOVE_CHECKLIST_CHANGED_EVENT));
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
  const next = { ...current, ...patch };
  return {
    ...state,
    weeks: {
      ...state.weeks,
      [key]: {
        education: Boolean(next.education),
        action: Boolean(next.action),
        educationAt: stampWhen(Boolean(next.education), next.educationAt),
        actionAt: stampWhen(Boolean(next.action), next.actionAt),
      },
    },
  };
}

export function setIntroWatched(state: MoveChecklistState, watched: boolean): MoveChecklistState {
  return {
    ...state,
    intro: watched || undefined,
    introAt: stampWhen(watched, state.introAt),
  };
}

/** True-wins merge so a phone tick is not wiped by an older empty cloud row. */
export function mergeMoveChecklists(
  cloud: MoveChecklistState,
  local: MoveChecklistState,
): MoveChecklistState {
  const a = normalizeMoveChecklist(cloud);
  const b = normalizeMoveChecklist(local);
  const weeks: Record<string, MoveChecklistWeek> = { ...a.weeks };
  for (const [key, value] of Object.entries(b.weeks)) {
    const current = weeks[key];
    if (!current) {
      weeks[key] = value;
      continue;
    }
    const education = current.education || value.education;
    const action = current.action || value.action;
    weeks[key] = {
      education,
      action,
      educationAt: stampWhen(education, current.educationAt || value.educationAt),
      actionAt: stampWhen(action, current.actionAt || value.actionAt),
    };
  }
  const intro = Boolean(a.intro || b.intro);
  return {
    weeks,
    intro: intro || undefined,
    introAt: stampWhen(intro, a.introAt || b.introAt),
  };
}
