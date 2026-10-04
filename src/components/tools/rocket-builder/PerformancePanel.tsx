"use client";

import { CheckCircle2, AlertTriangle, Info, Target, Zap, Package, DollarSign, Scale } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import type { RocketDesign } from "@/lib/rocket-builder";

interface PerformancePanelProps {
  performance: ReturnType<typeof import("@/lib/rocket-builder").calculateRocketPerformance> | null;
  validation: { valid: boolean; errors: string[] };
  loading: boolean;
}

function StatRow({ label, value, sub, icon, tone }: {
  label: string;
  value: string;
  sub?: string;
  icon?: React.ReactNode;
  tone?: "emerald" | "amber" | "cyan" | "crimson" | "slate";
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
      {icon && <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-space-cyan/20 text-space-cyan">{icon}</span>}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-400 truncate">{label}</p>
        <p className="font-mono text-lg text-white truncate">{value}</p>
        {sub && <p className="text-[10px] text-slate-500 truncate">{sub}</p>}
      </div>
      {tone && <Badge tone={tone} className="text-[10px]">{tone.toUpperCase()}</Badge>}
    </div>
  );
}

function StagePerformanceRow({ stage }: { stage: any }) {
  const twrTone = stage.twrSeaLevel >= 1.2 ? "emerald" : stage.twrSeaLevel >= 1.0 ? "amber" : "crimson";
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="font-medium text-white">{stage.name}</p>
        <Badge tone={twrTone} className="text-[10px]">TWR {stage.twrSeaLevel.toFixed(2)}</Badge>
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <p className="text-slate-500">Δv (vac)</p>
          <p className="font-mono text-space-cyan">{stage.deltaVVacKmS.toFixed(2)} km/s</p>
        </div>
        <div>
          <p className="text-slate-500">Isp (vac)</p>
          <p className="font-mono text-white">{stage.ispVacuumS.toFixed(0)} s</p>
        </div>
        <div>
          <p className="text-slate-500">Burn Time</p>
          <p className="font-mono text-white">{stage.burnTimeS.toFixed(0)} s</p>
        </div>
        <div>
          <p className="text-slate-500">Wet Mass</p>
          <p className="font-mono text-white">{(stage.wetMassKg / 1000).toFixed(1)} t</p>
        </div>
        <div>
          <p className="text-slate-500">Dry Mass</p>
          <p className="font-mono text-white">{(stage.dryMassKg / 1000).toFixed(1)} t</p>
        </div>
        <div>
          <p className="text-slate-500">Mass Ratio</p>
          <p className="font-mono text-white">{stage.massRatio.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-slate-500">Thrust (vac)</p>
          <p className="font-mono text-white">{stage.thrustVacuumKN.toFixed(0)} kN</p>
        </div>
        <div>
          <p className="text-slate-500">Thrust (sl)</p>
          <p className="font-mono text-white">{stage.thrustSeaLevelKN.toFixed(0)} kN</p>
        </div>
      </div>
    </div>
  );
}

export function PerformancePanel({ performance, validation, loading }: PerformancePanelProps) {
  if (loading) {
    return (
      <Card>
        <CardBody className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3 text-space-cyan">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-space-cyan/30 border-t-space-cyan" />
            <span>Calculating performance...</span>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (!performance) {
    return (
      <Card>
        <CardBody className="flex items-center justify-center h-48 text-slate-500">
          <p>Add stages and select engines/tanks to see performance.</p>
        </CardBody>
      </Card>
    );
  }

  const { payloadLEOKg, payloadTLIKg, payloadGTOKg, totalCostUsd, totalHeightM, maxDiameterM, totalWetMassKg, stages } = performance;

  const leoTone = payloadLEOKg && payloadLEOKg > 20000 ? "emerald" : payloadLEOKg && payloadLEOKg > 10000 ? "amber" : "crimson";
  const tliTone = payloadTLIKg && payloadTLIKg > 10000 ? "emerald" : payloadTLIKg && payloadTLIKg > 5000 ? "amber" : "crimson";

  return (
    <Card>
      <CardBody>
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-space-cyan" />
            Performance Summary
          </CardTitle>
          <Badge tone={validation.valid ? "emerald" : "crimson"} className="text-[10px]">
            {validation.valid ? "Valid Design" : "Has Errors"}
          </Badge>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-4">
          <StatRow
            label="Total Height"
            value={`${totalHeightM.toFixed(1)} m`}
            icon={<Target className="h-4 w-4" />}
          />
          <StatRow
            label="Max Diameter"
            value={`${maxDiameterM.toFixed(1)} m`}
            icon={<Package className="h-4 w-4" />}
          />
          <StatRow
            label="Liftoff Mass"
            value={`${(totalWetMassKg / 1000).toFixed(1)} t`}
            icon={<Scale className="h-4 w-4" />}
          />
          <StatRow
            label="Total Cost (est.)"
            value={`$${(totalCostUsd / 1e6).toFixed(0)} M`}
            icon={<DollarSign className="h-4 w-4" />}
          />
          <StatRow
            label="Payload to LEO"
            value={payloadLEOKg ? `${(payloadLEOKg / 1000).toFixed(1)} t` : "—"}
            sub={payloadLEOKg ? "200 km × 28.5°" : "Insufficient TWR/Δv"}
            icon={<Package className="h-4 w-4" />}
            tone={leoTone}
          />
          <StatRow
            label="Payload to TLI"
            value={payloadTLIKg ? `${(payloadTLIKg / 1000).toFixed(1)} t` : "—"}
            sub={payloadTLIKg ? "Trans-Lunar Injection" : "Insufficient TWR/Δv"}
            icon={<Target className="h-4 w-4" />}
            tone={tliTone}
          />
          <StatRow
            label="Payload to GTO"
            value={payloadGTOKg ? `${(payloadGTOKg / 1000).toFixed(1)} t` : "—"}
            sub={payloadGTOKg ? "Geostationary Transfer" : "Insufficient TWR/Δv"}
            icon={<Target className="h-4 w-4" />}
            tone={payloadGTOKg ? "cyan" : "crimson"}
          />
        </div>

        {/* Stage Breakdown */}
        <div className="border-t border-white/10 pt-4">
          <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
            <Info className="h-4 w-4 text-space-cyan" />
            Stage Breakdown (top fires first)
          </h4>
          <div className="space-y-3">
            {stages.map((stage, i) => (
              <StagePerformanceRow key={i} stage={stage} />
            ))}
          </div>
        </div>

        {/* Payload Estimate Disclaimer */}
        <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-300">
          <p className="flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5" />
            <span>{`Payload estimates are rough. Based on payload fraction heuristics: expendable ~3% of liftoff mass to LEO, reusable ~1.5%. TLI ~25–35% of LEO. GTO ~45% of LEO. Requires first-stage TWR > 1.2 and total Δv > 9 km/s. Real payload depends on trajectory, margins, and mission-specific constraints.`}</span>
          </p>
        </div>
      </CardBody>
    </Card>
  );
}