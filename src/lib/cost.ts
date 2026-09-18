/**
 * Mission cost estimate — a transparent, deterministic budget model on top of
 * the design engine. Every line item carries a confidence tag so nothing is
 * presented as fact that is a model estimate.
 */

import { type MissionDesign, type LaunchVehicleLite } from "@/lib/mission";

export type CostConfidence = LaunchVehicleLite["costConfidence"];

export interface CostLine {
  label: string;
  valueUsd: number;
  confidence: CostConfidence;
  note: string;
}

export interface MissionCost {
  lines: CostLine[];
  totalUsd: number;
  bestConfidence: CostConfidence;
}

/** Estimated recurring cost per astronaut per day for ground ops + life support (NASA historical ISS ~$150k/day crew ops). */
export const CREW_RATE_USD_PER_PERSON_DAY = 110_000;

/** Estimated marginal habitat + surface ops cost per person per day on the target body. */
export const SURFACE_RATE_USD_PER_PERSON_DAY = 30_000;

export function costConfidenceFor(design: MissionDesign): CostConfidence {
  return design.vehicle.costConfidence;
}

export function estimateMissionCost(design: MissionDesign): MissionCost {
  const lines: CostLine[] = [
    {
      label: `${design.vehicle.name} launch`,
      valueUsd: design.vehicle.costPerLaunchUsd,
      confidence: design.vehicle.costConfidence,
      note: design.vehicle.costNote,
    },
    {
      label: "Crew operations & logistics",
      valueUsd: Math.round(design.crew * design.totalDays * CREW_RATE_USD_PER_PERSON_DAY),
      confidence: "estimate",
      note: "per-astronaut mission-day rate, ISS-class ops",
    },
  ];
  if (design.surfaceDays > 0) {
    lines.push({
      label: "Surface operations (habitat & power)",
      valueUsd: Math.round(design.crew * design.surfaceDays * SURFACE_RATE_USD_PER_PERSON_DAY),
      confidence: "estimate",
      note: "per-person per-sol surface ops",
    });
  }

  const totalUsd = lines.reduce((sum, l) => sum + l.valueUsd, 0);
  const bestConfidence: CostConfidence = lines.some((l) => l.confidence === "documented")
    ? "documented"
    : "estimate";

  return { lines, totalUsd, bestConfidence };
}

export function formatUsd(usd: number): string {
  if (usd >= 1_000_000_000) return `$${(usd / 1_000_000_000).toFixed(2)} B`;
  if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(1)} M`;
  if (usd >= 1_000) return `$${(usd / 1_000).toFixed(0)} K`;
  return `$${Math.round(usd)}`;
}

/** Rough logistic cost class for the passport/report card: a headline label for $1B+ fleets. */
export function costClass(totalUsd: number): "flagship" | "commercial" | "research" {
  if (totalUsd >= 500_000_000) return "flagship";
  if (totalUsd >= 100_000_000) return "commercial";
  return "research";
}