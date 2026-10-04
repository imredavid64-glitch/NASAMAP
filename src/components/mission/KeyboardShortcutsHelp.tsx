"use client";

import { X, ChevronLeft, ChevronRight, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

interface KeyboardShortcutsHelpProps {
  showKeyboardHelp: boolean;
  toggleKeyboardHelp: () => void;
}

export function KeyboardShortcutsHelp({ showKeyboardHelp, toggleKeyboardHelp }: KeyboardShortcutsHelpProps) {
  if (!showKeyboardHelp) return null;

  return (
    <div className="pointer-events-auto fixed bottom-4 right-4 z-50">
      <div className="glass-panel rounded-2xl border border-white/10 bg-space-950/95 backdrop-blur p-4 max-w-sm">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-white text-sm">Keyboard Shortcuts</h4>
          <button
            onClick={() => {}}
            className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white"
            aria-label="Close shortcuts"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="space-y-2 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 text-slate-300">
              <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] font-mono">Space</kbd>
              <span>Play / Pause</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] font-mono">←</span>
              <span>Previous step</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] font-mono">→</span>
              <span>Next step</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] font-mono">1-5</span>
              <span>Jump to tour section</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">+ / =</span>
              <span>Increase speed</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="px-1.5 py-0.5">-</span>
              <span>Decrease speed</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="px-1.5 py-0.5">M</span>
              <span>Toggle narration</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="px-1.5 py-0.5">H / ?</span>
              <span>Show this help</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="px-1.5 py-0.5">C</span>
              <span>Toggle controls</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}