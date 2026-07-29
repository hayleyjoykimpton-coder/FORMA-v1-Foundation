/**
 * Exercise instruction videos.
 *
 * Library entries use curated YouTube links from reputable coaches
 * (Jeff Nippard, Scott Herman, Athlean-X, Jeremy Ethier, etc.).
 * Users can override any exercise with their own YouTube / Vimeo / URL
 * via the training editor (`Exercise.videoUrl`).
 *
 * Broken IDs are omitted so resolveExerciseVideoUrl falls back to a
 * YouTube “proper form” search. Verified via YouTube oEmbed.
 *
 * File uploads are intentionally not supported yet — video blobs do not
 * fit localStorage / the user_state JSON sync path. Cloud Storage can
 * land later when native/App Store work resumes.
 */

import { EXERCISES } from "./exercises";
import type { Exercise } from "./types";

/**
 * Hand-picked public form demos for key FORMA lifts.
 * Prefer high-signal coaching channels over low-quality shorts (except
 * where Hayley requested a specific link, e.g. hip_thrust).
 */
export const LIBRARY_VIDEO_URLS: Partial<Record<string, string>> = {
  // Glutes / posterior
  hip_thrust: "https://www.youtube.com/watch?v=42lU8xsumBo", // Hayley pick · Train with Dave
  romanian_deadlift: "https://www.youtube.com/watch?v=_oyxCn2iSjU", // Jeff Nippard
  bulgarian_split_squat: "https://www.youtube.com/watch?v=2C-uNgKwPLE", // Scott Herman
  walking_lunge: "https://www.youtube.com/watch?v=u9Dklt6z3FM", // Jim Stoppani
  step_up: "https://www.youtube.com/watch?v=7AtIjR-QqVA", // Bodybuilding.com
  cable_kickback: "https://www.youtube.com/watch?v=dJa_Nf4zdik", // Jeff Nippard × Stephanie Buttermore
  hip_abduction: "https://www.youtube.com/watch?v=b-cxonq03vQ", // Life Fitness machine guide
  glute_bridge: "https://www.youtube.com/watch?v=ylpfCk3i-0Y", // Scott Herman
  leg_curl: "https://www.youtube.com/watch?v=1Tq3QdYUuHs", // Scott Herman
  "45_degree_back_extension": "https://www.youtube.com/watch?v=WJm88qItjeE", // Colossus · glute-biased

  // Quads
  squat: "https://www.youtube.com/watch?v=gcNh17Ckjgg", // Jeremy Ethier
  hack_squat: "https://www.youtube.com/watch?v=0tn5K9NlCfo", // Bodybuilding.com
  leg_press: "https://www.youtube.com/watch?v=oujca3_Shgw", // Scott Herman
  leg_extension: "https://www.youtube.com/watch?v=YyvSfVjQeL0", // Scott Herman

  // Pull / posture
  lat_pulldown: "https://www.youtube.com/watch?v=CAwf7n6Luuc", // Scott Herman
  seated_row: "https://www.youtube.com/watch?v=GZbfZ033f74", // Scott Herman
  chest_supported_row: "https://www.youtube.com/watch?v=H75im9fAUMc", // Men's Health
  rear_delt_fly: "https://www.youtube.com/watch?v=JQFAPP_HxdM", // TylerPath

  // Push / shoulders
  shoulder_press: "https://www.youtube.com/watch?v=qEwKCR5JCog", // Scott Herman
  lateral_raise: "https://www.youtube.com/watch?v=3VcKaXpzqRo", // Scott Herman
  incline_press: "https://www.youtube.com/watch?v=8iPEnn-ltC8", // Scott Herman
  push_up: "https://www.youtube.com/watch?v=IODxDxX7oi4", // Calisthenicmovement

  // Core
  cable_crunch: "https://www.youtube.com/watch?v=36HK6uPM_PQ", // Jim Stoppani
  dead_bug: "https://www.youtube.com/watch?v=4XLEnwUr1d8", // Bodybuilding.com
  pallof_press: "https://www.youtube.com/watch?v=HXrLaqNIkTs", // PureGym
  side_plank: "https://www.youtube.com/watch?v=K2VljzCC16g", // Howcast
  hanging_knee_raise: "https://www.youtube.com/watch?v=Pr1ieGZ5atk", // ATHLEAN-X
  cable_woodchop: "https://www.youtube.com/watch?v=pAplQXk3dkU", // Scott Herman
  russian_twist: "https://www.youtube.com/watch?v=wkD8rjkodUI", // Howcast

  // Arms
  bicep_curl: "https://www.youtube.com/watch?v=sAq_ocpRh_I", // Scott Herman
  triceps_pushdown: "https://www.youtube.com/watch?v=2-LAMcpzODU", // Scott Herman
};

export function youtubeFormSearch(name: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${name} proper form`)}`;
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
 * Priority: user override → library curated → YouTube form search.
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
