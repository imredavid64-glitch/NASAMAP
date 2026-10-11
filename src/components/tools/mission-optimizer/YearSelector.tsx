"use client";

import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ParetoFront } from "@/data/pareto-fronts";

interface YearSelectorProps {
  fronts: ParetoFront[];
  selectedYear: number;
  onSelectYear: (year: number) => void;
}

export function YearSelector({ fronts, selectedYear, onSelectYear }: YearSelectorProps) {
  const sortedFronts = [...fronts].sort((a, b) => a.year - b.year);
  const currentIndex = sortedFronts.findIndex((f) => f.year === selectedYear);
  const currentFront = sortedFronts[currentIndex];

  const handlePrev = () => {
    if (currentIndex > 0) {
      onSelectYear(sortedFronts[currentIndex - 1].year);
    }
  };

  const handleNext = () => {
    if (currentIndex < sortedFronts.length - 1) {
      onSelectYear(sortedFronts[currentIndex + 1].year);
    }
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-space-cyan" />
          <span className="text-sm font-medium text-slate-300">Launch Window</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="p-2 rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:text-white hover:border-space-cyan/40 transition disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Previous launch window"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-space-950/60 border border-white/10">
            <Badge tone="cyan" className="text-sm px-3 py-1">
              {currentFront?.year ?? "—"}
            </Badge>
          </div>

          <button
            onClick={handleNext}
            disabled={currentIndex === sortedFronts.length - 1}
            className="p-2 rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:text-white hover:border-space-cyan/40 transition disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Next launch window"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {currentFront && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <p className="text-xs text-slate-400">{currentFront.methodology}</p>
          <ul className="mt-2 space-y-1 text-xs text-slate-500">
            {currentFront.assumptions.map((assumption, i) => (
              <li key={i} className="flex gap-1.5">
                <span className="text-space-cyan">•</span>
                <span>{assumption}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}