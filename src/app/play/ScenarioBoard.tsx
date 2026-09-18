"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Star, Rocket, ArrowRight, Trophy } from "lucide-react";
import { loadScenarios, type Scenario } from "@/lib/scenarios";
import { readProgress, totalStars, completedCount, starsFor, type ProgressMap } from "@/lib/progress";
import { Badge } from "@/components/ui/badge";

const DIFF_ORDER: Record<Scenario["difficulty"], number> = { "Beginner/Youth": 0, Intermediate: 1, Advanced: 2 };
const DIFF_TONE: Record<Scenario["difficulty"], "emerald" | "amber" | "crimson"> = {
  "Beginner/Youth": "emerald",
  Intermediate: "amber",
  Advanced: "crimson",
};

function Stars({ n }: { n: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${n} of 3 stars earned`}>
      {[1, 2, 3].map((i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i <= n ? "text-space-amber" : "text-slate-700"}`}
          fill={i <= n ? "currentColor" : "none"}
        />
      ))}
    </span>
  );
}

export function ScenarioBoard() {
  const scenarios = loadScenarios();
  const [progress, setProgress] = useState<ProgressMap | null>(null);

  useEffect(() => {
    setProgress(readProgress(window.localStorage));
  }, []);

  const ordered = [...scenarios].sort((a, b) => DIFF_ORDER[a.difficulty] - DIFF_ORDER[b.difficulty]);
  const stars = progress ? totalStars(progress) : 0;
  const done = progress ? completedCount(progress) : 0;

  return (
    <div>
      <div className="mt-8 flex flex-wrap items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4">
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <Trophy className="h-4 w-4 text-space-amber" />
          <span>
            {done} of {scenarios.length} missions completed
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <Star className="h-4 w-4 text-space-amber" fill="currentColor" />
          <span className="font-mono text-space-cyan">{stars}</span> stars earned
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ordered.map((s) => (
          <Link
            key={s.id}
            href={`/play/${s.id}`}
            className="glass-panel flex flex-col p-5 transition hover:border-space-cyan/40 hover:bg-white/[0.06]"
          >
            <div className="flex items-center justify-between">
              <Badge tone={DIFF_TONE[s.difficulty]}>{s.difficulty}</Badge>
              <Stars n={progress ? starsFor(progress, s.id) : 0} />
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-slate-500">
              {s.destination === "mars" ? (
                <>
                  <Rocket className="h-3 w-3" /> Mars mission
                </>
              ) : (
                <>
                  <Rocket className="h-3 w-3" /> Lunar mission
                </>
              )}
            </p>
            <p className="mt-1 text-sm font-semibold text-white">{s.title}</p>
            <p className="mt-2 flex-1 text-xs leading-relaxed text-slate-400">{s.brief}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-space-cyan">
              Play this mission <ArrowRight className="h-3 w-3" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}