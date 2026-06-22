import type { DailyTargets, FoodEntry } from "./types";

type Meal = FoodEntry["meal"];

// Per-meal distribution of the daily targets, based on nutrient-timing research
// for a lean/aesthetic goal:
//  - Protein split fairly evenly across meals to maximize muscle protein
//    synthesis (~3-4 feedings, Schoenfeld/Aragon).
//  - Carbs concentrated around the midday/training window (peri-workout) and
//    pulled back at night.
//  - Fat lowered around training (faster digestion) and higher at dinner for
//    satiety. Each column sums to 1.0 of the daily total.
interface MealSplit { cal: number; p: number; c: number; f: number; time: string; note: string }

export const MEAL_PLAN: Record<Meal, MealSplit> = {
  breakfast: { cal: 0.25, p: 0.25, c: 0.25, f: 0.30, time: "7–9 AM",  note: "Protein-forward start, moderate carbs" },
  lunch:     { cal: 0.30, p: 0.30, c: 0.35, f: 0.20, time: "12–1 PM", note: "Most carbs here — fuel for training" },
  dinner:    { cal: 0.30, p: 0.30, c: 0.20, f: 0.35, time: "6–8 PM",  note: "Lower carb, higher fat for satiety" },
  snack:     { cal: 0.15, p: 0.15, c: 0.20, f: 0.15, time: "Peri-workout", note: "Protein + fast carbs near your session" },
};

export interface MealTarget {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  time: string;
  note: string;
}

export function mealTarget(meal: Meal, t: DailyTargets): MealTarget {
  const s = MEAL_PLAN[meal];
  return {
    calories: Math.round(t.calories * s.cal),
    protein: Math.round(t.protein * s.p),
    carbs: Math.round(t.carbs * s.c),
    fat: Math.round(t.fat * s.f),
    time: s.time,
    note: s.note,
  };
}
