/**
 * Porkchop plot generator — computes C3 and transit time contours
 * for Earth-Mars transfers across a range of departure/arrival dates.
 * Based on Lambert's problem solver with patched-conic approximation.
 * Pure and unit-tested in tests/porkchop.test.ts.
 */

import { DEG, norm360, julianDate } from "@/lib/astro";

const MU_SUN = 1.32712440018e11; // km^3/s^2
const AU_KM = 149597870.7;

// Earth and Mars orbital elements (approximate)
const EARTH_ORBIT = { a: 1.000, e: 0.0167, period: 365.256 };
const MARS_ORBIT = { a: 1.523679, e: 0.0934, period: 686.980 };

export interface PorkchopParams {
  departureStart: Date;
  departureEnd: Date;
  arrivalStart: Date;
  arrivalEnd: Date;
  stepDays: number;
}

export interface PorkchopPoint {
  departureJD: number;
  arrivalJD: number;
  departureDate: string;
  arrivalDate: string;
  tofDays: number;
  c3: number; // km^2/s^2
  dvDeparture: number; // km/s
  dvArrival: number; // km/s
  dvTotal: number; // km/s
}

export interface PorkchopData {
  points: PorkchopPoint[];
  minC3: number;
  maxC3: number;
  minTOF: number;
  maxTOF: number;
  departureRange: [number, number];
  arrivalRange: [number, number];
}

/**
 * Solve Lambert's problem for Earth-Mars transfer using universal variable formulation.
 * Returns C3 (characteristic energy) and delta-V values.
 */
function solveLambert(
  r1: number, // Earth orbit radius (km)
  r2: number, // Mars orbit radius (km)
  nu1: number, // Earth true anomaly at departure (rad)
  nu2: number, // Mars true anomaly at arrival (rad)
  tof: number // time of flight (seconds)
): { c3: number; dv1: number; dv2: number } | null {
  // Universal variable Lambert solver (simplified for demonstration)
  // In production, use a robust implementation like NASA's or a standard algorithm
  
  const mu = MU_SUN;
  const chord = Math.sqrt(r1*r1 + r2*r2 - 2*r1*r2*Math.cos(nu2 - nu1));
  const s = (r1 + r2 + chord) / 2;
  
  // Minimum energy transfer (Hohmann-like)
  const a_min = s / 2;
  const tof_min = Math.PI * Math.sqrt(a_min * a_min * a_min / mu);
  
  if (tof < tof_min * 0.5) return null; // Too fast, not physically possible
  
  // Use universal variable approach
  // For simplicity, approximate with patched-conic
  const a = mu * (tof / Math.PI) ** (2/3); // approximate semi-major axis
  
  if (a <= 0) return null;
  
  const e = 1 - r1 / a;
  if (e >= 1) return null;
  
  // Velocity at departure
  const v_dep = Math.sqrt(mu * (2/r1 - 1/a));
  const v_earth = Math.sqrt(mu / r1);
  const dv1 = Math.abs(v_dep - v_earth);
  const c3 = dv1 * dv1;
  
  // Velocity at arrival
  const v_arr = Math.sqrt(mu * (2/r2 - 1/a));
  const v_mars = Math.sqrt(mu / r2);
  const dv2 = Math.abs(v_arr - v_mars);
  
  return { c3, dv1, dv2 };
}

/**
 * Get planet position at a given Julian Date
 */
function getPlanetPosition(jd: number, orbit: { a: number; e: number; period: number }): { r: number; nu: number } {
  const T = orbit.period * 86400; // period in seconds
  const n = 2 * Math.PI / T; // mean motion
  const t = (jd - 2451545.0) * 86400; // seconds since J2000
  const M = n * t; // mean anomaly
  
  // Solve Kepler's equation
  let E = M;
  for (let i = 0; i < 10; i++) {
    E = E - (E - orbit.e * Math.sin(E) - M) / (1 - orbit.e * Math.cos(E));
  }
  
  const nu = 2 * Math.atan2(
    Math.sqrt(1 + orbit.e) * Math.sin(E / 2),
    Math.sqrt(1 - orbit.e) * Math.cos(E / 2)
  );
  
  const r = orbit.a * AU_KM * (1 - orbit.e * Math.cos(E));
  
  return { r, nu: norm360(nu / DEG) * DEG };
}

/**
 * Generate porkchop plot data for Earth-Mars transfers
 */
export function generatePorkchop(params: PorkchopParams): PorkchopData {
  const depStart = julianDate(params.departureStart);
  const depEnd = julianDate(params.departureEnd);
  const arrStart = julianDate(params.arrivalStart);
  const arrEnd = julianDate(params.arrivalEnd);
  
  const points: PorkchopPoint[] = [];
  let minC3 = Infinity, maxC3 = -Infinity;
  let minTOF = Infinity, maxTOF = -Infinity;
  
  for (let depJD = depStart; depJD <= depEnd; depJD += params.stepDays) {
    const dep = getPlanetPosition(depJD, EARTH_ORBIT);
    
    for (let arrJD = arrStart; arrJD <= arrEnd; arrJD += params.stepDays) {
      const arr = getPlanetPosition(arrJD, MARS_ORBIT);
      
      const tofDays = arrJD - depJD;
      if (tofDays < 50 || tofDays > 500) continue; // Reasonable TOF bounds
      
      const tofSec = tofDays * 86400;
      
      const result = solveLambert(dep.r, arr.r, dep.nu, arr.nu, tofSec);
      if (!result) continue;
      
      if (result.c3 > 200) continue; // Filter unrealistic C3
      
      const point: PorkchopPoint = {
        departureJD: depJD,
        arrivalJD: arrJD,
        departureDate: new Date((depJD - 2440587.5) * 86400000).toISOString().split("T")[0],
        arrivalDate: new Date((arrJD - 2440587.5) * 86400000).toISOString().split("T")[0],
        tofDays,
        c3: result.c3,
        dvDeparture: result.dv1,
        dvArrival: result.dv2,
        dvTotal: result.dv1 + result.dv2,
      };
      
      points.push(point);
      minC3 = Math.min(minC3, result.c3);
      maxC3 = Math.max(maxC3, result.c3);
      minTOF = Math.min(minTOF, tofDays);
      maxTOF = Math.max(maxTOF, tofDays);
    }
  }
  
  return {
    points,
    minC3,
    maxC3,
    minTOF,
    maxTOF,
    departureRange: [depStart, depEnd],
    arrivalRange: [arrStart, arrEnd],
  };
}

/**
 * Get contour lines for C3 values (for plotting)
 */
export function getC3Contours(data: PorkchopData, levels: number[]): Array<{ level: number; points: { x: number; y: number }[] }> {
  const contours: Array<{ level: number; points: { x: number; y: number }[] }> = [];
  
  for (const level of levels) {
    const contourPoints: { x: number; y: number }[] = [];
    
    // Simple marching squares approach
    // Group points by departure date
    const byDep = new Map<number, PorkchopPoint[]>();
    for (const p of data.points) {
      const depKey = Math.round(p.departureJD);
      if (!byDep.has(depKey)) byDep.set(depKey, []);
      byDep.get(depKey)!.push(p);
    }
    
    for (const [dep, arrPoints] of byDep) {
      arrPoints.sort((a, b) => a.arrivalJD - b.arrivalJD);
      
      for (let i = 0; i < arrPoints.length - 1; i++) {
        const a = arrPoints[i];
        const b = arrPoints[i + 1];
        
        if ((a.c3 <= level && b.c3 >= level) || (a.c3 >= level && b.c3 <= level)) {
          const t = (level - a.c3) / (b.c3 - a.c3);
          const interpArrival = a.arrivalJD + t * (b.arrivalJD - a.arrivalJD);
          contourPoints.push({ x: dep, y: interpArrival });
        }
      }
    }
    
    if (contourPoints.length > 1) {
      contours.push({ level, points: contourPoints });
    }
  }
  
  return contours;
}

/**
 * Get TOF contour lines
 */
export function getTOFContours(data: PorkchopData, levels: number[]): Array<{ level: number; points: { x: number; y: number }[] }> {
  const contours: Array<{ level: number; points: { x: number; y: number }[] }> = [];
  
  for (const level of levels) {
    const contourPoints: { x: number; y: number }[] = [];
    
    const byDep = new Map<number, PorkchopPoint[]>();
    for (const p of data.points) {
      const depKey = Math.round(p.departureJD);
      if (!byDep.has(depKey)) byDep.set(depKey, []);
      byDep.get(depKey)!.push(p);
    }
    
    for (const [dep, arrPoints] of byDep) {
      arrPoints.sort((a, b) => a.arrivalJD - b.arrivalJD);
      
      for (let i = 0; i < arrPoints.length - 1; i++) {
        const a = arrPoints[i];
        const b = arrPoints[i + 1];
        
        if ((a.tofDays <= level && b.tofDays >= level) || (a.tofDays >= level && b.tofDays <= level)) {
          const t = (level - a.tofDays) / (b.tofDays - a.tofDays);
          const interpArrival = a.arrivalJD + t * (b.arrivalJD - a.arrivalJD);
          contourPoints.push({ x: dep, y: interpArrival });
        }
      }
    }
    
    if (contourPoints.length > 1) {
      contours.push({ level, points: contourPoints });
    }
  }
  
  return contours;
}

/**
 * Find optimal transfer windows (local minima in C3)
 */
export function findOptimalWindows(data: PorkchopData): Array<{ departureJD: number; arrivalJD: number; c3: number; tofDays: number }> {
  const windows: Array<{ departureJD: number; arrivalJD: number; c3: number; tofDays: number }> = [];
  
  // Group by departure
  const byDep = new Map<number, PorkchopPoint[]>();
  for (const p of data.points) {
    const depKey = Math.round(p.departureJD);
    if (!byDep.has(depKey)) byDep.set(depKey, []);
    byDep.get(depKey)!.push(p);
  }
  
  for (const [depJD, arrPoints] of byDep) {
    arrPoints.sort((a, b) => a.c3 - b.c3);
    if (arrPoints.length > 0) {
      const best = arrPoints[0];
      // Check if it's a local minimum compared to neighbors
      const prev = Array.from(byDep.entries()).find(([k]) => k === depJD - 1);
      const next = Array.from(byDep.entries()).find(([k]) => k === depJD + 1);
      
      let isLocalMin = true;
      if (prev && prev[1][0].c3 < best.c3) isLocalMin = false;
      if (next && next[1][0].c3 < best.c3) isLocalMin = false;
      
      if (isLocalMin) {
        windows.push({
          departureJD: best.departureJD,
          arrivalJD: best.arrivalJD,
          c3: best.c3,
          tofDays: best.tofDays,
        });
      }
    }
  }
  
  return windows.sort((a, b) => a.c3 - b.c3);
}