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
