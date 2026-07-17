/**
 * FORMA scientific exercise database.
 *
 * Every exercise is addressed by a STABLE id (never by display name).
 * The physique goal FORMA coaches toward is a lean, sculpted, athletic
 * feminine shape: glute hypertrophy, strong core, upper-body posture — so
 * the library is weighted toward glute/hamstring and posture work, with
 * quads present but not over-emphasised.
 */

export type MovementPattern =
  | "hinge"
  | "squat"
  | "lunge"
  | "push"
  | "pull"
  | "isolation"
  | "core"
  | "mobility";

export type MuscleGroup =
  | "glutes"
  | "hamstrings"
  | "quads"
  | "back"
  | "shoulders"
  | "chest"
  | "core"
  | "arms"
  | "mobility"
  | "fullbody";

export type Equipment =
  | "barbell"
  | "dumbbell"
  | "machine"
  | "cable"
  | "bodyweight"
  | "band"
  | "none";

export type Difficulty = "beginner" | "intermediate" | "advanced";

export type ExerciseDefinition = {
  id: string;
  name: string;
  movementPattern: MovementPattern;
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
  equipment: Equipment;
  difficulty: Difficulty;
  repRange: { min: number; max: number };
  restSeconds: number;
  coachingCues: string[];
  commonMistakes: string[];
  substitutions: string[];
};

/** Sensible load increment (kg) by equipment type. */
export function defaultIncrement(equipment: Equipment): number {
  switch (equipment) {
    case "barbell":
      return 2.5;
    case "machine":
      return 5;
    case "cable":
      return 2.5;
    case "dumbbell":
      return 2;
    default:
      return 1;
  }
}

const DEFINITIONS: ExerciseDefinition[] = [
  // ---------- GLUTES ----------
  {
    id: "hip_thrust",
    name: "Hip Thrust",
    movementPattern: "hinge",
    primaryMuscles: ["glutes"],
    secondaryMuscles: ["hamstrings"],
    equipment: "barbell",
    difficulty: "intermediate",
    repRange: { min: 8, max: 12 },
    restSeconds: 90,
    coachingCues: ["Drive through the heels", "Ribs down, posterior pelvic tilt at the top", "Pause and squeeze at lockout"],
    commonMistakes: ["Overarching the lower back", "Pushing through the toes"],
    substitutions: ["glute_bridge", "cable_kickback"],
  },
  {
    id: "romanian_deadlift",
    name: "Romanian Deadlift",
    movementPattern: "hinge",
    primaryMuscles: ["hamstrings", "glutes"],
    secondaryMuscles: ["back"],
    equipment: "barbell",
    difficulty: "intermediate",
    repRange: { min: 8, max: 12 },
    restSeconds: 90,
    coachingCues: ["Hinge from the hips", "Keep the bar close to the legs", "Soft knees, long spine"],
    commonMistakes: ["Rounding the back", "Turning it into a squat"],
    substitutions: ["45_degree_back_extension", "leg_curl"],
  },
  {
    id: "bulgarian_split_squat",
    name: "Bulgarian Split Squat",
    movementPattern: "lunge",
    primaryMuscles: ["glutes", "quads"],
    secondaryMuscles: ["hamstrings"],
    equipment: "dumbbell",
    difficulty: "intermediate",
    repRange: { min: 8, max: 12 },
    restSeconds: 90,
    coachingCues: ["Front foot far enough forward to load the glute", "Torso slightly forward", "Control the descent"],
    commonMistakes: ["Stance too short (quad-dominant)", "Knee caving in"],
    substitutions: ["walking_lunge", "step_up"],
  },
  {
    id: "walking_lunge",
    name: "Walking Lunge",
    movementPattern: "lunge",
    primaryMuscles: ["glutes", "quads"],
    secondaryMuscles: ["hamstrings", "core"],
    equipment: "dumbbell",
    difficulty: "beginner",
    repRange: { min: 10, max: 14 },
    restSeconds: 75,
    coachingCues: ["Long stride to bias the glutes", "Tall chest", "Push through the front heel"],
    commonMistakes: ["Short choppy steps", "Leaning back"],
    substitutions: ["bulgarian_split_squat", "step_up"],
  },
  {
    id: "step_up",
    name: "Step Up",
    movementPattern: "lunge",
    primaryMuscles: ["glutes", "quads"],
    secondaryMuscles: ["hamstrings"],
    equipment: "dumbbell",
    difficulty: "beginner",
    repRange: { min: 10, max: 12 },
    restSeconds: 75,
    coachingCues: ["Box at roughly knee height", "Drive through the top foot", "Minimise push-off from the bottom leg"],
    commonMistakes: ["Bouncing off the back foot", "Box too low"],
    substitutions: ["walking_lunge", "bulgarian_split_squat"],
  },
  {
    id: "cable_kickback",
    name: "Cable Kickback",
    movementPattern: "isolation",
    primaryMuscles: ["glutes"],
    secondaryMuscles: ["hamstrings"],
    equipment: "cable",
    difficulty: "beginner",
    repRange: { min: 12, max: 15 },
    restSeconds: 45,
    coachingCues: ["Hinge slightly and kick from the hip", "Squeeze at end range", "Slow eccentric"],
    commonMistakes: ["Arching the back to gain range", "Using momentum"],
    substitutions: ["glute_bridge", "hip_abduction"],
  },
  {
    id: "hip_abduction",
    name: "Hip Abduction",
    movementPattern: "isolation",
    primaryMuscles: ["glutes"],
    secondaryMuscles: [],
    equipment: "machine",
    difficulty: "beginner",
    repRange: { min: 12, max: 20 },
    restSeconds: 45,
    coachingCues: ["Slight forward lean targets glute medius", "Control the return", "Pause at the top"],
    commonMistakes: ["Rushing the reps", "Using bodyweight momentum"],
    substitutions: ["cable_kickback", "glute_bridge"],
  },
  {
    id: "glute_bridge",
    name: "Glute Bridge",
    movementPattern: "hinge",
    primaryMuscles: ["glutes"],
    secondaryMuscles: ["hamstrings"],
    equipment: "bodyweight",
    difficulty: "beginner",
    repRange: { min: 12, max: 20 },
    restSeconds: 45,
    coachingCues: ["Posterior pelvic tilt", "Drive heels down", "Squeeze glutes hard at the top"],
    commonMistakes: ["Hyperextending the lower back", "Short range of motion"],
    substitutions: ["hip_thrust", "cable_kickback"],
  },

  // ---------- HAMSTRINGS ----------
  {
    id: "leg_curl",
    name: "Leg Curl",
    movementPattern: "isolation",
    primaryMuscles: ["hamstrings"],
    secondaryMuscles: [],
    equipment: "machine",
    difficulty: "beginner",
    repRange: { min: 10, max: 15 },
    restSeconds: 60,
    coachingCues: ["Full range, controlled tempo", "Keep hips down", "Squeeze at peak contraction"],
    commonMistakes: ["Lifting hips off the pad", "Half reps"],
    substitutions: ["romanian_deadlift", "45_degree_back_extension"],
  },
  {
    id: "45_degree_back_extension",
    name: "45° Back Extension",
    movementPattern: "hinge",
    primaryMuscles: ["hamstrings", "glutes"],
    secondaryMuscles: ["back"],
    equipment: "bodyweight",
    difficulty: "beginner",
    repRange: { min: 10, max: 15 },
    restSeconds: 60,
    coachingCues: ["Round slightly to bias glutes/hamstrings", "Squeeze at the top", "Control down"],
    commonMistakes: ["Overextending at the top", "Using the lower back only"],
    substitutions: ["romanian_deadlift", "leg_curl"],
  },

  // ---------- QUADS ----------
  {
    id: "squat",
    name: "Squat",
    movementPattern: "squat",
    primaryMuscles: ["quads", "glutes"],
    secondaryMuscles: ["hamstrings", "core"],
    equipment: "barbell",
    difficulty: "intermediate",
    repRange: { min: 6, max: 10 },
    restSeconds: 120,
    coachingCues: ["Brace before descending", "Knees track over toes", "Drive up evenly"],
    commonMistakes: ["Heels rising", "Knees caving in"],
    substitutions: ["leg_press", "hack_squat"],
  },
  {
    id: "hack_squat",
    name: "Hack Squat",
    movementPattern: "squat",
    primaryMuscles: ["quads"],
    secondaryMuscles: ["glutes"],
    equipment: "machine",
    difficulty: "beginner",
    repRange: { min: 8, max: 12 },
    restSeconds: 90,
    coachingCues: ["Full depth with control", "Feet placement sets emphasis", "Brace the core"],
    commonMistakes: ["Cutting depth short", "Bouncing at the bottom"],
    substitutions: ["leg_press", "squat"],
  },
  {
    id: "leg_press",
    name: "Leg Press",
    movementPattern: "squat",
    primaryMuscles: ["quads", "glutes"],
    secondaryMuscles: ["hamstrings"],
    equipment: "machine",
    difficulty: "beginner",
    repRange: { min: 10, max: 15 },
    restSeconds: 90,
    coachingCues: ["Keep lower back on the pad", "Controlled depth", "Do not lock out aggressively"],
    commonMistakes: ["Rounding the lower back", "Knees caving"],
    substitutions: ["hack_squat", "squat"],
  },
  {
    id: "leg_extension",
    name: "Leg Extension",
    movementPattern: "isolation",
    primaryMuscles: ["quads"],
    secondaryMuscles: [],
    equipment: "machine",
    difficulty: "beginner",
    repRange: { min: 12, max: 15 },
    restSeconds: 60,
    coachingCues: ["Squeeze at the top", "Control the eccentric", "Keep hips seated"],
    commonMistakes: ["Swinging the weight", "Partial reps"],
    substitutions: ["hack_squat", "leg_press"],
  },

  // ---------- BACK ----------
  {
    id: "lat_pulldown",
    name: "Lat Pulldown",
    movementPattern: "pull",
    primaryMuscles: ["back"],
    secondaryMuscles: ["arms"],
    equipment: "cable",
    difficulty: "beginner",
    repRange: { min: 8, max: 12 },
    restSeconds: 75,
    coachingCues: ["Lead with the elbows", "Pull to upper chest", "Control the return"],
    commonMistakes: ["Leaning back excessively", "Using momentum"],
    substitutions: ["seated_row", "chest_supported_row"],
  },
  {
    id: "seated_row",
    name: "Seated Row",
    movementPattern: "pull",
    primaryMuscles: ["back"],
    secondaryMuscles: ["arms"],
    equipment: "cable",
    difficulty: "beginner",
    repRange: { min: 10, max: 12 },
    restSeconds: 75,
    coachingCues: ["Proud chest", "Squeeze shoulder blades", "Elbows close to the body"],
    commonMistakes: ["Rounding forward", "Yanking with the arms"],
    substitutions: ["chest_supported_row", "lat_pulldown"],
  },
  {
    id: "chest_supported_row",
    name: "Chest-Supported Row",
    movementPattern: "pull",
    primaryMuscles: ["back"],
    secondaryMuscles: ["arms", "shoulders"],
    equipment: "dumbbell",
    difficulty: "beginner",
    repRange: { min: 10, max: 12 },
    restSeconds: 75,
    coachingCues: ["Lead with the elbows", "Keep chest on the pad", "Full squeeze at the top"],
    commonMistakes: ["Jerking off the pad", "Short range of motion"],
    substitutions: ["seated_row", "lat_pulldown"],
  },

  // ---------- SHOULDERS ----------
  {
    id: "shoulder_press",
    name: "Shoulder Press",
    movementPattern: "push",
    primaryMuscles: ["shoulders"],
    secondaryMuscles: ["arms"],
    equipment: "dumbbell",
    difficulty: "beginner",
    repRange: { min: 8, max: 12 },
    restSeconds: 75,
    coachingCues: ["Ribs down, brace the core", "Press slightly back overhead", "Control the descent"],
    commonMistakes: ["Overarching the lower back", "Flaring elbows early"],
    substitutions: ["lateral_raise", "incline_press"],
  },
  {
    id: "lateral_raise",
    name: "Lateral Raise",
    movementPattern: "isolation",
    primaryMuscles: ["shoulders"],
    secondaryMuscles: [],
    equipment: "dumbbell",
    difficulty: "beginner",
    repRange: { min: 12, max: 18 },
    restSeconds: 45,
    coachingCues: ["Lead with the elbows", "Slight forward angle", "Control down slowly"],
    commonMistakes: ["Swinging the weight", "Shrugging the traps"],
    substitutions: ["shoulder_press", "rear_delt_fly"],
  },
  {
    id: "rear_delt_fly",
    name: "Rear Delt Fly",
    movementPattern: "isolation",
    primaryMuscles: ["shoulders"],
    secondaryMuscles: ["back"],
    equipment: "dumbbell",
    difficulty: "beginner",
    repRange: { min: 12, max: 18 },
    restSeconds: 45,
    coachingCues: ["Soft elbows", "Squeeze the rear delts", "Avoid using the lower back"],
    commonMistakes: ["Turning it into a row", "Using momentum"],
    substitutions: ["lateral_raise", "seated_row"],
  },

  // ---------- CHEST ----------
  {
    id: "incline_press",
    name: "Incline Press",
    movementPattern: "push",
    primaryMuscles: ["chest", "shoulders"],
    secondaryMuscles: ["arms"],
    equipment: "dumbbell",
    difficulty: "intermediate",
    repRange: { min: 8, max: 12 },
    restSeconds: 90,
    coachingCues: ["Set the shoulder blades", "Lower with control", "Press up and slightly together"],
    commonMistakes: ["Flaring elbows to 90°", "Bouncing at the bottom"],
    substitutions: ["push_up", "shoulder_press"],
  },
  {
    id: "push_up",
    name: "Push Up",
    movementPattern: "push",
    primaryMuscles: ["chest"],
    secondaryMuscles: ["core", "arms", "shoulders"],
    equipment: "bodyweight",
    difficulty: "beginner",
    repRange: { min: 8, max: 15 },
    restSeconds: 60,
    coachingCues: ["Rigid plank line", "Elbows ~45°", "Full range to the floor"],
    commonMistakes: ["Sagging hips", "Half reps"],
    substitutions: ["incline_press"],
  },

  // ---------- CORE ----------
  {
    id: "cable_crunch",
    name: "Cable Crunch",
    movementPattern: "core",
    primaryMuscles: ["core"],
    secondaryMuscles: [],
    equipment: "cable",
    difficulty: "beginner",
    repRange: { min: 12, max: 15 },
    restSeconds: 45,
    coachingCues: ["Crunch from the ribs, not the hips", "Round the spine", "Control the return"],
    commonMistakes: ["Turning it into a hip hinge", "Using the arms"],
    substitutions: ["hanging_knee_raise", "dead_bug"],
  },
  {
    id: "dead_bug",
    name: "Dead Bug",
    movementPattern: "core",
    primaryMuscles: ["core"],
    secondaryMuscles: [],
    equipment: "bodyweight",
    difficulty: "beginner",
    repRange: { min: 8, max: 12 },
    restSeconds: 30,
    coachingCues: ["Press the lower back into the floor", "Move slowly", "Exhale as you extend"],
    commonMistakes: ["Lower back arching up", "Holding the breath"],
    substitutions: ["pallof_press", "side_plank"],
  },
  {
    id: "pallof_press",
    name: "Pallof Press",
    movementPattern: "core",
    primaryMuscles: ["core"],
    secondaryMuscles: [],
    equipment: "cable",
    difficulty: "beginner",
    repRange: { min: 10, max: 12 },
    restSeconds: 30,
    coachingCues: ["Resist rotation", "Ribs down, glutes on", "Press straight out slowly"],
    commonMistakes: ["Letting the torso twist", "Rushing"],
    substitutions: ["side_plank", "dead_bug"],
  },
  {
    id: "side_plank",
    name: "Side Plank",
    movementPattern: "core",
    primaryMuscles: ["core"],
    secondaryMuscles: ["shoulders"],
    equipment: "bodyweight",
    difficulty: "beginner",
    repRange: { min: 8, max: 12 },
    restSeconds: 30,
    coachingCues: ["Stack the hips", "Straight line head to heels", "Breathe steadily"],
    commonMistakes: ["Hips sagging", "Rotating forward"],
    substitutions: ["pallof_press", "dead_bug"],
  },
  {
    id: "hanging_knee_raise",
    name: "Hanging Knee Raise",
    movementPattern: "core",
    primaryMuscles: ["core"],
    secondaryMuscles: [],
    equipment: "bodyweight",
    difficulty: "intermediate",
    repRange: { min: 8, max: 15 },
    restSeconds: 45,
    coachingCues: ["Posterior pelvic tilt to start", "Curl the pelvis up", "No swinging"],
    commonMistakes: ["Using momentum", "Only lifting the knees without curling"],
    substitutions: ["cable_crunch", "dead_bug"],
  },

  // ---------- PILATES / MOBILITY ----------
  {
    id: "mobility_flow",
    name: "Mobility Flow",
    movementPattern: "mobility",
    primaryMuscles: ["mobility", "fullbody"],
    secondaryMuscles: [],
    equipment: "none",
    difficulty: "beginner",
    repRange: { min: 5, max: 8 },
    restSeconds: 30,
    coachingCues: ["Move slowly with the breath", "Reach end range gently", "Stay relaxed"],
    commonMistakes: ["Rushing through positions", "Forcing painful ranges"],
    substitutions: ["hip_mobility", "core_control"],
  },
  {
    id: "core_control",
    name: "Core Control",
    movementPattern: "mobility",
    primaryMuscles: ["core"],
    secondaryMuscles: ["mobility"],
    equipment: "bodyweight",
    difficulty: "beginner",
    repRange: { min: 8, max: 12 },
    restSeconds: 30,
    coachingCues: ["Pilates-style precision", "Brace lightly and breathe", "Quality over quantity"],
    commonMistakes: ["Holding the breath", "Losing the neutral position"],
    substitutions: ["dead_bug", "mobility_flow"],
  },
  {
    id: "hip_mobility",
    name: "Hip Mobility",
    movementPattern: "mobility",
    primaryMuscles: ["mobility"],
    secondaryMuscles: ["glutes"],
    equipment: "none",
    difficulty: "beginner",
    repRange: { min: 5, max: 10 },
    restSeconds: 30,
    coachingCues: ["Slow, controlled circles and openers", "Breathe into the stretch", "Keep the spine long"],
    commonMistakes: ["Bouncing", "Forcing range"],
    substitutions: ["mobility_flow", "core_control"],
  },

  // ---------- ARMS (extends the initial list to support upper-body days) ----------
  {
    id: "bicep_curl",
    name: "Bicep Curl",
    movementPattern: "isolation",
    primaryMuscles: ["arms"],
    secondaryMuscles: [],
    equipment: "dumbbell",
    difficulty: "beginner",
    repRange: { min: 10, max: 15 },
    restSeconds: 45,
    coachingCues: ["Elbows pinned to the sides", "Full squeeze at the top", "Control the lowering"],
    commonMistakes: ["Swinging the torso", "Half reps"],
    substitutions: ["chest_supported_row", "seated_row"],
  },
  {
    id: "triceps_pushdown",
    name: "Triceps Pushdown",
    movementPattern: "isolation",
    primaryMuscles: ["arms"],
    secondaryMuscles: [],
    equipment: "cable",
    difficulty: "beginner",
    repRange: { min: 10, max: 15 },
    restSeconds: 45,
    coachingCues: ["Elbows fixed at the sides", "Full lockout", "Control the return"],
    commonMistakes: ["Elbows drifting forward", "Leaning into the weight"],
    substitutions: ["push_up", "incline_press"],
  },
];

export const EXERCISES: Record<string, ExerciseDefinition> = Object.fromEntries(
  DEFINITIONS.map((definition) => [definition.id, definition]),
);

export const ALL_EXERCISE_IDS: string[] = DEFINITIONS.map((definition) => definition.id);

export function getExercise(id: string | undefined): ExerciseDefinition | undefined {
  return id ? EXERCISES[id] : undefined;
}

/**
 * Aliases map legacy / free-text exercise names onto stable ids so historical
 * data (and hand-typed names) can be linked to the database during migration.
 */
const ALIASES: Record<string, string> = {
  "bench press": "incline_press",
  "back squat": "squat",
  "front squat": "squat",
  "lower body strength": "squat",
  "seated cable row": "seated_row",
  "cable row": "seated_row",
  "rdl": "romanian_deadlift",
  "kickback": "cable_kickback",
  "abduction": "hip_abduction",
};

const NAME_TO_ID: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const definition of DEFINITIONS) {
    map[definition.name.toLowerCase()] = definition.id;
    map[definition.id] = definition.id;
  }
  for (const [alias, id] of Object.entries(ALIASES)) {
    map[alias] = id;
  }
  return map;
})();

/** Best-effort resolution of a display name to a stable exercise id. */
export function findExerciseIdByName(name: string | undefined): string | undefined {
  if (!name) return undefined;
  const key = name.trim().toLowerCase();
  return NAME_TO_ID[key];
}
