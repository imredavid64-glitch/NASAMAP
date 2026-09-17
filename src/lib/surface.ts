import { SOLAR_ARRAY_EFFICIENCY } from "./life";

/**
 * Surface-operations engine — a sol on Mars.
 *
 * Solar geometry uses the standard spherical-astronomy elevation formula
 *   sin(elev) = sin(lat)·sin(dec) + cos(lat)·cos(dec)·cos(H)
 * with the hour angle H = 15°·(hour − 12). Solar declination is modelled as a
 * simple sinusoid over the Martian year (obliquity 25.19°). Array output is the
 * clear-sky, top-of-atmosphere-normalised projection: no airmass or dust term,
 * which is stated honestly in the UI.
 */

/** Length of a Martian solar day (sol) in hours: 24 h 39 m 35.244 s. */
export const MARS_SOL_HOURS = 24.6597;

/** Mars axial tilt (obliquity), degrees. */
export const MARS_OBLIQUITY_DEG = 25.19;

/** Length of the Martian year (sols) — 668.5991 sols. */
export const MARS_YEAR_SOLS = 668.5991;

const DEG = Math.PI / 180;

/** Solar declination over the Martian year (solOfYear), in degrees. */
export function marsDeclinationDeg(solOfYear: number): number {
  const phase = (2 * Math.PI * (solOfYear % MARS_YEAR_SOLS)) / MARS_YEAR_SOLS;
  return MARS_OBLIQUITY_DEG * Math.sin(phase);
}

/** Hour angle: 0° at local noon, ±180° at local midnight. */
export function hourAngleDeg(hourOfSol: number): number {
  return 15 * (hourOfSol - 12);
}

/** Solar elevation above the horizon, in degrees. */
export function solarElevationDeg(hourOfSol: number, latitudeDeg: number, declinationDeg: number): number {
  const lat = latitudeDeg * DEG;
  const dec = declinationDeg * DEG;
  const H = hourAngleDeg(hourOfSol) * DEG;
  const sinElev = Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(H);
  return Math.asin(Math.min(1, Math.max(-1, sinElev))) / DEG;
}

/** Solar azimuth measured clockwise from north, in degrees (180° = due south). */
export function solarAzimuthDeg(hourOfSol: number, latitudeDeg: number, declinationDeg: number): number {
  const lat = latitudeDeg * DEG;
  const dec = declinationDeg * DEG;
  const H = hourAngleDeg(hourOfSol) * DEG;
  const fromSouth = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(lat) - Math.tan(dec) * Math.cos(lat));
  return ((fromSouth / DEG + 180) % 360 + 360) % 360;
}

/** Fraction of the sol with the Sun above the horizon (0..1); handles polar day/night. */
export function daylightFraction(latitudeDeg: number, declinationDeg: number): number {
  const lat = latitudeDeg * DEG;
  const dec = declinationDeg * DEG;
  const cosH0 = -Math.tan(lat) * Math.tan(dec);
  if (cosH0 >= 1) return 0;
  if (cosH0 <= -1) return 1;
  return Math.acos(cosH0) / Math.PI;
}

export interface SurfacePowerPoint {
  hour: number;
  elevationDeg: number;
  /** Array output at this instant, kW (clear-sky projection of rated capacity). */
  generationKw: number;
  /** Habitat load, kW. */
  loadKw: number;
  /** generation − load, kW (negative = drawing on the battery). */
  netKw: number;
  /** State of charge after this step, % of capacity. */
  batteryPct: number;
  /** True when the battery is empty and the load cannot be fully met. */
  brownout: boolean;
}

export interface SurfaceSolOptions {
  latitudeDeg?: number;
  declinationDeg?: number;
  /** Rated array power at normal incidence, kW. */
  arrayKw: number;
  /** Constant habitat load, kW. */
  loadKw: number;
  /** Battery capacity, kWh. */
  batteryKwh: number;
  steps?: number;
}

/** Clear-sky array output (kW) at a given solar elevation, as a fraction of rated power. */
export function generationKw(elevationDeg: number, arrayKw: number): number {
  if (elevationDeg <= 0) return 0;
  return arrayKw * Math.sin(elevationDeg * DEG);
}

/** Simulate a full sol: generation, load, battery state and any brownouts. */
export function surfaceSolProfile(opts: SurfaceSolOptions): SurfacePowerPoint[] {
  const latitudeDeg = opts.latitudeDeg ?? 18;
  const declinationDeg = opts.declinationDeg ?? 0;
  const steps = opts.steps ?? 48;
  const dt = MARS_SOL_HOURS / steps;
  const points: SurfacePowerPoint[] = [];
  let charge = opts.batteryKwh * 0.5; // start the sol at 50% state of charge

  for (let i = 0; i <= steps; i += 1) {
    const hour = (i / steps) * MARS_SOL_HOURS;
    const elevationDeg = solarElevationDeg(hour, latitudeDeg, declinationDeg);
    const gen = generationKw(elevationDeg, opts.arrayKw);
    const net = gen - opts.loadKw;
    charge = Math.min(opts.batteryKwh, Math.max(0, charge + net * dt));
    const brownout = charge <= 1e-6 && net < 0;
    points.push({
      hour,
      elevationDeg,
      generationKw: gen,
      loadKw: opts.loadKw,
      netKw: net,
      batteryPct: (charge / opts.batteryKwh) * 100,
      brownout,
    });
  }
  return points;
}

export interface SurfaceSolSummary {
  daylightHours: number;
  peakElevationDeg: number;
  peakGenerationKw: number;
  energyGeneratedKwh: number;
  energyConsumedKwh: number;
  minBatteryPct: number;
  brownoutHours: number;
}

/** Roll a sol profile up into the numbers the UI reports. */
export function summariseSol(profile: SurfacePowerPoint[]): SurfaceSolSummary {
  const steps = profile.length - 1;
  const dt = MARS_SOL_HOURS / steps;
  const energyGeneratedKwh = profile.reduce((s, p) => s + p.generationKw * dt, 0);
  const energyConsumedKwh = profile.reduce((s, p) => s + p.loadKw * dt, 0);
  return {
    daylightHours: profile.filter((p) => p.elevationDeg > 0).length * dt,
    peakElevationDeg: Math.max(...profile.map((p) => p.elevationDeg)),
    peakGenerationKw: Math.max(...profile.map((p) => p.generationKw)),
    energyGeneratedKwh,
    energyConsumedKwh,
    minBatteryPct: Math.min(...profile.map((p) => p.batteryPct)),
    brownoutHours: profile.filter((p) => p.brownout).length * dt,
  };
}

/** Array capacity (kW at normal incidence) needed to run the load on sunlight alone over a full sol. */
export function arrayKwForLoad(loadKw: number, latitudeDeg = 18, declinationDeg = 0): number {
  // Balance over the whole sol: arrayKw · (mean of sin(elev) over the sol) = loadKw.
  let sum = 0;
  let n = 0;
  const total = 480;
  for (let i = 0; i <= total; i += 1) {
    const hour = (i / total) * MARS_SOL_HOURS;
    const elev = solarElevationDeg(hour, latitudeDeg, declinationDeg);
    if (elev > 0) {
      sum += Math.sin(elev * DEG);
      n += 1;
    }
  }
  const meanSinOverSol = n / total > 0 ? sum / total : 0;
  return meanSinOverSol > 0 ? loadKw / meanSinOverSol : Number.POSITIVE_INFINITY;
}

/** Rated array power from an area at Mars, reusing the shared array efficiency. */
export function arrayKwFromArea(areaM2: number, irradianceKwM2: number): number {
  return areaM2 * irradianceKwM2 * SOLAR_ARRAY_EFFICIENCY;
}

/** Format a sol hour as HH:MM (Martian clock, 24 h). */
export function formatSolClock(hourOfSol: number): string {
  const h = Math.floor(hourOfSol) % 24;
  const m = Math.floor((hourOfSol - Math.floor(hourOfSol)) * 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
