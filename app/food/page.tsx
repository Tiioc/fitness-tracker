"use client";
import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { Plus, Trash2, Search, X, ChevronLeft, PencilLine, ScanLine } from "lucide-react";
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

interface Macros { calories: number; protein: number; carbs: number; fat: number }
interface FoodSearchResult extends Macros { name: string; servingSize?: string; servings?: Serving[] }

const GRAM_PRESETS = [50, 100, 150, 200, 250];

async function searchFood(query: string): Promise<FoodSearchResult[]> {
  const res = await fetch(`/api/food-search?q=${encodeURIComponent(query)}`);
  if (!res.ok) return [];
  return res.json();
}

function scale(base: Macros, grams: number): Macros {
  const f = grams / 100;
  return {
    calories: Math.round(base.calories * f),
    protein: Math.round(base.protein * f),
    carbs: Math.round(base.carbs * f),
    fat: Math.round(base.fat * f),
  };
}

export default function FoodPage() {
  const today = todayStr();
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [macros, setMacros] = useState<Macros>({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [targets] = useState(getTargets());
  const [recent, setRecent] = useState<FoodEntry[]>([]);

  const [adding, setAdding] = useState<Meal | null>(null);
  const [step, setStep] = useState<"pick" | "portion" | "manual">("pick");

  const [searchQuery, setSearchQuery] = useState("");
  const [localResults, setLocalResults] = useState<FoodSearchResult[]>([]);
  const [searchResults, setSearchResults] = useState<FoodSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  // Portion step (scales a per-100g base)
  const [base, setBase] = useState<FoodSearchResult | null>(null);
  const [grams, setGrams] = useState("100");
  const [scanning, setScanning] = useState(false);

  // Manual step
  const [manual, setManual] = useState({ name: "", calories: "", protein: "", carbs: "", fat: "" });

  const searchRef = useRef<ReturnType<typeof setTimeout>>();

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
    // Instant offline matches from the built-in common-foods DB
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
    setBase(null);
    setGrams("100");
    setManual({ name: "", calories: "", protein: "", carbs: "", fat: "" });
  }
  function closeSheet() { setAdding(null); }

  function pickSearch(r: FoodSearchResult) {
    setBase(r);
    setGrams(String(defaultGrams(r)));
    setStep("portion");
  }

  async function lookupBarcode(code: string) {
    setScanning(false);
    try {
      const res = await fetch(`/api/barcode?code=${encodeURIComponent(code)}`);
      if (!res.ok) { toast.error("Product not found — try search or manual entry"); return; }
      const r: FoodSearchResult = await res.json();
      pickSearch(r);
    } catch {
      toast.error("Barcode lookup failed");
    }
  }

  function logScaled() {
    if (!adding || !base) return;
    const g = parseFloat(grams) || 0;
    if (g <= 0) { toast.error("Enter a portion size"); return; }
    saveFoodEntry({ id: uid(), date: today, meal: adding, name: base.name, ...scale(base, g), grams: g });
    reload();
    toast.success(`${base.name} added`);
    closeSheet();
  }

  function logManual() {
    if (!adding) return;
    if (!manual.name.trim()) { toast.error("Enter a food name"); return; }
    const cal = parseFloat(manual.calories) || 0;
    const p = parseFloat(manual.protein) || 0;
    const c = parseFloat(manual.carbs) || 0;
    const f = parseFloat(manual.fat) || 0;
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
  const preview = base ? scale(base, parseFloat(grams) || 0) : null;
  const autoCals = (() => {
    const p = parseFloat(manual.protein) || 0, c = parseFloat(manual.carbs) || 0, f = parseFloat(manual.fat) || 0;
    return Math.round(p * 4 + c * 4 + f * 9);
  })();

  return (
    <div className="p-4 space-y-4 pt-10">
      {scanning && <BarcodeScanner onDetected={lookupBarcode} onClose={() => setScanning(false)} />}
      <h1 className="text-2xl font-bold">Nutrition</h1>

      {/* Calorie ring summary */}
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
          <MacroChip label="Protein" value={macros.protein} target={targets.protein} unit="g" color="text-blue-400" />
          <MacroChip label="Carbs" value={macros.carbs} target={targets.carbs} unit="g" color="text-yellow-400" />
          <MacroChip label="Fat" value={macros.fat} target={targets.fat} unit="g" color="text-red-400" />
        </div>
      </div>

      <p className="text-xs text-gray-500 px-1 -mb-1">
        Targets per meal are split from your daily goal by nutrient timing — protein even across the day, carbs around training, fat higher at night.
      </p>

      {/* Meals */}
      {MEALS.map((meal) => {
        const mealEntries = entries.filter((e) => e.meal === meal);
        const mealCals = mealEntries.reduce((s, e) => s + e.calories, 0);
        const mt = mealTarget(meal, targets);
        const logged = mealEntries.reduce(
          (a, e) => ({ p: a.p + e.protein, c: a.c + e.carbs, f: a.f + e.fat }),
          { p: 0, c: 0, f: 0 }
        );
        const calPct = Math.min(100, mt.calories > 0 ? (mealCals / mt.calories) * 100 : 0);
        return (
          <div key={meal} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl overflow-hidden">
            <button
              onClick={() => openSheet(meal)}
              className="w-full px-4 pt-3 pb-2.5 text-left active:bg-[#222] transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">{MEAL_EMOJI[meal]}</span>
                  <div>
                    <p className="font-semibold capitalize leading-tight">{meal}</p>
                    <p className="text-[11px] text-gray-500">🕐 {mt.time}</p>
                  </div>
                </div>
                <span className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shrink-0">
                  <Plus size={16} />
                </span>
              </div>

              {/* Calories: logged vs target */}
              <div className="mt-2.5 flex items-center justify-between text-xs">
                <span className="text-gray-400">
                  <span className={cn(mealCals > 0 && "text-white font-medium")}>{mealCals}</span>
                  <span className="text-gray-600"> / {mt.calories} kcal</span>
                </span>
                <span className="text-[11px] text-gray-500">
                  P {Math.round(logged.p)}/{mt.protein} · C {Math.round(logged.c)}/{mt.carbs} · F {Math.round(logged.f)}/{mt.fat}
                </span>
              </div>
              <div className="mt-1.5 h-1 bg-[#2a2a2a] rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${calPct}%` }} />
              </div>
              <p className="mt-1.5 text-[10px] text-gray-600">{mt.note}</p>
            </button>
            {mealEntries.length > 0 && (
              <div className="border-t border-[#2a2a2a] divide-y divide-[#1f1f1f]">
                {mealEntries.map((e) => (
                  <div key={e.id} className="px-4 py-2.5 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{e.name}{e.grams ? <span className="text-gray-600"> · {e.grams}g</span> : null}</p>
                      <p className="text-xs text-gray-500">{e.calories} kcal · P {e.protein} · C {e.carbs} · F {e.fat}</p>
                    </div>
                    <button onClick={() => { deleteFoodEntry(e.id); reload(); }} className="ml-3 text-gray-600 hover:text-red-400 p-1.5">
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* ───────── Add sheet ───────── */}
      {adding && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end" onClick={closeSheet}>
          <div
            className="w-full max-w-lg mx-auto bg-[#111] border-t border-[#2a2a2a] rounded-t-3xl max-h-[88vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Grab handle */}
            <div className="pt-3 flex justify-center shrink-0">
              <div className="w-10 h-1 rounded-full bg-[#333]" />
            </div>

            {/* Header */}
            <div className="px-5 pt-3 pb-2 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                {step !== "pick" && (
                  <button onClick={() => setStep("pick")} className="p-1 -ml-1 text-gray-400">
                    <ChevronLeft size={20} />
                  </button>
                )}
                <h3 className="font-bold capitalize">
                  {step === "portion" ? "Portion" : step === "manual" ? "Manual entry" : `Add to ${adding}`}
                </h3>
              </div>
              <button onClick={closeSheet} className="p-1 text-gray-500"><X size={20} /></button>
            </div>

            <div className="px-5 pb-5 overflow-y-auto space-y-4">
              {/* STEP: PICK */}
              {step === "pick" && (
                <>
                  {recent.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Recent · tap to add</p>
                      <div className="flex flex-wrap gap-2">
                        {recent.map((f) => (
                          <button
                            key={f.id}
                            onClick={() => quickAdd(adding, f)}
                            className="flex items-center gap-1.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-full pl-3 pr-2.5 py-1.5 text-sm active:bg-[#252525] transition-colors"
                          >
                            <span className="truncate max-w-[140px]">{f.name}</span>
                            <span className="text-xs text-gray-500">{f.calories}</span>
                            <Plus size={13} className="text-blue-400" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        autoFocus
                        className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl pl-9 pr-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none focus:border-blue-500"
                        placeholder="Search any food..."
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

                  {(() => {
                    const localNames = new Set(localResults.map((r) => r.name.toLowerCase()));
                    const branded = searchResults.filter((r) => !localNames.has(r.name.toLowerCase()));
                    const combined = [...localResults, ...branded];
                    return (
                      <>
                        {combined.length > 0 && (
                          <div className="space-y-1.5">
                            {combined.map((r, i) => (
                              <button
                                key={i}
                                onClick={() => pickSearch(r)}
                                className="w-full text-left px-3 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl active:bg-[#222] transition-colors"
                              >
                                <p className="text-sm font-medium">{r.name}</p>
                                <p className="text-xs text-gray-500">{r.calories} kcal · P {r.protein} · C {r.carbs} · F {r.fat} <span className="text-gray-600">/ 100g</span></p>
                              </button>
                            ))}
                          </div>
                        )}
                        {searching && combined.length === 0 && (
                          <p className="text-xs text-gray-500 text-center py-2">Searching…</p>
                        )}
                        {!searching && searchQuery.trim() && combined.length === 0 && (
                          <p className="text-xs text-gray-500 text-center py-2">No matches — try manual entry below.</p>
                        )}
                      </>
                    );
                  })()}

                  <button
                    onClick={() => { setManual((m) => ({ ...m, name: searchQuery })); setStep("manual"); }}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-[#2a2a2a] text-sm text-gray-400 active:bg-[#1a1a1a] transition-colors"
                  >
                    <PencilLine size={15} /> Enter manually
                  </button>
                </>
              )}

              {/* STEP: PORTION */}
              {step === "portion" && base && (
                <>
                  <div>
                    <p className="font-semibold">{base.name}</p>
                    <p className="text-xs text-gray-500">{base.calories} kcal · P {base.protein} · C {base.carbs} · F {base.fat} per 100g</p>
                  </div>

                  {base.servings && base.servings.length > 0 && (
                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-500">Serving</label>
                      <div className="flex gap-2 flex-wrap">
                        {base.servings.map((sv) => (
                          <button
                            key={sv.label}
                            onClick={() => setGrams(String(sv.grams))}
                            className={cn(
                              "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                              String(sv.grams) === grams ? "bg-blue-600 border-blue-600 text-white" : "border-[#2a2a2a] text-gray-400"
                            )}
                          >
                            {sv.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-xs text-gray-500">How much? (grams)</label>
                    <input
                      type="number"
                      inputMode="decimal"
                      className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-lg font-semibold text-center text-white outline-none focus:border-blue-500"
                      value={grams}
                      onChange={(e) => setGrams(e.target.value)}
                    />
                    <div className="flex gap-2 overflow-x-auto no-scrollbar">
                      {GRAM_PRESETS.map((g) => (
                        <button
                          key={g}
                          onClick={() => setGrams(String(g))}
                          className={cn(
                            "shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors",
                            String(g) === grams ? "bg-blue-600 border-blue-600 text-white" : "border-[#2a2a2a] text-gray-400"
                          )}
                        >
                          {g}g
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Live preview */}
                  {preview && (
                    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4">
                      <div className="flex items-end justify-between mb-3">
                        <div>
                          <p className="text-2xl font-bold">{preview.calories}</p>
                          <p className="text-xs text-gray-500">kcal in this portion</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <PreviewMacro label="Protein" value={preview.protein} color="text-blue-400" />
                        <PreviewMacro label="Carbs" value={preview.carbs} color="text-yellow-400" />
                        <PreviewMacro label="Fat" value={preview.fat} color="text-red-400" />
                      </div>
                    </div>
                  )}

                  <button onClick={logScaled} className="w-full py-3.5 rounded-xl bg-blue-600 text-sm font-semibold text-white active:bg-blue-500 transition-colors">
                    Log to {adding}
                  </button>
                </>
              )}

              {/* STEP: MANUAL */}
              {step === "manual" && (
                <>
                  <input
                    autoFocus
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none focus:border-blue-500"
                    placeholder="Food name"
                    value={manual.name}
                    onChange={(e) => setManual((m) => ({ ...m, name: e.target.value }))}
                  />
                  <div className="grid grid-cols-2 gap-2.5">
                    <NumInput label="Calories" value={manual.calories} onChange={(v) => setManual((m) => ({ ...m, calories: v }))} />
                    <NumInput label="Protein (g)" value={manual.protein} onChange={(v) => setManual((m) => ({ ...m, protein: v }))} />
                    <NumInput label="Carbs (g)" value={manual.carbs} onChange={(v) => setManual((m) => ({ ...m, carbs: v }))} />
                    <NumInput label="Fat (g)" value={manual.fat} onChange={(v) => setManual((m) => ({ ...m, fat: v }))} />
                  </div>
                  {!manual.calories && autoCals > 0 && (
                    <button
                      onClick={() => setManual((m) => ({ ...m, calories: String(autoCals) }))}
                      className="text-xs text-blue-400"
                    >
                      Use ≈ {autoCals} kcal from macros
                    </button>
                  )}
                  <button onClick={logManual} className="w-full py-3.5 rounded-xl bg-blue-600 text-sm font-semibold text-white active:bg-blue-500 transition-colors">
                    Log to {adding}
                  </button>
                </>
              )}
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

function PreviewMacro({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-[#111] rounded-xl py-2">
      <p className={cn("font-bold text-sm", color)}>{value}g</p>
      <p className="text-[10px] text-gray-500">{label}</p>
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
        className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500"
        value={value}
        placeholder="0"
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
