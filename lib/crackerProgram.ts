/**
 * Life & Soul Christmas Cracker — 6-week challenge programmes
 * sourced from DRAFT Beginner / Intermediate DOCX + Fitness Test PDF.
 */

import { defaultIncrement } from "./exercises";
import type { Exercise, Workout } from "./types";
import type { ExperienceLevel } from "./user";

export type CrackerLevel = "beginner" | "intermediate";

export type CrackerWeekNames = [string, string, string, string, string, string];

export type CrackerSlot = {
  /** Pattern label shown in notes */
  pattern: string;
  /** Sets × reps for weeks 1–3 */
  early: { sets: number; repMin: number; repMax: number };
  /** Sets × reps for weeks 4–6 */
  late: { sets: number; repMin: number; repMax: number };
  /** Exact exercise name for each week 1–6 (DRAFT source of truth) */
  names: CrackerWeekNames;
  /** Optional library id for the closest FORMA exercise (first name). */
  libraryId?: string;
  restSeconds?: number;
  note?: string;
};

export type CrackerWod = {
  format: string;
  work: string;
  intensity: string;
};

export type CrackerDay = {
  day: string;
  title: string;
  strength: CrackerSlot[];
  wods: [CrackerWod, CrackerWod, CrackerWod, CrackerWod, CrackerWod, CrackerWod];
};

const uid = () => Math.random().toString(36).slice(2, 10);

export function crackerLevelFromExperience(level: ExperienceLevel): CrackerLevel {
  return level === "beginner" ? "beginner" : "intermediate";
}

/** Beginner — 3×/week Lower · Upper · Full Body */
export const CRACKER_BEGINNER: CrackerDay[] = [
  {
    day: "Monday",
    title: "Lower Body",
    strength: [
      {
        pattern: "Squat",
        early: { sets: 3, repMin: 8, repMax: 10 },
        late: { sets: 3, repMin: 6, repMax: 8 },
        names: ["KB Goblet Squat", "Leg Press", "Smith Machine Squat", "Goblet Box/Bench Squat", "Leg Press", "Smith Machine Squat"],
        libraryId: "goblet_squat",
        restSeconds: 75,
      },
      {
        pattern: "Hinge",
        early: { sets: 3, repMin: 8, repMax: 10 },
        late: { sets: 3, repMin: 6, repMax: 8 },
        names: ["DB Deadlift", "Trap Bar Deadlift", "DB Romanian Deadlift", "DB Deadlift", "Trap Bar Deadlift", "DB Romanian Deadlift"],
        libraryId: "romanian_deadlift",
        restSeconds: 75,
      },
      {
        pattern: "Unilateral",
        early: { sets: 3, repMin: 8, repMax: 10 },
        late: { sets: 3, repMin: 10, repMax: 12 },
        names: ["DB/BW Walking Lunge", "DB/BW Box Step Ups", "Bulgarian Split Squat", "DB/BW Walking Lunge", "DB/BW Box Step Ups", "Bulgarian Split Squat"],
        libraryId: "bulgarian_split_squat",
        note: "Reps per leg",
        restSeconds: 60,
      },
      {
        pattern: "Hams / Glutes / Calves",
        early: { sets: 3, repMin: 10, repMax: 12 },
        late: { sets: 3, repMin: 12, repMax: 15 },
        names: ["DB Glute Bridge", "Lying Leg Curl", "Standing Calf Raise", "DB Glute Bridge", "Lying Leg Curl", "Standing Calf Raise"],
        libraryId: "leg_curl",
        restSeconds: 60,
      },
      {
        pattern: "Quads",
        early: { sets: 3, repMin: 12, repMax: 15 },
        late: { sets: 3, repMin: 10, repMax: 12 },
        names: ["Leg Extension", "Leg Extension", "Leg Extension", "Heavy Leg Extension", "Leg Extension", "Leg Extension"],
        restSeconds: 45,
      },
      {
        pattern: "Core",
        early: { sets: 2, repMin: 10, repMax: 10 },
        late: { sets: 2, repMin: 15, repMax: 15 },
        names: ["Plated Russian Twist", "Plated Toe Touchers", "Plated Russian Twist", "Plated Toe Touchers", "Plated Russian Twist", "Plated Toe Touchers"],
        libraryId: "russian_twist",
        note: "Reps each side where noted",
        restSeconds: 45,
      },
    ],
    wods: [
      {
        format: "15 min AMRAP",
        work: "10 Cal Row, 10 DB Deadlifts, 10 Step Ups, 10 Ab Mat Crunches",
        intensity: "Light DB, 7/10. Learn movements, smooth pacing.",
      },
      {
        format: "EMOM 12 min (4 rounds × 3)",
        work: "Min 1: 12 Cal Ski · Min 2: 12 Goblet Squats · Min 3: 10 Walking Lunges (5/leg)",
        intensity: "Light load. New format, more reps per minute.",
      },
      {
        format: "For Time: 21-15-9",
        work: "DB Deadlifts, Box Jumps + 200m Row after each round",
        intensity: "Heavier DB. Descending ladder, race the clock.",
      },
      {
        format: "Death By Step-Ups",
        work: "Min 1: 2 · Min 2: 4 · Min 3: 6 … +2 every min until you can’t finish",
        intensity: "Bodyweight. Score = last minute completed.",
      },
      {
        format: "Tabata 8× (20s/10s)",
        work: "Rotate: Goblet Squats, Walking Lunges, Cal Row, Mountain Climbers",
        intensity: "Max effort each 20s. Shortest, most intense session.",
      },
      {
        format: "15 min AMRAP (repeat Wk1)",
        work: "10 Cal Row, 10 DB Deadlifts, 10 Step Ups, 10 Ab Mat Crunches",
        intensity: "Same as Week 1 — compare total rounds.",
      },
    ],
  },
  {
    day: "Wednesday",
    title: "Upper Body",
    strength: [
      {
        pattern: "Horizontal Push",
        early: { sets: 3, repMin: 8, repMax: 10 },
        late: { sets: 3, repMin: 6, repMax: 8 },
        names: ["Machine Chest Press", "DB Bench Press", "Incline DB Bench Press", "Machine Chest Press", "DB Bench Press", "Incline DB Bench Press"],
        libraryId: "bench_press",
        restSeconds: 75,
      },
      {
        pattern: "Vertical Pull",
        early: { sets: 3, repMin: 8, repMax: 10 },
        late: { sets: 3, repMin: 6, repMax: 8 },
        names: ["Wide Grip Lat Pulldown", "Machine Assisted Pull Up", "Neutral Grip Pulldown", "Wide Grip Lat Pulldown", "Machine Assisted Pull Up", "Neutral Grip Pulldown"],
        libraryId: "lat_pulldown",
        restSeconds: 75,
      },
      {
        pattern: "Horizontal Pull",
        early: { sets: 3, repMin: 8, repMax: 10 },
        late: { sets: 3, repMin: 6, repMax: 8 },
        names: ["Seated Cable Narrow Row", "Single Arm DB Row", "Machine Row", "Seated Cable Narrow Row", "Single Arm DB Row", "Machine Row"],
        libraryId: "seated_row",
        note: "Single-arm rows: reps per side",
        restSeconds: 60,
      },
      {
        pattern: "Vertical Push",
        early: { sets: 3, repMin: 10, repMax: 12 },
        late: { sets: 3, repMin: 8, repMax: 10 },
        names: ["Machine Shoulder Press", "BB Overhead Press", "DB Shoulder Press", "Machine Shoulder Press", "BB Overhead Press", "DB Shoulder Press"],
        libraryId: "shoulder_press",
        restSeconds: 60,
      },
      {
        pattern: "Biceps",
        early: { sets: 2, repMin: 10, repMax: 12 },
        late: { sets: 2, repMin: 12, repMax: 15 },
        names: ["DB Curl", "DB Hammer Curl", "Cable Rope Bicep Curl", "DB Curl", "DB Hammer Curl", "Cable Rope Bicep Curl"],
        libraryId: "bicep_curl",
        restSeconds: 45,
      },
      {
        pattern: "Triceps",
        early: { sets: 2, repMin: 10, repMax: 12 },
        late: { sets: 2, repMin: 12, repMax: 15 },
        names: ["Cable Bar Pushdown", "Overhead DB Tricep Extension", "Cable Rope Pushdown", "Cable Bar Pushdown", "Overhead DB Tricep Extension", "Cable Rope Pushdown"],
        restSeconds: 45,
      },
      {
        pattern: "Core",
        early: { sets: 2, repMin: 10, repMax: 12 },
        late: { sets: 2, repMin: 12, repMax: 15 },
        names: ["Plank (30s hold × 2)", "Weighted Sit Up", "Plank", "Plank (30s hold × 2)", "Weighted Sit Up", "Plank"],
        note: "Week 4–6 plank: 60s holds",
        restSeconds: 45,
      },
    ],
    wods: [
      {
        format: "1 set every 5 min × 5",
        work: "8 Cal Ski, 10 DB Push Press, 8 Burpees, 10 Box Jumps",
        intensity: "Light-moderate DB. Record time each set; rest the remainder.",
      },
      {
        format: "4 Rounds For Time",
        work: "12 Push-Ups, 15 Cal Ski, 9 Burpees",
        intensity: "Bodyweight chipper — more total reps than Wk1.",
      },
      {
        format: "EMOM 15 min (5 rounds × 3)",
        work: "Min 1: 10 DB Push Press · Min 2: 12 Box Jumps · Min 3: Rest",
        intensity: "Heavier push press. New EMOM format.",
      },
      {
        format: "Ascending Ladder 1→8",
        work: "DB Push Press + Burpees — add 1 rep of each per round, for time",
        intensity: "Same load as Wk3. Built-in volume.",
      },
      {
        format: "Tabata 8× (20s/10s)",
        work: "Rotate: Cal Ski, Burpees",
        intensity: "Max effort. Shortest, hardest upper session.",
      },
      {
        format: "1 set every 5 min × 5 (repeat Wk1)",
        work: "8 Cal Ski, 10 DB Push Press, 8 Burpees, 10 Box Jumps",
        intensity: "Same as Week 1 — compare set times.",
      },
    ],
  },
  {
    day: "Friday",
    title: "Full Body",
    strength: [
      {
        pattern: "Hinge",
        early: { sets: 3, repMin: 8, repMax: 10 },
        late: { sets: 3, repMin: 6, repMax: 8 },
        names: ["KB Swing", "Single Leg RDL", "Trap Bar Deadlift", "KB Swing", "Single Leg RDL", "Trap Bar Deadlift"],
        libraryId: "romanian_deadlift",
        restSeconds: 75,
      },
      {
        pattern: "Push",
        early: { sets: 3, repMin: 8, repMax: 10 },
        late: { sets: 3, repMin: 6, repMax: 8 },
        names: ["Push Up", "Smith Machine Incline Press", "DB Bench Press", "Push Up", "Smith Machine Incline Press", "DB Bench Press"],
        libraryId: "bench_press",
        restSeconds: 60,
      },
      {
        pattern: "Pull",
        early: { sets: 3, repMin: 8, repMax: 10 },
        late: { sets: 3, repMin: 6, repMax: 8 },
        names: ["Chest Supported Row", "Single Arm Cable Row", "Cable Row Wide Grip", "Chest Supported Row", "Single Arm Cable Row", "Cable Row Wide Grip"],
        libraryId: "chest_supported_row",
        note: "Single-arm: reps per side",
        restSeconds: 60,
      },
      {
        pattern: "Squat",
        early: { sets: 3, repMin: 8, repMax: 10 },
        late: { sets: 3, repMin: 6, repMax: 8 },
        names: ["Heel Elevated Goblet Squat", "DB Box Squat", "Leg Press", "Heel Elevated Goblet Squat", "DB Box Squat", "Leg Press"],
        libraryId: "goblet_squat",
        restSeconds: 75,
      },
      {
        pattern: "Shoulders",
        early: { sets: 2, repMin: 10, repMax: 12 },
        late: { sets: 2, repMin: 12, repMax: 15 },
        names: ["DB Lateral Raise", "Rear Delt Fly Machine", "DB Arnold Press", "DB Lateral Raise", "Rear Delt Fly Machine", "DB Arnold Press"],
        libraryId: "lateral_raise",
        restSeconds: 45,
      },
      {
        pattern: "Core",
        early: { sets: 2, repMin: 10, repMax: 12 },
        late: { sets: 2, repMin: 12, repMax: 15 },
        names: ["Weighted Sit Up", "Hanging Knee Raise", "Weighted Sit Up", "Hanging Knee Raise", "Weighted Sit Up", "Hanging Knee Raise"],
        libraryId: "hanging_knee_raise",
        restSeconds: 45,
      },
    ],
    wods: [
      {
        format: "16 min EMOM (4 rounds)",
        work: "Min 1: 10 Cal Row · Min 2: 10 KB Deadlifts · Min 3: 10 Wall Balls · Min 4: Rest",
        intensity: "Light KB/wall ball. Finish each minute with time to spare. No wall ball → Single DB Thruster.",
      },
      {
        format: "3 Rounds For Time",
        work: "15 Wall Balls, 12 KB Deadlifts, 200m Row",
        intensity: "Same load. Chipper format.",
      },
      {
        format: "For Time: 21-15-9",
        work: "KB Deadlifts, Wall Balls + Cal Row (scale with reps)",
        intensity: "Heavier KB/wall ball. Race the clock.",
      },
      {
        format: "20 min AMRAP",
        work: "10 Cal Row, 10 KB Deadlifts, 10 Wall Balls, 10 Burpees",
        intensity: "Same load as Wk3 + extra movement.",
      },
      {
        format: "Death By KB Deadlifts",
        work: "Min 1: 2 · Min 2: 4 · Min 3: 6 … +2 every min until failure",
        intensity: "Heavier KB. Score = last minute finished.",
      },
      {
        format: "16 min EMOM (repeat Wk1)",
        work: "Min 1: 10 Cal Row · Min 2: 10 KB Deadlifts · Min 3: 10 Wall Balls · Min 4: Rest",
        intensity: "Same as Week 1 — compare time-to-spare.",
      },
    ],
  },
];

/** Intermediate — barbell mains + supersets */
export const CRACKER_INTERMEDIATE: CrackerDay[] = [
  {
    day: "Monday",
    title: "Lower Body",
    strength: [
      {
        pattern: "Squat",
        early: { sets: 4, repMin: 6, repMax: 8 },
        late: { sets: 4, repMin: 4, repMax: 6 },
        names: ["BB Back Squat", "BB Front Squat", "Paused Back Squat 1:2:1", "BB Back Squat", "BB Front Squat", "Paused Back Squat 1:2:1"],
        libraryId: "squat",
        restSeconds: 120,
      },
      {
        pattern: "Hinge",
        early: { sets: 4, repMin: 6, repMax: 8 },
        late: { sets: 4, repMin: 4, repMax: 6 },
        names: ["BB Deadlift", "Trap Bar Deadlift", "BB Romanian Deadlift", "BB Deadlift", "Trap Bar Deadlift", "BB Romanian Deadlift"],
        libraryId: "romanian_deadlift",
        restSeconds: 120,
      },
      {
        pattern: "Hip Thrust",
        early: { sets: 3, repMin: 8, repMax: 10 },
        late: { sets: 3, repMin: 6, repMax: 8 },
        names: ["BB Hip Thrust", "Single-Leg Hip Thrust (DB)", "Single-Leg Hip Thrust (BB)", "BB Hip Thrust", "Single-Leg Hip Thrust (DB)", "Single-Leg Hip Thrust (BB)"],
        libraryId: "hip_thrust",
        restSeconds: 90,
      },
      {
        pattern: "Unilateral (SS w/ Leg Curl)",
        early: { sets: 3, repMin: 8, repMax: 10 },
        late: { sets: 3, repMin: 10, repMax: 12 },
        names: ["Single DB Bulgarian Split Squat", "DB Walking Lunge", "Cable Step Up", "Single DB Bulgarian Split Squat", "DB Walking Lunge", "Cable Step Up"],
        libraryId: "bulgarian_split_squat",
        note: "Superset with leg curl — no rest between D1/D2; 60–75s between rounds. Reps per leg.",
        restSeconds: 70,
      },
      {
        pattern: "Leg Curl (SS w/ Unilateral)",
        early: { sets: 3, repMin: 10, repMax: 12 },
        late: { sets: 3, repMin: 12, repMax: 15 },
        names: ["Lying Leg Curl", "Leg Extension", "Seated Leg Curl", "Lying Leg Curl", "Leg Extension", "Seated Leg Curl"],
        libraryId: "leg_curl",
        note: "Superset partner for unilateral",
        restSeconds: 45,
      },
      {
        pattern: "Calves",
        early: { sets: 3, repMin: 12, repMax: 15 },
        late: { sets: 4, repMin: 15, repMax: 20 },
        names: ["Standing Calf Raise", "Assisted Nordic Curl", "Smith Machine Calf Raise", "Standing Calf Raise", "Assisted Nordic Curl", "Smith Machine Calf Raise"],
        restSeconds: 45,
      },
      {
        pattern: "Core",
        early: { sets: 3, repMin: 12, repMax: 12 },
        late: { sets: 3, repMin: 15, repMax: 15 },
        names: ["Weighted Russian Twist", "Cable Crunch", "Weighted Russian Twist", "Weighted Russian Twist", "Cable Crunch", "Weighted Russian Twist"],
        libraryId: "cable_crunch",
        restSeconds: 45,
      },
    ],
    wods: [
      {
        format: "15 min AMRAP",
        work: "8 Barbell Deadlifts (65% 1RM), 10 Box Jumps, 12 Cal Row",
        intensity: "Moderate-heavy. Learn pacing under fatigue.",
      },
      {
        format: "EMOM 16 min (4 rounds × 4)",
        work: "Min 1: 10 Front Squats · Min 2: 12 Cal Ski · Min 3: 8 Heavy KB Swings · Min 4: Rest",
        intensity: "Heavier than Wk1.",
      },
      {
        format: "For Time: 21-15-9",
        work: "Barbell Deadlifts (heavy), Burpee Box Jump Overs + 200m Row after each round",
        intensity: "Heaviest barbell yet. Race the clock.",
      },
      {
        format: "Death By Front Squats",
        work: "Min 1: 3 · Min 2: 5 · Min 3: 7 … +2 every min until failure",
        intensity: "Barbell front squat. Score = last minute completed.",
      },
      {
        format: "Tabata 8× (20s/10s)",
        work: "Rotate: Empty Bar Back Squats, Broad Jumps, Cal Row, Burpees",
        intensity: "Max effort. Shortest, most intense lower session.",
      },
      {
        format: "15 min AMRAP (repeat Wk1)",
        work: "8 Barbell Deadlifts (65% 1RM), 10 Box Jumps, 12 Cal Row",
        intensity: "Same as Week 1 — compare rounds.",
      },
    ],
  },
  {
    day: "Wednesday",
    title: "Upper Body",
    strength: [
      {
        pattern: "Horizontal Push",
        early: { sets: 4, repMin: 6, repMax: 8 },
        late: { sets: 4, repMin: 4, repMax: 6 },
        names: ["Barbell Bench Press", "Incline DB Press", "Smith Machine Incline Bench", "Barbell Bench Press", "Incline DB Press", "Smith Machine Incline Bench"],
        libraryId: "bench_press",
        restSeconds: 120,
      },
      {
        pattern: "Vertical Pull",
        early: { sets: 4, repMin: 6, repMax: 8 },
        late: { sets: 4, repMin: 4, repMax: 6 },
        names: ["Lat Pulldown Wide Grip", "Pull-Up (assisted/BW)", "Chin-Up (assisted/BW)", "Lat Pulldown Wide Grip", "Pull-Up (assisted/BW)", "Chin-Up (assisted/BW)"],
        libraryId: "lat_pulldown",
        restSeconds: 90,
      },
      {
        pattern: "Horizontal Pull (SS w/ Biceps)",
        early: { sets: 3, repMin: 8, repMax: 10 },
        late: { sets: 3, repMin: 10, repMax: 12 },
        names: ["Pendlay Row", "Chest-Supported DB Row", "Machine Row (single-arm)", "Pendlay Row", "Chest-Supported DB Row", "Machine Row (single-arm)"],
        libraryId: "seated_row",
        note: "Superset with biceps",
        restSeconds: 70,
      },
      {
        pattern: "Biceps (SS w/ Row)",
        early: { sets: 3, repMin: 10, repMax: 12 },
        late: { sets: 3, repMin: 12, repMax: 15 },
        names: ["DB Bicep Curl", "Incline DB Curl", "Cable Bar Curl", "DB Bicep Curl", "Incline DB Curl", "Cable Bar Curl"],
        libraryId: "bicep_curl",
        restSeconds: 45,
      },
      {
        pattern: "Vertical Push",
        early: { sets: 4, repMin: 6, repMax: 8 },
        late: { sets: 4, repMin: 4, repMax: 6 },
        names: ["Barbell Overhead Strict Press", "BB Push Press", "Seated DB Shoulder Press", "Barbell Overhead Strict Press", "BB Push Press", "Seated DB Shoulder Press"],
        libraryId: "shoulder_press",
        restSeconds: 90,
      },
      {
        pattern: "Triceps",
        early: { sets: 3, repMin: 10, repMax: 12 },
        late: { sets: 3, repMin: 12, repMax: 15 },
        names: ["Close-Grip DB Bench Press", "Skull Crusher", "Overhead Cable Rope Extension", "Close-Grip DB Bench Press", "Skull Crusher", "Overhead Cable Rope Extension"],
        restSeconds: 45,
      },
      {
        pattern: "Core",
        early: { sets: 3, repMin: 12, repMax: 12 },
        late: { sets: 3, repMin: 15, repMax: 15 },
        names: ["Weighted Plank", "Ab Wheel Rollout", "Weighted Plank", "Weighted Plank", "Ab Wheel Rollout", "Weighted Plank"],
        restSeconds: 45,
      },
    ],
    wods: [
      {
        format: "1 set every 5 min × 5",
        work: "6 Barbell Push Press, 8 Strict Pull-Ups, 10 Box Jumps (band OK)",
        intensity: "Moderate barbell. Record set times.",
      },
      {
        format: "4 Rounds For Time",
        work: "10 Barbell Push Press, 12 Pull-Ups, 15 Cal Ski",
        intensity: "Same load as Wk1. Chipper.",
      },
      {
        format: "EMOM 15 min (5 rounds × 3)",
        work: "Min 1: 6 Push Press (heavier) · Min 2: 8 Chest-to-Bar Pull-Ups · Min 3: Rest",
        intensity: "Heavier push press.",
      },
      {
        format: "Ascending Ladder 1→8",
        work: "Barbell Push Press + Burpee + Pull-Ups (band OK) — +1 each round, for time",
        intensity: "Same load as Wk3.",
      },
      {
        format: "Tabata 8× (20s/10s)",
        work: "Rotate: Push Press, Burpees",
        intensity: "Max effort. Shortest, hardest upper session.",
      },
      {
        format: "1 set every 5 min × 5 (repeat Wk1)",
        work: "6 Barbell Push Press, 8 Strict Pull-Ups, 10 Box Jumps",
        intensity: "Same as Week 1 — compare set times.",
      },
    ],
  },
  {
    day: "Friday",
    title: "Full Body",
    strength: [
      {
        pattern: "Hinge",
        early: { sets: 4, repMin: 6, repMax: 8 },
        late: { sets: 4, repMin: 4, repMax: 6 },
        names: ["B Stance RDL (DB)", "KB Swing (heavy)", "BB Sumo Deadlift", "B Stance RDL (DB)", "KB Swing (heavy)", "BB Sumo Deadlift"],
        libraryId: "romanian_deadlift",
        restSeconds: 90,
      },
      {
        pattern: "Squat",
        early: { sets: 4, repMin: 6, repMax: 8 },
        late: { sets: 4, repMin: 4, repMax: 6 },
        names: ["Heel-Elevated Goblet Squat", "Leg Press High and Wide", "Single DB Bulgarian Split Squat", "Heel-Elevated Goblet Squat", "Leg Press High and Wide", "Single DB Bulgarian Split Squat"],
        libraryId: "bulgarian_split_squat",
        restSeconds: 90,
      },
      {
        pattern: "Push",
        early: { sets: 4, repMin: 6, repMax: 8 },
        late: { sets: 4, repMin: 4, repMax: 6 },
        names: ["Incline DB Press", "Tricep Dips BW/Machine", "DB Bench Press", "Incline DB Press", "Tricep Dips BW/Machine", "DB Bench Press"],
        libraryId: "bench_press",
        restSeconds: 75,
      },
      {
        pattern: "Pull",
        early: { sets: 4, repMin: 6, repMax: 8 },
        late: { sets: 4, repMin: 4, repMax: 6 },
        names: ["Single-Arm DB Row", "Machine Row (heavy)", "BB Pendlay Row", "Single-Arm DB Row", "Machine Row (heavy)", "BB Pendlay Row"],
        libraryId: "seated_row",
        restSeconds: 75,
      },
      {
        pattern: "Hip Thrust / Glute",
        early: { sets: 3, repMin: 8, repMax: 10 },
        late: { sets: 3, repMin: 6, repMax: 8 },
        names: ["DB Front Foot Elevated Split Squat", "BB Hip Thrust", "Cable Kickback", "DB Front Foot Elevated Split Squat", "BB Hip Thrust", "Cable Kickback"],
        libraryId: "hip_thrust",
        restSeconds: 60,
      },
      {
        pattern: "Shoulders (SS w/ Core)",
        early: { sets: 3, repMin: 10, repMax: 12 },
        late: { sets: 3, repMin: 12, repMax: 15 },
        names: ["DB Seated Lateral Raise", "Cable Lateral Raise", "Cable Face Pull", "DB Seated Lateral Raise", "Cable Lateral Raise", "Cable Face Pull"],
        libraryId: "lateral_raise",
        note: "Superset with core",
        restSeconds: 70,
      },
      {
        pattern: "Core (SS w/ Shoulders)",
        early: { sets: 3, repMin: 12, repMax: 12 },
        late: { sets: 3, repMin: 15, repMax: 15 },
        names: ["Ab Wheel Rollout", "Hanging Knee Raise", "Weighted Russian Twist", "Ab Wheel Rollout", "Hanging Knee Raise", "Weighted Russian Twist"],
        libraryId: "hanging_knee_raise",
        restSeconds: 45,
      },
    ],
    wods: [
      {
        format: "16 min EMOM (4 rounds)",
        work: "Min 1: 8 Heavy KB Deadlifts · Min 2: 10 Wall Balls · Min 3: 10 Cal Row · Min 4: Rest",
        intensity: "Heavy KB/wall ball. No wall ball → Single DB Thruster.",
      },
      {
        format: "3 Rounds For Time",
        work: "15 Wall Balls, 12 Heavy KB Deadlifts, 200m Row",
        intensity: "Chipper — more volume than Wk1.",
      },
      {
        format: "For Time: 21-15-9",
        work: "Heavy KB Deadlifts, Wall Balls + Cal Row",
        intensity: "Heavier implements. Race the clock.",
      },
      {
        format: "20 min AMRAP",
        work: "10 Cal Row, 10 Heavy KB Deadlifts, 10 Wall Balls, 10 Burpee Box Jump-Overs",
        intensity: "Same load as Wk3 + extra movement.",
      },
      {
        format: "Death By Heavy KB Deadlifts",
        work: "Min 1: 3 · Min 2: 5 · Min 3: 7 … +2 every min until failure",
        intensity: "Heaviest KB. Score = last minute finished.",
      },
      {
        format: "16 min EMOM (repeat Wk1)",
        work: "Min 1: 8 Heavy KB Deadlifts · Min 2: 10 Wall Balls · Min 3: 10 Cal Row · Min 4: Rest",
        intensity: "Same as Week 1 — compare time-to-spare.",
      },
    ],
  },
];

export const CRACKER_FITNESS_TEST = {
  title: "2026 Christmas Cracker Fitness Test",
  duration: "20–30 min",
  when: "Start of Week 1 and end of Week 6",
  warmUp: "3–5 minutes, coach-led",
  stations: [
    {
      id: "deadlift",
      name: "BB Deadlift or Dual KB Suitcase Deadlift",
      score: "Max quality reps (full lockout, controlled descent)",
      loadGuide: "BB 30/40/50 kg · KB 8/12/16 kg by experience",
    },
    {
      id: "ski500",
      name: "500m Ski / Row",
      score: "Time to complete distance",
      loadGuide: "Push hard — same erg Week 1 and Week 6",
    },
    {
      id: "pushups",
      name: "Push-Ups",
      score: "Max quality reps (chest to floor, lockout, no hip sag)",
      loadGuide: "Bodyweight",
    },
    {
      id: "situps",
      name: "Ab Mat Sit-Up",
      score: "Max reps in 60 seconds",
      loadGuide: "Bodyweight",
    },
    {
      id: "confidence",
      name: "Confidence Rating",
      score: "1–10 how confident you feel in the gym",
      loadGuide: "",
    },
  ],
  finisher: {
    name: "For Time Benchmark",
    work: "250m Ski/Row · 15 BB Thrusters · 20 Walking Lunges · 10 Burpees · 250m Ski/Row",
    loadGuide: "Thrusters 15/20/30 kg by experience — same ergs Week 1 and Week 6",
    score: "Total time",
  },
} as const;

export type CrackerFitnessScores = {
  deadliftReps?: number;
  ski500Seconds?: number;
  pushups?: number;
  situps60?: number;
  confidence?: number;
  finisherSeconds?: number;
  loadNote?: string;
  loggedAt?: string;
};

export type CrackerFitnessState = {
  week1?: CrackerFitnessScores;
  week6?: CrackerFitnessScores;
};

const FITNESS_KEY = "forma-cracker-fitness-v1";

export function loadCrackerFitness(): CrackerFitnessState {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(FITNESS_KEY);
    return raw ? (JSON.parse(raw) as CrackerFitnessState) : {};
  } catch {
    return {};
  }
}

export function saveCrackerFitness(state: CrackerFitnessState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(FITNESS_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function makeExercise(
  name: string,
  sets: number,
  repMin: number,
  repMax: number,
  opts?: { libraryId?: string; notes?: string; restSeconds?: number; rpe?: number },
): Exercise {
  return {
    id: uid(),
    exerciseId: opts?.libraryId,
    name,
    sets,
    repMin,
    repMax,
    weight: 0,
    rpe: opts?.rpe ?? 7,
    notes: opts?.notes ?? "",
    increment: defaultIncrement("dumbbell"),
    restSeconds: opts?.restSeconds ?? 75,
  };
}

/**
 * Build the three Cracker sessions for a given week (1–6).
 * Exercise names and WODs come from the DRAFT Beginner / Intermediate tables.
 */
export function buildCrackerWorkouts(level: CrackerLevel, week: number): Workout[] {
  const plan = level === "beginner" ? CRACKER_BEGINNER : CRACKER_INTERMEDIATE;
  const w = Math.min(6, Math.max(1, week));
  const late = w >= 4;
  const theme = CRACKER_WEEK_THEMES[w - 1];

  return plan.map((day) => {
    const strength = day.strength.map((slot) => {
      const rx = late ? slot.late : slot.early;
      const name = slot.names[w - 1];
      const notes = [slot.pattern, slot.note, `Wk${w} · ${theme}`].filter(Boolean).join(" · ");
      return makeExercise(name, rx.sets, rx.repMin, rx.repMax, {
        libraryId: slot.libraryId,
        notes,
        restSeconds: slot.restSeconds,
        rpe: late ? 8 : 7,
      });
    });

    const wod = day.wods[w - 1];
    const wallBallNote =
      /wall ball/i.test(wod.work) || /wall ball/i.test(wod.intensity)
        ? "\nIf no wall ball is available, substitute Single DB Thruster."
        : "";
    const deathByNote = /death by/i.test(wod.format)
      ? "\nDeath By score = last minute completed."
      : "";
    const wodExercise = makeExercise(`WOD · ${wod.format}`, 1, 1, 1, {
      notes: `${wod.work}\n${wod.intensity}${wallBallNote}${deathByNote}`,
      restSeconds: 0,
      rpe: 8,
    });

    const exercises = [...strength, wodExercise];
    const duration = Math.max(45, strength.length * 8 + 15);
    const slug = day.title.toLowerCase().replace(/\s+/g, "-");

    return {
      id: `cracker-${level}-w${w}-${slug}`,
      day: day.day,
      title: day.title,
      duration,
      exercises,
      // session ordinal for UI (1–3)
      // kept in notes via theme; CrackerMove maps by title
    };
  });
}

export const CRACKER_WEEK_THEMES = [
  "LEARN",
  "ADD REPS",
  "ADD LOAD",
  "ADD VOLUME",
  "INTENSITY",
  "DEMONSTRATE",
] as const;

/** Shared Jess McKee weekly training education (Beginner + Intermediate). */
export const CRACKER_TRAINING_EDUCATION = [
  {
    week: 1,
    title: "Gym Confidence",
    summary: "Build confidence using equipment and training independently.",
  },
  {
    week: 2,
    title: "Training Intensity & Progressive Overload",
    summary: "Learn how hard to train and how to progress your workouts safely.",
  },
  {
    week: 3,
    title: "Recovery",
    summary: "Understand sleep, recovery, soreness and managing your training load.",
  },
  {
    week: 4,
    title: "Mindset & Habit Building",
    summary: "Build systems and habits that make consistency easier.",
  },
  {
    week: 5,
    title: "Strength Training & Why It Matters",
    summary: "Understand why strength training supports long-term health and performance.",
  },
  {
    week: 6,
    title: "What Happens After CRACKER?",
    summary: "Set your next goals and plan how to continue beyond the six weeks.",
  },
] as const;

export function crackerEducationForWeek(week: number) {
  const w = Math.min(6, Math.max(1, week));
  return CRACKER_TRAINING_EDUCATION[w - 1];
}

export function crackerSessionIndex(title: string): number {
  const t = title.toLowerCase();
  if (t.includes("lower")) return 1;
  if (t.includes("upper")) return 2;
  if (t.includes("full")) return 3;
  return 0;
}
