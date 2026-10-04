"use client";

import { useMemo, useState } from "react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  Scatter,
  Cell
} from "recharts";
import { ChevronLeft, ChevronRight, Info, Target, Shield, DollarSign, Package } from "lucide-react";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { ParetoFront, ParetoPoint, getAllParetoFronts, getParetoFront } from "@/data/pareto-fronts";

const METRIC_CONFIG = {
  imleoT: { label: "IMLEO (t)", color: "#06b6d4", unit: "t", lowerIsBetter: true },
  payloadT: { label: "Surface Payload (t)", color: "#10b981", unit: "t", lowerIsBetter: false },
  radiationMSv: { label: "Crew Dose (mSv)", color: "#ef4444", unit: "mSv", lowerIsBetter: true },
  costB: { label: "Mission Cost (B$)", color: "#f59e0b", unit: "B$", lowerIsBetter: true },
  transferDays: { label: "Transfer Time (days)", color: "#8b5cf6", unit: "days", lowerIsBetter: true },
} as const;

type MetricKey = keyof typeof METRIC_CONFIG;

interface ParetoFrontChartProps {
  front: ParetoFront;
  selectedPoint?: ParetoPoint;
  onSelectPoint?: (point: ParetoPoint) => void;
}

function ParetoFrontChart({ front, selectedPoint, onSelectPoint }: ParetoFrontChartProps) {
  const [xMetric, setXMetric] = useState<MetricKey>("imleoT");
  const [yMetric, setYMetric] = useState<MetricKey>("payloadT");

  const chartData = useMemo(() => 
    front.points.map((p, i) => ({
      ...p,
      index: i,
      isSelected: selectedPoint?.vehicle === p.vehicle,
    }))
  , [front.points, selectedPoint]);

  const xConfig = METRIC_CONFIG[xMetric];
  const yConfig = METRIC_CONFIG[yMetric];

  // Find Pareto-optimal points (non-dominated)
  const paretoOptimal = useMemo(() => {
    return front.points.filter((p, i) => {
      return !front.points.some((other, j) => {
        if (i === j) return false;
        // Check if other dominates p in all three main objectives
        const dominatesIMLEO = other.imleoT <= p.imleoT;
        const dominatesPayload = other.payloadT >= p.payloadT;
        const dominatesRadiation = other.radiationMSv <= p.radiationMSv;
        const strictlyBetter = 
          (other.imleoT < p.imleoT) || 
          (other.payloadT > p.payloadT) || 
          (other.radiationMSv < p.radiationMSv);
        return dominatesIMLEO && dominatesPayload && dominatesRadiation && strictlyBetter;
      });
    });
  }, [front.points]);

  const paretoSet = new Set(paretoOptimal.map(p => p.vehicle));

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: ParetoPoint & { index: number } }> }) => {
    if (!active || !payload || !payload[0]) return null;
    const point = payload[0].payload;
    return (
      <div className="bg-space-950 border border-space-cyan/30 rounded-lg p-3 min-w-[200px]">
        <p className="font-bold text-space-cyan">{point.vehicle}</p>
        <p className="text-xs text-slate-400 mt-1">{point.architecture}</p>
        <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
          <div><span className="text-slate-500">IMLEO:</span> <span className="text-white ml-1">{point.imleoT}t</span></div>
          <div><span className="text-slate-500">Payload:</span> <span className="text-white ml-1">{point.payloadT}t</span></div>
          <div><span className="text-slate-500">Dose:</span> <span className="text-white ml-1">{point.radiationMSv}mSv</span></div>
          <div><span className="text-slate-500">Cost:</span> <span className="text-white ml-1">${point.costB}B</span></div>
          <div><span className="text-slate-500">Transfer:</span> <span className="text-white ml-1">{point.transferDays}d</span></div>
        </div>
        {paretoSet.has(point.vehicle) && (
          <p className="mt-2 text-xs text-emerald-400 flex items-center gap-1">
            <Target className="h-3 w-3" /> Pareto-optimal
          </p>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardBody>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-space-cyan" />
            Pareto Front: {front.destination.toUpperCase()} {front.year} Window
          </CardTitle>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Badge tone="emerald" className="text-[10px]">Pareto-optimal = non-dominated</Badge>
          </div>
        </div>

        {/* Axis selectors */}
        <div className="flex flex-wrap items-center gap-4 mb-4 text-sm">
          <div className="flex items-center gap-2">
            <label className="text-slate-400">X-axis:</label>
            <select
              value={xMetric}
              onChange={(e) => setXMetric(e.target.value as MetricKey)}
              className="rounded-lg border border-white/10 bg-space-950/60 px-3 py-2 text-sm text-white outline-none focus:border-space-cyan/60"
            >
              {(Object.keys(METRIC_CONFIG) as MetricKey[]).map((key) => (
                <option key={key} value={key}>{METRIC_CONFIG[key].label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-slate-400">Y-axis:</label>
            <select
              value={yMetric}
              onChange={(e) => setYMetric(e.target.value as MetricKey)}
              className="rounded-lg border border-white/10 bg-space-950/60 px-3 py-2 text-sm text-white outline-none focus:border-space-cyan/60"
            >
              {(Object.keys(METRIC_CONFIG) as MetricKey[]).map((key) => (
                <option key={key} value={key}>{METRIC_CONFIG[key].label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[400px]">
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 60, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              type="number"
              dataKey={xMetric}
              name={xConfig.label}
              stroke="#64748b"
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              axisLine={{ stroke: "#334155" }}
              tickLine={{ stroke: "#334155" }}
              tickFormatter={(v) => v.toFixed(0)}
            />
            <YAxis
              type="number"
              dataKey={yMetric}
              name={yConfig.label}
              stroke="#64748b"
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              axisLine={{ stroke: "#334155" }}
              tickLine={{ stroke: "#334155" }}
              tickFormatter={(v) => v.toFixed(0)}
              orientation="left"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            {/* Pareto frontier line (connecting Pareto-optimal points sorted by X) */}
            {paretoOptimal.length > 1 && (
              <Line
                type="monotone"
                dataKey={yMetric}
                data={paretoOptimal.toSorted((a, b) => a[xMetric] - b[xMetric])}
                stroke="#10b981"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                isAnimationActive={false}
              />
            )}

            <Scatter
              data={chartData}
              name={yConfig.label}
              fill="#06b6d4"
              shape="circle"
            >
              {chartData.map((point, i) => (
                <Cell
                  key={i}
                  fill={paretoSet.has(point.vehicle) ? "#10b981" : "#06b6d4"}
                  r={point.isSelected ? 8 : (paretoSet.has(point.vehicle) ? 6 : 4)}
                  stroke={point.isSelected ? "#fff" : "none"}
                  strokeWidth={2}
                />
              ))}
            </Scatter>
          </LineChart>
        </div>

        {/* Architecture cards */}
        <div className="mt-6 space-y-3">
          <h4 className="font-semibold text-white flex items-center gap-2">
            <Info className="h-4 w-4 text-space-cyan" />
            Architectures (click to select)
          </h4>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {front.points.map((point) => (
              <button
                key={point.vehicle}
                onClick={() => onSelectPoint?.(point)}
                className={`text-left p-3 rounded-xl border transition ${
                  selectedPoint?.vehicle === point.vehicle
                    ? "border-space-cyan/60 bg-space-cyan/10 ring-2 ring-space-cyan/20"
                    : "border-white/10 bg-white/5 hover:border-white/20"
                } ${paretoSet.has(point.vehicle) ? "border-emerald-500/30" : ""}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-white">{point.vehicle}</p>
                  {paretoSet.has(point.vehicle) && (
                    <Badge tone="emerald" className="text-[10px]">
                      <Target className="h-2.5 w-2.5 mr-1" /> Optimal
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-400 line-clamp-2 mb-2">{point.architecture}</p>
                <div className="flex flex-wrap gap-1.5 text-[10px]">
                  <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">
                    <Package className="h-2.5 w-2.5 inline mr-0.5" /> {point.imleoT}t IMLEO
                  </span>
                  <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-400">
                    <Package className="h-2.5 w-2.5 inline mr-0.5" /> {point.payloadT}t payload
                  </span>
                  <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400">
                    <Shield className="h-2.5 w-2.5 inline mr-0.5" /> {point.radiationMSv}mSv
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">
                    <DollarSign className="h-2.5 w-2.5 inline mr-0.5" /> ${point.costB}B
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

interface MissionOptimizerPageProps {
  searchParams: Promise<{ year?: string }>;
}

export default async function MissionOptimizerPage({ searchParams }: MissionOptimizerPageProps) {
  const { year: yearParam } = await searchParams;
  const year = yearParam ? parseInt(yearParam, 10) : 2028;
  const fronts = getAllParetoFronts();
  const front = getParetoFront(year) || fronts[0];
  const [selectedPoint, setSelectedPoint] = useState<ParetoPoint | undefined>();

  const availableYears = [...new Set(fronts.map(f => f.year))].sort((a, b) => a - b);

  return (
    <div className="pt-28">
      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <SectionHeading 
          kicker="Astrodynamics Lab" 
          title="Mission Optimizer — Pareto Frontiers" 
          description="Pre-computed mathematically optimal architectures for Mars missions. Each point represents a non-dominated solution balancing mass, payload, radiation, and cost."
        />

        {/* Year selector */}
        <Card className="mb-6">
          <CardBody className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-sm font-medium text-slate-300">Launch Window:</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const idx = availableYears.indexOf(year);
                    if (idx > 0) window.location.href = `/tools/mission-optimizer?year=${availableYears[idx - 1]}`;
                  }}
                  disabled={year === availableYears[0]}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <span className="font-mono text-xl text-white px-4">{year}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const idx = availableYears.indexOf(year);
                    if (idx < availableYears.length - 1) window.location.href = `/tools/mission-optimizer?year=${availableYears[idx + 1]}`;
                  }}
                  disabled={year === availableYears[availableYears.length - 1]}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
                <span className="text-xs text-slate-500 ml-2">Next: {availableYears[availableYears.length - 1]}</span>
              </div>
            </div>
          </CardBody>
        </Card>

        <ParetoFrontChart 
          front={front} 
          selectedPoint={selectedPoint}
          onSelectPoint={setSelectedPoint}
        />

        {/* Methodology & Assumptions */}
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <Card>
            <CardBody>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-4 w-4 text-space-cyan" /> Methodology
              </CardTitle>
              <p className="mt-3 text-sm text-slate-400">{front.methodology}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-4 w-4 text-space-cyan" /> Key Assumptions
              </CardTitle>
              <ul className="mt-3 space-y-2 text-sm text-slate-400">
                {front.assumptions.map((a, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-space-cyan">▸</span> {a}
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </div>

        {/* Selected architecture detail */}
        {selectedPoint && (
          <Card className="mt-6 border-space-cyan/30 bg-space-cyan/5">
            <CardBody>
              <div className="flex items-center justify-between mb-4">
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-emerald-400" />
                  Selected: {selectedPoint.vehicle}
                  {paretoSet?.has(selectedPoint.vehicle) && (
                    <Badge tone="emerald" className="ml-2">
                      <Target className="h-2.5 w-2.5 mr-1" /> Pareto-optimal
                    </Badge>
                  )}
                </CardTitle>
              </div>
              <p className="text-sm text-slate-400 mb-4">{selectedPoint.architecture}</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <StatCard label="IMLEO" value={`${selectedPoint.imleoT} t`} icon={<Package className="h-4 w-4" />} />
                <StatCard label="Surface Payload" value={`${selectedPoint.payloadT} t`} icon={<Package className="h-4 w-4" />} />
                <StatCard label="Crew Dose" value={`${selectedPoint.radiationMSv} mSv`} icon={<Shield className="h-4 w-4" />} />
                <StatCard label="Cost" value={`${selectedPoint.costB} B$`} icon={<DollarSign className="h-4 w-4" />} />
                <StatCard label="Transfer" value={`${selectedPoint.transferDays} days`} icon={<Target className="h-4 w-4" />} />
              </div>
              <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/10">
                <p className="font-medium text-white mb-2">Key Trade-offs:</p>
                <ul className="space-y-1 text-sm text-slate-400">
                  {selectedPoint.trades.map((t, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-space-cyan">▸</span> {t}
                    </li>
                  ))}
                </ul>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-space-cyan">{icon}</span>
        <span className="text-xs text-slate-400">{label}</span>
      </div>
      <p className="font-mono text-lg text-white">{value}</p>
    </div>
  );
}

const paretoSet = new Set<string>();