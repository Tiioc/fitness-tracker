"use client";
import { useState } from "react";
import { VOLUME_TARGETS } from "@/lib/muscles";
import { cn } from "@/lib/utils";

// Friendly labels + display order grouped by region.
const MUSCLE_LABELS: Record<string, string> = {
  chest: "Chest",
  back: "Back / Lats",
  traps: "Traps",
  front_delt: "Front Delts",
  side_delt: "Side Delts",
  rear_delt: "Rear Delts",
  biceps: "Biceps",
  triceps: "Triceps",
  forearms: "Forearms",
  quads: "Quads",
  hamstrings: "Hamstrings",
  glutes: "Glutes",
  calves: "Calves",
  lower_back: "Lower Back",
  core: "Core",
};

function barColor(ratio: number): string {
  if (ratio <= 0) return "#ef4444";
  if (ratio < 0.5) return "#f97316";
  if (ratio < 0.85) return "#eab308";
  if (ratio <= 1.15) return "#22c55e";
  return "#3b82f6";
}

function statusText(sets: number, target: number): string {
  if (sets === 0) return "Not trained";
  const r = sets / target;
  if (r < 0.5) return "Under-trained";
  if (r < 0.85) return "Building";
  if (r <= 1.15) return "Optimal";
  return "High volume";
}

interface Props {
  muscleSets: Record<string, number>;
}

export default function MuscleMap({ muscleSets }: Props) {
  const [sort, setSort] = useState<"priority" | "region">("priority");

  const rows = Object.keys(MUSCLE_LABELS).map((key) => {
    const sets = muscleSets[key] ?? 0;
    const target = VOLUME_TARGETS[key]?.optimal ?? 12;
    return { key, label: MUSCLE_LABELS[key], sets, target, ratio: target ? sets / target : 0 };
  });

  const ordered = sort === "priority" ? [...rows].sort((a, b) => a.ratio - b.ratio) : rows;

  const trained = rows.filter((r) => r.sets > 0).length;
  const optimal = rows.filter((r) => r.ratio >= 0.85 && r.ratio <= 1.15).length;
  const neglected = rows.filter((r) => r.sets === 0);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat label="Muscles hit" value={`${trained}/${rows.length}`} />
        <Stat label="In optimal range" value={String(optimal)} color="text-green-400" />
        <Stat label="Untrained" value={String(neglected.length)} color={neglected.length ? "text-red-400" : "text-green-400"} />
      </div>

      {/* Sort toggle */}
      <div className="flex bg-[#111] rounded-xl p-1 gap-1">
        {([["priority", "Needs work first"], ["region", "By region"]] as const).map(([v, lbl]) => (
          <button
            key={v}
            onClick={() => setSort(v)}
            className={cn("flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors", sort === v ? "bg-[#2a2a2a] text-white" : "text-gray-500")}
          >
            {lbl}
          </button>
        ))}
      </div>

      {/* Volume bars */}
      <div className="space-y-2.5">
        {ordered.map((r) => {
          const pct = Math.min(100, r.ratio * 100);
          const color = barColor(r.ratio);
          return (
            <div key={r.key} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-300">{r.label}</span>
                <span className="text-gray-500">
                  <span style={{ color }} className="font-semibold">{r.sets}</span> / {r.target} sets · {statusText(r.sets, r.target)}
                </span>
              </div>
              <div className="h-2 bg-[#222] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between px-1 pt-1">
        <span className="text-[10px] text-gray-600">Under-trained</span>
        <div className="flex-1 mx-3 h-1.5 rounded-full" style={{ background: "linear-gradient(to right, #ef4444, #f97316, #eab308, #22c55e)" }} />
        <span className="text-[10px] text-gray-600">Optimal</span>
      </div>

      <p className="text-[11px] text-gray-600 leading-relaxed">
        Weekly set targets are based on Renaissance Periodization volume landmarks (MEV–MAV). Aim to keep each muscle in the green by hitting its weekly sets across your sessions.
      </p>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-[#111] rounded-xl p-2.5">
      <p className={cn("font-bold text-lg", color)}>{value}</p>
      <p className="text-[10px] text-gray-500 leading-tight">{label}</p>
    </div>
  );
}
