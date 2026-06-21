"use client";
import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { toast } from "sonner";
import { cn, formatDate } from "@/lib/utils";
import {
  getWeightLog, logWeight, getStrengthHistory, getSessions,
  todayStr, uid,
} from "@/lib/storage";
import { getWeeklyMuscleSets } from "@/lib/muscles";
import MuscleMap from "@/components/MuscleMap";
import type { BodyWeight } from "@/lib/types";

const CHART_EXERCISES = [
  "Bench Press (Barbell)",
  "Incline Bench Press (Barbell)",
  "Lat Pulldown (Cable)",
  "Seated Row (Cable)",
  "Bicep Curl (Barbell)",
  "Leg Extension (Machine)",
];

export default function ProgressPage() {
  const [tab, setTab] = useState<"charts" | "muscle">("charts");
  const [weightLog, setWeightLog] = useState<BodyWeight[]>([]);
  const [selectedExercise, setSelectedExercise] = useState(CHART_EXERCISES[0]);
  const [strengthData, setStrengthData] = useState<{ date: string; weight: number }[]>([]);
  const [newWeight, setNewWeight] = useState("");
  const [totalSessions, setTotalSessions] = useState(0);
  const today = todayStr();

  function reload() {
    const log = [...getWeightLog()].sort((a, b) => a.date.localeCompare(b.date));
    setWeightLog(log);
    setStrengthData(getStrengthHistory(selectedExercise).slice(-20));
    setTotalSessions(getSessions().length);
  }

  useEffect(() => { reload(); }, [today]);
  useEffect(() => { setStrengthData(getStrengthHistory(selectedExercise).slice(-20)); }, [selectedExercise]);

  function saveWeight() {
    const w = parseFloat(newWeight);
    if (!w || w < 50 || w > 500) { toast.error("Enter a valid weight (lbs)"); return; }
    logWeight({ id: uid(), date: today, weight: w });
    setNewWeight("");
    reload();
    toast.success("Weight logged!");
  }

  const recent = weightLog.slice(-8);
  const latestW = weightLog[weightLog.length - 1]?.weight;
  const prevW = weightLog[weightLog.length - 8]?.weight;
  const weightChange = latestW && prevW ? latestW - prevW : null;
  const strengthChange = strengthData.length >= 2
    ? strengthData[strengthData.length - 1].weight - strengthData[0].weight
    : null;

  return (
    <div className="p-4 space-y-4 pt-10">
      <h1 className="text-2xl font-bold">Progress</h1>

      {/* Tab toggle */}
      <div className="flex bg-[#111] rounded-xl p-1 gap-1">
        {(["charts", "muscle"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors",
              tab === t ? "bg-[#2a2a2a] text-white" : "text-gray-500"
            )}
          >
            {t === "charts" ? "Charts" : "Muscle Map"}
          </button>
        ))}
      </div>

      {tab === "muscle" ? (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4">
          <p className="font-semibold text-sm mb-4">Weekly Volume</p>
          <MuscleMap muscleSets={getWeeklyMuscleSets(getSessions())} />
        </div>
      ) : (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Workouts" value={String(totalSessions)} />
            <StatCard label="Current" value={latestW ? `${latestW} lb` : "—"} />
            <StatCard
              label="8-Week Δ"
              value={weightChange !== null ? `${weightChange > 0 ? "+" : ""}${weightChange.toFixed(1)}` : "—"}
              highlight={weightChange !== null ? (weightChange < 0 ? "green" : weightChange > 2 ? "red" : "neutral") : "neutral"}
            />
          </div>

          {/* Log weight */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4 space-y-3">
            <h2 className="font-semibold text-sm">Log Today&apos;s Weight</h2>
            <div className="flex gap-2">
              <input
                type="number"
                inputMode="decimal"
                className="flex-1 bg-[#111] border border-[#2a2a2a] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:border-blue-500"
                placeholder="Weight in lbs..."
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveWeight()}
              />
              <button onClick={saveWeight} className="bg-blue-600 hover:bg-blue-500 px-4 rounded-xl text-sm font-semibold transition-colors">
                Log
              </button>
            </div>
            {recent.length >= 3 && (
              <ResponsiveContainer width="100%" height={100}>
                <LineChart data={recent}>
                  <YAxis domain={["dataMin - 2", "dataMax + 2"]} hide />
                  <XAxis dataKey="date" hide />
                  <Tooltip
                    contentStyle={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8 }}
                    formatter={(v: number) => [`${v} lbs`, "Weight"]}
                    labelFormatter={(l) => formatDate(l)}
                  />
                  <Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: "#3b82f6" }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Strength progress */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sm">Strength Progress</h2>
              {strengthChange !== null && (
                <span className={cn("text-xs font-semibold", strengthChange > 0 ? "text-green-400" : "text-red-400")}>
                  {strengthChange > 0 ? "+" : ""}{strengthChange} lbs
                </span>
              )}
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {CHART_EXERCISES.map((ex) => {
                const short = ex.split(" (")[0].split(" ").slice(0, 2).join(" ");
                return (
                  <button
                    key={ex}
                    onClick={() => setSelectedExercise(ex)}
                    className={cn(
                      "whitespace-nowrap text-xs px-3 py-1.5 rounded-full border transition-colors",
                      selectedExercise === ex
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "border-[#2a2a2a] text-gray-500 hover:border-[#3a3a3a]"
                    )}
                  >
                    {short}
                  </button>
                );
              })}
            </div>
            {strengthData.length >= 2 ? (
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={strengthData}>
                  <CartesianGrid stroke="#1f1f1f" strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#6b7280" }} tickFormatter={(d) => d.slice(5)} />
                  <YAxis domain={["dataMin - 5", "dataMax + 5"]} tick={{ fontSize: 9, fill: "#6b7280" }} />
                  <Tooltip
                    contentStyle={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8 }}
                    formatter={(v: number) => [`${v} lbs`, selectedExercise.split(" (")[0]]}
                    labelFormatter={(l) => formatDate(l)}
                  />
                  <Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4, fill: "#3b82f6" }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-32 flex items-center justify-center">
                <p className="text-gray-600 text-sm">Log workouts to see strength trends</p>
              </div>
            )}
          </div>

          {/* Personal bests */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4 space-y-3">
            <h2 className="font-semibold text-sm">Personal Records</h2>
            <div className="space-y-2">
              {CHART_EXERCISES.map((ex) => {
                const history = getStrengthHistory(ex);
                const pr = history.length ? Math.max(...history.map((h) => h.weight)) : null;
                const short = ex.split(" (")[0];
                return (
                  <div key={ex} className="flex items-center justify-between">
                    <span className="text-sm text-gray-400 flex-1 truncate mr-4">{short}</span>
                    <span className="font-semibold text-sm">{pr ? `${pr} lbs` : "—"}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: "green" | "red" | "neutral" }) {
  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-3">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={cn("font-bold text-sm", highlight === "green" && "text-green-400", highlight === "red" && "text-red-400")}>
        {value}
      </p>
    </div>
  );
}
