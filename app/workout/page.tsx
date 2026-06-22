"use client";
import { useEffect, useState, useRef } from "react";
import {
  Plus, Trash2, Check, ChevronDown, ChevronUp, X, History, Dumbbell, Clock, Calculator, Search
} from "lucide-react";
import { toast } from "sonner";
import { cn, formatDate, formatWeight, parseDuration, estimate1RM, platesPerSide } from "@/lib/utils";
import {
  saveSession, getSessionsForDate, getRecentSessions, deleteSession,
  todayStr, uid, getLastPerformance,
} from "@/lib/storage";
import type { PrevPerf } from "@/lib/storage";
import { getTodayProgram, PROGRAM } from "@/lib/program";
import { searchExercises, MUSCLE_CATEGORIES, type MuscleCategory } from "@/lib/exercises";
import type { WorkoutSession, WorkoutSet } from "@/lib/types";

export default function WorkoutPage() {
  const [view, setView] = useState<"home" | "active" | "history">("home");
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [history, setHistory] = useState<WorkoutSession[]>([]);
  const today = todayStr();
  const program = getTodayProgram();

  useEffect(() => {
    const existing = getSessionsForDate(today);
    if (existing.length > 0) { setSession(existing[0]); setView("active"); }
    setHistory(getRecentSessions(30));
  }, [today]);

  function startSession(programIdx?: number) {
    const p = programIdx !== undefined && programIdx >= 0 ? PROGRAM[programIdx] : (programIdx === undefined ? program : null);
    const name = p ? p.name : "Custom Workout";
    const sets: WorkoutSet[] = p
      ? p.exercises.flatMap((ex) =>
          Array.from({ length: ex.sets }, (_, si) => ({
            id: uid(),
            exerciseName: ex.name,
            setOrder: si + 1,
            weight: 0,
            reps: 0,
            completed: false,
          }))
        )
      : [];
    const newSession: WorkoutSession = {
      id: uid(),
      date: today,
      name,
      startTime: new Date().toISOString(),
      sets,
    };
    setSession(newSession);
    saveSession(newSession);
    setView("active");
  }

  function addExercise(name: string, numSets = 3) {
    if (!session) return;
    const newSets: WorkoutSet[] = Array.from({ length: numSets }, (_, i) => ({
      id: uid(), exerciseName: name, setOrder: i + 1, weight: 0, reps: 0, completed: false,
    }));
    const updated = { ...session, sets: [...session.sets, ...newSets] };
    setSession(updated);
    saveSession(updated);
  }

  function updateSet(setId: string, patch: Partial<WorkoutSet>) {
    if (!session) return;
    const updated = {
      ...session,
      sets: session.sets.map((s) => s.id === setId ? { ...s, ...patch } : s),
    };
    setSession(updated);
    saveSession(updated);
  }

  function toggleSet(setId: string) {
    if (!session) return;
    const updated = {
      ...session,
      sets: session.sets.map((s) =>
        s.id === setId ? { ...s, completed: !s.completed } : s
      ),
    };
    setSession(updated);
    saveSession(updated);
  }

  function addSet(exerciseName: string) {
    if (!session) return;
    const existing = session.sets.filter((s) => s.exerciseName === exerciseName);
    const last = existing[existing.length - 1];
    const newSet: WorkoutSet = {
      id: uid(),
      exerciseName,
      setOrder: existing.length + 1,
      weight: last?.weight ?? 0,
      reps: last?.reps ?? 0,
      completed: false,
    };
    const updated = { ...session, sets: [...session.sets, newSet] };
    setSession(updated);
    saveSession(updated);
  }

  function removeSet(setId: string) {
    if (!session) return;
    const updated = { ...session, sets: session.sets.filter((s) => s.id !== setId) };
    setSession(updated);
    saveSession(updated);
  }

  function finishWorkout() {
    if (!session) return;
    const updated = { ...session, endTime: new Date().toISOString() };
    setSession(updated);
    saveSession(updated);
    toast.success("Workout saved!");
    setHistory(getRecentSessions(30));
    setView("home");
  }

  if (view === "history") return <HistoryView sessions={history} onBack={() => setView("home")} onDelete={(id) => { deleteSession(id); setHistory(getRecentSessions(30)); }} />;

  if (view === "active" && session) {
    return (
      <ActiveWorkout
        session={session}
        onUpdateSet={updateSet}
        onToggleSet={toggleSet}
        onAddSet={addSet}
        onRemoveSet={removeSet}
        onAddExercise={addExercise}
        onFinish={finishWorkout}
        onDiscard={() => { deleteSession(session.id); setSession(null); setView("home"); }}
      />
    );
  }

  return (
    <div className="p-4 space-y-4 pt-10">
      <h1 className="text-2xl font-bold">Workout</h1>

      {program && (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4 space-y-3">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{program.focus}</p>
            <h2 className="font-semibold text-lg">{program.name}</h2>
          </div>
          {program.exercises.map((ex) => (
            <div key={ex.name} className="flex justify-between text-sm">
              <span className="text-gray-300">{ex.name}</span>
              <span className="text-gray-500">{ex.sets}×{ex.reps}</span>
            </div>
          ))}
          <button onClick={() => startSession()} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-colors">
            Start Today&apos;s Workout
          </button>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-xs text-gray-500 uppercase tracking-wider px-1">Other Days</p>
        {PROGRAM.map((p, i) => (
          <button
            key={i}
            onClick={() => startSession(i)}
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-3 flex items-center justify-between text-left hover:border-[#3a3a3a] transition-colors"
          >
            <div>
              <p className="font-medium text-sm">{p.name}</p>
              <p className="text-xs text-gray-500">{p.exercises.length} exercises · {p.focus}</p>
            </div>
            <Plus size={16} className="text-gray-500" />
          </button>
        ))}
        <button
          onClick={() => startSession(-1)}
          className="w-full bg-[#1a1a1a] border border-dashed border-[#2a2a2a] rounded-xl p-3 flex items-center justify-center gap-2 text-gray-400 hover:border-blue-500/50 hover:text-blue-400 transition-colors"
        >
          <Plus size={16} /> <span className="text-sm font-medium">Empty Workout</span>
        </button>
      </div>

      <button
        onClick={() => setView("history")}
        className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-3 flex items-center gap-3 hover:border-[#3a3a3a] transition-colors"
      >
        <History size={18} className="text-gray-500" />
        <span className="text-sm font-medium">Workout History</span>
      </button>
    </div>
  );
}

// ── Active Workout ───────────────────────────────────────────────────────────────

const REST_DURATION = 90;

function ActiveWorkout({
  session, onUpdateSet, onToggleSet, onAddSet, onRemoveSet, onAddExercise, onFinish, onDiscard,
}: {
  session: WorkoutSession;
  onUpdateSet: (id: string, patch: Partial<WorkoutSet>) => void;
  onToggleSet: (id: string) => void;
  onAddSet: (ex: string) => void;
  onRemoveSet: (id: string) => void;
  onAddExercise: (name: string, sets?: number) => void;
  onFinish: () => void;
  onDiscard: () => void;
}) {
  const [picking, setPicking] = useState(false);
  const [plateCalc, setPlateCalc] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [restRemaining, setRestRemaining] = useState<number | null>(null);
  const restTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const start = new Date(session.startTime).getTime();
    const iv = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(iv);
  }, [session.startTime]);

  useEffect(() => {
    return () => { if (restTimerRef.current) clearInterval(restTimerRef.current); };
  }, []);

  function startRestTimer() {
    if (restTimerRef.current) clearInterval(restTimerRef.current);
    setRestRemaining(REST_DURATION);
    restTimerRef.current = setInterval(() => {
      setRestRemaining(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(restTimerRef.current!);
          restTimerRef.current = null;
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function dismissRestTimer() {
    if (restTimerRef.current) { clearInterval(restTimerRef.current); restTimerRef.current = null; }
    setRestRemaining(null);
  }

  function handleToggleSet(setId: string) {
    const set = session.sets.find(s => s.id === setId);
    const completing = set && !set.completed;
    onToggleSet(setId);
    if (completing && !set?.warmup) startRestTimer();
  }

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const completedCount = session.sets.filter((s) => s.completed).length;
  const totalSets = session.sets.length;
  const totalVolume = session.sets
    .filter((s) => s.completed && !s.warmup)
    .reduce((a, s) => a + s.weight * s.reps, 0);

  const exercises = session.sets.reduce<Map<string, WorkoutSet[]>>((acc, s) => {
    const arr = acc.get(s.exerciseName) ?? [];
    arr.push(s);
    acc.set(s.exerciseName, arr);
    return acc;
  }, new Map());

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0a0a0a] border-b border-[#1a1a1a] px-4 py-3 flex items-center justify-between">
        <div>
          <h2 className="font-bold">{session.name}</h2>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1"><Clock size={11} />{String(mins).padStart(2,"0")}:{String(secs).padStart(2,"0")}</span>
            <span>{completedCount}/{totalSets} sets</span>
            {totalVolume > 0 && <span>{totalVolume.toLocaleString()} lb vol</span>}
          </div>
        </div>
        <div className="flex gap-1.5 items-center">
          <button onClick={() => setPlateCalc(true)} className="p-2 text-gray-400 hover:text-blue-400" aria-label="Plate calculator">
            <Calculator size={18} />
          </button>
          <button onClick={onDiscard} className="p-2 text-gray-500 hover:text-red-400">
            <X size={20} />
          </button>
          <button onClick={onFinish} className="bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-xl">
            Finish
          </button>
        </div>
      </div>

      {/* Exercise blocks */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-40">
        {[...exercises.entries()].map(([name, sets]) => {
          const prevPerf = getLastPerformance(name, session.id);
          return (
            <ExerciseBlock
              key={name}
              name={name}
              sets={sets}
              prevPerf={prevPerf}
              onUpdate={onUpdateSet}
              onToggle={handleToggleSet}
              onAddSet={() => onAddSet(name)}
              onRemoveSet={onRemoveSet}
            />
          );
        })}

        <button onClick={() => setPicking(true)} className="w-full bg-[#1a1a1a] border border-dashed border-[#2a2a2a] rounded-2xl p-4 flex items-center justify-center gap-2 text-gray-500 hover:border-blue-500/50 hover:text-blue-400 transition-colors">
          <Plus size={18} />
          <span className="text-sm">Add Exercise</span>
        </button>
      </div>

      {/* Rest Timer */}
      {restRemaining !== null && (
        <div className="fixed bottom-20 left-0 right-0 mx-4 z-20 bg-[#1a1a1a] border border-blue-500/30 rounded-2xl px-4 py-3 shadow-2xl flex items-center gap-3">
          <Clock size={16} className="text-blue-400 shrink-0" />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-gray-400">Rest</span>
              <span className="text-sm font-bold tabular-nums text-blue-400">{restRemaining}s</span>
            </div>
            <div className="h-1.5 bg-[#2a2a2a] rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                style={{ width: `${(restRemaining / REST_DURATION) * 100}%` }}
              />
            </div>
          </div>
          <button onClick={dismissRestTimer} className="text-gray-500 hover:text-gray-300 p-1 ml-1">
            <X size={16} />
          </button>
        </div>
      )}

      {picking && (
        <ExercisePicker
          onPick={(name) => { onAddExercise(name); setPicking(false); }}
          onClose={() => setPicking(false)}
        />
      )}
      {plateCalc && <PlateCalculator onClose={() => setPlateCalc(false)} />}
    </div>
  );
}

// ── Exercise Block ───────────────────────────────────────────────────────────────

function ExerciseBlock({
  name, sets, prevPerf, onUpdate, onToggle, onAddSet, onRemoveSet,
}: {
  name: string;
  sets: WorkoutSet[];
  prevPerf: PrevPerf | null;
  onUpdate: (id: string, patch: Partial<WorkoutSet>) => void;
  onToggle: (id: string) => void;
  onAddSet: () => void;
  onRemoveSet: (id: string) => void;
}) {
  const completed = sets.filter((s) => s.completed).length;
  const working = sets.filter((s) => !s.warmup && s.weight > 0 && s.reps > 0);
  const e1rm = working.length ? Math.max(...working.map((s) => estimate1RM(s.weight, s.reps))) : 0;

  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between">
        <div>
          <p className="font-semibold text-sm">{name}</p>
          <p className="text-xs text-gray-500">
            {completed}/{sets.length} sets{e1rm > 0 && <span className="text-blue-400"> · e1RM {e1rm} lb</span>}
          </p>
        </div>
        <Dumbbell size={16} className="text-gray-600" />
      </div>

      {prevPerf && (
        <div className="px-4 pb-2 -mt-1">
          <p className="text-xs text-gray-600">
            Last ({formatDate(prevPerf.date)}):{" "}
            {prevPerf.sets.map((s, i) => (
              <span key={i}>
                {i > 0 && <span className="text-gray-700"> · </span>}
                {s.weight > 0 ? `${s.weight}×${s.reps}` : `${s.reps} reps`}
              </span>
            ))}
          </p>
        </div>
      )}

      <div className="grid grid-cols-12 gap-1.5 px-4 pb-1 text-[10px] text-gray-600">
        <span className="col-span-2">SET</span>
        <span className="col-span-3 text-center">LBS</span>
        <span className="col-span-3 text-center">REPS</span>
        <span className="col-span-2 text-center">RPE</span>
        <span className="col-span-1 text-center">✓</span>
        <span className="col-span-1" />
      </div>
      <div className="divide-y divide-[#1f1f1f]">
        {sets.map((s, i) => (
          <div key={s.id} className={cn("grid grid-cols-12 gap-1.5 items-center px-4 py-2 transition-colors", s.completed && "bg-green-900/10")}>
            <button
              onClick={() => onUpdate(s.id, { warmup: !s.warmup })}
              className={cn("col-span-2 text-xs font-medium text-left", s.warmup ? "text-amber-400" : "text-gray-500")}
              title="Tap to toggle warmup"
            >
              {s.warmup ? "Warm" : i + 1}
            </button>
            <div className="col-span-3">
              <input
                type="number" inputMode="decimal"
                className="w-full bg-[#111] border border-[#2a2a2a] rounded-lg px-1.5 py-1.5 text-sm text-center text-white outline-none focus:border-blue-500"
                value={s.weight || ""}
                placeholder={prevPerf?.sets[i]?.weight ? String(prevPerf.sets[i].weight) : "0"}
                onChange={(e) => onUpdate(s.id, { weight: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="col-span-3">
              <input
                type="number" inputMode="numeric"
                className="w-full bg-[#111] border border-[#2a2a2a] rounded-lg px-1.5 py-1.5 text-sm text-center text-white outline-none focus:border-blue-500"
                value={s.reps || ""}
                placeholder={prevPerf?.sets[i]?.reps ? String(prevPerf.sets[i].reps) : "0"}
                onChange={(e) => onUpdate(s.id, { reps: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="col-span-2">
              <input
                type="number" inputMode="decimal"
                className="w-full bg-[#111] border border-[#2a2a2a] rounded-lg px-1 py-1.5 text-sm text-center text-white outline-none focus:border-blue-500"
                value={s.rpe ?? ""}
                placeholder="–"
                onChange={(e) => onUpdate(s.id, { rpe: parseFloat(e.target.value) || undefined })}
              />
            </div>
            <div className="col-span-1 flex justify-center">
              <button
                onClick={() => onToggle(s.id)}
                className={cn(
                  "w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors",
                  s.completed ? "bg-green-500 border-green-500" : "border-[#3a3a3a]"
                )}
              >
                {s.completed && <Check size={13} />}
              </button>
            </div>
            <div className="col-span-1 flex justify-end">
              <button onClick={() => onRemoveSet(s.id)} className="text-gray-600 hover:text-red-400 p-0.5">
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="px-4 pb-3 pt-2">
        <button onClick={onAddSet} className="w-full py-2 border border-dashed border-[#2a2a2a] rounded-xl text-xs text-gray-500 hover:border-blue-500/50 hover:text-blue-400 transition-colors">
          + Add Set
        </button>
      </div>
    </div>
  );
}

// ── Exercise Picker ──────────────────────────────────────────────────────────────

function ExercisePicker({ onPick, onClose }: { onPick: (name: string) => void; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<MuscleCategory | null>(null);
  const results = searchExercises(q, cat ?? undefined);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end" onClick={onClose}>
      <div className="w-full max-w-lg mx-auto bg-[#111] border-t border-[#2a2a2a] rounded-t-3xl max-h-[88vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="pt-3 flex justify-center"><div className="w-10 h-1 rounded-full bg-[#333]" /></div>
        <div className="px-5 pt-3 pb-2 flex items-center justify-between">
          <h3 className="font-bold">Add Exercise</h3>
          <button onClick={onClose} className="p-1 text-gray-500"><X size={20} /></button>
        </div>
        <div className="px-5 pb-2 space-y-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              autoFocus
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl pl-9 pr-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none focus:border-blue-500"
              placeholder="Search exercises..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            <button onClick={() => setCat(null)} className={cn("shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border", cat === null ? "bg-blue-600 border-blue-600 text-white" : "border-[#2a2a2a] text-gray-400")}>All</button>
            {MUSCLE_CATEGORIES.map((c) => (
              <button key={c} onClick={() => setCat(c)} className={cn("shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border", cat === c ? "bg-blue-600 border-blue-600 text-white" : "border-[#2a2a2a] text-gray-400")}>{c}</button>
            ))}
          </div>
        </div>
        <div className="px-5 pb-5 overflow-y-auto space-y-1.5">
          {results.map((e) => (
            <button key={e.name} onClick={() => onPick(e.name)} className="w-full text-left px-3 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl active:bg-[#222] transition-colors flex items-center justify-between">
              <span className="text-sm">{e.name}</span>
              <span className="text-[10px] text-gray-500">{e.equipment}</span>
            </button>
          ))}
          {q.trim() && (
            <button onClick={() => onPick(q.trim())} className="w-full text-left px-3 py-2.5 border border-dashed border-[#2a2a2a] rounded-xl text-sm text-gray-400 active:bg-[#1a1a1a]">
              + Add &quot;{q.trim()}&quot; as custom
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Plate Calculator ──────────────────────────────────────────────────────────

function PlateCalculator({ onClose }: { onClose: () => void }) {
  const [weight, setWeight] = useState("135");
  const [bar, setBar] = useState(45);
  const target = parseFloat(weight) || 0;
  const plates = platesPerSide(target, bar);
  const achievable = bar + plates.reduce((a, p) => a + p.plate * p.count, 0) * 2;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end" onClick={onClose}>
      <div className="w-full max-w-lg mx-auto bg-[#111] border-t border-[#2a2a2a] rounded-t-3xl p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold">Plate Calculator</h3>
          <button onClick={onClose} className="p-1 text-gray-500"><X size={20} /></button>
        </div>
        <div className="space-y-2">
          <label className="text-xs text-gray-500">Target weight (lbs)</label>
          <input
            type="number" inputMode="decimal" autoFocus
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-lg font-semibold text-center text-white outline-none focus:border-blue-500"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {[45, 35].map((b) => (
            <button key={b} onClick={() => setBar(b)} className={cn("flex-1 py-2 rounded-xl text-xs font-medium border", bar === b ? "bg-blue-600 border-blue-600 text-white" : "border-[#2a2a2a] text-gray-400")}>
              {b} lb bar
            </button>
          ))}
        </div>
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4">
          {plates.length > 0 ? (
            <>
              <p className="text-xs text-gray-500 mb-2">Per side:</p>
              <div className="flex flex-wrap gap-2">
                {plates.map((p) => (
                  <span key={p.plate} className="bg-blue-600/20 text-blue-300 border border-blue-600/40 rounded-lg px-3 py-1.5 text-sm font-semibold">
                    {p.count} × {p.plate}
                  </span>
                ))}
              </div>
              {achievable !== target && (
                <p className="text-xs text-amber-400 mt-3">Closest loadable: {achievable} lb</p>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-500 text-center">Just the {bar} lb bar.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── History View ───────────────────────────────────────────────────────────────

function HistoryView({
  sessions, onBack, onDelete,
}: {
  sessions: WorkoutSession[];
  onBack: () => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  return (
    <div className="p-4 space-y-3 pt-10">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={onBack} className="text-gray-400"><X size={20} /></button>
        <h1 className="text-xl font-bold">History</h1>
      </div>
      {sessions.length === 0 && <p className="text-gray-500 text-sm text-center py-10">No workouts yet.</p>}
      {sessions.map((s) => {
        const open = expanded === s.id;
        const dur = parseDuration(s.startTime, s.endTime);
        const totalSets = s.sets.length;
        const vol = s.sets.filter((st) => !st.warmup).reduce((a, st) => a + st.weight * st.reps, 0);
        const exNames = [...new Set(s.sets.map((st) => st.exerciseName))];
        return (
          <div key={s.id} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl overflow-hidden">
            <button
              onClick={() => setExpanded(open ? null : s.id)}
              className="w-full px-4 py-3 flex items-center justify-between text-left"
            >
              <div>
                <p className="font-semibold text-sm">{s.name}</p>
                <p className="text-xs text-gray-500">{formatDate(s.date)} · {totalSets} sets · {dur}{vol > 0 ? ` · ${vol.toLocaleString()} lb` : ""}</p>
              </div>
              {open ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
            </button>
            {open && (
              <div className="px-4 pb-3 space-y-2 border-t border-[#2a2a2a] pt-3">
                {exNames.map((exName) => {
                  const exSets = s.sets.filter((st) => st.exerciseName === exName);
                  return (
                    <div key={exName}>
                      <p className="text-xs font-medium text-gray-400 mb-1">{exName}</p>
                      <div className="space-y-0.5">
                        {exSets.map((st, i) => (
                          <p key={st.id} className="text-xs text-gray-600">
                            {st.warmup ? "Warmup" : `Set ${i + 1}`}: {formatWeight(st.weight)} × {st.reps} reps{st.rpe ? ` @ RPE ${st.rpe}` : ""}
                          </p>
                        ))}
                      </div>
                    </div>
                  );
                })}
                <button
                  onClick={() => { if (confirm("Delete this workout?")) onDelete(s.id); }}
                  className="mt-2 text-xs text-red-500 hover:text-red-400"
                >
                  Delete workout
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
