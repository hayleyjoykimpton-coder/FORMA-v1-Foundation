import type { CrackerTab } from "@/components/cracker/types";

export type MoveSubTab =
  | "training"
  | "learn"
  | "progress"
  | "fitness"
  | "inbody"
  | "recap"
  | "photos";

export type ConnectSubTab = "community" | "events" | "included";

export const MOVE_SUBTAB_KEY = "forma-cracker-move-subtab-v1";
export const CONNECT_SUBTAB_KEY = "forma-cracker-connect-subtab-v1";
export const CRACKER_TAB_KEY = "forma-cracker-tab-v1";
export const RECAP_FOCUS_KEY = "forma-cracker-recap-focus-v1";

export function loadMoveSubTab(): MoveSubTab {
  if (typeof window === "undefined") return "training";
  try {
    const raw = window.localStorage.getItem(MOVE_SUBTAB_KEY);
    if (
      raw === "fitness" ||
      raw === "inbody" ||
      raw === "training" ||
      raw === "recap" ||
      raw === "photos" ||
      raw === "learn" ||
      raw === "progress"
    ) {
      return raw;
    }
  } catch {
    /* ignore */
  }
  return "training";
}

export function saveMoveSubTab(tab: MoveSubTab): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MOVE_SUBTAB_KEY, tab);
  } catch {
    /* ignore */
  }
}

export function loadConnectSubTab(): ConnectSubTab {
  if (typeof window === "undefined") return "community";
  try {
    const raw = window.localStorage.getItem(CONNECT_SUBTAB_KEY);
    if (raw === "community" || raw === "events" || raw === "included") return raw;
  } catch {
    /* ignore */
  }
  return "community";
}

export function saveConnectSubTab(tab: ConnectSubTab): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CONNECT_SUBTAB_KEY, tab);
  } catch {
    /* ignore */
  }
}

export function loadCrackerTab(): CrackerTab {
  if (typeof window === "undefined") return "home";
  try {
    const raw = window.localStorage.getItem(CRACKER_TAB_KEY);
    if (raw === "home" || raw === "move" || raw === "nourish" || raw === "connect") return raw;
  } catch {
    /* ignore */
  }
  return "home";
}

export function saveCrackerTab(tab: CrackerTab): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CRACKER_TAB_KEY, tab);
  } catch {
    /* ignore */
  }
}

export function saveRecapFocus(sessionId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(RECAP_FOCUS_KEY, sessionId);
  } catch {
    /* ignore */
  }
}

export function takeRecapFocus(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const id = window.localStorage.getItem(RECAP_FOCUS_KEY);
    if (id) window.localStorage.removeItem(RECAP_FOCUS_KEY);
    return id;
  } catch {
    return null;
  }
}
