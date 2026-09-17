/**
 * Light-time / deep-space communications engine. Returns round-trip delays for
 * messages at the speed of light over a given one-way distance.
 */

import constants from "@/data/constants.json";

export const C_KM_S = constants.speedOfLightKmPerSec;

export interface LightTime {
  distanceKm: number;
  oneWaySec: number;
  roundTripSec: number;
  oneWayLabel: string;
  roundTripLabel: string;
}

/** Split seconds into a human label like "8m 12.4s". */
export function humanDuration(seconds: number, precision = 1): string {
  if (seconds < 60) return `${seconds.toFixed(precision)}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds - m * 60;
  if (m < 60) return `${m}m ${s.toFixed(precision)}s`;
  const h = Math.floor(m / 60);
  const mn = m - h * 60;
  return `${h}h ${mn}m`;
}

/** Light-time for a one-way distance in km. */
export function lightTime(distanceKm: number): LightTime {
  const oneWaySec = distanceKm / C_KM_S;
  return {
    distanceKm,
    oneWaySec,
    roundTripSec: oneWaySec * 2,
    oneWayLabel: humanDuration(oneWaySec),
    roundTripLabel: humanDuration(oneWaySec * 2),
  };
}

/**
 * Typical distance → light-time for the canonical "mind the bandwidth" card.
 * Values sourced from live JPL telemetry at runtime when available; this is
 * the static benchmark table.
 */
export function benchmarkDistances(): { name: string; distanceKm: number }[] {
  return [
    { name: "Moon (mean)", distanceKm: constants.distanceKm.earthMoonMean },
    { name: "Mars (mean)", distanceKm: constants.distanceKm.earthMarsMean },
    { name: "Voyager 1", distanceKm: 24_100_000_000 }, // ~2026 telemetry order of magnitude
    { name: "Voyager 2", distanceKm: 20_200_000_000 },
    { name: "Sun distance (1 AU)", distanceKm: constants.astronomicalUnitKm },
  ];
}