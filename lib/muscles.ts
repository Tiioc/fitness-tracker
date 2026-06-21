import type { WorkoutSession } from "./types";

// ── Exercise → muscle group keyword mapping ───────────────────────────────────

export const EXERCISE_MUSCLE_MAP: Record<string, string[]> = {
  chest:      ["bench press","incline bench","decline bench","chest press","pec deck",
               "cable fly","chest fly","decline cable","push up","dumbbell fly",
               "iso-lateral chest","fly"],
  front_delt: ["overhead press","shoulder press","seated overhead","standing shoulder",
               "barbell shoulder","arnold press","front raise","seated dip"],
  side_delt:  ["lateral raise","upright row"],
  rear_delt:  ["face pull","rear delt","rear deltoid","bent over lat raise",
               "reverse fly","rear fly","band pull apart"],
  biceps:     ["bicep curl","biceps curl","hammer curl","preacher curl","chin up",
               "incline curl","cable curl","single cable curl","single arm curl",
               "concentration curl"],
  triceps:    ["tricep","pushdown","rope pushdown","skullcrusher","skull crusher",
               "close grip","overhead tricep","single arm pushdown","lying tricep","dip",
               "decline cable"],
  back:       ["lat pulldown","seated row","cable pullover","pull up","pullover",
               "iso-lateral row","high row","t bar row","bent over row","machine row",
               "cable row"],
  traps:      ["shrug","trap"],
  core:       ["crunch","hanging leg raise","russian twist","decline crunch",
               "cable crunch","plank","leg raise","sit up","oblique","ab "],
  quads:      ["leg extension","leg press","squat","hack squat","bulgarian","lunge",
               "step up","seated leg press"],
  hamstrings: ["leg curl","romanian deadlift","rdl","lying leg curl","seated leg curl",
               "nordic","stiff leg","deadlift"],
  glutes:     ["hip thrust","glute bridge","kickback","cable kickback"],
  calves:     ["calf raise","seated calf","standing calf","donkey calf"],
  lower_back: ["deadlift","rack pull","back extension","hyperextension"],
  forearms:   ["wrist curl","reverse curl","forearm"],
};

// ── Weekly volume targets (sets/week) from RP Strength research ───────────────

export const VOLUME_TARGETS: Record<string, { optimal: number }> = {
  chest:      { optimal: 14 },
  front_delt: { optimal: 10 },
  side_delt:  { optimal: 14 },
  rear_delt:  { optimal: 12 },
  biceps:     { optimal: 14 },
  triceps:    { optimal: 14 },
  back:       { optimal: 16 },
  traps:      { optimal: 8  },
  core:       { optimal: 8  },
  quads:      { optimal: 12 },
  hamstrings: { optimal: 10 },
  glutes:     { optimal: 8  },
  calves:     { optimal: 10 },
  lower_back: { optimal: 6  },
  forearms:   { optimal: 8  },
};

// ── Map path IDs → muscle group(s) for coloring ───────────────────────────────

export const PATH_TO_MUSCLES: Record<string, string[]> = {
  chestLeft:        ["chest"],
  chestRight:       ["chest"],
  shoulderLeft:     ["side_delt", "front_delt"],
  shoulderRight:    ["side_delt", "front_delt"],
  bicepsLeft:       ["biceps"],
  bicepsRight:      ["biceps"],
  forearmsLeft:     ["forearms"],
  forearmsRight:    ["forearms"],
  abs:              ["core"],
  quadsLeft:        ["quads"],
  quadsRight:       ["quads"],
  calvesLeftFront:  ["calves"],
  calvesRightFront: ["calves"],
  traps:            ["traps"],
  rearDeltLeft:     ["rear_delt"],
  rearDeltRight:    ["rear_delt"],
  latsLeft:         ["back"],
  latsRight:        ["back"],
  lowerBack:        ["lower_back"],
  glutesLeft:       ["glutes"],
  glutesRight:      ["glutes"],
  hamstringsLeft:   ["hamstrings"],
  hamstringsRight:  ["hamstrings"],
  calvesLeftBack:   ["calves"],
  calvesRightBack:  ["calves"],
};

// ── Color scale: red (untrained) → orange → yellow → green (optimal) ──────────

function hexToRgb(hex: string): [number, number, number] {
  return [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)];
}
function lerp(c1: string, c2: string, t: number): string {
  const [r1,g1,b1] = hexToRgb(c1);
  const [r2,g2,b2] = hexToRgb(c2);
  return "#" + [r1+(r2-r1)*t, g1+(g2-g1)*t, b1+(b2-b1)*t]
    .map(v => Math.round(v).toString(16).padStart(2,"0")).join("");
}

export function getMuscleColor(sets: number, pathId: string): string {
  const muscleGroups = PATH_TO_MUSCLES[pathId] ?? [];
  if (muscleGroups.length === 0) return "#1a1a1a";

  const totals = muscleGroups.map(m => ({ sets, optimal: VOLUME_TARGETS[m]?.optimal ?? 12 }));
  const combined = totals.reduce((a, b) => ({ sets: a.sets, optimal: a.optimal + b.optimal }));
  const ratio = sets === 0 ? 0 : combined.sets / combined.optimal;

  if (ratio <= 0)    return "#ef4444";
  if (ratio < 0.35)  return lerp("#ef4444","#f97316", ratio / 0.35);
  if (ratio < 0.65)  return lerp("#f97316","#eab308", (ratio-0.35)/0.30);
  if (ratio < 1.0)   return lerp("#eab308","#22c55e", (ratio-0.65)/0.35);
  return "#22c55e";
}

export function getMuscleStatus(sets: number, pathId: string): string {
  const muscleGroups = PATH_TO_MUSCLES[pathId] ?? [];
  if (sets === 0) return "Not trained this week";
  const total = muscleGroups.reduce((a,m) => a + (VOLUME_TARGETS[m]?.optimal ?? 12), 0);
  const ratio = sets / total;
  if (ratio < 0.35)  return `Under-trained (${sets} sets)`;
  if (ratio < 0.65)  return `Getting there (${sets} sets)`;
  if (ratio < 0.9)   return `Almost optimal (${sets} sets)`;
  if (ratio <= 1.1)  return `Optimal ✓ (${sets} sets)`;
  return `Above target (${sets} sets)`;
}

// ── Get exercises that belong to a muscle group ───────────────────────────────

export function getExerciseMuscles(exerciseName: string): string[] {
  const lower = exerciseName.toLowerCase();
  return Object.entries(EXERCISE_MUSCLE_MAP)
    .filter(([, kws]) => kws.some(k => lower.includes(k)))
    .map(([m]) => m);
}

// ── Calculate weekly sets per muscle (current Mon–Sun) ────────────────────────

export function getWeeklyMuscleSets(sessions: WorkoutSession[]): Record<string, number> {
  const now = new Date();
  const dow = now.getDay();
  const daysSinceMon = dow === 0 ? 6 : dow - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - daysSinceMon);
  monday.setHours(0,0,0,0);
  const weekStr = monday.toISOString().split("T")[0];

  const thisWeek = sessions.filter(s => s.date >= weekStr);
  const result: Record<string, number> = {};

  for (const session of thisWeek) {
    for (const set of session.sets) {
      for (const muscle of getExerciseMuscles(set.exerciseName)) {
        result[muscle] = (result[muscle] ?? 0) + 1;
      }
    }
  }
  return result;
}

// ── Map muscle group → path IDs (for looking up sets by path) ────────────────

export function getSetsForPath(pathId: string, muscleSets: Record<string, number>): number {
  const muscles = PATH_TO_MUSCLES[pathId] ?? [];
  const total = muscles.reduce((a, m) => a + (muscleSets[m] ?? 0), 0);
  return total;
}
