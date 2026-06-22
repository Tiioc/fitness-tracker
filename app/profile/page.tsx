"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronLeft, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { getProfile, saveProfile, saveTargets } from "@/lib/storage";
import { calculateTargets, ACTIVITY_LABEL, GOAL_LABEL, inchesToFtIn } from "@/lib/profile";
import type { UserProfile, Sex, ActivityLevel, Goal } from "@/lib/types";

const ACTIVITIES: ActivityLevel[] = ["sedentary", "light", "moderate", "active", "very_active"];
const GOALS: Goal[] = ["cut", "maintain", "lean_bulk"];

export default function ProfilePage() {
  const router = useRouter();
  const existing = getProfile();
  const startFtIn = existing ? inchesToFtIn(existing.heightIn) : { ft: 5, in: 10 };

  const [sex, setSex] = useState<Sex>(existing?.sex ?? "male");
  const [age, setAge] = useState(existing ? String(existing.age) : "");
  const [ft, setFt] = useState(String(startFtIn.ft));
  const [inch, setInch] = useState(String(startFtIn.in));
  const [weight, setWeight] = useState(existing ? String(existing.weightLb) : "");
  const [activity, setActivity] = useState<ActivityLevel>(existing?.activity ?? "moderate");
  const [goal, setGoal] = useState<Goal>(existing?.goal ?? "cut");

  const profile: UserProfile | null = (() => {
    const a = parseInt(age), f = parseInt(ft) || 0, i = parseInt(inch) || 0, w = parseFloat(weight);
    const heightIn = f * 12 + i;
    if (!a || a < 13 || a > 100 || heightIn <= 0 || !w || w < 50 || w > 700) return null;
    return { sex, age: a, heightIn, weightLb: w, activity, goal };
  })();

  const preview = profile ? calculateTargets(profile) : null;

  function save() {
    if (!profile) { toast.error("Fill in age, height and weight"); return; }
    saveProfile(profile);
    saveTargets(calculateTargets(profile));
    toast.success("Goals updated!");
    router.push("/");
  }

  return (
    <div className="p-4 space-y-5 pt-10 pb-24">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-400"><ChevronLeft size={22} /></button>
        <h1 className="text-2xl font-bold">Your Goals</h1>
      </div>
      <p className="text-sm text-gray-500 -mt-2">
        Your targets are calculated from your stats using the Mifflin–St Jeor equation — the same science MyFitnessPal and MyNetDiary use.
      </p>

      <Segment label="Sex" options={[["male", "Male"], ["female", "Female"]]} value={sex} onChange={(v) => setSex(v as Sex)} />

      <div className="grid grid-cols-2 gap-3">
        <Field label="Age">
          <input type="number" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} placeholder="28" className={inputCls} />
        </Field>
        <Field label="Weight (lbs)">
          <input type="number" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="185" className={inputCls} />
        </Field>
      </div>

      <Field label="Height">
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-1.5">
            <input type="number" inputMode="numeric" value={ft} onChange={(e) => setFt(e.target.value)} className={inputCls} />
            <span className="text-sm text-gray-500">ft</span>
          </div>
          <div className="flex-1 flex items-center gap-1.5">
            <input type="number" inputMode="numeric" value={inch} onChange={(e) => setInch(e.target.value)} className={inputCls} />
            <span className="text-sm text-gray-500">in</span>
          </div>
        </div>
      </Field>

      <Field label="Activity level">
        <div className="space-y-2">
          {ACTIVITIES.map((a) => (
            <button
              key={a}
              onClick={() => setActivity(a)}
              className={cn(
                "w-full text-left px-3 py-2.5 rounded-xl border text-sm transition-colors flex items-center justify-between",
                activity === a ? "border-blue-500 bg-blue-500/10 text-white" : "border-[#2a2a2a] text-gray-400"
              )}
            >
              {ACTIVITY_LABEL[a]}
              {activity === a && <Check size={16} className="text-blue-400" />}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Goal">
        <div className="grid grid-cols-3 gap-2">
          {GOALS.map((g) => (
            <button
              key={g}
              onClick={() => setGoal(g)}
              className={cn(
                "px-2 py-3 rounded-xl border text-xs font-medium transition-colors",
                goal === g ? "border-blue-500 bg-blue-500/10 text-white" : "border-[#2a2a2a] text-gray-400"
              )}
            >
              {GOAL_LABEL[g].split(" — ")[0]}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-1.5">{GOAL_LABEL[goal]}</p>
      </Field>

      {preview && (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4 space-y-3">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Your daily targets</p>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-bold">{preview.calories}</p>
            <p className="text-sm text-gray-500 mb-1">kcal / day</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <TargetCell label="Protein" value={`${preview.protein}g`} color="text-blue-400" />
            <TargetCell label="Carbs" value={`${preview.carbs}g`} color="text-yellow-400" />
            <TargetCell label="Fat" value={`${preview.fat}g`} color="text-red-400" />
          </div>
        </div>
      )}

      <button onClick={save} className="w-full py-3.5 rounded-xl bg-blue-600 font-semibold text-white active:bg-blue-500 transition-colors">
        Save Goals
      </button>
    </div>
  );
}

const inputCls = "w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:border-blue-500";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-gray-300">{label}</label>
      {children}
    </div>
  );
}

function Segment({ label, options, value, onChange }: { label: string; options: [string, string][]; value: string; onChange: (v: string) => void }) {
  return (
    <Field label={label}>
      <div className="flex bg-[#111] rounded-xl p-1 gap-1">
        {options.map(([val, lbl]) => (
          <button
            key={val}
            onClick={() => onChange(val)}
            className={cn("flex-1 py-2 rounded-lg text-sm font-medium transition-colors", value === val ? "bg-[#2a2a2a] text-white" : "text-gray-500")}
          >
            {lbl}
          </button>
        ))}
      </div>
    </Field>
  );
}

function TargetCell({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-[#111] rounded-xl p-2.5 text-center">
      <p className={cn("font-bold", color)}>{value}</p>
      <p className="text-[10px] text-gray-500">{label}</p>
    </div>
  );
}
