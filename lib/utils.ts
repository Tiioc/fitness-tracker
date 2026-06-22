import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function formatWeight(w: number): string {
  return w === 0 ? "BW" : `${w} lbs`;
}

export function parseDuration(start: string, end?: string): string {
  if (!end) return "—";
  const diff = new Date(end).getTime() - new Date(start).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export function macroColor(macro: "protein" | "carbs" | "fat"): string {
  return macro === "protein" ? "#3b82f6" : macro === "carbs" ? "#f59e0b" : "#ef4444";
}

// Estimated 1-rep max (Epley formula). Capped at ~12 reps where it stays reliable.
export function estimate1RM(weight: number, reps: number): number {
  if (!weight || !reps) return 0;
  if (reps === 1) return Math.round(weight);
  return Math.round(weight * (1 + Math.min(reps, 12) / 30));
}

// Plates needed PER SIDE of an Olympic barbell for a target total weight.
export function platesPerSide(target: number, bar = 45): { plate: number; count: number }[] {
  let perSide = (target - bar) / 2;
  if (perSide <= 0) return [];
  const sizes = [45, 35, 25, 10, 5, 2.5];
  const out: { plate: number; count: number }[] = [];
  for (const p of sizes) {
    const count = Math.floor(perSide / p);
    if (count > 0) { out.push({ plate: p, count }); perSide = +(perSide - count * p).toFixed(2); }
  }
  return out;
}
