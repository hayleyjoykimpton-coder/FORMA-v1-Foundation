/**
 * Clears all member-owned browser data for this origin.
 * Used on sign-out / account switch so User A cannot see User B's progress.
 *
 * FORMA stores most member data in fixed localStorage keys (not user-scoped).
 * Cloud sync (when configured) is the cross-device source of truth; local keys
 * are an offline cache that must not leak across accounts on a shared device.
 */

import { PROFILE_STORAGE } from "./user";
import { STORAGE } from "./migrations";
import { PROGRESS_STORAGE, PHOTOS_STORAGE } from "./progress";
import { INBODY_STORAGE_KEY } from "./inbody";
import { WELLNESS_STORAGE_KEY } from "./wellness";
import { MEALS_STORAGE_KEY } from "./meals";
import { MOVE_CHECKINS_STORAGE } from "./crackerMoveCheckIns";

const LOCAL_ONLY_KEY = "forma-local-only-v1";
const MOVE_SUBTAB_KEY = "forma-cracker-move-subtab-v1";
const MOVE_CHECKLIST_KEY = "forma-cracker-move-checklist-v1";
const LEGACY_FITNESS_KEY = "forma-cracker-fitness-v1";
const CHALLENGE_MODE_KEY = "forma-challenge-mode-v1";
const HOME_PREFS_KEY = "forma-home-prefs-v1";
const REMINDERS_KEY = "forma-reminders-v1";
const PROGRESS_SUBTAB_KEY = "forma-progress-subtab-v1";
const WEEKLY_REVIEW_NUDGE_KEY = "forma-weekly-review-nudge-v1";
const CRACKER_TAB_KEY = "forma-cracker-tab-v1";
const RECAP_FOCUS_KEY = "forma-cracker-recap-focus-v1";

/** Member-owned keys. Challenge mode preference is kept (seasonal product setting). */
export const MEMBER_DATA_KEYS = [
  PROFILE_STORAGE,
  STORAGE.workouts,
  STORAGE.history,
  STORAGE.program,
  STORAGE.session,
  STORAGE.water,
  STORAGE.journal,
  STORAGE.wellness,
  WELLNESS_STORAGE_KEY,
  MEALS_STORAGE_KEY,
  INBODY_STORAGE_KEY,
  PROGRESS_STORAGE,
  PHOTOS_STORAGE,
  MOVE_CHECKINS_STORAGE,
  MOVE_CHECKLIST_KEY,
  MOVE_SUBTAB_KEY,
  CRACKER_TAB_KEY,
  RECAP_FOCUS_KEY,
  LEGACY_FITNESS_KEY,
  LOCAL_ONLY_KEY,
  HOME_PREFS_KEY,
  REMINDERS_KEY,
  PROGRESS_SUBTAB_KEY,
  WEEKLY_REVIEW_NUDGE_KEY,
  // Legacy namespaces
  "forma-workouts-v11",
  "forma-history-v11",
] as const;

export function clearLocalMemberData(): void {
  if (typeof window === "undefined") return;
  for (const key of MEMBER_DATA_KEYS) {
    window.localStorage.removeItem(key);
  }
  // Keep CHALLENGE_MODE_KEY — seasonal lock is product-wide, not per-member.
  void CHALLENGE_MODE_KEY;
}

/**
 * True when local cached profile is safe to merge into this cloud account.
 * Different id / email ⇒ prior device user — do not merge their history.
 */
export function localProfileBelongsToUser(
  localProfile: { id?: string; email?: string } | null | undefined,
  userId: string,
  cloudEmail?: string,
): boolean {
  if (!localProfile) return false;
  if (localProfile.id && localProfile.id === userId) return true;
  const localEmail = (localProfile.email || "").trim().toLowerCase();
  const remoteEmail = (cloudEmail || "").trim().toLowerCase();
  if (localEmail && remoteEmail && localEmail === remoteEmail) return true;
  return false;
}
