"use client";
import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { Plus, Trash2, Search, X, ChevronLeft, ChevronRight, PencilLine, ScanLine } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  getFoodForDate, getFoodEntries, saveFoodEntry, deleteFoodEntry, getDailyMacros,
  getTargets, todayStr, uid,
} from "@/lib/storage";
import type { FoodEntry } from "@/lib/types";
import { searchCommonFoods, defaultGrams, type Serving } from "@/lib/foods";
import { mealTarget } from "@/lib/nutrition";

const BarcodeScanner = dynamic(() => import("@/components/BarcodeScanner"), { ssr: false });

type Meal = FoodEntry["meal"];
const MEALS: Meal[] = ["breakfast", "lunch", "dinner", "snack"];
const MEAL_EMOJI: Record<Meal, string> = { breakfast: "🍳", lunch: "🥗", dinner: "🍽️", snack: "🍎" };
const MEAL_LABEL: Record<Meal, string> = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snack" };

type Unit = "g" | "oz" | "cup" | "tbsp" | "tsp";
const UNIT_TO_G: Record<Unit, number> = { g: 1, oz: 28.35, cup: 240, tbsp: 15, tsp: 5 };
const UNITS: Unit[] = ["g", "oz", "cup", "tbsp", "tsp"];
const UNIT_PRESETS: Record<Unit, number[]> = {
  g:    [50, 100, 150, 200, 250],
  oz:   [1, 2, 3, 4, 6],
  cup:  [0.25, 0.5, 0.75, 1, 2],
  tbsp: [1, 2, 3, 4],
  tsp:  [1, 2, 3],
};

interface Macros { calories: number; protein: number; carbs: number; fat: number }
interface FoodSearchResult extends Macros { name: string; servingSize?: string; servings?: Serving[] }

async function searchFood(query: string): Promise<FoodSearchResult[]> {
  const res = await fetch(`/api/food-search?q=${encodeURIComponent(query)}`);
  if (!res.ok) return [];
  return res.json();
}

function scale(base: Macros, grams: number): Macros {
  const f = grams / 100;
  return {
    calories: Math.round(base.calories * f),
    protein:  Math.round(base.protein  * f),
    carbs:    Math.round(base.carbs    * f),
    fat:      Math.round(base.fat      * f),
  };
}

export default function FoodPage() {
  const today = todayStr();
  const [entries, setEntries]   = useState<FoodEntry[]>([]);
  const [macros, setMacros]     = useState<Macros>({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [targets]               = useState(getTargets());
  const [recent, setRecent]     = useState<FoodEntry[]>([]);

  const [adding, setAdding]     = useState<Meal | null>(null);
  const [step, setStep]         = useState<"pick" | "portion" | "manual">("pick");

  const [searchQuery, setSearchQuery]   = useState("");
  const [localResults, setLocalResults] = useState<FoodSearchResult[]>([]);
  const [searchResults, setSearchResults] = useState<FoodSearchResult[]>([]);
  const [searching, setSearching]       = useState(false);

  const [base, setBase]         = useState<FoodSearchResult | null>(null);
  const [amount, setAmount]     = useState("100");
  const [unit, setUnit]         = useState<Unit>("g");
  const [scanning, setScanning] = useState(false);

  const [manual, setManual] = useState({ name: "", calories: "", protein: "", carbs: "", fat: "" });
  const searchRef = useRef<ReturnType<typeof setTimeout>>();

  // Derive effective grams from current amount + unit
  const effectiveGrams = (parseFloat(amount) || 0) * UNIT_TO_G[unit];
  const preview = base ? scale(base, effectiveGrams) : null;

  function getRecentFoods(): FoodEntry[] {
    const all = getFoodEntries();
    const seen = new Set<string>();
    const out: FoodEntry[] = [];
    for (const e of [...all].reverse()) {
      const k = e.name.toLowerCase().trim();
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(e);
      if (out.length >= 8) break;
    }
    return out;
  }

  function reload() {
    setEntries(getFoodForDate(today));
    setMacros(getDailyMacros(today));
    setRecent(getRecentFoods());
  }

  useEffect(() => { reload(); }, [today]);

  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) { setLocalResults([]); setSearchResults([]); setSearching(false); return; }
    setLocalResults(searchCommonFoods(q).map((f) => ({ ...f })));
    if (searchRef.current) clearTimeout(searchRef.current);
    setSearching(true);
    searchRef.current = setTimeout(async () => {
      setSearchResults(await searchFood(q));
      setSearching(false);
    }, 450);
  }, [searchQuery]);

  function openSheet(meal: Meal) {
    setAdding(meal);
    setStep("pick");
    setSearchQuery("");
    setSearchResults([]);
    setLocalResults([]);
    setBase(null);
    setAmount("100");
    setUnit("g");
    setManual({ name: "", calories: "", protein: "", carbs: "", fat: "" });
  }
  function closeSheet() { setAdding(null); }

  function pickFood(r: FoodSearchResult) {
    setBase(r);
    setAmount(String(defaultGrams(r)));
    setUnit("g");
    setStep("portion");
  }

  // When user switches unit, auto-convert the current amount
  function changeUnit(newUnit: Unit) {
    const curG = (parseFloat(amount) || 0) * UNIT_TO_G[unit];
    if (curG > 0) {
      const converted = curG / UNIT_TO_G[newUnit];
      setAmount(String(Math.round(converted * 10) / 10));
    }
    setUnit(newUnit);
  }

  async function lookupBarcode(code: string) {
    setScanning(false);
    try {
      const res = await fetch(`/api/barcode?code=${encodeURIComponent(code)}`);
      if (!res.ok) { toast.error("Product not found — try search or manual entry"); return; }
      const r: FoodSearchResult = await res.json();
      pickFood(r);
    } catch {
      toast.error("Barcode lookup failed");
    }
  }

  function logScaled() {
    if (!adding || !base) return;
    if (effectiveGrams <= 0) { toast.error("Enter a portion size"); return; }
    saveFoodEntry({
      id: uid(), date: today, meal: adding, name: base.name,
      ...scale(base, effectiveGrams),
      grams: Math.round(effectiveGrams),
    });
    reload();
    toast.success(`${base.name} added to ${MEAL_LABEL[adding].toLowerCase()}`);
    closeSheet();
  }

  function logManual() {
    if (!adding) return;
    if (!manual.name.trim()) { toast.error("Enter a food name"); return; }
    const cal = parseFloat(manual.calories) || 0;
    const p   = parseFloat(manual.protein)  || 0;
    const c   = parseFloat(manual.carbs)    || 0;
    const f   = parseFloat(manual.fat)      || 0;
    if (cal <= 0 && p <= 0 && c <= 0 && f <= 0) { toast.error("Enter calories or macros"); return; }
    saveFoodEntry({
      id: uid(), date: today, meal: adding, name: manual.name.trim(),
      calories: cal || Math.round(p * 4 + c * 4 + f * 9),
      protein: p, carbs: c, fat: f,
    });
    reload();
    toast.success("Food logged");
    closeSheet();
  }

  function quickAdd(meal: Meal, f: FoodEntry) {
    const { id: _id, date: _date, meal: _meal, ...rest } = f;
    saveFoodEntry({ ...rest, id: uid(), date: today, meal });
    reload();
    toast.success(`${f.name} added`);
  }

  const remaining = targets.calories - macros.calories;
  const autoCals = (() => {
    const p = parseFloat(manual.protein) || 0;
    const c = parseFloat(manual.carbs)   || 0;
    const f = parseFloat(manual.fat)     || 0;
    return Math.round(p * 4 + c * 4 + f * 9);
  })();

  const canLog =
    step === "portion" ? (base !== null && effectiveGrams > 0) :
    step === "manual"  ? (manual.name.trim().length > 0) : false;

  return (
    <div className="p-4 space-y-4 pt-10 pb-24">
      {scanning && <BarcodeScanner onDetected={lookupBarcode} onClose={() => setScanning(false)} />}
      <h1 className="text-2xl font-bold">Nutrition</h1>

      {/* Daily summary */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4 space-y-3">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-bold">{macros.calories}</p>
            <p className="text-xs text-gray-500">of {targets.calories} kcal</p>
          </div>
          <div className={cn("text-sm font-semibold", remaining >= 0 ? "text-green-400" : "text-red-400")}>
            {remaining >= 0 ? `${remaining} left` : `${Math.abs(remaining)} over`}
          </div>
        </div>
        <div className="h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all", remaining >= 0 ? "bg-green-500" : "bg-red-500")}
            style={{ width: `${Math.min(100, targets.calories > 0 ? (macros.calories / targets.calories) * 100 : 0)}%` }}
          />
        </div>
        <div className="grid grid-cols-3 gap-3 pt-1">
          <MacroChip label="Protein" value={macros.protein} target={targets.protein} color="text-blue-400" />
          <MacroChip label="Carbs"   value={macros.carbs}   target={targets.carbs}   color="text-yellow-400" />
          <MacroChip label="Fat"     value={macros.fat}     target={targets.fat}     color="text-red-400" />
        </div>
      </div>

      {/* Meals */}
      {MEALS.map((meal) => {
        const mealEntries = entries.filter((e) => e.meal === meal);
        const mealCals    = mealEntries.reduce((s, e) => s + e.calories, 0);
        const mt          = mealTarget(meal, targets);
        const logged      = mealEntries.reduce(
          (a, e) => ({ p: a.p + e.protein, c: a.c + e.carbs, f: a.f + e.fat }),
          { p: 0, c: 0, f: 0 },
        );
        const calPct = Math.min(100, mt.calories > 0 ? (mealCals / mt.calories) * 100 : 0);

        return (
          <div key={meal} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl overflow-hidden">
            <div className="px-4 pt-3 pb-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{MEAL_EMOJI[meal]}</span>
                  <div>
                    <p className="font-semibold leading-tight">{MEAL_LABEL[meal]}</p>
                    <p className="text-[11px] text-gray-500">🕐 {mt.time}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">
                    <span className={mealCals > 0 ? "text-white" : "text-gray-600"}>{mealCals}</span>
                    <span className="text-gray-600 font-normal">/{mt.calories}</span>
                    <span className="text-gray-600 font-normal text-xs"> kcal</span>
                  </p>
                  <p className="text-[10px] text-gray-600">
                    P {Math.round(logged.p)}/{mt.protein} · C {Math.round(logged.c)}/{mt.carbs} · F {Math.round(logged.f)}/{mt.fat}
                  </p>
                </div>
              </div>
              <div className="mt-2 h-1 bg-[#2a2a2a] rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${calPct}%` }} />
              </div>
              <p className="mt-1 text-[10px] text-gray-600">{mt.note}</p>
            </div>

            {mealEntries.length > 0 && (
              <div className="border-t border-[#2a2a2a] divide-y divide-[#1f1f1f]">
                {mealEntries.map((e) => (
                  <div key={e.id} className="px-4 py-2.5 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">
                        {e.name}
                        {e.grams ? <span className="text-gray-600"> · {e.grams}g</span> : null}
                      </p>
                      <p className="text-xs text-gray-500">{e.calories} kcal · P {e.protein}g · C {e.carbs}g · F {e.fat}g</p>
                    </div>
                    <button
                      onClick={() => { deleteFoodEntry(e.id); reload(); }}
                      className="ml-3 text-gray-600 hover:text-red-400 p-1.5 shrink-0"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-[#2a2a2a]">
              <button
                onClick={() => openSheet(meal)}
                className="w-full px-4 py-3 flex items-center gap-2 text-blue-400 text-sm font-medium active:bg-[#222] transition-colors"
              >
                <Plus size={16} />
                Add food to {MEAL_LABEL[meal].toLowerCase()}
              </button>
            </div>
          </div>
        );
      })}

      {/* ───────────── Add sheet ───────────── */}
      {adding && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
          onClick={closeSheet}
        >
          <div
            className="w-full max-w-lg mx-auto bg-[#111] rounded-t-3xl flex flex-col"
            style={{ maxHeight: "90vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="pt-3 pb-1 flex justify-center shrink-0">
              <div className="w-10 h-1 rounded-full bg-[#333]" />
            </div>

            {/* Header */}
            <div className="px-5 pt-2 pb-3 flex items-center justify-between shrink-0 border-b border-[#2a2a2a]">
              <div className="flex items-center gap-2">
                {step !== "pick" && (
                  <button onClick={() => setStep("pick")} className="p-1 -ml-1 text-gray-400">
                    <ChevronLeft size={20} />
                  </button>
                )}
                <div>
                  <h3 className="font-bold text-base">
                    {step === "portion" && base
                      ? base.name
                      : step === "manual"
                      ? "Manual entry"
                      : `Add to ${MEAL_LABEL[adding]}`}
                  </h3>
                  {step === "pick" && (
                    <p className="text-xs text-gray-500">{MEAL_EMOJI[adding]} {MEAL_LABEL[adding]}</p>
                  )}
                  {step === "portion" && base && (
                    <p className="text-xs text-gray-500">
                      {base.calories} kcal · P {base.protein}g · C {base.carbs}g · F {base.fat}g per 100g
                    </p>
                  )}
                </div>
              </div>
              <button onClick={closeSheet} className="p-1.5 text-gray-400 bg-[#2a2a2a] rounded-full">
                <X size={16} />
              </button>
            </div>

            {/* ── Scrollable body ── */}
            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

              {/* STEP: PICK */}
              {step === "pick" && (
                <>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                      <input
                        className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl pl-9 pr-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none focus:border-blue-500"
                        placeholder="Search any food…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <button
                      onClick={() => setScanning(true)}
                      className="shrink-0 px-3.5 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] text-blue-400 active:bg-[#222] transition-colors flex items-center justify-center"
                      aria-label="Scan barcode"
                    >
                      <ScanLine size={18} />
                    </button>
                  </div>

                  {/* Search results */}
                  {(() => {
                    const localNames = new Set(localResults.map((r) => r.name.toLowerCase()));
                    const branded    = searchResults.filter((r) => !localNames.has(r.name.toLowerCase()));
                    const combined   = [...localResults, ...branded];
                    if (combined.length > 0) {
                      return (
                        <div className="space-y-1.5">
                          {combined.map((r, i) => (
                            <button
                              key={i}
                              onClick={() => pickFood(r)}
                              className="w-full text-left px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl active:bg-[#222] transition-colors flex items-center gap-3"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{r.name}</p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {r.calories} kcal · P {r.protein}g · C {r.carbs}g · F {r.fat}g
                                  <span className="text-gray-600"> / 100g</span>
                                </p>
                              </div>
                              <ChevronRight size={16} className="text-gray-600 shrink-0" />
                            </button>
                          ))}
                        </div>
                      );
                    }
                    if (searching)           return <p className="text-xs text-gray-500 text-center py-4">Searching…</p>;
                    if (searchQuery.trim())  return <p className="text-xs text-gray-500 text-center py-4">No matches — try manual entry below.</p>;
                    return null;
                  })()}

                  {/* Recent foods */}
                  {!searchQuery.trim() && recent.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Recently added</p>
                      <div className="space-y-1.5">
                        {recent.map((f) => (
                          <button
                            key={f.id}
                            onClick={() => quickAdd(adding, f)}
                            className="w-full text-left px-4 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl active:bg-[#222] transition-colors flex items-center justify-between"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-sm truncate">{f.name}</p>
                              <p className="text-xs text-gray-500">{f.calories} kcal</p>
                            </div>
                            <span className="text-xs text-blue-400 font-semibold shrink-0 ml-2 flex items-center gap-1">
                              <Plus size={12} /> Add
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Manual entry */}
                  <button
                    onClick={() => { setManual((m) => ({ ...m, name: searchQuery })); setStep("manual"); }}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-[#333] text-sm text-gray-400 active:bg-[#1a1a1a] transition-colors"
                  >
                    <PencilLine size={15} /> Enter macros manually
                  </button>
                </>
              )}

              {/* STEP: PORTION */}
              {step === "portion" && base && (
                <>
                  {/* Common servings from food DB */}
                  {base.servings && base.servings.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Common servings</p>
                      <div className="flex gap-2 flex-wrap">
                        {base.servings.map((sv) => {
                          const isActive = unit === "g" && String(sv.grams) === amount;
                          return (
                            <button
                              key={sv.label}
                              onClick={() => { setUnit("g"); setAmount(String(sv.grams)); }}
                              className={cn(
                                "px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors",
                                isActive
                                  ? "bg-blue-600 border-blue-600 text-white"
                                  : "border-[#2a2a2a] text-gray-400 bg-[#1a1a1a]",
                              )}
                            >
                              {sv.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Unit selector */}
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Unit</p>
                    <div className="flex gap-1.5">
                      {UNITS.map((u) => (
                        <button
                          key={u}
                          onClick={() => changeUnit(u)}
                          className={cn(
                            "flex-1 py-2 rounded-lg text-xs font-semibold border transition-colors",
                            unit === u
                              ? "bg-blue-600 border-blue-600 text-white"
                              : "border-[#2a2a2a] text-gray-400 bg-[#1a1a1a]",
                          )}
                        >
                          {u}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Amount input */}
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Amount</p>
                    <div className="relative">
                      <input
                        type="number"
                        inputMode="decimal"
                        className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 pr-16 py-3 text-3xl font-bold text-center text-white outline-none focus:border-blue-500"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium pointer-events-none">
                        {unit}
                      </span>
                    </div>
                    {/* Quick presets for current unit */}
                    <div className="flex gap-1.5">
                      {UNIT_PRESETS[unit].map((p) => (
                        <button
                          key={p}
                          onClick={() => setAmount(String(p))}
                          className={cn(
                            "flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                            String(p) === amount
                              ? "bg-blue-600 border-blue-600 text-white"
                              : "border-[#2a2a2a] text-gray-400 bg-[#1a1a1a]",
                          )}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                    {unit !== "g" && effectiveGrams > 0 && (
                      <p className="text-xs text-gray-600 text-center">≈ {Math.round(effectiveGrams)}g</p>
                    )}
                  </div>

                  {/* Live macro preview */}
                  {preview && (
                    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4">
                      <p className="text-3xl font-bold">
                        {preview.calories}
                        <span className="text-base font-normal text-gray-500 ml-1">kcal</span>
                      </p>
                      <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                        <div className="bg-[#111] rounded-xl py-2">
                          <p className="text-lg font-bold text-blue-400">{preview.protein}g</p>
                          <p className="text-[10px] text-gray-500">Protein</p>
                        </div>
                        <div className="bg-[#111] rounded-xl py-2">
                          <p className="text-lg font-bold text-yellow-400">{preview.carbs}g</p>
                          <p className="text-[10px] text-gray-500">Carbs</p>
                        </div>
                        <div className="bg-[#111] rounded-xl py-2">
                          <p className="text-lg font-bold text-red-400">{preview.fat}g</p>
                          <p className="text-[10px] text-gray-500">Fat</p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* STEP: MANUAL */}
              {step === "manual" && (
                <>
                  <input
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none focus:border-blue-500"
                    placeholder="Food name (e.g. Greek yogurt)"
                    value={manual.name}
                    onChange={(e) => setManual((m) => ({ ...m, name: e.target.value }))}
                  />
                  <div className="grid grid-cols-2 gap-2.5">
                    <NumInput label="Calories"   value={manual.calories} onChange={(v) => setManual((m) => ({ ...m, calories: v }))} />
                    <NumInput label="Protein (g)" value={manual.protein}  onChange={(v) => setManual((m) => ({ ...m, protein: v }))} />
                    <NumInput label="Carbs (g)"   value={manual.carbs}    onChange={(v) => setManual((m) => ({ ...m, carbs: v }))} />
                    <NumInput label="Fat (g)"     value={manual.fat}      onChange={(v) => setManual((m) => ({ ...m, fat: v }))} />
                  </div>
                  {!manual.calories && autoCals > 0 && (
                    <button
                      onClick={() => setManual((m) => ({ ...m, calories: String(autoCals) }))}
                      className="text-xs text-blue-400 text-left"
                    >
                      ≈ {autoCals} kcal calculated from macros — tap to use
                    </button>
                  )}
                </>
              )}

            </div>{/* end scrollable body */}

            {/* ── Fixed footer: Log button — stays above keyboard & home bar ── */}
            {(step === "portion" || step === "manual") && (
              <div
                className="px-5 pt-3 shrink-0 border-t border-[#2a2a2a] bg-[#111]"
                style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom, 1.25rem))" }}
              >
                <button
                  onClick={step === "portion" ? logScaled : logManual}
                  disabled={!canLog}
                  className={cn(
                    "w-full py-4 rounded-2xl text-base font-bold transition-colors",
                    canLog
                      ? "bg-blue-600 text-white active:bg-blue-500"
                      : "bg-[#2a2a2a] text-gray-600 cursor-not-allowed",
                  )}
                >
                  Log to {MEAL_LABEL[adding]}
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function MacroChip({
  label, value, target, color,
}: {
  label: string; value: number; target: number; color: string;
}) {
  const pct = Math.min(100, target > 0 ? (value / target) * 100 : 0);
  return (
    <div className="space-y-1.5">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={cn("font-bold text-sm", color)}>
        {Math.round(value)}
        <span className="text-gray-600 font-normal text-xs">/{target}g</span>
      </p>
      <div className="h-1 bg-[#2a2a2a] rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full", color.replace("text-", "bg-"))}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function NumInput({
  label, value, onChange,
}: {
  label: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-gray-500">{label}</label>
      <input
        type="number"
        inputMode="decimal"
        className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500"
        value={value}
        placeholder="0"
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
