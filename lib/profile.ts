import type { UserProfile, ActivityLevel, Goal, DailyTargets } from "./types";

export const ACTIVITY_FACTOR: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export const ACTIVITY_LABEL: Record<ActivityLevel, string> = {
  sedentary: "Sedentary (desk job, little exercise)",
  light: "Light (1–3 workouts/week)",
  moderate: "Moderate (3–5 workouts/week)",
  active: "Active (6–7 workouts/week)",
  very_active: "Very active (physical job + training)",
};

export const GOAL_LABEL: Record<Goal, string> = {
  cut: "Cut — lose fat",
  maintain: "Maintain",
  lean_bulk: "Lean bulk — build muscle",
};

const GOAL_ADJUST: Record<Goal, number> = {
  cut: -0.2,
  maintain: 0,
  lean_bulk: 0.1,
};

// Mifflin–St Jeor BMR → TDEE → goal-adjusted calories, then macro split.
export function calculateTargets(p: UserProfile): DailyTargets {
  const kg = p.weightLb / 2.2046;
  const cm = p.heightIn * 2.54;
  const bmr = 10 * kg + 6.25 * cm - 5 * p.age + (p.sex === "male" ? 5 : -161);
  const tdee = bmr * ACTIVITY_FACTOR[p.activity];
  const calories = Math.max(1200, Math.round((tdee * (1 + GOAL_ADJUST[p.goal])) / 10) * 10);

  // Protein ~1g/lb (slightly higher on a cut to protect muscle).
  const protein = Math.round(p.weightLb * (p.goal === "cut" ? 1.1 : 1.0));
  // Fat ~0.35g/lb.
  const fat = Math.round(p.weightLb * 0.35);
  // Carbs fill the remaining calories.
  const carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));

  return { calories, protein, carbs, fat, steps: 10000 };
}

export function inchesToFtIn(totalIn: number): { ft: number; in: number } {
  return { ft: Math.floor(totalIn / 12), in: Math.round(totalIn % 12) };
}
