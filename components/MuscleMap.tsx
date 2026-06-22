"use client";
import { useState } from "react";
import { getMuscleColor, getMuscleStatus, getSetsForPath, PATH_TO_MUSCLES } from "@/lib/muscles";
import { cn } from "@/lib/utils";

const SILHOUETTE =
  "M100,10 Q122,10 120,30 Q122,50 111,52 L111,65 Q140,65 172,68 " +
  "Q185,93 182,118 Q184,148 184,178 L184,194 Q182,198 178,198 " +
  "Q176,175 174,150 Q172,130 165,118 Q162,115 160,112 Q152,112 148,120 " +
  "Q146,140 142,155 Q141,170 140,188 Q146,200 152,212 Q156,260 154,320 " +
  "Q155,360 154,400 Q149,410 140,408 Q134,365 132,320 Q118,270 100,240 " +
  "Q82,270 68,320 Q66,365 60,408 Q51,410 46,400 Q45,360 46,320 " +
  "Q44,260 48,212 Q54,200 60,188 Q59,170 58,155 Q54,140 52,120 Q48,112 40,112 " +
  "Q35,118 26,150 Q24,175 22,198 L18,198 Q14,198 16,194 L16,178 " +
  "Q16,148 18,118 Q15,93 28,68 Q60,65 89,65 L89,52 Q78,50 78,30 Q78,10 100,10 Z";

interface MusclePath { id: string; label: string; d: string }

const FRONT_MUSCLES: MusclePath[] = [
  { id: "chestLeft",    label: "Left Chest",
    d: "M89,72 Q64,68 48,78 Q42,88 42,100 Q44,112 56,116 Q76,124 84,132 Q92,134 100,133 L100,72 Z" },
  { id: "chestRight",   label: "Right Chest",
    d: "M111,72 Q136,68 152,78 Q158,88 158,100 Q156,112 144,116 Q124,124 116,132 Q108,134 100,133 L100,72 Z" },
  { id: "shoulderLeft", label: "Left Shoulder",
    d: "M89,65 Q60,65 28,68 Q20,80 20,100 Q26,110 36,114 Q44,116 48,108 Q50,96 48,78 Q68,70 89,72 Z" },
  { id: "shoulderRight",label: "Right Shoulder",
    d: "M111,65 Q140,65 172,68 Q180,80 180,100 Q174,110 164,114 Q156,116 152,108 Q150,96 152,78 Q132,70 111,72 Z" },
  { id: "bicepsLeft",   label: "Left Biceps",
    d: "M36,114 Q22,110 18,118 Q20,128 26,134 Q34,130 40,124 Q42,118 40,112 Z" },
  { id: "bicepsRight",  label: "Right Biceps",
    d: "M164,114 Q178,110 182,118 Q180,128 174,134 Q166,130 160,124 Q158,118 160,112 Z" },
  { id: "forearmsLeft", label: "Left Forearm",
    d: "M26,134 Q18,148 16,178 L22,178 Q24,150 28,136 Z" },
  { id: "forearmsRight",label: "Right Forearm",
    d: "M174,134 Q182,148 184,178 L178,178 Q176,150 172,136 Z" },
  { id: "abs",          label: "Abs / Core",
    d: "M68,133 Q62,155 60,175 Q60,184 62,188 Q76,192 100,192 Q124,192 138,188 Q140,184 140,175 Q138,155 132,133 Q116,136 100,136 Q84,136 68,133 Z" },
  { id: "quadsLeft",    label: "Left Quad",
    d: "M58,212 Q50,230 48,260 Q46,288 46,315 Q66,318 80,316 Q88,290 90,260 Q94,230 96,212 Q80,208 58,212 Z" },
  { id: "quadsRight",   label: "Right Quad",
    d: "M142,212 Q150,230 152,260 Q154,288 154,315 Q134,318 120,316 Q112,290 110,260 Q106,230 104,212 Q120,208 142,212 Z" },
  { id: "calvesLeftFront",  label: "Left Calf",
    d: "M46,322 Q44,350 46,375 Q48,390 50,398 Q60,402 68,400 Q74,392 76,375 Q78,350 76,322 Q62,320 46,322 Z" },
  { id: "calvesRightFront", label: "Right Calf",
    d: "M154,322 Q156,350 154,375 Q152,390 150,398 Q140,402 132,400 Q126,392 124,375 Q122,350 124,322 Q138,320 154,322 Z" },
];

const BACK_MUSCLES: MusclePath[] = [
  { id: "traps",          label: "Traps",
    d: "M89,52 Q60,58 28,68 Q32,88 40,100 Q60,110 80,116 Q90,140 100,142 Q110,140 120,116 Q140,110 160,100 Q168,88 172,68 Q140,58 111,52 L100,46 Z" },
  { id: "rearDeltLeft",   label: "Left Rear Delt",
    d: "M28,68 Q16,80 18,100 Q24,112 36,116 Q44,108 42,96 Q38,80 28,68 Z" },
  { id: "rearDeltRight",  label: "Right Rear Delt",
    d: "M172,68 Q184,80 182,100 Q176,112 164,116 Q156,108 158,96 Q162,80 172,68 Z" },
  { id: "latsLeft",       label: "Left Lat",
    d: "M40,112 Q36,130 34,150 Q32,170 36,188 Q48,196 60,192 Q72,188 78,175 Q84,158 82,140 Q74,122 64,116 Q52,112 40,112 Z" },
  { id: "latsRight",      label: "Right Lat",
    d: "M160,112 Q164,130 166,150 Q168,170 164,188 Q152,196 140,192 Q128,188 122,175 Q116,158 118,140 Q126,122 136,116 Q148,112 160,112 Z" },
  { id: "lowerBack",      label: "Lower Back",
    d: "M86,142 Q80,155 78,175 Q78,195 82,212 Q90,216 100,216 Q110,216 118,212 Q122,195 122,175 Q120,155 114,142 Q107,138 100,138 Q93,138 86,142 Z" },
  { id: "glutesLeft",     label: "Left Glute",
    d: "M48,212 Q44,226 46,240 Q60,248 76,246 Q88,242 94,232 Q96,220 96,212 Q76,208 48,212 Z" },
  { id: "glutesRight",    label: "Right Glute",
    d: "M152,212 Q156,226 154,240 Q140,248 124,246 Q112,242 106,232 Q104,220 104,212 Q124,208 152,212 Z" },
  { id: "hamstringsLeft", label: "Left Hamstring",
    d: "M46,248 Q44,278 46,310 Q58,320 74,318 Q84,312 86,292 Q88,268 84,248 Q68,244 46,248 Z" },
  { id: "hamstringsRight",label: "Right Hamstring",
    d: "M154,248 Q156,278 154,310 Q142,320 126,318 Q116,312 114,292 Q112,268 116,248 Q132,244 154,248 Z" },
  { id: "calvesLeftBack",  label: "Left Calf",
    d: "M46,320 Q44,350 46,375 Q48,390 50,400 Q64,406 76,400 Q78,388 78,372 Q78,348 76,320 Q62,316 46,320 Z" },
  { id: "calvesRightBack", label: "Right Calf",
    d: "M154,320 Q156,350 154,375 Q152,390 150,400 Q136,406 124,400 Q122,388 122,372 Q122,348 124,320 Q138,316 154,320 Z" },
];

interface Props {
  muscleSets: Record<string, number>;
}

export default function MuscleMap({ muscleSets }: Props) {
  const [view, setView] = useState<"front" | "back">("front");
  const [tooltip, setTooltip] = useState<{ label: string; status: string } | null>(null);

  const muscles = view === "front" ? FRONT_MUSCLES : BACK_MUSCLES;

  function handleTap(m: MusclePath) {
    const sets = getSetsForPath(m.id, muscleSets);
    setTooltip({ label: m.label, status: getMuscleStatus(sets, m.id) });
    setTimeout(() => setTooltip(null), 2000);
  }

  return (
    <div className="space-y-3">
      <div className="flex bg-[#111] rounded-xl p-1 gap-1">
        {(["front","back"] as const).map(v => (
          <button
            key={v}
            onClick={() => { setView(v); setTooltip(null); }}
            className={cn(
              "flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize",
              view === v ? "bg-[#2a2a2a] text-white" : "text-gray-500"
            )}
          >
            {v}
          </button>
        ))}
      </div>

      <div className="relative flex justify-center">
        <svg
          viewBox="0 0 200 420"
          className="w-full max-w-[220px]"
          style={{ filter: "drop-shadow(0 0 12px rgba(0,0,0,0.8))" }}
        >
          <path d={SILHOUETTE} fill="#111" />
          <circle cx="100" cy="30" r="20" fill="#111" />

          {muscles.map(m => {
            const sets = getSetsForPath(m.id, muscleSets);
            const color = getMuscleColor(sets, m.id);
            return (
              <path
                key={m.id}
                d={m.d}
                fill={color}
                fillOpacity={0.88}
                stroke="#0a0a0a"
                strokeWidth={0.8}
                style={{ cursor: "pointer" }}
                onPointerDown={() => handleTap(m)}
              />
            );
          })}

          <path d={SILHOUETTE} fill="none" stroke="#333" strokeWidth={1} />
          <circle cx="100" cy="30" r="20" fill="none" stroke="#333" strokeWidth={1} />
        </svg>

        {tooltip && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#1a1a1a] border border-[#3a3a3a] rounded-xl px-4 py-2 text-center shadow-xl pointer-events-none z-10">
            <p className="font-semibold text-sm text-white">{tooltip.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{tooltip.status}</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-2">
        <span className="text-xs text-gray-600">Untrained</span>
        <div className="flex-1 mx-3 h-2 rounded-full"
          style={{ background: "linear-gradient(to right, #ef4444, #f97316, #eab308, #22c55e)" }}
        />
        <span className="text-xs text-gray-600">Optimal</span>
      </div>
    </div>
  );
}
