"use client";
import type {
  WorkoutSession,
  FoodEntry,
  BodyWeight,
  DailyTargets,
  ChatMessage,
} from "./types";

// ── Generic helpers ──────────────────────────────────────────────────────────

function get<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function set<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

// ── Workouts ─────────────────────────────────────────────────────────────────

const WS_KEY = "fit_workouts";

export function getSessions(): WorkoutSession[] {
  return get<WorkoutSession[]>(WS_KEY, []);
}

export function saveSession(session: WorkoutSession): void {
  const all = getSessions();
  const idx = all.findIndex((s) => s.id === session.id);
  if (idx >= 0) all[idx] = session;
  else all.push(session);
  set(WS_KEY, all);
}

export function deleteSession(id: string): void {
  set(WS_KEY, getSessions().filter((s) => s.id !== id));
}

export function getSessionById(id: string): WorkoutSession | undefined {
  return getSessions().find((s) => s.id === id);
}

export function getSessionsForDate(date: string): WorkoutSession[] {
  return getSessions().filter((s) => s.date === date);
}

export function getRecentSessions(n = 20): WorkoutSession[] {
  return [...getSessions()]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, n);
}

// ── Food ─────────────────────────────────────────────────────────────────────

const FOOD_KEY = "fit_food";

export function getFoodEntries(): FoodEntry[] {
  return get<FoodEntry[]>(FOOD_KEY, []);
}

export function saveFoodEntry(entry: FoodEntry): void {
  const all = getFoodEntries();
  const idx = all.findIndex((e) => e.id === entry.id);
  if (idx >= 0) all[idx] = entry;
  else all.push(entry);
  set(FOOD_KEY, all);
}

export function deleteFoodEntry(id: string): void {
  set(FOOD_KEY, getFoodEntries().filter((e) => e.id !== id));
}

export function getFoodForDate(date: string): FoodEntry[] {
  return getFoodEntries().filter((e) => e.date === date);
}

export function getDailyMacros(date: string) {
  const entries = getFoodForDate(date);
  return entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      protein: acc.protein + e.protein,
      carbs: acc.carbs + e.carbs,
      fat: acc.fat + e.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

// ── Body weight ───────────────────────────────────────────────────────────────

const BW_KEY = "fit_bodyweight";

export function getWeightLog(): BodyWeight[] {
  return get<BodyWeight[]>(BW_KEY, []);
}

export function logWeight(entry: BodyWeight): void {
  const all = getWeightLog();
  const idx = all.findIndex((e) => e.date === entry.date);
  if (idx >= 0) all[idx] = entry;
  else all.push(entry);
  set(BW_KEY, all);
}

export function getLatestWeight(): BodyWeight | undefined {
  return [...getWeightLog()].sort((a, b) => b.date.localeCompare(a.date))[0];
}

// ── Targets ──────────────────────────────────────────────────────────────────

const TARGETS_KEY = "fit_targets";

const DEFAULT_TARGETS: DailyTargets = {
  calories: 2400,
  protein: 180,
  carbs: 240,
  fat: 70,
  steps: 10000,
};

export function getTargets(): DailyTargets {
  return get<DailyTargets>(TARGETS_KEY, DEFAULT_TARGETS);
}

export function saveTargets(t: DailyTargets): void {
  set(TARGETS_KEY, t);
}

// ── Chat history ─────────────────────────────────────────────────────────────

const CHAT_KEY = "fit_chat";

export function getChatHistory(): ChatMessage[] {
  return get<ChatMessage[]>(CHAT_KEY, []);
}

export function appendChat(msg: ChatMessage): void {
  const all = getChatHistory();
  all.push(msg);
  if (all.length > 100) all.splice(0, all.length - 100);
  set(CHAT_KEY, all);
}

export function clearChat(): void {
  set(CHAT_KEY, []);
}

// ── Utils ─────────────────────────────────────────────────────────────────────

export function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

export function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ── Strength history for a specific exercise ──────────────────────────────────

export function getStrengthHistory(exerciseName: string) {
  const sessions = getSessions();
  const map: Record<string, number> = {};
  for (const s of sessions) {
    const sets = s.sets.filter(
      (st) => st.exerciseName.toLowerCase() === exerciseName.toLowerCase() && st.weight > 0
    );
    if (sets.length === 0) continue;
    const best = Math.max(...sets.map((st) => st.weight));
    if (!map[s.date] || map[s.date] < best) map[s.date] = best;
  }
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, weight]) => ({ date, weight }));
}

// ── Personal records ───────────────────────────────────────────────────────────

export function getPR(exerciseName: string): number {
  const history = getStrengthHistory(exerciseName);
  if (!history.length) return 0;
  return Math.max(...history.map((h) => h.weight));
}

// ── Previous performance for an exercise ─────────────────────────────────────

export interface PrevPerf {
  date: string;
  sets: { weight: number; reps: number }[];
}

export function getLastPerformance(exerciseName: string, excludeSessionId?: string): PrevPerf | null {
  const sessions = [...getSessions()]
    .sort((a, b) => b.date.localeCompare(a.date));

  for (const s of sessions) {
    if (s.id === excludeSessionId) continue;
    const sets = s.sets.filter(
      st => st.exerciseName.toLowerCase() === exerciseName.toLowerCase() && (st.weight > 0 || st.reps > 0)
    );
    if (sets.length > 0) {
      return {
        date: s.date,
        sets: sets.map(st => ({ weight: st.weight, reps: st.reps })),
      };
    }
  }
  return null;
}

// ── Oura token ────────────────────────────────────────────────────────────────

const OURA_KEY = "fit_oura_token";

export function getOuraToken(): string | null {
  return get<string | null>(OURA_KEY, null);
}

export function saveOuraToken(token: string): void {
  set(OURA_KEY, token);
}

export function clearOuraToken(): void {
  if (typeof window !== "undefined") localStorage.removeItem(OURA_KEY);
}
