/**
 * Exercise instruction videos.
 *
 * Library entries use curated YouTube links where we have a stable demo;
 * otherwise we fall back to a YouTube search for “{name} proper form”.
 * Users can override any exercise with their own YouTube / Vimeo / URL
 * via the training editor (`Exercise.videoUrl`).
 *
 * File uploads are intentionally not supported yet — video blobs do not
 * fit localStorage / the user_state JSON sync path. Cloud Storage can
 * land later when native/App Store work resumes.
 */

import { EXERCISES } from "./exercises";
import type { Exercise } from "./types";

/** Hand-picked public form demos for key FORMA lifts. */
export const LIBRARY_VIDEO_URLS: Partial<Record<string, string>> = {
  hip_thrust: "https://www.youtube.com/watch?v=SEdqd1n0VjM",
  romanian_deadlift: "https://www.youtube.com/watch?v=jEy_czb3RKA",
  bulgarian_split_squat: "https://www.youtube.com/watch?v=2C-uNgKwPLE",
  walking_lunge: "https://www.youtube.com/watch?v=L8fvypPrzzs",
  step_up: "https://www.youtube.com/watch?v=aajBM3YJh_o",
  cable_kickback: "https://www.youtube.com/watch?v=duvLGWZX_kw",
  hip_abduction: "https://www.youtube.com/watch?v=abB6PqA6QhU",
  glute_bridge: "https://www.youtube.com/watch?v=OUgsJ8-Vi0E",
  leg_curl: "https://www.youtube.com/watch?v=1Tq3QdYUuHs",
  squat: "https://www.youtube.com/watch?v=ultWZbUMPL8",
  hack_squat: "https://www.youtube.com/watch?v=0tn5K9NlCfo",
  leg_press: "https://www.youtube.com/watch?v=IZxyjW7MPJY",
  lat_pulldown: "https://www.youtube.com/watch?v=CAwf7n6Luuc",
  seated_row: "https://www.youtube.com/watch?v=GZbfZ033f74",
  shoulder_press: "https://www.youtube.com/watch?v=qEwKCR5JCog",
  lateral_raise: "https://www.youtube.com/watch?v=3VcKaXpzqRo",
  incline_press: "https://www.youtube.com/watch?v=8iPEnn-ltC8",
  push_up: "https://www.youtube.com/watch?v=IODxDxX7oi4",
  cable_crunch: "https://www.youtube.com/watch?v=ToisFnrtQmA",
  dead_bug: "https://www.youtube.com/watch?v=4XLEnjTl9FM",
  pallof_press: "https://www.youtube.com/watch?v=AH_QZLm_0-s",
  side_plank: "https://www.youtube.com/watch?v=K2VljzCC16g",
  hanging_knee_raise: "https://www.youtube.com/watch?v=RD_Bj5-Vkzc",
  bicep_curl: "https://www.youtube.com/watch?v=ykJmrZ5v0Oo",
  triceps_pushdown: "https://www.youtube.com/watch?v=2-LAMcpzODU",
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
