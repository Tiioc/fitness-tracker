export interface WorkoutSet {
  id: string;
  exerciseName: string;
  setOrder: number;
  weight: number;
  reps: number;
  completed: boolean;
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
