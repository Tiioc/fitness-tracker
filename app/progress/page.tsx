"use client";
import { useEffect, useRef, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import { toast } from "sonner";
import { Camera, Trash2 } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import {
  getWeightLog, logWeight, getStrengthHistory, getSessions,
  getMeasurements, saveMeasurement, getPhotos, savePhoto, deletePhoto,
  todayStr, uid,
} from "@/lib/storage";
import { getWeeklyMuscleSets } from "@/lib/muscles";
import MuscleMap from "@/components/MuscleMap";
import type { BodyWeight, BodyMeasurement, ProgressPhoto } from "@/lib/types";

const CHART_EXERCISES = [
  "Bench Press (Barbell)",
  "Incline Bench Press (Barbell)",
  "Lat Pulldown (Cable)",
  "Seated Row (Cable)",
  "Bicep Curl (Barbell)",
  "Leg Extension (Machine)",
];

function movingAverage(data: { date: string; weight: number }[], window = 7) {
  return data.map((d, i) => {
    const slice = data.slice(Math.max(0, i - window + 1), i + 1);
    const avg = slice.reduce((a, b) => a + b.weight, 0) / slice.length;
    return { ...d, trend: Math.round(avg * 10) / 10 };
  });
}

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 720;
        let { width, height } = img;
        if (width > height && width > max) { height = (height * max) / width; width = max; }
        else if (height > max) { width = (width * max) / height; height = max; }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("no ctx"));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.6));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ProgressPage() {
  const [tab, setTab] = useState<"charts" | "muscle" | "body">("charts");
  const [weightLog, setWeightLog] = useState<BodyWeight[]>([]);
  const [selectedExercise, setSelectedExercise] = useState(CHART_EXERCISES[0]);
  const [strengthData, setStrengthData] = useState<{ date: string; weight: number }[]>([]);
  const [newWeight, setNewWeight] = useState("");
  const [totalSessions, setTotalSessions] = useState(0);
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [meas, setMeas] = useState({ weightLb: "", waistIn: "", chestIn: "", armIn: "", thighIn: "" });
  const fileRef = useRef<HTMLInputElement>(null);
  const today = todayStr();

  function reload() {
    setWeightLog([...getWeightLog()].sort((a, b) => a.date.localeCompare(b.date)));
    setStrengthData(getStrengthHistory(selectedExercise).slice(-20));
    setTotalSessions(getSessions().length);
    setMeasurements([...getMeasurements()].reverse());
    setPhotos(getPhotos());
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

  function saveMeas() {
    const m: BodyMeasurement = {
      id: uid(), date: today,
      weightLb: parseFloat(meas.weightLb) || undefined,
      waistIn: parseFloat(meas.waistIn) || undefined,
      chestIn: parseFloat(meas.chestIn) || undefined,
      armIn: parseFloat(meas.armIn) || undefined,
      thighIn: parseFloat(meas.thighIn) || undefined,
    };
    if (!m.weightLb && !m.waistIn && !m.chestIn && !m.armIn && !m.thighIn) {
      toast.error("Enter at least one measurement"); return;
    }
    saveMeasurement(m);
    if (m.weightLb) logWeight({ id: uid(), date: today, weight: m.weightLb });
    setMeas({ weightLb: "", waistIn: "", chestIn: "", armIn: "", thighIn: "" });
    reload();
    toast.success("Measurements saved!");
  }

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImage(file);
      savePhoto({ id: uid(), date: today, dataUrl });
      reload();
      toast.success("Photo added!");
    } catch {
      toast.error("Couldn't process that image");
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  const recent = weightLog.slice(-30);
  const weightSeries = movingAverage(recent);
  const latestW = weightLog[weightLog.length - 1]?.weight;
  const prevW = weightLog[weightLog.length - 8]?.weight;
  const weightChange = latestW && prevW ? latestW - prevW : null;
  const strengthChange = strengthData.length >= 2
    ? strengthData[strengthData.length - 1].weight - strengthData[0].weight
    : null;

  return (
    <div className="p-4 space-y-4 pt-10">
      <h1 className="text-2xl font-bold">Progress</h1>

      <div className="flex bg-[#111] rounded-xl p-1 gap-1">
        {(["charts", "muscle", "body"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn("flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize", tab === t ? "bg-[#2a2a2a] text-white" : "text-gray-500")}
          >
            {t === "charts" ? "Charts" : t === "muscle" ? "Volume" : "Body"}
          </button>
        ))}
      </div>

      {tab === "muscle" && (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4">
          <p className="font-semibold text-sm mb-4">Weekly Training Volume</p>
          <MuscleMap muscleSets={getWeeklyMuscleSets(getSessions())} />
        </div>
      )}

      {tab === "body" && (
        <>
          {/* Measurement entry */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4 space-y-3">
            <h2 className="font-semibold text-sm">Log Measurements</h2>
            <div className="grid grid-cols-2 gap-2.5">
              <MInput label="Weight (lb)" value={meas.weightLb} onChange={(v) => setMeas((m) => ({ ...m, weightLb: v }))} />
              <MInput label="Waist (in)" value={meas.waistIn} onChange={(v) => setMeas((m) => ({ ...m, waistIn: v }))} />
              <MInput label="Chest (in)" value={meas.chestIn} onChange={(v) => setMeas((m) => ({ ...m, chestIn: v }))} />
              <MInput label="Arm (in)" value={meas.armIn} onChange={(v) => setMeas((m) => ({ ...m, armIn: v }))} />
              <MInput label="Thigh (in)" value={meas.thighIn} onChange={(v) => setMeas((m) => ({ ...m, thighIn: v }))} />
            </div>
            <button onClick={saveMeas} className="w-full py-2.5 rounded-xl bg-blue-600 text-sm font-semibold text-white active:bg-blue-500 transition-colors">
              Save
            </button>
          </div>

          {measurements.length > 0 && (
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4 space-y-2">
              <h2 className="font-semibold text-sm mb-1">History</h2>
              {measurements.slice(0, 10).map((m) => (
                <div key={m.id} className="flex items-center justify-between text-xs border-b border-[#222] last:border-0 py-1.5">
                  <span className="text-gray-400">{formatDate(m.date)}</span>
                  <span className="text-gray-300 flex gap-2 flex-wrap justify-end">
                    {m.weightLb ? <span>{m.weightLb} lb</span> : null}
                    {m.waistIn ? <span>W {m.waistIn}&quot;</span> : null}
                    {m.chestIn ? <span>C {m.chestIn}&quot;</span> : null}
                    {m.armIn ? <span>A {m.armIn}&quot;</span> : null}
                    {m.thighIn ? <span>T {m.thighIn}&quot;</span> : null}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Progress photos */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sm">Progress Photos</h2>
              <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 text-xs text-blue-400">
                <Camera size={15} /> Add photo
              </button>
              <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onPhoto} />
            </div>
            {photos.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-4">Add photos to track visual changes over time.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {photos.map((p) => (
                  <div key={p.id} className="relative aspect-[3/4] rounded-xl overflow-hidden bg-[#111]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.dataUrl} alt={p.date} className="w-full h-full object-cover" />
                    <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[9px] text-white text-center py-0.5">{formatDate(p.date)}</span>
                    <button
                      onClick={() => { if (confirm("Delete photo?")) { deletePhoto(p.id); reload(); } }}
                      className="absolute top-1 right-1 bg-black/60 rounded-full p-1 text-gray-200"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-[10px] text-gray-600">Photos are stored only on this device.</p>
          </div>
        </>
      )}

      {tab === "charts" && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Workouts" value={String(totalSessions)} />
            <StatCard label="Current" value={latestW ? `${latestW} lb` : "—"} />
            <StatCard
              label="8-Week Δ"
              value={weightChange !== null ? `${weightChange > 0 ? "+" : ""}${weightChange.toFixed(1)}` : "—"}
              highlight={weightChange !== null ? (weightChange < 0 ? "green" : weightChange > 2 ? "red" : "neutral") : "neutral"}
            />
          </div>

          {/* Log weight + trend chart */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4 space-y-3">
            <h2 className="font-semibold text-sm">Body Weight</h2>
            <div className="flex gap-2">
              <input
                type="number" inputMode="decimal"
                className="flex-1 bg-[#111] border border-[#2a2a2a] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:border-blue-500"
                placeholder="Weight in lbs..."
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveWeight()}
              />
              <button onClick={saveWeight} className="bg-blue-600 hover:bg-blue-500 px-4 rounded-xl text-sm font-semibold transition-colors">Log</button>
            </div>
            {weightSeries.length >= 3 && (
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={weightSeries}>
                  <CartesianGrid stroke="#1f1f1f" strokeDasharray="3 3" />
                  <YAxis domain={["dataMin - 2", "dataMax + 2"]} tick={{ fontSize: 9, fill: "#6b7280" }} width={28} />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#6b7280" }} tickFormatter={(d) => String(d).slice(5)} />
                  <Tooltip
                    contentStyle={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8 }}
                    formatter={(v) => [`${v} lbs`]}
                    labelFormatter={(l) => formatDate(String(l))}
                  />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Line name="Weight" type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={1.5} dot={{ r: 2, fill: "#3b82f6" }} />
                  <Line name="7-day trend" type="monotone" dataKey="trend" stroke="#22c55e" strokeWidth={2.5} dot={false} />
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
                    className={cn("whitespace-nowrap text-xs px-3 py-1.5 rounded-full border transition-colors",
                      selectedExercise === ex ? "bg-blue-600 border-blue-600 text-white" : "border-[#2a2a2a] text-gray-500 hover:border-[#3a3a3a]")}
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
                  <YAxis domain={["dataMin - 5", "dataMax + 5"]} tick={{ fontSize: 9, fill: "#6b7280" }} width={28} />
                  <Tooltip
                    contentStyle={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8 }}
                    formatter={(v) => [`${v} lbs`, selectedExercise.split(" (")[0]]}
                    labelFormatter={(l) => formatDate(String(l))}
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
      <p className={cn("font-bold text-sm", highlight === "green" && "text-green-400", highlight === "red" && "text-red-400")}>{value}</p>
    </div>
  );
}

function MInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-gray-500">{label}</label>
      <input
        type="number" inputMode="decimal"
        className="w-full bg-[#111] border border-[#2a2a2a] rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500"
        value={value} placeholder="0" onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
