import type { AppState, ProgressionMode } from "./types";

const ex = (
  id: string,
  name: string,
  targetSets: number,
  repRange: string,
  targetRpe: string,
  previousWeight = "",
  notes = "",
  progressionMode: ProgressionMode = "hypertrophy",
  loadIncrement = 2.5
) => ({ id, name, targetSets, repRange, targetRpe, previousWeight, notes, progressionMode, loadIncrement });

export const DEFAULT_STATE: AppState = {
  activeWorkout: null,
  history: [],
  workouts: [
    {
      id: "yard-lower",
      name: "Yard Lower Rig",
      day: "Monday",
      duration: 50,
      focus: "Squat strength + conditioning",
      exercises: [
        ex("back-squat", "Back Squat", 5, "3–5", "7–9", "60", "", "strength", 2.5),
        ex("lower-support", "Class Supporting Movement", 3, "As programmed", "7–8", "", "", "manual", 0),
        ex("lower-conditioning", "Conditioning Block", 1, "As programmed", "7–9", "", "", "conditioning", 1),
      ],
    },
    {
      id: "glute-builder",
      name: "Glute Builder",
      day: "Wednesday",
      duration: 50,
      focus: "Glute shape, tension and hypertrophy",
      exercises: [
        ex("hip-thrust", "Hip Thrust", 4, "8–10", "8", "100"),
        ex("bulgarian", "Bulgarian Split Squat", 3, "10–12 / side", "8"),
        ex("rdl", "Romanian Deadlift", 3, "10", "7–8"),
        ex("kickback", "Cable Kickback", 3, "12–15 / side", "8", "", "", "conditioning", 1),
        ex("abduction", "Cable Hip Abduction", 3, "15–20", "8", "", "", "conditioning", 1),
      ],
    },
    {
      id: "yard-upper",
      name: "Yard Upper Rig",
      day: "Thursday",
      duration: 50,
      focus: "Chest-press strength + supporting work",
      exercises: [
        ex("chest-press", "Chest Press", 5, "3–5", "7–9", "25", "", "strength", 2.5),
        ex("upper-support", "Class Supporting Movement", 3, "As programmed", "7–8", "", "", "manual", 0),
        ex("upper-conditioning", "Conditioning Block", 1, "As programmed", "7–9", "", "", "conditioning", 1),
      ],
    },
    {
      id: "turf",
      name: "Yard Turf",
      day: "Friday",
      duration: 50,
      focus: "Conditioning and athletic capacity",
      exercises: [
        ex("turf-main", "Turf Session", 1, "Complete class", "7–9", "", "", "conditioning", 0),
      ],
    },
    {
      id: "upper-abs",
      name: "Upper Sculpt + Weighted Abs",
      day: "Saturday",
      duration: 50,
      focus: "Back, shoulders and defined weighted core",
      exercises: [
        ex("lat-pulldown", "Lat Pulldown", 4, "8–10", "8"),
        ex("chest-row", "Chest-Supported Row", 3, "10–12", "8"),
        ex("single-row", "Single-Arm Cable Row", 3, "12 / side", "8"),
        ex("lateral", "Dumbbell Lateral Raise", 4, "12–15", "8", "", "", "conditioning", 1),
        ex("face-pull", "Face Pull", 3, "12–15", "8", "", "", "conditioning", 1),
        ex("reverse-pec", "Reverse Pec Deck", 3, "12–15", "8", "", "", "conditioning", 1),
        ex("leg-raise", "Hanging Leg Raise", 3, "8–12", "8", "", "", "bodyweight", 0),
        ex("cable-crunch", "Cable Crunch", 4, "10–15", "8"),
        ex("decline-situp", "Weighted Decline Sit-up", 3, "10–12", "8"),
        ex("pallof", "Pallof Press", 3, "12–15 / side", "7"),
        ex("dead-bug", "Dead Bug", 3, "10–15 / side", "7", "", "", "bodyweight", 0),
        ex("rkc-plank", "RKC Plank", 2, "20–30 sec", "8", "", "", "bodyweight", 0),
      ],
    },
  ],
};
