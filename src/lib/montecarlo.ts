/**
 * Monte Carlo uncertainty analysis for mission design parameters.
 * Runs thousands of simulations with parameter distributions to compute
 * confidence intervals on key mission metrics (IMLEO, radiation, payload, cost).
 */

import { designMission, type MissionDesignOptions, type MissionDesign } from "@/lib/mission";
import { scoreMission, type Scorecard } from "@/lib/score";

export interface ParameterDistribution {
  name: string;
  type: "normal" | "lognormal" | "uniform" | "triangular";
  mean: number;
  stdDev?: number;
  min?: number;
  max?: number;
  mode?: number;
}

export interface MonteCarloConfig {
  iterations: number;
  parameters: ParameterDistribution[];
  baseDesign: MissionDesignOptions;
  seed?: number;
}

export interface MonteCarloResult {
  metrics: {
    imleoT: { mean: number; stdDev: number; p5: number; p50: number; p95: number };
    payloadT: { mean: number; stdDev: number; p5: number; p50: number; p95: number };
    radiationMSv: { mean: number; stdDev: number; p5: number; p50: number; p95: number };
    totalCostB: { mean: number; stdDev: number; p5: number; p50: number; p95: number };
    score: { mean: number; stdDev: number; p5: number; p50: number; p95: number };
    gradeDistribution: Record<string, number>;
    goProbability: number;
  };
  samples: Array<{
    imleoT: number;
    payloadT: number;
    radiationMSv: number;
    totalCostB: number;
    score: number;
    grade: string;
    go: boolean;
  }>;
  config: MonteCarloConfig;
}

function randomNormal(mean: number, stdDev: number, rng: () => number): number {
  // Box-Muller transform
  const u1 = rng();
  const u2 = rng();
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z0 * stdDev;
}

function randomLogNormal(mean: number, stdDev: number, rng: () => number): number {
  // Log-normal: ln(X) ~ N(mean, stdDev)
  const u1 = rng();
  const u2 = rng();
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return Math.exp(mean + z0 * stdDev);
}

function randomUniform(min: number, max: number, rng: () => number): number {
  return min + rng() * (max - min);
}

function randomTriangular(min: number, max: number, mode: number, rng: () => number): number {
  const u = rng();
  const cdfMode = (mode - min) / (max - min);
  if (u <= cdfMode) {
    return min + Math.sqrt(u * (max - min) * (mode - min));
  } else {
    return max - Math.sqrt((1 - u) * (max - min) * (max - mode));
  }
}

function sampleParameter(dist: ParameterDistribution, rng: () => number): number {
  switch (dist.type) {
    case "normal":
      return randomNormal(dist.mean, dist.stdDev ?? dist.mean * 0.1, rng);
    case "lognormal":
      return randomLogNormal(dist.mean, dist.stdDev ?? 0.1, rng);
    case "uniform":
      return randomUniform(dist.min ?? dist.mean * 0.8, dist.max ?? dist.mean * 1.2, rng);
    case "triangular":
      return randomTriangular(
        dist.min ?? dist.mean * 0.8,
        dist.max ?? dist.mean * 1.2,
        dist.mode ?? dist.mean,
        rng
      );
    default:
      return dist.mean;
  }
}

function createRng(seed: number): () => number {
  // Simple LCG for reproducible random numbers
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function percentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil(p / 100 * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(sorted.length - 1, idx))];
}

export function runMonteCarlo(config: MonteCarloConfig): MonteCarloResult {
  const rng = createRng(config.seed ?? Date.now());
  const baseDesign = config.baseDesign;
  const iterations = config.iterations;

  const samples: MonteCarloResult["samples"] = [];

  for (let i = 0; i < iterations; i++) {
    // Sample all parameters
    const sampledParams: Record<string, number> = {};
    for (const param of config.parameters) {
      sampledParams[param.name] = sampleParameter(param, rng);
    }

    // Create modified design
    const modifiedDesign: MissionDesignOptions = {
      ...baseDesign,
      crew: sampledParams.crew ?? baseDesign.crew,
      surfaceDays: sampledParams.surfaceDays ?? baseDesign.surfaceDays,
      // Add other sampled parameters as needed
    };

    try {
      const design = designMission(modifiedDesign);
      const scorecard = scoreMission(design);

      const imleoT = design.requiredMassKg / 1000;
      const payloadT = design.payloadCapacityKg ? design.payloadCapacityKg / 1000 : 0;
      const radiationMSv = design.radiationMsvTotal;
      const totalCostB = scorecard.objectives.find(o => o.id === "budget")?.actual 
        ? parseFloat(scorecard.objectives.find(o => o.id === "budget")!.actual.replace(/[$,]/g, "")) / 1e9
        : 0;
      const score = scorecard.score;
      const grade = scorecard.grade;
      const go = scorecard.grade !== "D" && design.launchGate === "pass";

      samples.push({
        imleoT,
        payloadT,
        radiationMSv,
        totalCostB,
        score,
        grade,
        go,
      });
    } catch (e) {
      // Skip failed simulations
    }
  }

  // Compute statistics
  const imleoT = samples.map(s => s.imleoT);
  const payloadT = samples.map(s => s.payloadT);
  const radiationMSv = samples.map(s => s.radiationMSv);
  const totalCostB = samples.map(s => s.totalCostB);
  const scores = samples.map(s => s.score);
  const grades = samples.map(s => s.grade);
  const goCount = samples.filter(s => s.go).length;

  // Grade distribution
  const gradeDist: Record<string, number> = {};
  for (const g of grades) {
    gradeDist[g] = (gradeDist[g] || 0) + 1;
  }
  for (const k of Object.keys(gradeDist)) {
    gradeDist[k] = gradeDist[k] / samples.length;
  }

  const mean = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const stdDev = (arr: number[], m: number) => Math.sqrt(arr.reduce((a, b) => a + (b - m) ** 2, 0) / arr.length);

  return {
    metrics: {
      imleoT: { mean: mean(imleoT), stdDev: stdDev(imleoT, mean(imleoT)), p5: percentile(imleoT, 5), p50: percentile(imleoT, 50), p95: percentile(imleoT, 95) },
      payloadT: { mean: mean(payloadT), stdDev: stdDev(payloadT, mean(payloadT)), p5: percentile(payloadT, 5), p50: percentile(payloadT, 50), p95: percentile(payloadT, 95) },
      radiationMSv: { mean: mean(radiationMSv), stdDev: stdDev(radiationMSv, mean(radiationMSv)), p5: percentile(radiationMSv, 5), p50: percentile(radiationMSv, 50), p95: percentile(radiationMSv, 95) },
      totalCostB: { mean: mean(totalCostB), stdDev: stdDev(totalCostB, mean(totalCostB)), p5: percentile(totalCostB, 5), p50: percentile(totalCostB, 50), p95: percentile(totalCostB, 95) },
      score: { mean: mean(scores), stdDev: stdDev(scores, mean(scores)), p5: percentile(scores, 5), p50: percentile(scores, 50), p95: percentile(scores, 95) },
      gradeDistribution: gradeDist,
      goProbability: goCount / samples.length,
    },
    samples,
    config,
  };
}

export function formatMonteCarloResult(result: MonteCarloResult): string {
  const { metrics } = result;
  return `
Monte Carlo Uncertainty Analysis (${result.config.iterations} samples)
============================================================
IMLEO: ${metrics.imleoT.mean.toFixed(1)} ± ${metrics.imleoT.stdDev.toFixed(1)} t [P5: ${metrics.imleoT.p5.toFixed(1)}, P50: ${metrics.imleoT.p50.toFixed(1)}, P95: ${metrics.imleoT.p95.toFixed(1)}]
Payload to Surface: ${metrics.payloadT.mean.toFixed(1)} ± ${metrics.payloadT.stdDev.toFixed(1)} t [P5: ${metrics.payloadT.p5.toFixed(1)}, P50: ${metrics.payloadT.p50.toFixed(1)}, P95: ${metrics.payloadT.p95.toFixed(1)}]
Radiation Dose: ${metrics.radiationMSv.mean.toFixed(0)} ± ${metrics.radiationMSv.stdDev.toFixed(0)} mSv [P5: ${metrics.radiationMSv.p5.toFixed(0)}, P50: ${metrics.radiationMSv.p50.toFixed(0)}, P95: ${metrics.radiationMSv.p95.toFixed(0)}]
Total Cost: $${metrics.totalCostB.mean.toFixed(2)} ± $${metrics.totalCostB.stdDev.toFixed(2)} B [P5: $${metrics.totalCostB.p5.toFixed(2)}, P50: $${metrics.totalCostB.p50.toFixed(2)}, P95: $${metrics.totalCostB.p95.toFixed(2)}]
Mission Score: ${metrics.score.mean.toFixed(1)} ± ${metrics.score.stdDev.toFixed(1)} [P5: ${metrics.score.p5.toFixed(1)}, P50: ${metrics.score.p50.toFixed(1)}, P95: ${metrics.score.p95.toFixed(1)}]
GO Probability: ${(metrics.goProbability * 100).toFixed(1)}%
Grade Distribution: ${Object.entries(metrics.gradeDistribution).map(([g, p]) => `${g}: ${(p * 100).toFixed(1)}%`).join(", ")}
  `.trim();
}

export const DEFAULT_MONTE_CARLO_PARAMS: ParameterDistribution[] = [
  { name: "crew", type: "uniform", mean: 4, min: 2, max: 6 },
  { name: "surfaceDays", type: "uniform", mean: 90, min: 30, max: 180 },
  { name: "habMassFactor", type: "normal", mean: 1.0, stdDev: 0.15 },
  { name: "consumableFactor", type: "normal", mean: 1.0, stdDev: 0.1 },
  { name: "radiationFactor", type: "lognormal", mean: 1.0, stdDev: 0.2 },
  { name: "costFactor", type: "lognormal", mean: 1.0, stdDev: 0.25 },
  { name: "launchVehicleMargin", type: "triangular", mean: 1.0, min: 0.9, max: 1.1, mode: 1.0 },
];