/**
 * Orbit propagation engine — thin, typed wrappers over satellite.js (SGP4).
 * Used by the live ISS pass route and unit-tested in tests/orbit.test.ts.
 */

import * as satellite from "satellite.js";

export interface Tle {
  name?: string;
  line1: string;
  line2: string;
}

export interface Observer {
  latDeg: number;
  lonDeg: number;
  /** Height above sea level, km. Defaults to 0. */
  altitudeKm?: number;
  /** Minimum elevation (deg) that counts as a visible pass. Defaults to 10. */
  minElevationDeg?: number;
}

export interface GeoPoint {
  latDeg: number;
  lonDeg: number;
  altitudeKm: number;
}

export interface LookAngle {
  azimuthDeg: number;
  elevationDeg: number;
  rangeKm: number;
}

export interface Pass {
  startUtc: string;
  endUtc: string;
  peakUtc: string;
  maxElevationDeg: number;
  durationMin: number;
}

export function parseTle(tle: Tle): satellite.SatRec {
  return satellite.twoline2satrec(tle.line1, tle.line2);
}

/** Satellite sub-point (nadir lat/lon/altitude) at a UTC instant. */
export function subpointAt(tle: Tle, date: Date): GeoPoint {
  const satrec = parseTle(tle);
  const { position } = satellite.propagate(satrec, date);
  if (!position || typeof position === "boolean") throw new Error("propagation failed");
  const gmst = satellite.gstime(date);
  const geo = satellite.eciToGeodetic(position, gmst);
  return {
    latDeg: satellite.degreesLat(geo.latitude),
    lonDeg: satellite.degreesLong(geo.longitude),
    altitudeKm: geo.height,
  };
}

/** Topocentric look angles for an observer at a UTC instant. */
export function lookAngleAt(tle: Tle, date: Date, obs: Observer): LookAngle {
  const satrec = parseTle(tle);
  const { position } = satellite.propagate(satrec, date);
  if (!position || typeof position === "boolean") throw new Error("propagation failed");
  const gmst = satellite.gstime(date);
  const ecf = satellite.eciToEcf(position, gmst);
  const observerGd: satellite.GeodeticLocation = {
    longitude: satellite.degreesToRadians(obs.lonDeg),
    latitude: satellite.degreesToRadians(obs.latDeg),
    height: obs.altitudeKm ?? 0,
  };
  const look = satellite.ecfToLookAngles(observerGd, ecf);
  return {
    azimuthDeg: look.azimuth * (180 / Math.PI),
    elevationDeg: look.elevation * (180 / Math.PI),
    rangeKm: look.rangeSat,
  };
}

/**
 * Find visible passes over an observer by sampling the SGP4 track.
 * Simple and deterministic: sample elevation, then grow windows above the
 * minimum. Good enough for "look up tonight" planning.
 */
export function predictPasses(
  tle: Tle,
  obs: Observer,
  from: Date,
  hours = 24,
  stepSec = 30,
): Pass[] {
  const satrec = parseTle(tle);
  const minEl = obs.minElevationDeg ?? 10;
  const observerGd: satellite.GeodeticLocation = {
    longitude: satellite.degreesToRadians(obs.lonDeg),
    latitude: satellite.degreesToRadians(obs.latDeg),
    height: obs.altitudeKm ?? 0,
  };

  const stepMs = stepSec * 1000;
  const totalMs = hours * 3600 * 1000;
  const passes: Pass[] = [];
  let current: { start: Date; peak: Date; maxEl: number; lastAbove: Date } | null = null;

  for (let t = 0; t <= totalMs; t += stepMs) {
    const date = new Date(from.getTime() + t);
    const { position } = satellite.propagate(satrec, date);
    if (!position || typeof position === "boolean") continue;
    const gmst = satellite.gstime(date);
    const ecf = satellite.eciToEcf(position, gmst);
    const look = satellite.ecfToLookAngles(observerGd, ecf);
    const elDeg = look.elevation * (180 / Math.PI);

    if (elDeg >= minEl) {
      if (!current) {
        current = { start: date, peak: date, maxEl: elDeg, lastAbove: date };
      } else if (elDeg > current.maxEl) {
        current.maxEl = elDeg;
        current.peak = date;
      }
      current.lastAbove = date;
    } else if (current) {
      passes.push({
        startUtc: current.start.toISOString(),
        endUtc: current.lastAbove.toISOString(),
        peakUtc: current.peak.toISOString(),
        maxElevationDeg: current.maxEl,
        durationMin: (current.lastAbove.getTime() - current.start.getTime()) / 60000,
      });
      current = null;
    }
  }

  return passes;
}