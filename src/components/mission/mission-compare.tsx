"use client";

import { useMemo } from "react";
import { ChevronLeft, ChevronRight, ArrowRight, Minus, Plus, AlertTriangle, CheckCircle2, XCircle, Download, Share2, Twitter, Linkedin, Copy, Check } from "lucide-react";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { decodeDesignQuery, encodeDesignQuery, type DesignInput } from "@/lib/design-link";
import { designMission } from "@/lib/mission";
import { scoreMission, type Scorecard } from "@/lib/score";
import { cn } from "@/lib/cn";

interface MissionCompareProps {
  designA: DesignInput | null;
  designB: DesignInput | null;
}

export function MissionCompare({ designA, designB }: MissionCompareProps) {
  const missionA = useMemo(() => designA ? designMission(designA) : null, [designA]);
  const missionB = useMemo(() => designB ? designMission(designB) : null, [designB]);
  const scorecardA = useMemo(() => missionA ? scoreMission(missionA) : null, [missionA]);
  const scorecardB = useMemo(() => missionB ? scoreMission(missionB) : null, [missionB]);

  const diffs = useMemo(() => {
    if (!missionA || !missionB) return [];
    return [
      { label: "Destination", key: "destination" as const, a: missionA.destination, b: missionB.destination, unit: "" },
      { label: "Vehicle", key: "vehicle" as const, a: missionA.vehicle.name, b: missionB.vehicle.name, unit: "" },
      { label: "Crew", key: "crew" as const, a: missionA.crew, b: missionB.crew, unit: "" },
      { label: "Surface Days", key: "surfaceDays" as const, a: missionA.surfaceDays, b: missionB.surfaceDays, unit: "d" },
      { label: "Total Δv", key: "totalDeltaVKmS" as const, a: missionA.totalDeltaVKmS, b: missionB.totalDeltaVKmS, unit: "km/s", precision: 2 },
      { label: "Transit Time", key: "transferDays" as const, a: missionA.transferDays, b: missionB.transferDays, unit: "d", precision: 1 },
      { label: "Stack Mass", key: "requiredMassKg" as const, a: missionA.requiredMassKg, b: missionB.requiredMassKg, unit: "t", precision: 1, divide: 1000 },
      { label: "Payload Capacity", key: "payloadCapacityKg" as const, a: missionA.payloadCapacityKg ?? 0, b: missionB.payloadCapacityKg ?? 0, unit: "t", precision: 1, divide: 1000 },
      { label: "Launch Gate", key: "launchGate" as const, a: missionA.launchGate, b: missionB.launchGate, unit: "" },
      { label: "Radiation Dose", key: "radiationMsvTotal" as const, a: missionA.radiationMsvTotal, b: missionB.radiationMsvTotal, unit: "mSv", precision: 0 },
      { label: "Light Lag (one-way)", key: "arrivalLt.oneWaySec" as const, a: missionA.arrivalLt.oneWaySec, b: missionB.arrivalLt.oneWaySec, unit: "s", precision: 0 },
      { label: "Light Lag (round-trip)", key: "arrivalLt.roundTripLabel" as const, a: missionA.arrivalLt.roundTripLabel, b: missionB.arrivalLt.roundTripLabel, unit: "", precision: 0 },
      { label: "Total Consumables", key: "consumablesTotalKg" as const, a: missionA.consumablesTotalKg, b: missionB.consumablesTotalKg, unit: "t", precision: 1, divide: 1000 },
      { label: "O₂", key: "consumables.oxygenKg" as const, a: missionA.consumables.oxygenKg, b: missionB.consumables.oxygenKg, unit: "kg", precision: 0 },
      { label: "Water", key: "consumables.waterKg" as const, a: missionA.consumables.waterKg, b: missionB.consumables.waterKg, unit: "kg", precision: 0 },
      { label: "Food", key: "consumables.foodKg" as const, a: missionA.consumables.foodKg, b: missionB.consumables.foodKg, unit: "kg", precision: 0 },
      { label: "Total Days", key: "totalDays" as const, a: missionA.totalDays, b: missionB.totalDays, unit: "d", precision: 1 },
    ].map(d => {
      const valA = getNestedValue(d.key as string, missionA);
      const valB = getNestedValue(d.key as string, missionB);
      const a = d.divide ? valA / d.divide : valA;
      const b = d.divide ? valB / d.divide : valB;
      const diff = b - a;
      const pct = a !== 0 ? ((diff / a) * 100) : 0;
      return {
        ...d,
        valA: a,
        valB: b,
        diff,
        pct,
        changed: Math.abs(diff) > (d.precision ? 0.01 : 0.5),
        better: diff > 0 ? "B" : diff < 0 ? "A" : "same",
      };
    });
  }, [missionA, missionB]);

  const scoreDiff = useMemo(() => {
    if (!scorecardA || !scorecardB) return null;
    return {
      total: scorecardB.score - scorecardA.score,
      grade: scorecardB.grade.localeCompare(scorecardA.grade),
      objectives: scorecardA.objectives.map((oa, i) => {
        const ob = scorecardB.objectives[i];
return {
        label: oa.label,
        a: oa.earned,
        b: ob?.earned ?? 0,
        diff: (ob?.earned ?? 0) - oa.earned,
      };
      }),
    };
  }, [scorecardA, scorecardB]);

  const formatValue = (val: number, precision?: number, unit?: string) => {
    const p = precision ?? 0;
    return `${val.toFixed(p)} ${unit ?? ""}`.trim();
  };

  const getUrl = (design: DesignInput) => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/mission?${encodeDesignQuery(design)}`;
  };

  const copyUrl = (design: DesignInput, label: string) => {
    const url = getUrl(design);
    navigator.clipboard.writeText(url);
    alert(`${label} URL copied!`);
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <Card className="glass-panel">
        <CardBody className="p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Mission A URL or Design String</label>
              <input
                value={designA ? encodeDesignQuery(designA) : ""}
                onChange={(e) => {
                  // Parent should handle this via URL params
                }}
                placeholder="?d=mars&v=starship&c=4&s=90"
                className="flex h-10 w-full rounded-xl border border-white/10 bg-space-950/60 px-3 py-2.5 text-sm font-mono text-white outline-none placeholder:text-slate-500 focus:border-space-cyan/60"
                readOnly
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Mission B URL or Design String</label>
              <input
                value={designB ? encodeDesignQuery(designB) : ""}
                onChange={(e) => {}}
                placeholder="?d=moon&v=sls-block-1&c=4&s=7"
                className="flex h-10 w-full rounded-xl border border-white/10 bg-space-950/60 px-3 py-2.5 text-sm font-mono text-white outline-none placeholder:text-slate-500 focus:border-space-cyan/60"
                readOnly
              />
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500">Use the Mission Lab to create designs, then add them as URL params: <code className="font-mono bg-white/5 px-1 rounded">?a=...&b=...</code></p>
        </CardBody>
      </Card>

      {/* Score Comparison */}
      {scorecardA && scorecardB && (
        <Card className="glass-panel">
          <CardBody>
            <CardTitle className="flex items-center justify-between mb-4">
              Score Comparison
              <div className="flex items-center gap-2">
                <Badge tone={scorecardA.grade === "S" ? "emerald" : scorecardA.grade === "A" ? "cyan" : scorecardA.grade === "B" ? "cyan" : scorecardA.grade === "C" ? "amber" : "crimson"} className="text-lg">
                  {scorecardA.grade} ({scorecardA.score})
                </Badge>
                <span className="text-space-cyan text-lg">→</span>
                <Badge tone={scorecardB.grade === "S" ? "emerald" : scorecardB.grade === "A" ? "cyan" : scorecardB.grade === "B" ? "cyan" : scorecardB.grade === "C" ? "amber" : "crimson"} className="text-lg">
                  {scorecardB.grade} ({scorecardB.score})
                </Badge>
                <Badge tone={scoreDiff && scoreDiff.total > 0 ? "emerald" : scoreDiff && scoreDiff.total < 0 ? "crimson" : "slate"} className="text-lg">
                  {scoreDiff && scoreDiff.total > 0 ? "+" : ""}{scoreDiff?.total ?? 0}
                </Badge>
              </div>
            </CardTitle>
            
            {scoreDiff && (
              <div className="space-y-2">
                {scoreDiff.objectives.map((obj, i) => (
                  <div key={i} className="flex items-center justify-between gap-4">
                    <span className="flex-1 text-sm text-slate-300">{obj.label}</span>
                    <div className="flex items-center gap-2 text-sm font-mono">
                      <span className="w-16 text-right text-slate-400">{obj.a}</span>
                      <ArrowRight className="h-4 w-4 text-space-cyan" />
                      <span className="w-16 text-left text-slate-400">{obj.b}</span>
                      <Badge tone={obj.diff > 0 ? "emerald" : obj.diff < 0 ? "crimson" : "slate"} className="text-[10px]">
                        {obj.diff > 0 ? "+" : ""}{obj.diff}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Parameter Diff Table */}
      <Card className="glass-panel">
        <CardBody>
          <CardTitle className="mb-4">Parameter Diff</CardTitle>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs text-slate-400">
                  <th className="pb-2 pr-4">Parameter</th>
                  <th className="pb-2 pr-4 text-right">Mission A</th>
                  <th className="pb-2 pr-4 text-right">Mission B</th>
                  <th className="pb-2 pr-4 text-right">Δ</th>
                  <th className="pb-2 pr-4 text-right">% Change</th>
                  <th className="pb-2">Better</th>
                </tr>
              </thead>
              <tbody>
                {diffs.map((d, i) => (
                  <tr key={i} className={cn("border-b border-white/5", d.changed && "bg-space-cyan/5")}>
                    <td className="py-2 pr-4 font-medium text-white">{d.label}</td>
                    <td className="py-2 pr-4 text-right text-slate-400 font-mono">
                      {formatValue(d.valA, d.precision, d.unit)}
                    </td>
                    <td className="py-2 pr-4 text-right text-slate-400 font-mono">
                      {formatValue(d.valB, d.precision, d.unit)}
                    </td>
                    <td className="py-2 pr-4 text-right font-mono">
                      {d.changed && (
                        <span className={cn(d.diff > 0 ? "text-space-emerald" : "text-red-400")}>
                          {d.diff > 0 ? "+" : ""}{formatValue(d.diff, d.precision, d.unit)}
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-4 text-right font-mono text-slate-500">
                      {d.changed ? `${d.pct > 0 ? "+" : ""}{d.pct.toFixed(1)}%` : "—"}
                    </td>
                    <td className="py-2">
                      {d.changed && (
                        <Badge tone={d.better === "A" ? "emerald" : "crimson"} className="text-[10px]">
                          {d.better} wins
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* Scorecard Objective Diff */}
      {scoreDiff && (
        <Card className="glass-panel">
          <CardBody>
            <CardTitle className="mb-4">Objective Score Diff</CardTitle>
            <div className="space-y-2">
              {scoreDiff.objectives.map((obj, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-48 text-sm text-slate-300 truncate">{obj.label}</span>
                  <div className="flex-1 h-3 bg-space-950/60 rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", obj.diff > 0 ? "bg-space-emerald" : obj.diff < 0 ? "bg-red-400" : "bg-slate-500")}
                      style={{ width: `${Math.min(100, Math.abs(obj.diff) / 10 * 100)}%` }}
                    />
                  </div>
                  <span className={cn("font-mono text-xs", obj.diff > 0 ? "text-space-emerald" : obj.diff < 0 ? "text-red-400" : "text-slate-400")} style={{ width: "3rem" }}>
                    {obj.diff > 0 ? "+" : ""}{obj.diff}
                  </span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Summary */}
      {(missionA || missionB) && (
        <Card className="glass-panel">
          <CardBody>
            <CardTitle className="mb-4">Quick Summary</CardTitle>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-slate-400 mb-1">Grade Change</p>
                <p className="font-mono text-2xl text-space-cyan">
                  {scorecardA && scorecardB ? `${scorecardA.grade} → ${scorecardB.grade}` : "—"}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-slate-400 mb-1">Score Delta</p>
                <p className={cn("font-mono text-2xl", scoreDiff && scoreDiff.total > 0 ? "text-space-emerald" : scoreDiff && scoreDiff.total < 0 ? "text-red-400" : "text-space-cyan")}>
                  {scoreDiff ? (scoreDiff.total > 0 ? "+" : "") + scoreDiff.total : "—"}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-slate-400 mb-1">Parameters Changed</p>
                <p className="font-mono text-2xl text-space-cyan">
                  {diffs.filter(d => d.changed).length} / {diffs.length}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

function getNestedValue(path: string, obj: any): number {
  return path.split(".").reduce((o, k) => o?.[k], obj) ?? 0;
}