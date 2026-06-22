"use client";
import { useEffect, useState, useRef } from "react";
import {
  Plus, Trash2, Check, ChevronDown, ChevronUp, X, History, Dumbbell, Clock
} from "lucide-react";
import { toast } from "sonner";
import { cn, formatDate, formatWeight, parseDuration } from "@/lib/utils";
import {
  saveSession, getSessionsForDate, getRecentSessions, deleteSession,
  todayStr, uid, getLastPerformance,
} from "@/lib/storage";
import type { PrevPerf } from "@/lib/storage";
import { getTodayProgram, PROGRAM } from "@/lib/program";
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
    const p = programIdx !== undefined ? PROGRAM[programIdx] : program;
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

  function updateSet(setId: string, field: "weight" | "reps", value: number) {
    if (!session) return;
    const updated = {
      ...session,
      sets: session.sets.map((s) => s.id === setId ? { ...s, [field]: value } : s),
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
  onUpdateSet: (id: string, field: "weight" | "reps", v: number) => void;
  onToggleSet: (id: string) => void;
  onAddSet: (ex: string) => void;
  onRemoveSet: (id: string) => void;
  onAddExercise: (name: string, sets?: number) => void;
  onFinish: () => void;
  onDiscard: () => void;
}) {
  const [addingEx, setAddingEx] = useState(false);
  const [newExName, setNewExName] = useState("");
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
    if (completing) startRestTimer();
  }

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const completedCount = session.sets.filter((s) => s.completed).length;
  const totalSets = session.sets.length;

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
            <span className="flex items-center gap-1"><Clock size={11} />{String(mins).padStart(2,"0")}:{String(secs).padStart(2,"00")}</span>
            <span>{completedCount}/{totalSets} sets</span>
          </div>
        </div>
        <div className="flex gap-2">
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

        {addingEx ? (
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4 space-y-3">
            <p className="font-medium text-sm">Add Exercise</p>
            <input
              autoFocus
              className="w-full bg-[#111] border border-[#2a2a2a] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:border-blue-500"
              placeholder="Exercise name..."
              value={newExName}
              onChange={(e) => setNewExName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newExName.trim()) {
                  onAddExercise(newExName.trim());
                  setNewExName("");
                  setAddingEx(false);
                }
              }}
            />
            <div className="flex gap-2">
              <button onClick={() => setAddingEx(false)} className="flex-1 py-2 rounded-xl border border-[#2a2a2a] text-sm text-gray-400">Cancel</button>
              <button
                onClick={() => { if (newExName.trim()) { onAddExercise(newExName.trim()); setNewExName(""); setAddingEx(false); } }}
                className="flex-1 py-2 rounded-xl bg-blue-600 text-sm font-medium text-white"
              >Add</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setAddingEx(true)} className="w-full bg-[#1a1a1a] border border-dashed border-[#2a2a2a] rounded-2xl p-4 flex items-center justify-center gap-2 text-gray-500 hover:border-blue-500/50 hover:text-blue-400 transition-colors">
            <Plus size={18} />
            <span className="text-sm">Add Exercise</span>
          </button>
        )}
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
    </div>
  );
}

// ── Exercise Block ────────────────────────────────────────────────────────────────

function ExerciseBlock({
  name, sets, prevPerf, onUpdate, onToggle, onAddSet, onRemoveSet,
}: {
  name: string;
  sets: WorkoutSet[];
  prevPerf: PrevPerf | null;
  onUpdate: (id: string, f: "weight" | "reps", v: number) => void;
  onToggle: (id: string) => void;
  onAddSet: () => void;
  onRemoveSet: (id: string) => void;
}) {
  const completed = sets.filter((s) => s.completed).length;
  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between">
        <div>
          <p className="font-semibold text-sm">{name}</p>
          <p className="text-xs text-gray-500">{completed}/{sets.length} sets done</p>
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

      <div className="grid grid-cols-12 gap-2 px-4 pb-1 text-xs text-gray-600">
        <span className="col-span-1">SET</span>
        <span className="col-span-4 text-center">WEIGHT (lbs)</span>
        <span className="col-span-4 text-center">REPS</span>
        <span className="col-span-2 text-center">DONE</span>
        <span className="col-span-1" />
      </div>
      <div className="divide-y divide-[#1f1f1f]">
        {sets.map((s, i) => (
          <div key={s.id} className={cn("grid grid-cols-12 gap-2 items-center px-4 py-2.5 transition-colors", s.completed && "bg-green-900/10")}>
            <span className="col-span-1 text-xs text-gray-500">{i + 1}</span>
            <div className="col-span-4">
              <input
                type="number"
                inputMode="decimal"
                className="w-full bg-[#111] border border-[#2a2a2a] rounded-lg px-2 py-1.5 text-sm text-center text-white outline-none focus:border-blue-500"
                value={s.weight || ""}
                placeholder={prevPerf?.sets[i]?.weight ? String(prevPerf.sets[i].weight) : "0"}
                onChange={(e) => onUpdate(s.id, "weight", parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="col-span-4">
              <input
                type="number"
                inputMode="numeric"
                className="w-full bg-[#111] border border-[#2a2a2a] rounded-lg px-2 py-1.5 text-sm text-center text-white outline-none focus:border-blue-500"
                value={s.reps || ""}
                placeholder={prevPerf?.sets[i]?.reps ? String(prevPerf.sets[i].reps) : "0"}
                onChange={(e) => onUpdate(s.id, "reps", parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="col-span-2 flex justify-center">
              <button
                onClick={() => onToggle(s.id)}
                className={cn(
                  "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors",
                  s.completed ? "bg-green-500 border-green-500" : "border-[#3a3a3a]"
                )}
              >
                {s.completed && <Check size={14} />}
              </button>
            </div>
            <div className="col-span-1 flex justify-end">
              <button onClick={() => onRemoveSet(s.id)} className="text-gray-600 hover:text-red-400 p-1">
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

// ── History View ────────────────────────────────────────────────────────────────

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
        const exNames = [...new Set(s.sets.map((st) => st.exerciseName))];
        return (
          <div key={s.id} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl overflow-hidden">
            <button
              onClick={() => setExpanded(open ? null : s.id)}
              className="w-full px-4 py-3 flex items-center justify-between text-left"
            >
              <div>
                <p className="font-semibold text-sm">{s.name}</p>
                <p className="text-xs text-gray-500">{formatDate(s.date)} · {totalSets} sets · {dur}</p>
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
                            Set {i + 1}: {formatWeight(st.weight)} × {st.reps} reps
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
