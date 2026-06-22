export interface WorkoutSet {
  id: string;
  exerciseName: string;
  setOrder: number;
  weight: number;
  reps: number;
  completed: boolean;
  rpe?: number;     // 6–10, optional
  warmup?: boolean; // excluded from 1RM / volume
}

export interface WorkoutSession {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
  name: string;
  startTime: string;
  endTime?: string;
  sets: WorkoutSet[];
  notes?: string;
}

export interface FoodEntry {
  id: string;
  date: string;
  meal: "breakfast" | "lunch" | "dinner" | "snack";
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  grams?: number;
}

export interface BodyWeight {
  id: string;
  date: string;
  weight: number; // lbs
}

export interface DailyTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  steps: number;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface ProgramExercise {
  name: string;
  sets: number;
  reps: string; // e.g. "6-10"
  notes?: string;
}

export interface ProgramDay {
  name: string;
  focus: string;
  exercises: ProgramExercise[];
  cardio?: string;
}

export type Sex = "male" | "female";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";
export type Goal = "cut" | "maintain" | "lean_bulk";

export interface UserProfile {
  sex: Sex;
  age: number;
  heightIn: number; // total inches
  weightLb: number;
  activity: ActivityLevel;
  goal: Goal;
}

export interface BodyMeasurement {
  id: string;
  date: string;
  weightLb?: number;
  waistIn?: number;
  chestIn?: number;
  armIn?: number;
  thighIn?: number;
}

export interface ProgressPhoto {
  id: string;
  date: string;
  dataUrl: string; // compressed base64
  note?: string;
}
