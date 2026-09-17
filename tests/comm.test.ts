import { describe, it, expect } from "vitest";
import { lightTime, humanDuration, benchmarkDistances, C_KM_S } from "@/lib/comm";
import constants from "@/data/constants.json";

describe("light time", () => {
  it("Moon (mean 384,400 km) → 1.28 s one-way, 2.56 s round trip", () => {
    const t = lightTime(384400);
    expect(t.oneWaySec).toBeCloseTo(1.2822, 2);
    expect(t.roundTripSec).toBeCloseTo(2.5644, 2);
  });

  it("Mars (mean 225,000,000 km) → ~12.5 min one-way", () => {
    const t = lightTime(225000000);
    expect(t.oneWaySec).toBeGreaterThan(730);
    expect(t.oneWaySec).toBeLessThan(770);
  });

  it("Voyager 1 (~24.1 billion km) → ~22.3 h one-way", () => {
    const t = lightTime(24100000000);
    expect(t.oneWaySec).toBeGreaterThan(80000);
    expect(t.oneWaySec).toBeLessThan(81000);
  });

  it("humanDuration formats minutes+seconds", () => {
    expect(humanDuration(62.5)).toMatch(/1m 2\.5s/);
  });

  it("C matches published speed of light", () => {
    expect(C_KM_S).toBeCloseTo(299792.458, 5);
  });

  it("benchmark table uses the AU constant internally", () => {
    const sun = benchmarkDistances().find((d) => d.name.includes("Sun"))!;
    expect(sun.distanceKm).toBe(constants.astronomicalUnitKm);
  });
});