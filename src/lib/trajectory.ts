/**
 * Trajectory engine for the Fly view.
 * - Generic patched-conic Earth→Moon Hohmann transfer
 * - Apollo 11 interpolated ephemeris from historical timeline
 * All positions in normalized scene units (Earth radius = 1).
 */

import constants from "@/data/constants.json";

const MU_EARTH_KM3S2 = constants.mu.earth;
const MU_MOON_KM3S2 = constants.mu.moon;
const R_EARTH_KM = constants.radiusKm.earth;
const R_MOON_KM = constants.radiusKm.moon;
const D_EARTH_MOON_KM = constants.distanceKm.earthMoonMean;
import apolloRaw from "@/data/apollo11-trajectory.json";

export interface Vec3 { x: number; y: number; z: number; }

export interface TrajectoryPoint {
  met: string;           // Mission Elapsed Time "hh:mm:ss"
  utc: string;           // ISO UTC
  event: string;
  body: "earth" | "moon";
  position: Vec3;
  velocity: Vec3;
}

export interface InterpolatedState {
  met: number;           // seconds since launch
  utc: Date;
  event: string;
  body: "earth" | "moon";
  position: Vec3;
  velocity: Vec3;
}

/** Convert MET string "hh:mm:ss" → seconds since launch. */
export function metToSeconds(met: string): number {
  const [h, m, s] = met.split(":").map(Number);
  return h * 3600 + m * 60 + s;
}

/** Normalize km → scene units (Earth radius = 1). */
export function kmToScene(km: number): number {
  return km / R_EARTH_KM;
}

/** Hohmann transfer Earth→Moon (patched-conic approximation).
 * Returns position/velocity in Earth-centered inertial frame, normalized.
 * timeSec: seconds after TLI cutoff.
 */
export function hohmannEarthMoon(timeSec: number): { position: Vec3; velocity: Vec3 } {
  // Earth parking orbit ~ 185 km → r1 = 6556 km
  // Moon distance ~ 384400 km → r2
  const r1 = R_EARTH_KM + 185;
  const r2 = D_EARTH_MOON_KM;
  const a = (r1 + r2) / 2;
  const mu = MU_EARTH_KM3S2;

  // Transfer orbit period
  const T = 2 * Math.PI * Math.sqrt(a ** 3 / mu);
  const halfT = T / 2; // ~ 3.2 days in seconds

  // Mean anomaly at time
  const M = (2 * Math.PI * timeSec) / T;

  // Solve Kepler's equation for eccentric anomaly (simple iteration)
  const e = (r2 - r1) / (r2 + r1); // ~0.97
  let E = M;
  for (let i = 0; i < 10; i++) {
    E = M + e * Math.sin(E);
  }

  // True anomaly
  const nu = 2 * Math.atan(Math.sqrt((1 + e) / (1 - e)) * Math.tan(E / 2));

  // Radius at true anomaly
  const r = a * (1 - e * Math.cos(E));

  // Position in orbital plane (x along major axis)
  const x = r * Math.cos(nu);
  const y = r * Math.sin(nu);

  // Velocity in orbital plane
  const h = Math.sqrt(mu * a * (1 - e * e));
  const vr = (mu / h) * e * Math.sin(nu);
  const vt = h / r;
  const vx = vr * Math.cos(nu) - vt * Math.sin(nu);
  const vy = vr * Math.sin(nu) + vt * Math.cos(nu);

  return {
    position: { x: kmToScene(x), y: kmToScene(y), z: 0 },
    velocity: { x: kmToScene(vx * 3600), y: kmToScene(vy * 3600), z: 0 }, // km/h → scene units per hour
  };
}

/** Interpolate Apollo 11 trajectory at a given MET (seconds). */
export function interpolateApollo11(metSec: number): InterpolatedState {
  const points = apolloRaw as TrajectoryPoint[];
  const metVals = points.map((p) => metToSeconds(p.met));

  // Find bracketing points
  let i = 0;
  while (i < metVals.length - 1 && metVals[i + 1] <= metSec) i++;

  const t0 = metVals[i];
  const t1 = metVals[Math.min(i + 1, metVals.length - 1)];
  const p0 = points[i];
  const p1 = points[Math.min(i + 1, points.length - 1)];

  if (t1 === t0) {
    return {
      met: metSec,
      utc: new Date(p0.utc),
      event: p0.event,
      body: p0.body,
      position: p0.position,
      velocity: p0.velocity,
    };
  }

  const alpha = (metSec - t0) / (t1 - t0);
  const lerp = (a: number, b: number) => a + (b - a) * alpha;

  const utc0 = new Date(p0.utc).getTime();
  const utc1 = new Date(p1.utc).getTime();

  return {
    met: metSec,
    utc: new Date(utc0 + (utc1 - utc0) * alpha),
    event: alpha < 0.5 ? p0.event : p1.event,
    body: p0.body,
    position: {
      x: lerp(p0.position.x, p1.position.x),
      y: lerp(p0.position.y, p1.position.y),
      z: lerp(p0.position.z, p1.position.z),
    },
    velocity: {
      x: lerp(p0.velocity.x, p1.velocity.x),
      y: lerp(p0.velocity.y, p1.velocity.y),
      z: lerp(p0.velocity.z, p1.velocity.z),
    },
  };
}

/** One-way Hohmann transfer duration (seconds) Earth parking orbit → Moon. */
export function hohmannTransferSeconds(): number {
  const r1 = R_EARTH_KM + 185;
  const r2 = D_EARTH_MOON_KM;
  const a = (r1 + r2) / 2;
  return Math.PI * Math.sqrt(a ** 3 / MU_EARTH_KM3S2);
}

/** Sample the generic Earth→Moon Hohmann transfer as a timeline. */
export function getHohmannSamples(sampleCount = 500): InterpolatedState[] {
  const halfPeriodSec = hohmannTransferSeconds();
  const ref = Date.UTC(2026, 0, 1);
  return Array.from({ length: sampleCount }, (_, i) => {
    const t = (i / (sampleCount - 1)) * halfPeriodSec;
    const { position, velocity } = hohmannEarthMoon(t);
    const frac = t / halfPeriodSec;
    let event = "Translunar Coast";
    if (frac < 0.01) event = "TLI Cutoff";
    else if (frac > 0.97) event = "Lunar Orbit Insertion";
    else if (frac > 0.6) event = "Approaching Moon";
    const body: "earth" | "moon" = frac < 0.5 ? "earth" : "moon";
    return {
      met: t,
      utc: new Date(ref + t * 1000),
      event,
      body,
      position,
      velocity,
    };
  });
}

/** Get the full Apollo 11 trajectory as a smooth sampled array. */
export function getApollo11Samples(sampleCount = 300): InterpolatedState[] {
  const totalSec = metToSeconds((apolloRaw as TrajectoryPoint[]).slice(-1)[0].met);
  return Array.from({ length: sampleCount }, (_, i) => {
    const t = (i / (sampleCount - 1)) * totalSec;
    return interpolateApollo11(t);
  });
}

/** Format MET seconds → "hh:mm:ss". */
export function formatMet(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** Distance between two positions in scene units. */
export function distance(a: Vec3, b: Vec3): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/** Earth position in scene units (always at origin). */
export const EARTH_POSITION: Vec3 = { x: 0, y: 0, z: 0 };

/** Moon position in scene units (at mean distance along -X). */
export const MOON_POSITION: Vec3 = { x: -kmToScene(D_EARTH_MOON_KM), y: 0, z: 0 };

/** Moon orbital radius in scene units. */
export const MOON_ORBIT_RADIUS = kmToScene(D_EARTH_MOON_KM); // ~ 60.3