"use client";

import { Rocket, Sparkles, Wrench, CheckCircle2 } from "lucide-react";
import type { RocketDesign } from "@/lib/rocket-builder";

interface RocketTemplatesProps {
  templates: RocketDesign[];
  selected: string;
  onSelect: (templateId: string) => void;
}

const TEMPLATE_ICONS: Record<string, React.ReactNode> = {
  "falcon-9": <Rocket className="h-5 w-5" />,
  "starship": <Sparkles className="h-5 w-5" />,
  "sls-block-1": <Rocket className="h-5 w-5" />,
  "saturn-v": <Rocket className="h-5 w-5" />,
  "custom": <Wrench className="h-5 w-5" />,
};

const TEMPLATE_DESCRIPTIONS: Record<string, string> = {
  "falcon-9": "SpaceX's workhorse — reusable first stage, 9× Merlin 1D, RP-1/LOX",
  "starship": "Fully reusable super-heavy — 33× Raptor SL + 6× Raptor Vac, CH4/LOX",
  "sls-block-1": "NASA's Artemis rocket — 4× RS-25 + 2× 5-seg SRBs, LH2/LOX core",
  "saturn-v": "Apollo Moon rocket — 5× F-1 + 5× J-2 + 1× J-2, RP-1/LOX + LH2/LOX",
  "custom": "Start from scratch with a blank stage",
};

export function RocketTemplates({ templates, selected, onSelect }: RocketTemplatesProps) {
  const allOptions = [
    { id: "custom", name: "Custom Rocket", description: "Start from scratch", icon: <Wrench className="h-5 w-5" /> },
    ...templates.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      icon: TEMPLATE_ICONS[t.id] || <Rocket className="h-5 w-5" />,
    })),
  ];

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <p className="text-sm font-medium text-slate-300 mb-3">Start from a template</p>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {allOptions.map((tmpl) => (
          <button
            key={tmpl.id}
            onClick={() => onSelect(tmpl.id)}
            className={`relative rounded-xl border p-3 text-left transition-all ${
              selected === tmpl.id
                ? "border-space-cyan/60 bg-space-cyan/10 ring-2 ring-space-cyan/20"
                : "border-white/10 bg-white/[0.02] hover:border-white/25"
            }`}
            aria-pressed={selected === tmpl.id}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                selected === tmpl.id ? "bg-space-cyan/20 text-space-cyan" : "bg-white/5 text-slate-400"
              }`}>
                {tmpl.icon}
              </div>
              {selected === tmpl.id && (
                <CheckCircle2 className="h-4 w-4 text-space-cyan shrink-0" />
              )}
            </div>
            <p className="font-medium text-white text-sm">{tmpl.name}</p>
            <p className="mt-1 text-xs text-slate-400 line-clamp-2">{tmpl.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}