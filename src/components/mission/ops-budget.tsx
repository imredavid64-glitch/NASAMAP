import { Recycle, BatteryCharging, Sun, Download } from "lucide-react";
import { useState } from "react";
import { type MissionDesign } from "@/lib/mission";
import { opsBudget, type Confidence, type OpsBudget } from "@/lib/life";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { lifeSupportBudgetCsv, eclssPowerBreakdownCsv, consumablesTimelineCsv, downloadCsv } from "@/lib/export";

const CONFIDENCE_TONE: Record<Confidence, "emerald" | "cyan" | "amber"> = {
  documented: "emerald",
  derived: "cyan",
  estimate: "amber",
};

function Bar({ label, grossKg, netKg, accent }: { label: string; grossKg: number; netKg: number; accent: string }) {
  const netPct = grossKg > 0 ? (netKg / grossKg) * 100 : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between text-xs">
        <span className="font-medium text-slate-300">{label}</span>
        <span className="font-mono text-slate-400">
          {netKg.toFixed(0)} / {grossKg.toFixed(0)} kg
        </span>
      </div>
      <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full" style={{ width: `${netPct}%`, background: accent }} />
      </div>
      <p className="mt-1 text-[11px] text-slate-500">
        {grossKg > 0 ? `${(100 - netPct).toFixed(0)}% recycled` : "no load"} · {(grossKg - netKg).toFixed(0)} kg saved
      </p>
    </div>
  );
}

export function OpsBudget({ design }: { design: MissionDesign }) {
  const ops = opsBudget({ destination: design.destination, crew: design.crew, days: design.totalDays });
  const [exportType, setExportType] = useState<"budget" | "power" | "timeline" | null>(null);

  const handleExport = (type: "budget" | "power" | "timeline") => {
    const label = `${design.destination}-${design.crew}crew-${design.totalDays.toFixed(0)}d`;
    if (type === "budget") {
      const csv = lifeSupportBudgetCsv(ops, label);
      downloadCsv(`${label}-life-support-budget.csv`, csv);
    } else if (type === "power") {
      const csv = eclssPowerBreakdownCsv(ops, label);
      downloadCsv(`${label}-eclss-power-breakdown.csv`, csv);
    } else if (type === "timeline") {
      const csv = consumablesTimelineCsv(ops, label);
      downloadCsv(`${label}-consumables-timeline.csv`, csv);
    }
    setExportType(null);
  };

  return (
    <Card>
      <CardBody>
<CardTitle className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <Recycle className="h-4 w-4 text-space-emerald" /> Life-support budget · {design.totalDays.toFixed(0)} days
        </span>
        <div className="relative">
          <Button variant="outline" size="sm" onClick={() => setExportType("budget")}>
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
          {exportType && (
            <div className="absolute right-0 top-full mt-1 z-10 rounded-xl border border-white/10 bg-space-950/95 backdrop-blur p-2 shadow-lg">
              <div className="text-xs text-slate-400 px-3 py-2 border-b border-white/10">Export Life Support Data</div>
              <button onClick={() => { handleExport("budget"); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-white/10 rounded-lg">
                Full budget (consumables, recycling, ISRU, power, array)
              </button>
              <button onClick={() => { handleExport("power"); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-white/10 rounded-lg">
                ECLSS power line breakdown
              </button>
              <button onClick={() => { handleExport("timeline"); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-white/10 rounded-lg">
                Daily consumables timeline
              </button>
              <div className="pt-1">
                <button onClick={() => setExportType(null)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-500 hover:bg-white/10 rounded-lg">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </CardTitle>
        <p className="mt-2 text-xs text-slate-500">
          An ISS-class regenerative ECLSS closes the loop on most consumables — here is how much it saves out of the
          launch stack, and the power that costs.
        </p>

        <div className="mt-5 grid gap-6 lg:grid-cols-2">
          <div>
            <p className="mb-3 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-slate-500">
              Consumables · open loop vs closed loop
            </p>
            <div className="space-y-4">
              <Bar
                label="Water"
                grossKg={ops.gross.waterKg}
                netKg={ops.net.waterKg}
                accent="linear-gradient(90deg,#38bdf8,#22d3ee)"
              />
              <Bar
                label="Oxygen"
                grossKg={ops.gross.oxygenKg}
                netKg={ops.net.oxygenKg}
                accent="linear-gradient(90deg,#34d399,#10b981)"
              />
              <Bar
                label="Food (no reclamation)"
                grossKg={ops.gross.foodKg}
                netKg={ops.net.foodKg}
                accent="linear-gradient(90deg,#f59e0b,#fbbf24)"
              />
            </div>
            <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.02] p-3">
              <p className="font-mono text-lg text-space-emerald">
                {ops.savedPct >= 0 ? (ops.savedPct * 100).toFixed(0) : "0"}% mass saved
              </p>
              <p className="mt-0.5 text-xs text-slate-400">
                {ops.netResupplyKg.toFixed(0)} kg up-mass instead of {ops.grossResupplyKg.toFixed(0)} kg ·{" "}
                {ops.savedKg.toFixed(0)} kg not launched
              </p>
            </div>
          </div>

          <div>
            <p className="mb-3 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-slate-500">
              <BatteryCharging className="h-3.5 w-3.5 text-space-cyan" /> ECLSS electrical load
            </p>
            <ul className="space-y-2">
              {ops.powerLines.map((line) => (
                <li key={line.id} className="flex items-center justify-between gap-3 text-xs">
                  <span className="flex items-center gap-2 text-slate-300">
                    <Badge tone={CONFIDENCE_TONE[line.confidence]}>{line.confidence.slice(0, 4)}</Badge>
                    {line.label}
                  </span>
                  <span className="font-mono text-slate-400">{(line.kWPerCrew * design.crew).toFixed(2)} kW</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-baseline justify-between border-t border-white/10 pt-3">
              <span className="text-xs font-medium text-slate-300">Total ECLSS demand</span>
              <span className="font-mono text-lg text-space-cyan">{ops.powerKw.toFixed(2)} kW</span>
            </div>
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs text-slate-400">
              <Sun className="mt-0.5 h-4 w-4 shrink-0 text-space-amber" />
              <span>
                At {ops.au.toFixed(2)} au solar irradiance is {ops.irradianceKwM2.toFixed(3)} kW/m², so the array needs
                ≈{ops.arrayAreaM2.toFixed(1)} m² at {(ops.arrayEfficiency * 100).toFixed(0)}% efficiency.
              </span>
            </div>
          </div>
        </div>

        <ul className="mt-5 space-y-1.5 border-t border-white/10 pt-4 text-xs text-slate-500">
          {ops.notes.map((n, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-space-cyan">▸</span>
              {n}
            </li>
          ))}
          <li className="flex gap-2 italic">
            <span className="text-space-cyan">▸</span>
            {ops.rates.note}
          </li>
        </ul>
      </CardBody>
    </Card>
  );
}
