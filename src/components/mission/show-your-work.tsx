"use client";

import { useState } from "react";
import { ChevronDown, ExternalLink, Calculator, FileText, Shield, Zap, Globe, DollarSign } from "lucide-react";
import { cn } from "@/lib/cn";

interface ShowYourWorkProps {
  design: any;
  scorecard: any;
}

const objectiveIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "lift-stack": Rocket,
  radiation: Shield,
  "eclss-loop": Zap,
  comms: Globe,
  transfer: Zap,
  surface: Globe,
  duration: Zap,
  budget: DollarSign,
};

const objectiveDescriptions: Record<string, string> = {
  "lift-stack": "Checks if the total mission stack mass fits within the launch vehicle's documented TLI (trans-lunar injection) or TMI (trans-Mars injection) payload capacity.",
  radiation: "Calculates total crew radiation dose from galactic cosmic rays (GCR) and potential solar particle events (SPE), comparing against NASA-STD-3001 career limit of 600 mSv.",
  "eclss-loop": "Models ISS-class regenerative ECLSS performance: ~90% water recovery (WPA + UPA), ~50% oxygen recovery (Sabatier CO2 reduction), computes mass savings vs. open-loop.",
  comms: "Computes one-way light-time using mean Earth-Mars distance (225M km) divided by speed of light (299,792 km/s). Round-trip is 2x one-way.",
  transfer: "Compares mission total Δv against Hohmann/apoll-class reference values. Moon: ~3.2 km/s, Mars: ~6.0 km/s. Penalty for exceeding 1.3× reference.",
  surface: "Validates surface stay meets minimum for meaningful science: Moon ≥3 days, Mars ≥30 days. Warn if >0 but below minimum.",
  duration: "Total mission duration cap at 900 days (warn) / 1100 days (fail). Longer missions compound consumables, radiation, and human factors risk.",
  budget: "Estimates mission cost from launch vehicle per-launch costs × number of launches. Warn at $500M, fail at $1.5B. Costs tagged with confidence in launch-vehicles.json.",
};

const objectiveReferences: Record<string, string> = {
  "lift-stack": "Vehicle specs from launch-vehicles.json (payloadLEOKg, TLI scaling ~0.4× LEO)",
  radiation: "NASA-STD-3001 Vol 1 Rev A (2022): 600 mSv career effective dose limit; MSL RAD cruise data (Zeitlin et al. 2013)",
  "eclss-loop": "NASA ISS ECLSS fact sheets: WPA ~90% H2O recovery; Sabatier CO2 reduction ~50% O2 recovery; OGS draw ~1.2 kW",
  comms: "Speed of light CODATA 2018: 299,792.458 km/s; mean Earth-Mars distance ~225M km",
  transfer: "Hohmann transfer Δv calculations (astro.ts); Apollo-class TLI reference (rocket.ts)",
  surface: "Mission design intent; Apollo surface stays 2-3 days, Artemis plans 7-30 days, Mars DRA 5.0 ≥30 days",
  duration: "Mission design intent; NASA DRA 5.0 reference missions ~900 days; psychological/medical risk increases beyond",
  budget: "launch-vehicles.json costPerLaunchUsd with costConfidence tags (documented/estimate/derived)",
};

function Rocket({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>;
}

export function ShowYourWorkPanel({ design, scorecard }: ShowYourWorkProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggle = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getObjectiveDetails = (objId: string) => {
    const obj = scorecard.objectives.find((o: any) => o.id === objId);
    if (!obj) return null;

    let calculation = "";
    let inputs = {};

    switch (objId) {
      case "lift-stack":
        calculation = `Stack mass: ${(design.requiredMassKg / 1000).toFixed(1)} t vs Vehicle capacity: ${design.payloadCapacityKg ? (design.payloadCapacityKg / 1000).toFixed(0) : "unknown"} t`;
        inputs = { stackMassKg: design.requiredMassKg, payloadCapacityKg: design.payloadCapacityKg };
        break;
      case "radiation":
        calculation = `Total dose: ${design.radiationMsvTotal.toFixed(0)} mSv (GCR cruise + surface + SPE risk) vs Limit: 600 mSv`;
        inputs = { totalMsv: design.radiationMsvTotal, limitMsv: 600 };
        break;
      case "eclss-loop":
        // This would come from opsBudget
        calculation = `Regenerative ECLSS recycles ${obj.actual} of consumables (water ~90%, O2 ~50%)`;
        inputs = { recycledPct: obj.actual };
        break;
      case "comms":
        calculation = `One-way light time: ${design.arrivalLt.oneWayLabel} (distance / c)`;
        inputs = { oneWaySec: design.arrivalLt.oneWaySec };
        break;
      case "transfer":
        const ref = design.destination === "moon" ? 3.2 : 6.0;
        calculation = `Total Δv: ${design.totalDeltaVKmS.toFixed(2)} km/s vs Hohmann reference: ${ref} km/s`;
        inputs = { totalDeltaVKmS: design.totalDeltaVKmS, referenceKmS: ref };
        break;
      case "surface":
        const min = design.destination === "mars" ? 30 : 3;
        calculation = `Surface stay: ${design.surfaceDays.toFixed(0)} days vs Minimum: ${min} days`;
        inputs = { surfaceDays: design.surfaceDays, minimumDays: min };
        break;
      case "duration":
        calculation = `Total mission: ${design.totalDays.toFixed(0)} days vs Threshold: 900 days (warn) / 1100 days (fail)`;
        inputs = { totalDays: design.totalDays };
        break;
      case "budget":
        calculation = `Estimated cost: ${obj.actual} (launch cost × launches)`;
        inputs = { estimatedCost: obj.actual };
        break;
    }

    return { calculation, inputs, ...obj };
  };

  return (
    <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-5" id="show-your-work">
      <div className="flex items-center justify-between mb-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
          <Calculator className="h-5 w-5 text-space-cyan" />
          Show Your Work — Calculation Breakdown
        </h2>
        <span className="text-xs text-slate-500 font-mono">
          {scorecard.objectives.length} objectives, every number traceable to a cited source
        </span>
      </div>

      <p className="mb-4 text-sm text-slate-400">
        Click any objective to see the exact formula, input values, and NASA reference behind the score.
        This transparency is the core of the NASAMAP engineering honesty commitment.
      </p>

      <div className="space-y-2" role="list" aria-label="Objective calculations">
        {scorecard.objectives.map((obj: any) => {
          const details = getObjectiveDetails(obj.id);
          if (!details) return null;
          const Icon = objectiveIcons[obj.id] || Calculator;
          const isExpanded = expandedId === obj.id;

          return (
            <div
              key={obj.id}
              className={cn(
                "rounded-xl border transition-all duration-200",
                isExpanded
                  ? "border-space-cyan/30 bg-space-cyan/5"
                  : "border-white/10 bg-white/[0.02] hover:border-space-cyan/20"
              )}
              role="listitem"
            >
              <button
                onClick={() => toggle(obj.id)}
                className="w-full px-4 py-3 flex items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-space-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-space-950"
                aria-expanded={isExpanded}
                aria-controls={`details-${obj.id}`}
              >
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg",
                  obj.status === "pass" && "bg-space-emerald/20 text-space-emerald",
                  obj.status === "warn" && "bg-space-amber/20 text-space-amber",
                  obj.status === "fail" && "bg-space-crimson/20 text-space-crimson"
                )}>
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{obj.label}</p>
                  <p className="text-xs text-slate-400 truncate">{details.calculation}</p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className={cn(
                    "px-2 py-0.5 rounded-full font-mono",
                    obj.status === "pass" && "bg-space-emerald/20 text-space-emerald",
                    obj.status === "warn" && "bg-space-amber/20 text-space-amber",
                    obj.status === "fail" && "bg-space-crimson/20 text-space-crimson"
                  )}>
                    {obj.status.toUpperCase()}
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-slate-400 transition-transform",
                      isExpanded && "rotate-180"
                    )}
                    aria-hidden="true"
                  />
                </div>
              </button>

              <div
                id={`details-${obj.id}`}
                className={cn(
                  "overflow-hidden transition-all duration-200",
                  isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                )}
              >
                <div className="px-4 pb-4 border-t border-white/5 bg-white/[0.02] space-y-3">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-slate-500">Status</p>
                      <p className="font-mono text-sm text-white capitalize">{obj.status}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Weight</p>
                      <p className="font-mono text-sm text-white">{obj.weight} pts (earned {obj.earned})</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Actual</p>
                      <p className="font-mono text-sm text-white">{obj.actual}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Target</p>
                      <p className="font-mono text-sm text-white">{obj.target}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">How it's calculated</p>
                    <p className="mt-1 text-sm text-slate-300 font-mono bg-space-950/50 rounded p-2">
                      {details.calculation}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">Key inputs</p>
                    <pre className="mt-1 text-[10px] text-slate-400 bg-space-950/50 rounded p-2 overflow-x-auto">
                      {JSON.stringify(details.inputs, null, 2)}
                    </pre>
                  </div>

                  <div className="flex items-center gap-2">
                    <ExternalLink className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
                    <span className="text-xs text-slate-400">Reference:</span>
                    <a
                      href="#"
                      className="text-xs text-space-cyan hover:underline font-mono"
                      onClick={(e) => { e.preventDefault(); navigator.clipboard.writeText(objectiveReferences[obj.id] || ""); }}
                    >
                      {objectiveReferences[obj.id] || "NASA reference (copy to clipboard)"}
                    </a>
                  </div>

                  {obj.coach && (
                    <div className="rounded-lg bg-space-cyan/10 border border-space-cyan/20 p-3">
                      <p className="text-xs text-space-cyan flex items-center gap-1.5">
                        <span className="text-space-cyan">💡</span>
                        <span>{obj.coach}</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}