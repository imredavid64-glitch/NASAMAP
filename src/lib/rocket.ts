/**
 * Astronautics engine — orbital mechanics and rocketry. Pure functions,
 * unit-tested against known reference values in tests/rocket.test.ts.
 * Distances in km, masses in kg, times in seconds unless noted.
 */

import constants from "@/data/constants.json";

const G = constants.G;
export const G0 = constants.g0;

/** Standard gravitational parameter μ = G·M in km³/s². */
export function muFromMass(massKg: number): number {
  return G * massKg * 1e-9;
}

/** Escape velocity from the surface radius of a spherical body. */
export function escapeVelocity(muKm3s2: number, radiusKm: number): number {
  return Math.sqrt((2 * muKm3s2) / radiusKm);
}

/** Circular orbit velocity at radius r from body center. */
export function circularVelocity(muKm3s2: number, radiusKm: number): number {
  return Math.sqrt(muKm3s2 / radiusKm);
}

/** Orbital period (seconds) of a circular orbit at radius r. */
export function circularPeriodSec(muKm3s2: number, radiusKm: number): number {
  return (2 * Math.PI * radiusKm) / circularVelocity(muKm3s2, radiusKm);
}

/** Tsiolkovsky rocket equation: Δv (m/s) for an impulse. */
export function tsiolkovskyDeltaV(ispSeconds: number, mass0Kg: number, massFinalKg: number): number {
  if (massFinalKg <= 0 || mass0Kg < massFinalKg) {
    throw new Error("tsiolkovskyDeltaV: invalid masses");
  }
  return G0 * ispSeconds * Math.log(mass0Kg / massFinalKg);
}

export interface StageInput {
  ispSeconds: number;
  mass0Kg: number;
  massFinalKg: number;
}

/** Total Δv of a staged stack (each stage burns sequentially). */
export function stagedDeltaV(stages: StageInput[]): number {
  return stages.reduce((acc, s) => acc + tsiolkovskyDeltaV(s.ispSeconds, s.mass0Kg, s.massFinalKg), 0);
}

export interface HohmannResult {
  transferDays: number;
  departureDeltaVKmS: number;
  arrivalDeltaVKmS: number;
  totalDeltaVKmS: number;
  coastTimeHours: number;
}

/**
 * Hohmann transfer between circular orbits (radii from the primary's center).
 * μ in km³/s². Returns relative Δv at each endpoint and coast duration.
 */
export function hohmannTransfer(
  muKm3s2: number,
  innerRadiusKm: number,
  outerRadiusKm: number,
): HohmannResult {
  const r1 = Math.min(innerRadiusKm, outerRadiusKm);
  const r2 = Math.max(innerRadiusKm, outerRadiusKm);
  const a = (r1 + r2) / 2;
  const v1 = circularVelocity(muKm3s2, r1);
  const v2 = circularVelocity(muKm3s2, r2);
  const vT1 = Math.sqrt(muKm3s2 * (2 / r1 - 1 / a));
  const vT2 = Math.sqrt(muKm3s2 * (2 / r2 - 1 / a));
  // Δv magnitude at each end (from inner→outer ascending transfer)
  const dv1 = Math.abs(vT1 - v1);
  const dv2 = Math.abs(v2 - vT2);
  const periodSec = 2 * Math.PI * Math.sqrt((a * a * a) / muKm3s2);
  const coastTimeSec = periodSec / 2;
  return {
    transferDays: coastTimeSec / 86400,
    departureDeltaVKmS: dv1,
    arrivalDeltaVKmS: dv2,
    totalDeltaVKmS: dv1 + dv2,
    coastTimeHours: coastTimeSec / 3600,
  };
}

/** Gravity at a body's surface (m/s²). */
export function surfaceGravity(muKm3s2: number, radiusKm: number): number {
  return (muKm3s2 * 1000) / (radiusKm * radiusKm);
}