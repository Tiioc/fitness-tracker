// Exercise library for the workout builder (Strong-style picker).

export type MuscleCategory = "Chest" | "Back" | "Shoulders" | "Arms" | "Legs" | "Core";

export interface LibraryExercise {
  name: string;
  category: MuscleCategory;
  equipment: string;
}

export const MUSCLE_CATEGORIES: MuscleCategory[] = ["Chest", "Back", "Shoulders", "Arms", "Legs", "Core"];

export const EXERCISE_LIBRARY: LibraryExercise[] = [
  // Chest
  { name: "Bench Press (Barbell)", category: "Chest", equipment: "Barbell" },
  { name: "Incline Bench Press (Barbell)", category: "Chest", equipment: "Barbell" },
  { name: "Decline Bench Press (Barbell)", category: "Chest", equipment: "Barbell" },
  { name: "Bench Press (Dumbbell)", category: "Chest", equipment: "Dumbbell" },
  { name: "Incline Bench Press (Dumbbell)", category: "Chest", equipment: "Dumbbell" },
  { name: "Chest Press (Machine)", category: "Chest", equipment: "Machine" },
  { name: "Incline Chest Press (Machine)", category: "Chest", equipment: "Machine" },
  { name: "Pec Deck (Machine)", category: "Chest", equipment: "Machine" },
  { name: "Cable Fly", category: "Chest", equipment: "Cable" },
  { name: "Dumbbell Fly", category: "Chest", equipment: "Dumbbell" },
  { name: "Push Up", category: "Chest", equipment: "Bodyweight" },
  { name: "Dip (Chest)", category: "Chest", equipment: "Bodyweight" },

  // Back
  { name: "Lat Pulldown (Cable)", category: "Back", equipment: "Cable" },
  { name: "Seated Row (Cable)", category: "Back", equipment: "Cable" },
  { name: "Pull Up", category: "Back", equipment: "Bodyweight" },
  { name: "Chin Up", category: "Back", equipment: "Bodyweight" },
  { name: "Bent Over Row (Barbell)", category: "Back", equipment: "Barbell" },
  { name: "Bent Over Row (Dumbbell)", category: "Back", equipment: "Dumbbell" },
  { name: "Iso-Lateral Row (Machine)", category: "Back", equipment: "Machine" },
  { name: "T-Bar Row", category: "Back", equipment: "Barbell" },
  { name: "Cable Pullover", category: "Back", equipment: "Cable" },
  { name: "Deadlift (Barbell)", category: "Back", equipment: "Barbell" },
  { name: "Rack Pull", category: "Back", equipment: "Barbell" },
  { name: "Shrug (Dumbbell)", category: "Back", equipment: "Dumbbell" },

  // Shoulders
  { name: "Overhead Press (Barbell)", category: "Shoulders", equipment: "Barbell" },
  { name: "Seated Overhead Press (Dumbbell)", category: "Shoulders", equipment: "Dumbbell" },
  { name: "Arnold Press (Dumbbell)", category: "Shoulders", equipment: "Dumbbell" },
  { name: "Lateral Raise (Dumbbell)", category: "Shoulders", equipment: "Dumbbell" },
  { name: "Lateral Raise (Cable)", category: "Shoulders", equipment: "Cable" },
  { name: "Front Raise (Dumbbell)", category: "Shoulders", equipment: "Dumbbell" },
  { name: "Face Pull (Cable)", category: "Shoulders", equipment: "Cable" },
  { name: "Bent Over Rear Delt Raise", category: "Shoulders", equipment: "Dumbbell" },
  { name: "Reverse Pec Deck (Machine)", category: "Shoulders", equipment: "Machine" },
  { name: "Upright Row (Cable)", category: "Shoulders", equipment: "Cable" },

  // Arms
  { name: "Bicep Curl (Barbell)", category: "Arms", equipment: "Barbell" },
  { name: "Bicep Curl (Dumbbell)", category: "Arms", equipment: "Dumbbell" },
  { name: "Hammer Curl (Dumbbell)", category: "Arms", equipment: "Dumbbell" },
  { name: "Hammer Curl (Cable)", category: "Arms", equipment: "Cable" },
  { name: "Preacher Curl (Machine)", category: "Arms", equipment: "Machine" },
  { name: "Incline Curl (Dumbbell)", category: "Arms", equipment: "Dumbbell" },
  { name: "Cable Curl", category: "Arms", equipment: "Cable" },
  { name: "Triceps Pushdown (Straight Bar)", category: "Arms", equipment: "Cable" },
  { name: "Rope Pushdown", category: "Arms", equipment: "Cable" },
  { name: "Overhead Triceps Extension", category: "Arms", equipment: "Dumbbell" },
  { name: "Skullcrusher (Barbell)", category: "Arms", equipment: "Barbell" },
  { name: "Close Grip Bench Press", category: "Arms", equipment: "Barbell" },
  { name: "Dip (Triceps)", category: "Arms", equipment: "Bodyweight" },

  // Legs
  { name: "Back Squat (Barbell)", category: "Legs", equipment: "Barbell" },
  { name: "Front Squat (Barbell)", category: "Legs", equipment: "Barbell" },
  { name: "Leg Press", category: "Legs", equipment: "Machine" },
  { name: "Hack Squat (Machine)", category: "Legs", equipment: "Machine" },
  { name: "Leg Extension (Machine)", category: "Legs", equipment: "Machine" },
  { name: "Seated Leg Curl (Machine)", category: "Legs", equipment: "Machine" },
  { name: "Lying Leg Curl (Machine)", category: "Legs", equipment: "Machine" },
  { name: "Romanian Deadlift (Barbell)", category: "Legs", equipment: "Barbell" },
  { name: "Bulgarian Split Squat", category: "Legs", equipment: "Dumbbell" },
  { name: "Walking Lunge (Dumbbell)", category: "Legs", equipment: "Dumbbell" },
  { name: "Hip Thrust (Barbell)", category: "Legs", equipment: "Barbell" },
  { name: "Standing Calf Raise (Machine)", category: "Legs", equipment: "Machine" },
  { name: "Seated Calf Raise (Machine)", category: "Legs", equipment: "Machine" },

  // Core
  { name: "Hanging Leg Raise", category: "Core", equipment: "Bodyweight" },
  { name: "Cable Crunch", category: "Core", equipment: "Cable" },
  { name: "Decline Crunch", category: "Core", equipment: "Bodyweight" },
  { name: "Plank", category: "Core", equipment: "Bodyweight" },
  { name: "Russian Twist", category: "Core", equipment: "Bodyweight" },
  { name: "Ab Wheel Rollout", category: "Core", equipment: "Bodyweight" },
];

export function searchExercises(query: string, category?: MuscleCategory): LibraryExercise[] {
  const q = query.toLowerCase().trim();
  return EXERCISE_LIBRARY.filter((e) => {
    if (category && e.category !== category) return false;
    if (!q) return true;
    return e.name.toLowerCase().includes(q) || e.equipment.toLowerCase().includes(q);
  });
}
