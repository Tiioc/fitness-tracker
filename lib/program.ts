import type { ProgramDay } from "./types";

export const PROGRAM: ProgramDay[] = [
  {
    name: "Chest + Triceps",
    focus: "Push — Chest Primary",
    exercises: [
      { name: "Incline Bench Press (Barbell)", sets: 4, reps: "6-10", notes: "Lead compound. Add weight when you hit 10 on all sets." },
      { name: "Bench Press (Barbell)", sets: 3, reps: "8-10" },
      { name: "Incline Chest Press (Machine)", sets: 3, reps: "10-12" },
      { name: "Pec Deck / Cable Fly", sets: 3, reps: "12-15" },
      { name: "Triceps Pushdown (Straight Bar)", sets: 4, reps: "10-12" },
      { name: "Rope Pushdown", sets: 3, reps: "12-15" },
    ],
  },
  {
    name: "Back + Biceps",
    focus: "Pull — Back Primary",
    exercises: [
      { name: "Lat Pulldown (Cable)", sets: 4, reps: "8-12", notes: "Your #1 exercise. Focus on the stretch." },
      { name: "Seated Row (Cable)", sets: 4, reps: "8-12" },
      { name: "Iso-Lateral Row (Machine)", sets: 3, reps: "10-12" },
      { name: "Cable Pullover", sets: 3, reps: "12-15" },
      { name: "Bicep Curl (Barbell)", sets: 4, reps: "8-12" },
      { name: "Hammer Curl (Cable or Dumbbell)", sets: 3, reps: "10-12" },
    ],
  },
  {
    name: "Legs",
    focus: "Legs + Core",
    cardio: "20 min incline treadmill after",
    exercises: [
      { name: "Leg Press", sets: 4, reps: "10-15" },
      { name: "Leg Extension (Machine)", sets: 4, reps: "10-15" },
      { name: "Seated Leg Curl (Machine)", sets: 4, reps: "10-15" },
      { name: "Standing Calf Raise (Machine)", sets: 4, reps: "15-20" },
      { name: "Hanging Leg Raise", sets: 3, reps: "12-20" },
    ],
  },
  {
    name: "Shoulders",
    focus: "Side Delts + Rear Delts",
    cardio: "20-25 min Stairmaster after",
    exercises: [
      { name: "Seated Overhead Press (Dumbbell)", sets: 4, reps: "8-12" },
      { name: "Lateral Raise (Dumbbell)", sets: 4, reps: "12-15", notes: "Side delts were your #2 muscle in P1. Own them." },
      { name: "Lateral Raise (Cable)", sets: 4, reps: "12-15" },
      { name: "Face Pull (Cable)", sets: 3, reps: "15-20" },
      { name: "Bent Over Rear Delt Raise", sets: 3, reps: "12-15" },
    ],
  },
  {
    name: "Arms + Rear Delts",
    focus: "Sharms — Arms Finisher",
    exercises: [
      { name: "Bicep Curl (Barbell)", sets: 4, reps: "8-12" },
      { name: "Hammer Curl (Cable)", sets: 3, reps: "10-12" },
      { name: "Preacher Curl (Machine)", sets: 3, reps: "10-12" },
      { name: "Triceps Pushdown (Straight Bar)", sets: 4, reps: "10-12" },
      { name: "Rope Pushdown", sets: 3, reps: "12-15" },
      { name: "Face Pull / Rear Delt Crossover", sets: 3, reps: "15" },
    ],
  },
];

export const WEEKLY_SCHEDULE: Record<number, number> = {
  0: 0, // Mon → Chest + Triceps
  1: 1, // Tue → Back + Biceps
  2: 2, // Wed → Legs
  3: 3, // Thu → Shoulders
  4: 4, // Fri → Arms
};

export function getTodayProgram(): ProgramDay | null {
  const day = new Date().getDay();
  const adjusted = day === 0 ? -1 : day - 1;
  return WEEKLY_SCHEDULE[adjusted] !== undefined
    ? PROGRAM[WEEKLY_SCHEDULE[adjusted]]
    : null;
}

export const MAIN_COMPOUNDS = [
  "Bench Press",
  "Incline Bench Press",
  "Lat Pulldown",
  "Seated Row",
  "Leg Extension",
  "Bicep Curl",
  "Rope Pushdown",
  "Overhead Press",
];
