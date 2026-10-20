"use client";

import { useState } from "react";
import Link from "next/link";
import { Rocket, Orbit, Radio, Compass, X } from "lucide-react";

export function JudgeQuickstart() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="relative mb-6 overflow-hidden rounded-xl border border-space-amber/40 bg-gradient-to-r from-space-amber/10 via-space-cyan/10 to-space-emerald/10 p-4 shadow-lg shadow-space-amber/10">
        <button
          onClick={() => setDismissed(true)}
          className="absolute right-2 top-2 rounded p-1 text-slate-400 transition hover:bg-white/10 hover:text-white"
          aria-label="Dismiss judge quickstart"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-white">🚀 Judge Quickstart — 60 seconds to the frontier</p>
            <p className="mt-1 text-xs text-slate-400">
              Follow the journey: Plan → Fly → Live → Use in the Commons
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/mission"
              className="inline-flex items-center gap-1.5 rounded-lg bg-space-amber/20 border border-space-amber/40 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-space-amber/30"
            >
              <Rocket className="h-3.5 w-3.5" /> 1. Plan Mission
            </Link>
            <Link
              href="/fly"
              className="inline-flex items-center gap-1.5 rounded-lg bg-space-cyan/20 border border-space-cyan/40 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-space-cyan/30"
            >
              <Orbit className="h-3.5 w-3.5" /> 2. Fly Apollo 11
            </Link>
            <Link
              href="/live"
              className="inline-flex items-center gap-1.5 rounded-lg bg-space-emerald/20 border border-space-emerald/40 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-space-emerald/30"
            >
              <Radio className="h-3.5 w-3.5" /> 3. Live Frontier
            </Link>
            <Link
              href="/commons"
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 border border-white/20 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/20"
            >
              <Compass className="h-3.5 w-3.5" /> 4. Commons for All
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
