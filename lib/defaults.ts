import type { AppState } from "./types";

const ex = (
  id: string,
  name: string,
  targetSets: number,
  repRange: string,
  targetRpe: string,
  previousWeight = "",
  notes = ""
) => ({ id, name, targetSets, repRange, targetRpe, previousWeight, notes });

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
        ex("back-squat", "Back Squat", 5, "Build toward class prescription", "7–9", "60"),
        ex("lower-support", "Class Supporting Movement", 3, "As programmed", "7–8"),
        ex("lower-conditioning", "Conditioning Block", 1, "As programmed", "7–9"),
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
        ex("kickback", "Cable Kickback", 3, "15 / side", "8"),
        ex("abduction", "Cable Hip Abduction", 3, "15–20", "8"),
      ],
    },
    {
      id: "yard-upper",
      name: "Yard Upper Rig",
      day: "Thursday",
      duration: 50,
      focus: "Chest-press strength + supporting work",
      exercises: [
        ex("chest-press", "Chest Press", 5, "Build toward class prescription", "7–9", "25"),
        ex("upper-support", "Class Supporting Movement", 3, "As programmed", "7–8"),
        ex("upper-conditioning", "Conditioning Block", 1, "As programmed", "7–9"),
      ],
    },
    {
      id: "turf",
      name: "Yard Turf",
      day: "Friday",
      duration: 50,
      focus: "Conditioning and athletic capacity",
      exercises: [
        ex("turf-main", "Turf Session", 1, "Complete class", "7–9"),
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
        ex("lateral", "Dumbbell Lateral Raise", 4, "15", "8"),
        ex("face-pull", "Face Pull", 3, "15", "8"),
        ex("reverse-pec", "Reverse Pec Deck", 3, "15", "8"),
        ex("leg-raise", "Hanging Leg Raise", 3, "8–12", "8"),
        ex("cable-crunch", "Cable Crunch", 4, "10–15", "8"),
        ex("decline-situp", "Weighted Decline Sit-up", 3, "10–12", "8"),
        ex("pallof", "Pallof Press", 3, "12–15 / side", "7"),
        ex("dead-bug", "Dead Bug", 3, "10 / side", "7"),
        ex("rkc-plank", "RKC Plank", 2, "20–30 sec", "8"),
      ],
    },
  ],
};
