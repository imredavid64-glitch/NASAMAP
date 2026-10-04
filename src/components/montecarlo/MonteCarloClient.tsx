"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Play, Pause, BarChart2, Download, Settings, Target, AlertTriangle, DollarSign, Package, Plus, X, Loader2 } from "lucide-react";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionHeading } from "@/components/ui/section-heading";
import { runMonteCarlo, formatMonteCarloResult, DEFAULT_MONTE_CARLO_PARAMS, type MonteCarloConfig, type ParameterDistribution, type MonteCarloResult } from "@/lib/montecarlo";
import { designMission, type MissionDesignOptions } from "@/lib/mission";
import { DEFAULT_DESIGN } from "@/lib/design-link";
import { scoreMission } from "@/lib/score";

export function MonteCarloClient() {
  const searchParams = useSearchParams();
  const designParam = searchParams.get("design");
  
  // Parse design from URL if provided
  let initialDesign: MissionDesignOptions = DEFAULT_DESIGN;
  if (designParam) {
    try {
      const decoded = atob(designParam);
      initialDesign = JSON.parse(decoded);
    } catch {
      // Use default
    }
  }

  const [config, setConfig] = useState<MonteCarloConfig>({
    iterations: 500,
    parameters: DEFAULT_MONTE_CARLO_PARAMS,
    baseDesign: initialDesign,
    seed: 42,
  });
  const [result, setResult] = useState<MonteCarloResult | null>(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<"results" | "config" | "distribution">("results");

  const handleRun = async () => {
    setRunning(true);
    setProgress(0);
    
    // Run in chunks to allow progress updates
    const chunkSize = 50;
    const totalIterations = config.iterations;
    const allSamples: any[] = [];
    
    for (let i = 0; i < totalIterations; i += chunkSize) {
      const chunkIterations = Math.min(chunkSize, totalIterations - i);
      const chunkConfig = { ...config, iterations: chunkIterations, seed: (config.seed ?? Date.now()) + i };
      
      // Run chunk synchronously for now (could be moved to web worker)
      const chunkResult = runMonteCarlo(chunkConfig);
      allSamples.push(...chunkResult.samples);
      
      setProgress(((i + chunkIterations) / totalIterations) * 100);
      // Allow UI to update
      await new Promise(r => setTimeout(r, 0));
    }
    
    // Combine results
    const combinedResult: MonteCarloResult = {
      ...runMonteCarlo({ ...config, iterations: allSamples.length }),
      samples: allSamples,
    };
    
    // Recompute metrics from all samples
    const combinedResultFull = recomputeMetrics(allSamples, config);
    setResult(combinedResultFull);
    setRunning(false);
    setProgress(100);
  };

  const recomputeMetrics = (samples: any[], config: MonteCarloConfig): MonteCarloResult => {
    if (samples.length === 0) {
      return runMonteCarlo(config);
    }
    
    const imleoT = samples.map((s: any) => s.imleoT);
    const payloadT = samples.map((s: any) => s.payloadT);
    const radiationMSv = samples.map((s: any) => s.radiationMSv);
    const totalCostB = samples.map((s: any) => s.totalCostB);
    const scores = samples.map((s: any) => s.score);
    const grades = samples.map((s: any) => s.grade);
    const goCount = samples.filter((s: any) => s.go).length;

    const gradeDist: Record<string, number> = {};
    for (const g of grades) {
      gradeDist[g] = (gradeDist[g] || 0) + 1;
    }
    for (const k of Object.keys(gradeDist)) {
      gradeDist[k] = gradeDist[k] / samples.length;
    }

    const mean = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
    const stdDev = (arr: number[], m: number) => Math.sqrt(arr.reduce((a, b) => a + (b - m) ** 2, 0) / arr.length);
    const percentile = (arr: number[], p: number) => {
      const sorted = [...arr].sort((a, b) => a - b);
      const idx = Math.ceil(p / 100 * sorted.length) - 1;
      return sorted[Math.max(0, Math.min(sorted.length - 1, idx))];
    };

    const mImleo = mean(imleoT);
    const mPayload = mean(payloadT);
    const mRad = mean(radiationMSv);
    const mCost = mean(totalCostB);
    const mScore = mean(scores);

    const metrics = {
      imleoT: { mean: mImleo, stdDev: stdDev(imleoT, mImleo), p5: percentile(imleoT, 5), p50: percentile(imleoT, 50), p95: percentile(imleoT, 95) },
      payloadT: { mean: mPayload, stdDev: stdDev(payloadT, mPayload), p5: percentile(payloadT, 5), p50: percentile(payloadT, 50), p95: percentile(payloadT, 95) },
      radiationMSv: { mean: mRad, stdDev: stdDev(radiationMSv, mRad), p5: percentile(radiationMSv, 5), p50: percentile(radiationMSv, 50), p95: percentile(radiationMSv, 95) },
      totalCostB: { mean: mCost, stdDev: stdDev(totalCostB, mCost), p5: percentile(totalCostB, 5), p50: percentile(totalCostB, 50), p95: percentile(totalCostB, 95) },
      score: { mean: mScore, stdDev: stdDev(scores, mScore), p5: percentile(scores, 5), p50: percentile(scores, 50), p95: percentile(scores, 95) },
      gradeDistribution: gradeDist,
      goProbability: goCount / samples.length,
    };

    return {
      metrics,
      samples,
      config,
    };
  };

  const handleParamChange = (index: number, field: keyof ParameterDistribution, value: number | string) => {
    const newParams = [...config.parameters];
    newParams[index] = { ...newParams[index], [field]: typeof value === "string" ? parseFloat(value) : value };
    setConfig({ ...config, parameters: newParams });
  };

  const addParameter = () => {
    setConfig({ ...config, parameters: [...config.parameters, { name: "newParam", type: "uniform", mean: 1, min: 0.8, max: 1.2 }] });
  };

  const removeParameter = (index: number) => {
    setConfig({ ...config, parameters: config.parameters.filter((_, i) => i !== index) });
  };

  const exportResults = () => {
    if (!result) return;
    const text = formatMonteCarloResult(result);
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `monte-carlo-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="pt-28">
      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <SectionHeading
          kicker="Astrodynamics Lab"
          title="Monte Carlo Uncertainty Analysis"
          description="Run thousands of simulations with parameter uncertainty to compute confidence intervals on IMLEO, payload, radiation, cost, and mission score."
        />

        {/* Progress Bar */}
        {running && (
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-slate-400">Running simulation...</span>
              <span className="font-mono text-space-cyan">{progress.toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-space-cyan to-space-emerald transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          {/* Configuration Panel */}
          <Card className="lg:sticky lg:top-28">
            <CardBody>
              <CardTitle className="flex items-center gap-2 mb-4">
                <Settings className="h-5 w-5 text-space-cyan" />
                Configuration
              </CardTitle>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Iterations</label>
                  <Input
                    type="number"
                    value={config.iterations}
                    onChange={(e) => setConfig({ ...config, iterations: Math.max(100, Math.min(10000, parseInt(e.target.value))) })}
                    className="rounded-lg border border-white/10 bg-space-950/60 px-3 py-2 text-sm text-white outline-none focus:border-space-cyan/60"
                    min={100}
                    max={10000}
                    step={100}
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Random Seed</label>
                  <Input
                    type="number"
                    value={config.seed}
                    onChange={(e) => setConfig({ ...config, seed: parseInt(e.target.value) || Date.now() })}
                    className="rounded-lg border border-white/10 bg-space-950/60 px-3 py-2 text-sm text-white outline-none focus:border-space-cyan/60"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Base Design</label>
                  <select
                    value={config.baseDesign.destination}
                    onChange={(e) => setConfig({ ...config, baseDesign: { ...config.baseDesign, destination: e.target.value as "moon" | "mars" } })}
                    className="w-full rounded-lg border border-white/10 bg-space-950/60 px-3 py-2 text-sm text-white outline-none focus:border-space-cyan/60"
                  >
                    <option value="moon">Moon</option>
                    <option value="mars">Mars</option>
                  </select>
                </div>

                <hr className="border-white/10 my-4" />

                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-white">Uncertain Parameters</span>
                  <Badge tone="cyan" className="text-[10px]">{config.parameters.length}</Badge>
                </div>

                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {config.parameters.map((param, i) => (
                    <div key={i} className="rounded-lg border border-white/10 bg-white/5 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs text-space-cyan">param_{i}</span>
                        <Button variant="ghost" size="sm" onClick={() => removeParameter(i)} className="text-red-400 hover:text-red-300">
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-3">
                        <div>
                          <label className="block text-[10px] text-slate-500 mb-1">Name</label>
                          <Input
                            value={config.parameters[i].name}
                            onChange={(e) => handleParamChange(i, "name", e.target.value)}
                            className="rounded-lg border border-white/10 bg-space-950/60 px-2 py-1.5 text-[11px] text-white outline-none focus:border-space-cyan/60"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500 mb-1">Type</label>
                          <select
                            value={config.parameters[i].type}
                            onChange={(e) => handleParamChange(i, "type", e.target.value)}
                            className="w-full rounded-lg border border-white/10 bg-space-950/60 px-2 py-1.5 text-[11px] text-white outline-none focus:border-space-cyan/60"
                          >
                            <option value="normal">Normal</option>
                            <option value="lognormal">Log-Normal</option>
                            <option value="uniform">Uniform</option>
                            <option value="triangular">Triangular</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500 mb-1">Mean</label>
                          <Input
                            type="number"
                            step="0.01"
                            value={config.parameters[i].mean}
                            onChange={(e) => handleParamChange(i, "mean", parseFloat(e.target.value))}
                            className="w-full rounded-lg border border-white/10 bg-space-950/60 px-2 py-1.5 text-[11px] text-white outline-none focus:border-space-cyan/60"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500 mb-1">StdDev</label>
                          <Input
                            type="number"
                            step="0.01"
                            value={config.parameters[i].stdDev ?? ""}
                            onChange={(e) => handleParamChange(i, "stdDev", parseFloat(e.target.value))}
                            className="w-full rounded-lg border border-white/10 bg-space-950/60 px-2 py-1.5 text-[11px] text-white outline-none focus:border-space-cyan/60"
                            placeholder="0.1"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500 mb-1">Min</label>
                          <Input
                            type="number"
                            step="0.01"
                            value={config.parameters[i].min ?? ""}
                            onChange={(e) => handleParamChange(i, "min", parseFloat(e.target.value))}
                            className="w-full rounded-lg border border-white/10 bg-space-950/60 px-2 py-1.5 text-[11px] text-white outline-none focus:border-space-cyan/60"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500 mb-1">Max</label>
                          <Input
                            type="number"
                            step="0.01"
                            value={config.parameters[i].max ?? ""}
                            onChange={(e) => handleParamChange(i, "max", parseFloat(e.target.value))}
                            className="w-full rounded-lg border border-white/10 bg-space-950/60 px-2 py-1.5 text-[11px] text-white outline-none focus:border-space-cyan/60"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500 mb-1">Mode</label>
                          <Input
                            type="number"
                            step="0.01"
                            value={config.parameters[i].mode ?? ""}
                            onChange={(e) => handleParamChange(i, "mode", parseFloat(e.target.value))}
                            className="w-full rounded-lg border border-white/10 bg-space-950/60 px-2 py-1.5 text-[11px] text-white outline-none focus:border-space-cyan/60"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Button onClick={addParameter} variant="outline" size="sm" className="w-full">
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Parameter
                </Button>

                <div className="pt-4 border-t border-white/10">
                  <Button
                    onClick={handleRun}
                    disabled={running}
                    className={`w-full ${running ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {running ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Running...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Run Monte Carlo
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Results Panel */}
        <div className="space-y-6">
          {result ? (
            <>
              {/* Key Metrics */}
              <Card>
                <CardBody>
                  <CardTitle className="flex items-center gap-2 mb-4">
                    <BarChart2 className="h-5 w-5 text-space-cyan" />
                    Key Metrics (P5 / P50 / P95)
                  </CardTitle>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    <MetricCard 
                      label="IMLEO" 
                      value={`${result.metrics.imleoT.mean.toFixed(1)} ± ${result.metrics.imleoT.stdDev.toFixed(1)} t`}
                      sub={`P5: ${result.metrics.imleoT.p5.toFixed(1)} | P50: ${result.metrics.imleoT.p50.toFixed(1)} | P95: ${result.metrics.imleoT.p95.toFixed(1)}`}
                      icon={<BarChart2 className="h-4 w-4" />}
                    />
                    <MetricCard 
                      label="Surface Payload" 
                      value={`${result.metrics.payloadT.mean.toFixed(1)} ± ${result.metrics.payloadT.stdDev.toFixed(1)} t`}
                      sub={`P5: ${result.metrics.payloadT.p5.toFixed(1)} | P50: ${result.metrics.payloadT.p50.toFixed(1)} | P95: ${result.metrics.payloadT.p95.toFixed(1)}`}
                      icon={<Target className="h-4 w-4" />}
                    />
                    <MetricCard 
                      label="Radiation Dose" 
                      value={`${result.metrics.radiationMSv.mean.toFixed(0)} ± ${result.metrics.radiationMSv.stdDev.toFixed(0)} mSv`}
                      sub={`P5: ${result.metrics.radiationMSv.p5.toFixed(0)} | P50: ${result.metrics.radiationMSv.p50.toFixed(0)} | P95: ${result.metrics.radiationMSv.p95.toFixed(0)}`}
                      icon={<AlertTriangle className="h-4 w-4" />}
                    />
                    <MetricCard 
                      label="Total Cost" 
                      value={`$${result.metrics.totalCostB.mean.toFixed(2)} ± ${result.metrics.totalCostB.stdDev.toFixed(2)} B`}
                      sub={`P5: $${result.metrics.totalCostB.p5.toFixed(2)}B | P50: $${result.metrics.totalCostB.p50.toFixed(2)}B | P95: $${result.metrics.totalCostB.p95.toFixed(2)}B`}
                      icon={<DollarSign className="h-4 w-4" />}
                    />
                    <MetricCard 
                      label="GO Probability" 
                      value={`${(result.metrics.goProbability * 100).toFixed(1)}%`}
                      sub={`Mean Score: ${result.metrics.score.mean.toFixed(1)} ± ${result.metrics.score.stdDev.toFixed(1)}`}
                      icon={<Target className="h-4 w-4" />}
                      tone="emerald"
                    />
                  </div>
                </CardBody>
              </Card>

              {/* Grade Distribution */}
              <Card>
                <CardBody>
                  <CardTitle className="flex items-center gap-2 mb-4">
                    <Badge className="h-5 w-5" tone="cyan">★</Badge>
                    Grade Distribution
                  </CardTitle>
                  <div className="grid gap-2 sm:grid-cols-5">
                    {["S", "A", "B", "C", "D"].map((grade) => {
                      const pct = result.metrics.gradeDistribution[grade] ?? 0;
                      const tone = grade === "S" ? "emerald" : grade === "A" ? "cyan" : grade === "B" ? "amber" : grade === "C" ? "amber" : "crimson";
                      return (
                        <div key={grade} className="rounded-lg border border-white/10 bg-white/5 p-4 text-center">
                          <Badge tone={tone as any} className="text-sm mb-2">{grade}</Badge>
                          <div className="h-16 bg-gradient-to-t from-space-cyan/20 to-transparent rounded mb-2" style={{ height: `${(result.metrics.gradeDistribution[grade] ?? 0) * 100}%` }} />
                          <p className="font-mono text-xl text-white">{(pct * 100).toFixed(1)}%</p>
                          <p className="text-[10px] text-slate-400">{grade}</p>
                        </div>
                      );
                    })}
                  </div>
                </CardBody>
              </Card>

              {/* GO/NO-GO Probability */}
              <Card className={result.metrics.goProbability >= 0.8 ? "border-emerald-500/30 bg-emerald-500/5" : result.metrics.goProbability >= 0.5 ? "border-amber-500/30 bg-amber-500/5" : "border-crimson-500/30 bg-crimson-500/5"}>
                <CardBody>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-space-cyan" />
                        GO/NO-GO Probability
                      </CardTitle>
                      <p className="text-sm text-slate-400 mt-1">Probability that a random sample meets all GO criteria</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-mono text-4xl ${result.metrics.goProbability >= 0.8 ? "text-emerald-400" : result.metrics.goProbability >= 0.5 ? "text-amber-400" : "text-crimson-400"}`}>
                        {(result.metrics.goProbability * 100).toFixed(1)}%
                      </p>
                      <p className="text-sm text-slate-400">
                        {result.metrics.goProbability >= 0.8 ? "✅ High confidence" : result.metrics.goProbability >= 0.5 ? "⚠️ Marginal" : "❌ Low confidence"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 h-4 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        result.metrics.goProbability >= 0.8 ? "bg-emerald-400" : 
                        result.metrics.goProbability >= 0.5 ? "bg-amber-400" : "bg-crimson-400"
                      }`}
                      style={{ width: `${result.metrics.goProbability * 100}%` }}
                    />
                  </div>
                </CardBody>
              </Card>

              {/* Export */}
              <div className="flex justify-end gap-2">
                <Button onClick={exportResults} variant="outline" size="sm">
                  <Download className="h-3.5 w-3.5 mr-1" /> Export Report
                </Button>
                <Button onClick={() => {
                  const text = formatMonteCarloResult(result);
                  const blob = new Blob([text], { type: "text/plain" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `monte-carlo-${Date.now()}.txt`;
                  a.click();
                  URL.revokeObjectURL(url);
                }} variant="outline" size="sm">
                  <BarChart2 className="h-3.5 w-3.5 mr-1" /> Export Data
                </Button>
              </div>
            </>
          ) : (
            <Card>
              <CardBody className="py-12 text-center">
                <BarChart2 className="h-12 w-12 mx-auto mb-4 text-space-cyan/50" />
                <p className="text-lg text-slate-400 mb-2">No results yet</p>
                <p className="text-sm text-slate-500 mb-6">Configure parameters and run a Monte Carlo simulation</p>
                <Button onClick={handleRun} size="lg">
                  <Play className="h-4 w-4 mr-2" /> Run First Simulation
                </Button>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, sub, icon, tone }: { label: string; value: string; sub?: string; icon?: React.ReactNode; tone?: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon && <span className="text-space-cyan">{icon}</span>}
        <span className="text-xs text-slate-400">{label}</span>
      </div>
      <p className="font-mono text-xl text-white">{value}</p>
      {sub && <p className="text-[10px] text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

function percentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil(p / 100 * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(sorted.length - 1, idx))];
}

function mean(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function stdDev(arr: number[], m: number): number {
  return Math.sqrt(arr.reduce((a, b) => a + (b - m) ** 2, 0) / arr.length);
}