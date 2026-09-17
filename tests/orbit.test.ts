import { describe, it, expect } from "vitest";
import { parseTle, subpointAt, lookAngleAt, predictPasses } from "@/lib/orbit";
import snapshots from "@/data/live-snapshots.json";

const tle = { name: snapshots.iss.name, line1: snapshots.iss.line1, line2: snapshots.iss.line2 };
const epoch = new Date("2026-09-17T00:00:00Z");

describe("SGP4 orbit wrappers", () => {
  it("parses the ISS element set without throwing", () => {
    expect(() => parseTle(tle)).not.toThrow();
  });

  it("computes a plausible sub-point (within inclination, LEO altitude)", () => {
    const sp = subpointAt(tle, epoch);
    expect(Math.abs(sp.latDeg)).toBeLessThanOrEqual(53); // inclination ~51.6°
    expect(sp.lonDeg).toBeGreaterThanOrEqual(-180);
    expect(sp.lonDeg).toBeLessThanOrEqual(180);
    expect(sp.altitudeKm).toBeGreaterThan(350);
    expect(sp.altitudeKm).toBeLessThan(480);
  });

  it("returns valid look angles for an observer", () => {
    const look = lookAngleAt(tle, epoch, { latDeg: 29.56, lonDeg: -95.09 });
    expect(look.elevationDeg).toBeGreaterThanOrEqual(-90);
    expect(look.elevationDeg).toBeLessThanOrEqual(90);
    expect(look.azimuthDeg).toBeGreaterThanOrEqual(0);
    expect(look.azimuthDeg).toBeLessThanOrEqual(360);
    expect(look.rangeKm).toBeGreaterThan(300);
  });

  it("finds visible passes over a mid-latitude observer in 24 h", () => {
    const passes = predictPasses(tle, { latDeg: 29.56, lonDeg: -95.09, minElevationDeg: 10 }, epoch, 24);
    expect(passes.length).toBeGreaterThanOrEqual(2);
    expect(passes.length).toBeLessThanOrEqual(12);
    for (const p of passes) {
      expect(p.maxElevationDeg).toBeGreaterThanOrEqual(10);
      expect(p.durationMin).toBeGreaterThan(0);
      expect(p.durationMin).toBeLessThan(20);
      expect(new Date(p.endUtc).getTime()).toBeGreaterThan(new Date(p.startUtc).getTime());
    }
  });

  it("is deterministic for the same inputs", () => {
    const a = predictPasses(tle, { latDeg: 40, lonDeg: -74 }, epoch, 12);
    const b = predictPasses(tle, { latDeg: 40, lonDeg: -74 }, epoch, 12);
    expect(a).toEqual(b);
  });
});