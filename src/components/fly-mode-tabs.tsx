"use client";

import { useRouter } from "next/navigation";
import { Rocket, Moon, Sun, Globe } from "lucide-react";
import type { FlyMode } from "@/components/fly-stage";

const MODES: { mode: FlyMode; label: string; hint: string; icon: typeof Rocket }[] = [
  { mode: "apollo11", label: "Apollo 11", hint: "historical replay", icon: Rocket },
  { mode: "hohmann", label: "Moon Hohmann", hint: "patched-conic", icon: Moon },
  { mode: "mars", label: "Mars Hohmann", hint: "Sun-centred Kepler", icon: Sun },
  { mode: "orrery", label: "Solar System", hint: "all planets, real-time", icon: Globe },
];

export function FlyModeTabs({ active }: { active: FlyMode }) {
  const router = useRouter();
  return (
    <div className="flex flex-wrap items-center gap-1 rounded-xl border border-white/15 bg-black/40 p-1">
      {MODES.map(({ mode, label, hint, icon: Icon }) => {
        const isActive = mode === active;
        return (
          <button
            key={mode}
            onClick={() => router.push(`/fly?mode=${mode}`)}
            aria-pressed={isActive}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
              isActive ? "bg-space-cyan/20 text-space-cyan" : "text-slate-300 hover:bg-white/10"
            }`}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
            <span className="hidden text-[11px] font-normal text-slate-500 sm:inline">{hint}</span>
          </button>
        );
      })}
    </div>
  );
}
