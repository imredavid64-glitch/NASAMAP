"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, Target } from "lucide-react";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { designMission, type MissionDesignOptions } from "@/lib/mission";
import historicalMissions from "@/data/historical-missions.json";

interface ValidationResult {
  missionId: string;
  missionName: string;
  matches: ValidationCheck[];
  overallScore: number; // 0-100
}

interface ValidationCheck {
  label: string;
  engineValue: string;
  historicalValue: string;
  match: "exact" | "close" | "off" | "unknown";
  tolerance?: string;
  notes?: string;
}

const VALIDATION_MISSIONS = [
  "apollo-8",
  "apollo-10",
  "apollo-11",
  "apollo-12",
  "apollo-13",
  "apollo-14",
  "apollo-15",
  "apollo-16",
  "apollo-17",
  "artemis-1",
  "msl-curiosity",
  "mars2020-perseverance",
];

function compareValues(engine: number, historical: number, tolerancePct = 10): "exact" | "close" | "off" | "unknown" {
  if (historical === 0) return "unknown";
  const diff = Math.abs((engine - historical) / historical) * 100;
  if (diff <= 5) return "exact";
  if (diff <= tolerancePct) return "close";
  return "off";
}

function formatNumber(val: number, unit: string): string {
  if (val >= 1e6) return `${(val / 1e6).toFixed(2)}M ${unit}`;
  if (val >= 1e3) return `${(val / 1e3).toFixed(1)}K ${unit}`;
  return `${val.toFixed(1)} ${unit}`;
}

export function HistoricalValidationTab() {
  const [selectedMission, setSelectedMission] = useState<string>("apollo-11");

  const results = useMemo(() => {
    return VALIDATION_MISSIONS.map((missionId) => {
      const hist = historicalMissions.missions.find((m) => m.id === missionId);
      if (!hist) return null;

      // Create a design that matches the historical mission as closely as possible
      const designOpts: any = {
        destination: hist.destination as "moon" | "mars",
        vehicleId: hist.vehicle.toLowerCase().replace(/\s+/g, "-"),
        crew: hist.crew?.length || 0,
        surfaceDays: hist.durationDays * 0.5, // rough estimate
      };

      const design = designMission(designOpts);

      const checks: any[] = [];

      // Duration check
      checks.push({
        label: "Mission Duration",
        engineValue: `${design.totalDays.toFixed(1)} days`,
        historicalValue: `${hist.durationDays} days`,
        match: compareValues(design.totalDays, hist.durationDays, 15),
        tolerance: "±15%",
        notes: "Includes transit + surface",
      });

      // Delta-v check (for moon missions)
      if (hist.destination === "moon") {
        checks.push({
          label: "Total Δv",
          engineValue: `${design.totalDeltaVKmS.toFixed(2)} km/s`,
          historicalValue: "3.1 km/s (Apollo TLI)",
          match: compareValues(design.totalDeltaVKmS, 3.1, 10),
          tolerance: "±10%",
        });
      }

      // Crew size
      checks.push({
        label: "Crew Size",
        engineValue: `${design.crew}`,
        historicalValue: `${hist.crew?.length || 0}`,
        match: design.crew === (hist.crew?.length || 0) ? "exact" : "off",
      });

      // Vehicle
      checks.push({
        label: "Launch Vehicle",
        engineValue: design.vehicle.name,
        historicalValue: hist.vehicle,
        match: design.vehicle.name.toLowerCase().includes(hist.vehicle.toLowerCase().split(" ")[0]) ? "exact" : "close",
      });

      const scoredChecks = checks.filter(c => c.match !== "unknown");
      const score = scoredChecks.length > 0
        ? Math.round(
            (scoredChecks.filter(c => c.match === "exact").length * 100 +
              scoredChecks.filter(c => c.match === "close").length * 60) /
              scoredChecks.length
          )
        : 0;

      return {
        missionId: hist.id,
        missionName: hist.name,
        matches: checks,
        overallScore: score,
      };
    }).filter(Boolean) as Array<{ missionId: string; missionName: string; matches: any[]; overallScore: number }>;
  }, []);

  const selectedResult = results.find(r => r.missionId === selectedMission) ?? results[0];

  return (
    <div className="space-y-6">
      {/* Mission Selector */}
      <Card>
        <CardBody>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-space-cyan" /> Historical Validation
          </CardTitle>
          <p className="mt-2 text-sm text-slate-400">
            Compare engine predictions against real historical mission data. Select a mission to see detailed validation.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {VALIDATION_MISSIONS.map((missionId) => {
              const hist = historicalMissions.missions.find(m => m.id === missionId);
              const result = results.find(r => r.missionId === missionId);
              if (!hist) return null;
              return (
                <button
                  key={missionId}
                  onClick={() => setSelectedMission(missionId)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    selectedMission === missionId
                      ? "bg-space-cyan/20 text-space-cyan border border-space-cyan/30"
                      : "bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10"
                  }`}>
                  {hist.name}
                  <Badge className="ml-2" tone={
                    (result?.overallScore || 0) >= 80 ? "emerald" :
                    (result?.overallScore || 0) >= 60 ? "amber" : "crimson"
                  }>
                    {result?.overallScore || 0}%
                  </Badge>
                </button>
              )
            })}
          </div>
        </CardBody>
      </Card>

      {/* Validation Results */}
      {selectedResult && (
        <>
          <Card>
            <CardBody>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">{selectedResult.missionName}</h3>
                  <p className="text-sm text-slate-400">Overall Match: <Badge tone={
                    selectedResult.overallScore >= 80 ? "emerald" :
                    selectedResult.overallScore >= 60 ? "amber" : "crimson"
                  } className="text-sm">{selectedResult.overallScore}% Match</Badge></p>
                </div>
              </div>

              <div className="space-y-3">
                {selectedResult.matches.map((check, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-lg border border-white/10 bg-white/5">
                    <div className="flex-1">
                      <p className="font-medium text-white">{check.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Engine: <span className="font-mono text-white">{check.engineValue}</span> | Historical: <span className="font-mono text-white">{check.historicalValue}</span>
                        {check.tolerance && <span className="text-slate-500 ml-2">({check.tolerance})</span>}
                      </p>
                      {check.notes && <p className="text-[11px] text-slate-500 mt-1">{check.notes}</p>}
                    </div>
                    <Badge tone={
                      check.match === "exact" ? "emerald" :
                      check.match === "close" ? "amber" : "crimson"
                    } className="text-sm">
                      {check.match === "exact" ? "✓ Exact" : check.match === "close" ? "≈ Close" : "✗ Off"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Summary Stats */}
          <Card>
            <CardBody>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-space-cyan" /> Summary
              </CardTitle>
              <div className="mt-4 grid gap-4 sm:grid-cols-4">
                <StatTile label="Missions Validated" value={`${results.length}`} />
                <StatTile label="Avg Match Score" value={`${Math.round(results.reduce((a, r) => a + r.overallScore, 0) / results.length)}%`} />
                <StatTile label="High Confidence" value={`${results.filter(r => r.overallScore >= 80).length}`} icon={<CheckCircle2 className="h-4 w-4 text-emerald-400" />} />
                <StatTile label="Needs Review" value={`${results.filter(r => r.overallScore < 60).length}`} icon={<AlertTriangle className="h-4 w-4 text-amber-400" />} />
              </div>
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}

function StatTile({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
      {icon && <div className="flex items-center justify-center w-8 h-8 rounded bg-space-cyan/20 text-space-cyan mb-2">{icon}</div>}
      <p className="text-xs text-slate-400">{label}</p>
      <p className="font-mono text-xl text-white">{value}</p>
    </div>
  );
}