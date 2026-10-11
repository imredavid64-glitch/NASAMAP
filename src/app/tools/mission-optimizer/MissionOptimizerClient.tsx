"use client";

import { useState, useMemo } from "react";
import { Download, FileText, BarChart2, Sparkles, Shield, Radio, DollarSign, Target, ExternalLink } from "lucide-react";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { ParetoFrontChart } from "@/components/tools/mission-optimizer/ParetoFrontChart";
import { ArchitectureCard } from "@/components/tools/mission-optimizer/ArchitectureCard";
import { YearSelector } from "@/components/tools/mission-optimizer/YearSelector";
import { getAllParetoFronts, getParetoFront, type ParetoFront, type ParetoPoint } from "@/data/pareto-fronts";

export function MissionOptimizerClient() {
  const fronts = useMemo(() => getAllParetoFronts(), []);
  const [selectedYear, setSelectedYear] = useState(2028);
  const [selectedArchitecture, setSelectedArchitecture] = useState<string | null>(null);
  const [expandedArchitectures, setExpandedArchitectures] = useState<Set<string>>(new Set());

  const front = useMemo(() => getParetoFront(selectedYear), [selectedYear]);
  const points = front?.points ?? [];

  const handleSelectArchitecture = (vehicle: string) => {
    setSelectedArchitecture(vehicle === selectedArchitecture ? null : vehicle);
  };

  const handleToggleExpand = (vehicle: string) => {
    setExpandedArchitectures((prev) => {
      const next = new Set(prev);
      if (next.has(vehicle)) {
        next.delete(vehicle);
      } else {
        next.add(vehicle);
      }
      return next;
    });
  };

  const handleExportCSV = () => {
    if (!front) return;
    const headers = ["Vehicle", "IMLEO (t)", "Payload (t)", "Radiation (mSv)", "Cost ($B)", "Transfer (days)", "Architecture", "Trades"];
    const rows = points.map((p) => [
      p.vehicle,
      p.imleoT.toString(),
      p.payloadT.toString(),
      p.radiationMSv.toString(),
      p.costB.toString(),
      p.transferDays.toString(),
      `"${p.architecture}"`,
      `"${p.trades.join("; ")}"`,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mars-pareto-${front.year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <SectionHeading
        kicker="Astrodynamics Lab"
        title="Mission Optimizer"
        description="Pre-computed Pareto-optimal Mars architectures. Multi-objective: minimize IMLEO, maximize payload, minimize radiation. NSGA-II + gradient refinement with interactive Pareto front visualization."
      />

      {/* Year Selector */}
      <YearSelector fronts={fronts} selectedYear={selectedYear} onSelectYear={setSelectedYear} />

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        {/* Left: Pareto Front Chart */}
        <ParetoFrontChart
          data={points}
          selectedArchitecture={selectedArchitecture ?? undefined}
          onSelect={handleSelectArchitecture}
        />

        {/* Right: Selected Architecture Details */}
        <Card className="h-full">
          <CardBody>
            <div className="flex items-center justify-between mb-4">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-space-cyan" />
                Architecture Details
              </CardTitle>
              {front && (
                <Button variant="outline" size="sm" onClick={handleExportCSV}>
                  <Download className="h-3.5 w-3.5" />
                  Export CSV
                </Button>
              )}
            </div>

            {selectedArchitecture ? (
              <>
                {points.map((point) => (
                  point.vehicle === selectedArchitecture && (
                    <ArchitectureCard
                      key={point.vehicle}
                      architecture={point}
                      isSelected={true}
                      onSelect={() => handleSelectArchitecture(point.vehicle)}
                      isExpanded={expandedArchitectures.has(point.vehicle)}
                      onToggleExpand={() => handleToggleExpand(point.vehicle)}
                    />
                  )
                ))}
              </>
            ) : (
              <div className="flex items-center justify-center h-64 text-slate-500">
                <div className="text-center">
                  <BarChart2 className="h-12 w-12 mx-auto mb-4 text-slate-700" />
                  <p className="text-lg">Click an architecture on the Pareto front</p>
                  <p className="mt-2 text-sm">Each point represents a non-dominated solution</p>
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* All Architectures Table */}
      <Card>
        <CardBody>
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-space-cyan" />
              All Architectures — {front?.year ?? "—"} Launch Window
            </CardTitle>
            <Badge tone="cyan" className="text-sm">
              {points.length} non-dominated solutions
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-slate-400">
                  <th className="text-left p-3 font-medium">Vehicle</th>
                  <th className="text-right p-3 font-medium">IMLEO (t)</th>
                  <th className="text-right p-3 font-medium">Payload (t)</th>
                  <th className="text-right p-3 font-medium">Radiation (mSv)</th>
                  <th className="text-right p-3 font-medium">Cost ($B)</th>
                  <th className="text-right p-3 font-medium">Transfer (days)</th>
                  <th className="text-left p-3 font-medium">Architecture</th>
                </tr>
              </thead>
              <tbody>
                {points.map((point) => (
                  <tr
                    key={point.vehicle}
                    className={`border-b border-white/5 transition ${
                      selectedArchitecture === point.vehicle ? "bg-space-cyan/5" : "hover:bg-white/[0.02]"
                    }`}
                    onClick={() => handleSelectArchitecture(point.vehicle)}
                    style={{ cursor: "pointer" }}
                  >
                    <td className="p-3 font-medium text-white">{point.vehicle}</td>
                    <td className="p-3 text-right font-mono text-space-cyan">{point.imleoT}</td>
                    <td className="p-3 text-right font-mono text-space-emerald">{point.payloadT}</td>
                    <td className="p-3 text-right font-mono">
                      <span className={
                        point.radiationMSv > 700 ? "text-red-400" :
                        point.radiationMSv > 550 ? "text-amber-400" : "text-emerald-400"
                      }>
                        {point.radiationMSv}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono">
                      <span className={
                        point.costB > 2 ? "text-red-400" :
                        point.costB > 1 ? "text-amber-400" : "text-emerald-400"
                      }>
                        {point.costB.toFixed(1)}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono text-slate-400">{point.transferDays}</td>
                    <td className="p-3 text-slate-400 truncate max-w-xs">{point.architecture}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* Methodology */}
      <Card>
        <CardBody>
          <CardTitle className="flex items-center gap-2 mb-4">
            <BarChart2 className="h-5 w-5 text-space-cyan" />
            Methodology & Assumptions
          </CardTitle>
          {front && (
            <div className="space-y-4">
              <div>
                <p className="font-medium text-white mb-2">Optimization Method</p>
                <p className="text-sm text-slate-400">{front.methodology}</p>
              </div>
              <div>
                <p className="font-medium text-white mb-2">Key Assumptions</p>
                <ul className="space-y-1 text-sm text-slate-400">
                  {front.assumptions.map((assumption, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-space-cyan">•</span>
                      <span>{assumption}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <MetricHighlight
                  icon={<Target className="h-5 w-5" />}
                  label="Objective 1"
                  value="Minimize IMLEO"
                  desc="Initial Mass in LEO — total launch mass"
                />
                <MetricHighlight
                  icon={<Radio className="h-5 w-5" />}
                  label="Objective 2"
                  value="Maximize Payload"
                  desc="Useful cargo to Mars surface"
                />
                <MetricHighlight
                  icon={<Shield className="h-5 w-5" />}
                  label="Objective 3"
                  value="Minimize Radiation"
                  desc="Crew effective dose (mSv)"
                />
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Data Sources */}
      <Card>
        <CardBody>
          <CardTitle className="flex items-center gap-2 mb-4">
            <ExternalLink className="h-5 w-5 text-space-cyan" />
            Data Sources & References
          </CardTitle>
          <ul className="space-y-2 text-sm text-slate-400">
            <li className="flex gap-2">
              <span className="text-space-cyan">•</span>
              <span><strong>Vehicle specs:</strong> NASA SLS, SpaceX Starship/Falcon, Blue Origin New Glenn, Ariane 6 — public specifications</span>
            </li>
            <li className="flex gap-2">
              <span className="text-space-cyan">•</span>
              <span><strong>Radiation:</strong> Badhwar-O'Neill 2010 GCR model (φ=500-600 MV), King 1974 SPE model, NASA-STD-3001 600 mSv career limit</span>
            </li>
            <li className="flex gap-2">
              <span className="text-space-cyan">•</span>
              <span><strong>Cost models:</strong> NASA cost models (PCM, JSCM) + commercial fixed-price estimates</span>
            </li>
            <li className="flex gap-2">
              <span className="text-space-cyan">•</span>
              <span><strong>Trajectory:</strong> Hohmann transfer, C3 from NASA launch window analysis, 2028/2031 conjunction class</span>
            </li>
            <li className="flex gap-2">
              <span className="text-space-cyan">•</span>
              <span><strong>Optimization:</strong> NSGA-II (pop=200, gen=500) + SLSQP gradient refinement for Pareto front convergence</span>
            </li>
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}

function MetricHighlight({
  icon,
  label,
  value,
  desc,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  desc: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-space-cyan/20 text-space-cyan">{icon}</span>
        <span className="font-medium text-white">{label}</span>
      </div>
      <p className="font-mono text-space-cyan text-lg">{value}</p>
      <p className="text-xs text-slate-500 mt-1">{desc}</p>
    </div>
  );
}