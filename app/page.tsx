"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Dumbbell, Flame, Scale, ChevronRight, Zap, Calendar, Activity, Moon, X } from "lucide-react";
import {
  getSessionsForDate,
  getDailyMacros,
  getTargets,
  getLatestWeight,
  todayStr,
  getRecentSessions,
  getOuraToken,
  saveOuraToken,
} from "@/lib/storage";
import { getTodayProgram } from "@/lib/program";
import { cn, formatDate } from "@/lib/utils";
import type { WorkoutSession } from "@/lib/types";

interface OuraData {
  readiness: number | null;
  sleep: number | null;
  steps: number | null;
}

export default function Dashboard() {
  const [todaySessions, setTodaySessions] = useState<WorkoutSession[]>([]);
  const [macros, setMacros] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [targets] = useState(getTargets());
  const [latestWeight, setLatestWeight] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);
  const [ouraConnected, setOuraConnected] = useState(false);
  const [ouraData, setOuraData] = useState<OuraData | null>(null);
  const [showOuraSetup, setShowOuraSetup] = useState(false);
  const [ouraTokenInput, setOuraTokenInput] = useState("");
  const today = todayStr();
  const program = getTodayProgram();

  async function fetchOura(token: string) {
    try {
      const res = await fetch("/api/oura", { headers: { "x-oura-token": token } });
      if (!res.ok) return;
      const d = await res.json();
      setOuraData({
        readiness: d.readiness?.score ?? null,
        sleep: d.sleep?.score ?? null,
        steps: d.activity?.steps ?? null,
      });
    } catch {}
  }

  useEffect(() => {
    setTodaySessions(getSessionsForDate(today));
    setMacros(getDailyMacros(today));
    setLatestWeight(getLatestWeight()?.weight ?? null);
    setStreak(calcStreak());
    const token = getOuraToken();
    setOuraConnected(!!token);
    if (token) fetchOura(token);
  }, [today]);

  function calcStreak(): number {
    const sessions = getRecentSessions(60);
    const dates = new Set(sessions.map((s) => s.date));
    let count = 0;
    const d = new Date();
    while (true) {
      const ds = d.toISOString().split("T")[0];
      if (dates.has(ds)) { count++; d.setDate(d.getDate() - 1); }
      else break;
    }
    return count;
  }

  function connectOura() {
    const token = ouraTokenInput.trim();
    if (!token) return;
    saveOuraToken(token);
    setOuraTokenInput("");
    setShowOuraSetup(false);
    setOuraConnected(true);
    fetchOura(token);
  }

  const dayName = new Date().toLocaleDateString("en-US", { weekday: "long" });

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="pt-10 pb-2">
        <p className="text-gray-500 text-sm">{dayName}, {formatDate(today)}</p>
        <h1 className="text-2xl font-bold mt-0.5">
          {program ? `${program.name} Day` : "Rest Day"}
        </h1>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={<Flame size={16} className="text-orange-400" />} label="Streak" value={`${streak}d`} />
        <StatCard icon={<Dumbbell size={16} className="text-blue-400" />} label="Today" value={todaySessions.length > 0 ? "Done ✓" : "Pending"} />
        <StatCard icon={<Scale size={16} className="text-green-400" />} label="Weight" value={latestWeight ? `${latestWeight} lb` : "—"} />
      </div>

      {/* Oura Ring */}
      {ouraConnected ? (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-blue-400" />
            <h2 className="font-semibold text-sm">Oura Today</h2>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <OuraScore label="Readiness" value={ouraData?.readiness ?? null} />
            <OuraScore label="Sleep" value={ouraData?.sleep ?? null} icon={<Moon size={10} />} />
            <div className="bg-[#111] rounded-xl p-2.5 text-center">
              <p className="text-xs text-gray-500 mb-1">Steps</p>
              <p className="font-bold text-sm">
                {ouraData?.steps !== null && ouraData?.steps !== undefined
                  ? ouraData.steps.toLocaleString()
                  : "—"}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <button
            onClick={() => setShowOuraSetup(v => !v)}
            className="w-full bg-[#1a1a1a] border border-dashed border-[#2a2a2a] rounded-2xl p-4 flex items-center gap-3 hover:border-blue-500/30 transition-colors"
          >
            <Activity size={18} className="text-gray-600" />
            <div className="text-left">
              <p className="text-sm font-medium text-gray-400">Connect Oura Ring</p>
              <p className="text-xs text-gray-600">See readiness, sleep & steps</p>
            </div>
          </button>
          {showOuraSetup && (
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm">Personal Access Token</p>
                <button onClick={() => setShowOuraSetup(false)}>
                  <X size={16} className="text-gray-500" />
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Get your token at cloud.ouraring.com → Personal Access Tokens
              </p>
              <input
                autoFocus
                className="w-full bg-[#111] border border-[#2a2a2a] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:border-blue-500"
                placeholder="Paste token here..."
                value={ouraTokenInput}
                onChange={(e) => setOuraTokenInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && connectOura()}
              />
              <button
                onClick={connectOura}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
              >
                Connect
              </button>
            </div>
          )}
        </>
      )}

      {/* Today's program */}
      {program && (
        <Link href="/workout" className="block">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">{program.focus}</p>
                <h2 className="font-semibold text-lg">{program.name}</h2>
              </div>
              <ChevronRight size={20} className="text-gray-500" />
            </div>
            <div className="space-y-1.5">
              {program.exercises.slice(0, 4).map((ex) => (
                <div key={ex.name} className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">{ex.name}</span>
                  <span className="text-gray-500">{ex.sets}×{ex.reps}</span>
                </div>
              ))}
              {program.exercises.length > 4 && (
                <p className="text-xs text-gray-600">+{program.exercises.length - 4} more exercises</p>
              )}
            </div>
            {program.cardio && (
              <div className="flex items-center gap-2 text-xs text-blue-400 bg-blue-400/10 rounded-lg px-3 py-2">
                <Zap size={12} />
                {program.cardio}
              </div>
            )}
            <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-colors">
              {todaySessions.length > 0 ? "Continue Workout" : "Start Workout"}
            </button>
          </div>
        </Link>
      )}

      {program === null && (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 text-center space-y-2">
          <Calendar size={32} className="mx-auto text-gray-600" />
          <p className="text-gray-400 font-medium">Rest Day</p>
          <p className="text-gray-600 text-sm">Recovery is part of the program. Walk, stay active, hit your protein.</p>
        </div>
      )}

      {/* Nutrition summary */}
      <Link href="/food" className="block">
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Nutrition Today</h2>
            <span className="text-sm text-gray-500">{macros.calories} / {targets.calories} kcal</span>
          </div>
          <Bar label="Calories" value={macros.calories} target={targets.calories} color="bg-orange-400" />
          <Bar label={`Protein ${macros.protein}g`} value={macros.protein} target={targets.protein} color="bg-blue-400" />
          <Bar label={`Carbs ${macros.carbs}g`} value={macros.carbs} target={targets.carbs} color="bg-yellow-400" />
          <Bar label={`Fat ${macros.fat}g`} value={macros.fat} target={targets.fat} color="bg-red-400" />
        </div>
      </Link>

      {/* Quick link to coach */}
      <Link href="/coach" className="block">
        <div className="bg-gradient-to-r from-blue-900/40 to-blue-800/20 border border-blue-800/40 rounded-2xl p-4 flex items-center gap-3">
          <div className="bg-blue-500/20 rounded-full p-2">
            <Zap size={18} className="text-blue-400" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm">Ask your AI Coach</p>
            <p className="text-xs text-gray-400">Get advice, form tips, nutrition guidance</p>
          </div>
          <ChevronRight size={16} className="text-gray-500" />
        </div>
      </Link>
    </div>
  );
}

function OuraScore({ label, value, icon }: { label: string; value: number | null; icon?: React.ReactNode }) {
  const color = value === null ? "text-gray-500"
    : value >= 70 ? "text-green-400"
    : value >= 60 ? "text-yellow-400"
    : "text-red-400";
  return (
    <div className="bg-[#111] rounded-xl p-2.5 text-center">
      <div className="flex items-center justify-center gap-1 mb-1">
        {icon && <span className="text-gray-500">{icon}</span>}
        <p className="text-xs text-gray-500">{label}</p>
      </div>
      <p className={cn("font-bold text-sm", color)}>{value !== null ? value : "—"}</p>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-3 flex flex-col gap-1">
      <div className="flex items-center gap-1.5">{icon}<span className="text-xs text-gray-500">{label}</span></div>
      <p className="font-bold text-sm">{value}</p>
    </div>
  );
}

function Bar({ label, value, target, color }: { label: string; value: number; target: number; color: string }) {
  const pct = Math.min(100, target > 0 ? (value / target) * 100 : 0);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-500">
        <span>{label}</span>
        <span>{Math.round(pct)}%</span>
      </div>
      <div className="h-1.5 bg-[#2a2a2a] rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
