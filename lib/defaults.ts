import type { Workout } from "./types";

export const DEFAULT_WORKOUTS: Workout[] = [
  {
    id: "w1",
    day: "Monday",
    title: "Lower Body",
    duration: 55,
    exercises: [
      { id: "e1", name: "Romanian Deadlift", sets: 3, repMin: 8, repMax: 10, weight: 70, rpe: 8, notes: "Bar close to the legs. Controlled hinge." },
      { id: "e2", name: "Bulgarian Split Squat", sets: 3, repMin: 8, repMax: 10, weight: 18, rpe: 8, notes: "Stable foot position and controlled depth." },
      { id: "e3", name: "Hip Thrust", sets: 3, repMin: 10, repMax: 12, weight: 85, rpe: 8, notes: "Pause briefly at lockout." }
    ]
  },
  {
    id: "w2",
    day: "Tuesday",
    title: "Upper Body",
    duration: 50,
    exercises: [
      { id: "e4", name: "Bench Press", sets: 3, repMin: 8, repMax: 10, weight: 42.5, rpe: 8, notes: "Keep setup consistent." },
      { id: "e5", name: "Chest-Supported Row", sets: 3, repMin: 10, repMax: 12, weight: 28, rpe: 8, notes: "Lead with elbows." }
    ]
  },
  {
    id: "w3",
    day: "Thursday",
    title: "Lower Body Strength",
    duration: 60,
    exercises: [
      { id: "e6", name: "Back Squat", sets: 4, repMin: 5, repMax: 6, weight: 75, rpe: 8, notes: "Brace before every rep." },
      { id: "e7", name: "Leg Press", sets: 3, repMin: 8, repMax: 10, weight: 140, rpe: 8, notes: "Controlled depth." }
    ]
  }
];
