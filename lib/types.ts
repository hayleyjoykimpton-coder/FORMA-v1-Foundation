export type Season = "Foundation" | "Build" | "Peak" | "Align";

export type Exercise = {
  id: string;
  name: string;
  sets: number;
  repMin: number;
  repMax: number;
  weight: number;
  rpe: number;
  notes: string;
};

export type Workout = {
  id: string;
  day: string;
  title: string;
  duration: number;
  exercises: Exercise[];
};
