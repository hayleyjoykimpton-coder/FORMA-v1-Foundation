/**
 * Exercise instruction videos.
 *
 * Prefer high-engagement YouTube Shorts (vertical form tips) so “Watch form”
 * matches the style Hayley likes. Verified via YouTube oEmbed.
 * Users can still override any exercise via Training edit (`Exercise.videoUrl`).
 *
 * File uploads are intentionally not supported yet — video blobs do not
 * fit localStorage / the user_state JSON sync path.
 */

import { EXERCISES } from "./exercises";
import type { Exercise } from "./types";

/**
 * Hand-picked YouTube Shorts for key FORMA lifts.
 * Prefer viral, high-like form Shorts; keep Hayley’s explicit picks.
 */
export const LIBRARY_VIDEO_URLS: Partial<Record<string, string>> = {
  // Glutes / posterior — Hayley picks first
  hip_thrust: "https://www.youtube.com/shorts/42lU8xsumBo", // Hayley · Train with Dave
  romanian_deadlift: "https://www.youtube.com/shorts/CBOhr6H7BEY", // Hayley · ArielYu_Fit
  bulgarian_split_squat: "https://www.youtube.com/shorts/Cow3ESXmrTU", // DeltaBolic · ~396K
  walking_lunge: "https://www.youtube.com/shorts/dW5l-RxHzaE", // Colossus Fitness
  step_up: "https://www.youtube.com/shorts/9day6RhW8XA", // Move With Us · ~1M
  cable_kickback: "https://www.youtube.com/shorts/n-cgsNePyFo", // Gerardi · ~2.4M
  hip_abduction: "https://www.youtube.com/shorts/WOv7Aca6r-0", // LisaFiitt
  glute_bridge: "https://www.youtube.com/shorts/LkCJxld5Bj4", // WeShape
  leg_curl: "https://www.youtube.com/shorts/0fuxdoKUCHA", // Sean Nalewanyj
  "45_degree_back_extension": "https://www.youtube.com/shorts/LJk_rYNMHHQ", // Bret Contreras

  // Quads
  squat: "https://www.youtube.com/shorts/gslEzVggur8", // Davis Diley · ~6M · 292K likes
  hack_squat: "https://www.youtube.com/shorts/91B_5-XEzE4", // N1 Education
  leg_press: "https://www.youtube.com/shorts/jA9tsYbA7Ms", // Sean Nalewanyj
  leg_extension: "https://www.youtube.com/shorts/d3d2yz7V26c", // DeltaBolic

  // Pull / posture
  lat_pulldown: "https://www.youtube.com/shorts/77bPLrsMwiQ", // DeltaBolic · ~8M
  seated_row: "https://www.youtube.com/shorts/BbYc8JbD8dI", // TylerPath
  chest_supported_row: "https://www.youtube.com/shorts/azN0upTD8Go", // Gerardi
  rear_delt_fly: "https://www.youtube.com/shorts/LsT-bR_zxLo", // DeltaBolic

  // Push / shoulders
  shoulder_press: "https://www.youtube.com/shorts/k6tzKisR3NY", // DeltaBolic · ~18M
  lateral_raise: "https://www.youtube.com/shorts/Kl3LEzQ5Zqs", // DeltaBolic · ~11M
  incline_press: "https://www.youtube.com/shorts/JgP9JJnmsjc", // DeltaBolic
  push_up: "https://www.youtube.com/shorts/wD1M-f69Yy8", // FitnessFAQs

  // Core
  cable_crunch: "https://www.youtube.com/shorts/tQgNAIzcjlk", // LeanBeefPatty
  dead_bug: "https://www.youtube.com/shorts/HrxOWhPdsOY", // Dr. Jordan Weber
  pallof_press: "https://www.youtube.com/shorts/2g5tJz1jJsg", // Brandon Smitley
  side_plank: "https://www.youtube.com/shorts/sH5PiIUjDW8", // VIGEO
  hanging_knee_raise: "https://www.youtube.com/shorts/2n4UqRIJyk4", // Gerardi · hanging raise ~1.4M
  cable_woodchop: "https://www.youtube.com/shorts/suSEgI6VpBg", // Colossus Fitness
  russian_twist: "https://www.youtube.com/shorts/S_odouUnGOc", // KevTheTrainer

  // Arms
  bicep_curl: "https://www.youtube.com/shorts/803JIAWBj_c", // Sean Nalewanyj · ~12M
  triceps_pushdown: "https://www.youtube.com/shorts/1FjkhpZsaxc", // DeltaBolic
};

export function youtubeFormSearch(name: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${name} proper form shorts`)}`;
}

export function isLikelyVideoUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * Resolve the best instruction URL for an exercise instance.
 * Priority: user override → library curated Short → YouTube form search.
 */
export function resolveExerciseVideoUrl(exercise: Exercise): string {
  const custom = exercise.videoUrl?.trim();
  if (custom && isLikelyVideoUrl(custom)) return custom;

  const libraryId = exercise.exerciseId;
  if (libraryId && LIBRARY_VIDEO_URLS[libraryId]) return LIBRARY_VIDEO_URLS[libraryId]!;

  const libraryName = libraryId ? EXERCISES[libraryId]?.name : undefined;
  return youtubeFormSearch(libraryName || exercise.name);
}

export function videoSourceLabel(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (host.includes("youtube") || host.includes("youtu.be")) return "YouTube";
    if (host.includes("vimeo")) return "Vimeo";
    return "Video";
  } catch {
    return "Video";
  }
}
