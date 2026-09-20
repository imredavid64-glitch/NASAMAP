"use client";

import { Recycle, Leaf, Droplet, Zap, Package, Factory } from "lucide-react";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { opsBudget, type OpsBudget, type ISRURates } from "@/lib/life";
import { cn } from "@/lib/cn";

interface ISRUWasteProps {
  design: { destination: "moon" | "mars"; crew: number; totalDays: number };
}

export function ISRUWaste({ design }: ISRUWasteProps) {
  const ops = opsBudget({ destination: design.destination, crew: design.crew, days: design.totalDays });
  const isru = ops.isru;

  return (
    <Card className="glass-panel">
      <CardBody>
        <CardTitle className="flex items-center gap-2">
          <Recycle className="h-4 w-4 text-space-emerald" />
          ISRU Waste-to-Resource (SpaceTrash Hack)
        </CardTitle>
        <p className="mt-2 text-xs text-slate-400">
          In-situ resource utilization of crew waste (feces, packaging, CO₂) into water, oxygen & fertilizer.
          Based on NASA OSCAR/Heat Melt Compactor studies (TRL 4–5).
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Water recovered"
            value={`${isru.waterKg.toFixed(0)} kg`}
            icon={<Droplet className="h-5 w-5 text-space-cyan" />}
            note={`${(isru.waterKg / ops.gross.waterKg * 100).toFixed(1)}% of gross water`}
          />
          <StatCard
            label="Oxygen recovered"
            value={`${isru.oxygenKg.toFixed(0)} kg`}
            icon={<Leaf className="h-5 w-5 text-space-emerald" />}
            note={`${(isru.oxygenKg / ops.gross.oxygenKg * 100).toFixed(1)}% of gross O₂`}
          />
          <StatCard
            label="Fertilizer produced"
            value={`${isru.fertilizerKg.toFixed(0)} kg`}
            icon={<Leaf className="h-5 w-5 text-amber-400" />}
            note={`Supports food production loops`}
          />
        </div>

        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <h4 className="font-semibold text-white mb-2">How it works</h4>
          <ul className="space-y-2 text-sm text-slate-300">
            <li className="flex gap-2">
              <Factory className="h-4 w-4 shrink-0 text-space-cyan" />
              <span>
                <strong>Thermal decomposition (OSCAR):</strong> Heat waste to 500–600°C in oxygen-starved reactor —
                volatiles (H₂O, CO₂, CH₄) captured, char residue for radiation shielding.
              </span>
            </li>
            <li className="flex gap-2">
              <Droplet className="h-4 w-4 shrink-0 text-space-cyan" />
              <span>
                <strong>Water electrolysis:</strong> Recovered water split → H₂ (fuel) + O₂ (breathing).
                Adds to Sabatier loop for CO₂ reduction.
              </span>
            </li>
            <li className="flex gap-2">
              <Leaf className="h-4 w-4 shrink-0 text-amber-400" />
              <span>
                <strong>Char + nutrients → fertilizer:</strong> Carbon-rich char mixed with urine-derived
                struvite (MgNH₄PO₄) creates Mars regolith soil amendment.
              </span>
            </li>
            <li className="flex gap-2">
              <Zap className="h-4 w-4 shrink-0 text-amber-400" />
              <span>
                <strong>Power cost:</strong> ~1.2 kW thermal for OSCAR reactor (shared across crew).
                Heat partially recovered for cabin thermal control.
              </span>
            </li>
          </ul>
        </div>

        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <h4 className="font-semibold text-white mb-2">Mass balance vs. open loop</h4>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 text-sm">
            <div className="flex gap-2">
              <Package className="h-4 w-4 text-slate-400" />
              <span>Gross resupply: <strong className="text-space-cyan">{(ops.grossResupplyKg / 1000).toFixed(1)} t</strong></span>
            </div>
            <div className="flex gap-2">
              <Recycle className="h-4 w-4 text-space-emerald" />
              <span>ECLSS recycled: <strong className="text-space-emerald">{(ops.recycled.waterKg + ops.recycled.oxygenKg) / 1000} t</strong></span>
            </div>
            <div className="flex gap-2">
              <Leaf className="h-4 w-4 text-amber-400" />
              <span>ISRU recovered: <strong className="text-amber-400">{(isru.waterKg + isru.oxygenKg) / 1000} t</strong></span>
            </div>
            <div className="flex gap-2">
              <Zap className="h-4 w-4 text-space-cyan" />
              <span>Net resupply: <strong className="text-space-cyan">{(ops.netResupplyKg / 1000).toFixed(1)} t</strong></span>
            </div>
          </div>
          <div className="mt-3 h-3 bg-space-950/60 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-space-cyan via-space-emerald to-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${ops.savedPct * 100}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Total mass saved: <strong>{ops.savedKg.toFixed(0)} kg ({(ops.savedPct * 100).toFixed(1)}%)</strong>
          </p>
        </div>

        <Badge tone="emerald" className="mt-4 inline-flex items-center gap-1">
          <Recycle className="h-3 w-3" />
          Addresses "SpaceTrash Hack: Revolutionizing Recycling on Mars"
        </Badge>
      </CardBody>
    </Card>
  );
}

function StatCard({ label, value, icon, note }: { label: string; value: string; icon: React.ReactNode; note: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs text-slate-500">{label}</span>
      </div>
      <p className="text-xl font-bold text-white">{value}</p>
      <p className="mt-1 text-[10px] text-slate-500">{note}</p>
    </div>
  );
}