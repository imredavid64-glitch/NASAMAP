import { describe, it, expect } from "vitest";
import {
  MARS_SOL_HOURS,
  MARS_OBLIQUITY_DEG,
  marsDeclinationDeg,
  hourAngleDeg,
  solarElevationDeg,
  solarAzimuthDeg,
  daylightFraction,
  generationKw,
  surfaceSolProfile,
  summariseSol,
  arrayKwForLoad,
  arrayKwFromArea,
  formatSolClock,
} from "@/lib/surface";

describe("Mars surface solar geometry", () => {
  it("uses the true sol length (24 h 39 m 35 s)", () => {
    expect(MARS_SOL_HOURS).toBeCloseTo(24.6597, 4);
  });

  it("puts the Sun at the zenith at the equator on an equinox at noon", () => {
    expect(solarElevationDeg(12, 0, 0)).toBeCloseTo(90, 3);
  });

  it("matches 90° − latitude at local noon for a zero declination", () => {
    expect(solarElevationDeg(12, 40, 0)).toBeCloseTo(50, 3);
    expect(solarElevationDeg(12, 18, 0)).toBeCloseTo(72, 3);
  });

  it("rises and sets at 06:00 and 18:00 at the equator on an equinox", () => {
    expect(solarElevationDeg(6, 0, 0)).toBeCloseTo(0, 3);
    expect(solarElevationDeg(18, 0, 0)).toBeCloseTo(0, 3);
    expect(solarElevationDeg(0, 0, 0)).toBeCloseTo(-90, 3);
  });

  it("reproduces the polar-summer minimum elevation at high latitude", () => {
    // min elevation = dec − (90 − lat) = 25 − 10 = 15°
    expect(solarElevationDeg(0, 80, 25)).toBeCloseTo(15, 3);
  });

  it("swings declination between ±obliquity over the Martian year", () => {
    expect(marsDeclinationDeg(MARS_SOL_HOURS * 0.25 * 0)).toBeCloseTo(0, 6);
    const sols = [0, 167, 334, 501];
    const decs = sols.map((s) => marsDeclinationDeg(s));
    expect(Math.max(...decs)).toBeCloseTo(MARS_OBLIQUITY_DEG, 1);
    expect(Math.min(...decs)).toBeCloseTo(-MARS_OBLIQUITY_DEG, 1);
  });

  it("measures hour angle from noon", () => {
    expect(hourAngleDeg(12)).toBe(0);
    expect(hourAngleDeg(6)).toBe(-90);
    expect(hourAngleDeg(18)).toBe(90);
  });

  it("keeps azimuth in [0,360) and due south at noon in the north", () => {
    const az = solarAzimuthDeg(12, 40, 0);
    expect(az).toBeGreaterThanOrEqual(0);
    expect(az).toBeLessThan(360);
    expect(az).toBeCloseTo(180, 1);
  });

  it("returns 12 h of daylight at the equator and polar day at high latitude", () => {
    expect(daylightFraction(0, 0)).toBeCloseTo(0.5, 3);
    expect(daylightFraction(80, 25)).toBe(1);
    expect(daylightFraction(-80, 25)).toBe(0);
  });
});

describe("Mars surface power", () => {
  it("produces no array output below the horizon", () => {
    expect(generationKw(-5, 20)).toBe(0);
    expect(generationKw(0, 20)).toBe(0);
    expect(generationKw(90, 20)).toBeCloseTo(20, 6);
    expect(generationKw(30, 20)).toBeCloseTo(10, 6);
  });

  it("sizes an array that runs a load on sunlight alone", () => {
    const load = 4;
    const array = arrayKwForLoad(load, 0, 0);
    const profile = surfaceSolProfile({
      arrayKw: array,
      loadKw: load,
      batteryKwh: 200,
      latitudeDeg: 0,
      declinationDeg: 0,
      steps: 144,
    });
    const s = summariseSol(profile);
    // Energy balance holds to within sampling error (< 2%).
    expect(s.energyGeneratedKwh).toBeGreaterThan(s.energyConsumedKwh * 0.98);
  });

  it("keeps the battery within capacity across a sol", () => {
    const profile = surfaceSolProfile({ arrayKw: 30, loadKw: 6, batteryKwh: 60, latitudeDeg: 18, declinationDeg: 0 });
    expect(Math.min(...profile.map((p) => p.batteryPct))).toBeGreaterThanOrEqual(0);
    expect(Math.max(...profile.map((p) => p.batteryPct))).toBeLessThanOrEqual(100);
  });

  it("reports a brownout when the array and battery cannot carry the load", () => {
    const profile = surfaceSolProfile({ arrayKw: 0, loadKw: 6, batteryKwh: 12, latitudeDeg: 18, declinationDeg: 0 });
    const s = summariseSol(profile);
    expect(s.brownoutHours).toBeGreaterThan(0);
    expect(s.minBatteryPct).toBeCloseTo(0, 6);
  });

  it("has a generation peak at local noon", () => {
    const profile = surfaceSolProfile({ arrayKw: 30, loadKw: 6, batteryKwh: 60, latitudeDeg: 0, declinationDeg: 0 });
    const peak = profile.reduce((a, b) => (b.generationKw > a.generationKw ? b : a));
    expect(peak.hour).toBeGreaterThan(11);
    expect(peak.hour).toBeLessThan(13.5);
  });

  it("converts array area to rated power with the shared 30% efficiency", () => {
    const irradiance = 1.361 / (1.523679 * 1.523679);
    expect(arrayKwFromArea(100, irradiance)).toBeCloseTo(100 * irradiance * 0.3, 6);
  });

  it("formats a sol clock", () => {
    expect(formatSolClock(0)).toBe("00:00");
    expect(formatSolClock(12.5)).toBe("12:30");
    expect(formatSolClock(MARS_SOL_HOURS)).toBe("00:39");
  });
});
