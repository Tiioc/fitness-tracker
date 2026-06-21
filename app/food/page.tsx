"use client";
import { useEffect, useState, useRef } from "react";
import { Plus, Trash2, Search, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  getFoodForDate, saveFoodEntry, deleteFoodEntry, getDailyMacros,
  getTargets, todayStr, uid,
} from "@/lib/storage";
import type { FoodEntry } from "@/lib/types";

type Meal = FoodEntry["meal"];
const MEALS: Meal[] = ["breakfast", "lunch", "dinner", "snack"];

interface FoodSearchResult {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize?: string;
}

async function searchFood(query: string): Promise<FoodSearchResult[]> {
  const res = await fetch(`/api/food-search?q=${encodeURIComponent(query)}`);
  if (!res.ok) return [];
  return res.json();
}

export default function FoodPage() {
  const today = todayStr();
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [macros, setMacros] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [targets] = useState(getTargets());
  const [adding, setAdding] = useState<Meal | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FoodSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [form, setForm] = useState({ name: "", calories: "", protein: "", carbs: "", fat: "", grams: "100" });

  const searchRef = useRef<ReturnType<typeof setTimeout>>();

  function reload() {
    setEntries(getFoodForDate(today));
    setMacros(getDailyMacros(today));
  }

  useEffect(() => { reload(); }, [today]);

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(async () => {
      setSearching(true);
      const results = await searchFood(searchQuery);
      setSearchResults(results);
      setSearching(false);
    }, 500);
  }, [searchQuery]);

  function pickFood(f: FoodSearchResult) {
    setForm({ name: f.name, calories: String(f.calories), protein: String(f.protein), carbs: String(f.carbs), fat: String(f.fat), grams: "100" });
    setManualMode(true);
    setSearchResults([]);
  }

  function saveEntry() {
    if (!adding || !form.name || !form.calories) { toast.error("Name and calories required"); return; }
    const entry: FoodEntry = {
      id: uid(),
      date: today,
      meal: adding,
      name: form.name,
      calories: parseFloat(form.calories) || 0,
      protein: parseFloat(form.protein) || 0,
      carbs: parseFloat(form.carbs) || 0,
      fat: parseFloat(form.fat) || 0,
      grams: parseFloat(form.grams) || undefined,
    };
    saveFoodEntry(entry);
    reload();
    setAdding(null);
    setForm({ name: "", calories: "", protein: "", carbs: "", fat: "", grams: "100" });
    setManualMode(false);
    setSearchQuery("");
    toast.success("Food logged!");
  }

  const remaining = targets.calories - macros.calories;

  return (
    <div className="p-4 space-y-4 pt-10">
      <h1 className="text-2xl font-bold">Nutrition</h1>

      {/* Macro summary */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4 space-y-3">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-bold">{macros.calories}</p>
            <p className="text-xs text-gray-500">of {targets.calories} kcal</p>
          </div>
          <div className={cn("text-sm font-semibold", remaining >= 0 ? "text-green-400" : "text-red-400")}>
            {remaining >= 0 ? `${remaining} remaining` : `${Math.abs(remaining)} over`}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 pt-1">
          <MacroChip label="Protein" value={macros.protein} target={targets.protein} unit="g" color="text-blue-400" />
          <MacroChip label="Carbs" value={macros.carbs} target={targets.carbs} unit="g" color="text-yellow-400" />
          <MacroChip label="Fat" value={macros.fat} target={targets.fat} unit="g" color="text-red-400" />
        </div>
      </div>

      {/* Meals */}
      {MEALS.map((meal) => {
        const mealEntries = entries.filter((e) => e.meal === meal);
        const mealCals = mealEntries.reduce((s, e) => s + e.calories, 0);
        return (
          <div key={meal} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl overflow-hidden">
            <div className="px-4 py-3 flex items-center justify-between">
              <div>
                <p className="font-semibold capitalize">{meal}</p>
                <p className="text-xs text-gray-500">{mealCals > 0 ? `${mealCals} kcal` : "Nothing logged"}</p>
              </div>
              <button onClick={() => { setAdding(meal); setManualMode(false); setSearchQuery(""); }} className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center">
                <Plus size={14} />
              </button>
            </div>
            {mealEntries.length > 0 && (
              <div className="border-t border-[#2a2a2a] divide-y divide-[#1f1f1f]">
                {mealEntries.map((e) => (
                  <div key={e.id} className="px-4 py-2.5 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{e.name}</p>
                      <p className="text-xs text-gray-500">{e.calories} kcal · P {e.protein}g · C {e.carbs}g · F {e.fat}g</p>
                    </div>
                    <button onClick={() => { deleteFoodEntry(e.id); reload(); }} className="ml-3 text-gray-600 hover:text-red-400 p-1">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Add food sheet */}
      {adding && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end" onClick={() => setAdding(null)}>
          <div className="w-full max-w-lg mx-auto bg-[#111] border border-[#2a2a2a] rounded-t-3xl p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold capitalize">Add to {adding}</h3>
              <button onClick={() => setAdding(null)}><X size={20} className="text-gray-500" /></button>
            </div>

            {!manualMode && (
              <>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    autoFocus
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:border-blue-500"
                    placeholder="Search food..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                {searching && <p className="text-xs text-gray-500 text-center">Searching...</p>}
                {searchResults.length > 0 && (
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {searchResults.map((r, i) => (
                      <button key={i} onClick={() => pickFood(r)} className="w-full text-left px-3 py-2.5 bg-[#1a1a1a] rounded-xl hover:bg-[#222] transition-colors">
                        <p className="text-sm font-medium">{r.name}</p>
                        <p className="text-xs text-gray-500">{r.calories} kcal · P {r.protein}g · C {r.carbs}g · F {r.fat}g</p>
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-[#2a2a2a]" />
                  <button onClick={() => setManualMode(true)} className="text-xs text-gray-500 hover:text-white">Enter manually</button>
                  <div className="flex-1 h-px bg-[#2a2a2a]" />
                </div>
              </>
            )}

            {manualMode && (
              <div className="space-y-3">
                <input
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:border-blue-500"
                  placeholder="Food name *"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
                <div className="grid grid-cols-2 gap-2">
                  <NumInput label="Calories *" value={form.calories} onChange={(v) => setForm((f) => ({ ...f, calories: v }))} />
                  <NumInput label="Protein (g)" value={form.protein} onChange={(v) => setForm((f) => ({ ...f, protein: v }))} />
                  <NumInput label="Carbs (g)" value={form.carbs} onChange={(v) => setForm((f) => ({ ...f, carbs: v }))} />
                  <NumInput label="Fat (g)" value={form.fat} onChange={(v) => setForm((f) => ({ ...f, fat: v }))} />
                </div>
                <button onClick={() => setManualMode(false)} className="text-xs text-gray-500">← Search instead</button>
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={() => setAdding(null)} className="flex-1 py-3 rounded-xl border border-[#2a2a2a] text-sm text-gray-400">Cancel</button>
              <button onClick={saveEntry} className="flex-1 py-3 rounded-xl bg-blue-600 text-sm font-semibold text-white">Log Food</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MacroChip({ label, value, target, unit, color }: { label: string; value: number; target: number; unit: string; color: string }) {
  const pct = Math.min(100, target > 0 ? (value / target) * 100 : 0);
  return (
    <div className="space-y-1.5">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={cn("font-bold text-sm", color)}>{Math.round(value)}<span className="text-gray-600 font-normal text-xs">/{target}{unit}</span></p>
      <div className="h-1 bg-[#2a2a2a] rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full", color.replace("text-", "bg-"))} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function NumInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-gray-500">{label}</label>
      <input
        type="number"
        inputMode="decimal"
        className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
        value={value}
        placeholder="0"
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
