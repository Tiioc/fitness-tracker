"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dumbbell, UtensilsCrossed, TrendingUp, MessageCircle, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", icon: LayoutDashboard, label: "Home" },
  { href: "/workout", icon: Dumbbell, label: "Workout" },
  { href: "/food", icon: UtensilsCrossed, label: "Food" },
  { href: "/progress", icon: TrendingUp, label: "Progress" },
  { href: "/coach", icon: MessageCircle, label: "Coach" },
];

export default function BottomNav() {
  const path = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#111] border-t border-[#222] safe-area-inset-bottom">
      <div className="max-w-lg mx-auto flex items-center justify-around py-2 pb-safe">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = path === href || (href !== "/" && path.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors min-w-[56px]",
                active ? "text-blue-400" : "text-gray-500"
              )}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
