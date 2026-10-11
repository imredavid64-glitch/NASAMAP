"use client";

import { ChevronDown, ChevronUp, Target, DollarSign, Radio, Shield, Clock, Sparkles } from "lucide-react";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ParetoPoint } from "@/data/pareto-fronts";

interface ArchitectureCardProps {
  architecture: ParetoPoint;
  isSelected: boolean;
  onSelect: () => void;
  isExpanded?: boolean;
  onToggleExpand: () => void;
}

export function ArchitectureCard({ architecture, isSelected, onSelect, isExpanded, onToggleExpand }: ArchitectureCardProps) {
  const costTone = architecture.costB > 2 ? "crimson" : architecture.costB > 1 ? "amber" : "emerald";
  const radiationTone = architecture.radiationMSv > 700 ? "crimson" : architecture.radiationMSv > 550 ? "amber" : "emerald";

  return (
    <div
      className={`rounded-xl border transition-all cursor-pointer ${
        isSelected
          ? "border-space-cyan/30 ring-2 ring-space-cyan/50 bg-space-cyan/5"
          : "border-white/10 bg-white/5 hover:border-space-cyan/40 hover:bg-white/[0.03]"
      }`}
      onClick={onSelect}
    >
      <CardBody className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-space-cyan/20 text-space-cyan">
                <Sparkles className="h-4 w-4" />
              </span>
              <h4 className="font-semibold text-white truncate">{architecture.vehicle}</h4>
              {isSelected && (
                <Badge tone="cyan" className="text-[10px]">SELECTED</Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 line-clamp-1">{architecture.architecture}</p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand();
            }}
            className="p-1 rounded hover:bg-white/10 text-slate-400 transition shrink-0"
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <MetricCard
            icon={<Target className="h-4 w-4" />}
            label="IMLEO"
            value={`${architecture.imleoT} t`}
            iconColor="space-cyan"
          />
          <MetricCard
            icon={<Radio className="h-4 w-4" />}
            label="Payload"
            value={`${architecture.payloadT} t`}
            iconColor="space-emerald"
          />
          <MetricCard
            icon={<Shield className="h-4 w-4" />}
            label="Radiation"
            value={`${architecture.radiationMSv} mSv`}
            tone={radiationTone}
            iconColor={radiationTone === "crimson" ? "red" : radiationTone === "amber" ? "amber" : "emerald"}
          />
          <MetricCard
            icon={<DollarSign className="h-4 w-4" />}
            label="Cost"
            value={`${architecture.costB.toFixed(1)} B$`}
            tone={costTone}
            iconColor={costTone === "crimson" ? "red" : costTone === "amber" ? "amber" : "emerald"}
          />
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="border-t border-white/10 pt-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
            <div>
              <p className="font-medium text-slate-300 mb-2">Architecture</p>
              <p className="text-sm text-slate-400">{architecture.architecture}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-white/5 p-3">
                <p className="text-xs text-slate-500">Transfer Time</p>
                <p className="font-mono text-white">{architecture.transferDays} days</p>
              </div>
              <div className="rounded-lg bg-white/5 p-3">
                <p className="text-xs text-slate-500">Status</p>
                <p className="font-mono text-white">Non-dominated</p>
              </div>
            </div>

            <div>
              <p className="font-medium text-slate-300 mb-2">Key Trade-offs</p>
              <ul className="space-y-1 text-sm text-slate-400">
                {architecture.trades.map((trade, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-space-cyan">▸</span>
                    <span>{trade}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </CardBody>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  tone,
  iconColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "emerald" | "amber" | "crimson" | "cyan";
  iconColor?: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
      <div className="flex items-center gap-2 mb-1">
        <span className={`flex h-6 w-6 items-center justify-center rounded ${iconColor ? `text-${iconColor}-400` : "text-space-cyan"} bg-white/5`}>
          {icon}
        </span>
        {tone && <Badge tone={tone} className="text-[9px]">{tone.toUpperCase()}</Badge>}
      </div>
      <p className="text-[10px] text-slate-500">{label}</p>
      <p className="font-mono text-white text-sm">{value}</p>
    </div>
  );
}