import { describe, it, expect } from "vitest";
import {
  missionConsumables,
  radiationDose,
  RADIATION_MSV_DAY,
  opsBudget,
  ECLSS_POWER,
  DESTINATION_AU,
} from "@/lib/life";

describe("life support consumables", () => {
  it("3 crew × 500 days O₂ = 1260 kg (0.84 kg/person/day)", () => {
    const t = missionConsumables(3, 500);
    expect(t.oxygenKg).toBeCloseTo(1260, 6);
  });

  it("water benchmark is per-person daily", () => {
    const perDay = missionConsumables(1, 1).waterKg;
    expect(perDay).toBeCloseTo(3.85, 6);
  });

  it("radiation dose transit-Mars ≈ 0.66 mSv/day × days", () => {
    const d = radiationDose(260, "transit-mars");
    expect(d.mSvTotal).toBeCloseTo(0.66 * 260, 6);
    expect(d.remTotal).toBeCloseTo(d.mSvTotal / 10, 6);
  });

  it("every radiation environment has a labelled source", () => {
    for (const env of Object.keys(RADIATION_MSV_DAY) as (keyof typeof RADIATION_MSV_DAY)[]) {
      expect(RADIATION_MSV_DAY[env].mSvPerDay).toBeGreaterThan(0);
      expect(RADIATION_MSV_DAY[env].sourceNote.length).toBeGreaterThan(10);
    }
  });
});

describe("closed-loop ops budget", () => {
  const mars = opsBudget({ destination: "mars", crew: 4, days: 259 });

  it("gross consumables reuse the per-person daily benchmarks", () => {
    expect(mars.gross.waterKg).toBeCloseTo(4 * 259 * 3.85, 6);
    expect(mars.gross.oxygenKg).toBeCloseTo(4 * 259 * 0.84, 6);
    expect(mars.gross.foodKg).toBeCloseTo(4 * 259 * 0.62, 6);
  });

  it("ISS water reclamation leaves ~10% of water for resupply", () => {
    expect(mars.recycled.waterKg).toBeCloseTo(mars.gross.waterKg * 0.9, 6);
    expect(mars.net.waterKg).toBeCloseTo(mars.gross.waterKg * 0.1, 6);
  });

  it("Sabatier oxygen recovery halves the O₂ resupply demand", () => {
    expect(mars.recycled.oxygenKg).toBeCloseTo(mars.gross.oxygenKg * 0.5, 6);
    expect(mars.net.oxygenKg).toBeCloseTo(mars.gross.oxygenKg * 0.5, 6);
  });

  it("food has no reclamation and is carried in full", () => {
    expect(mars.net.foodKg).toBe(mars.gross.foodKg);
  });

  it("recycling removes a majority of the consumables stack", () => {
    expect(mars.savedKg).toBeCloseTo(mars.grossResupplyKg - mars.netResupplyKg, 6);
    expect(mars.savedPct).toBeGreaterThan(0.7);
    expect(mars.savedPct).toBeLessThan(0.8);
  });

  it("ECLSS power scales with crew and matches the per-crew line sum", () => {
    const lineSum = ECLSS_POWER.reduce((s, l) => s + l.kWPerCrew, 0);
    expect(mars.powerKw).toBeCloseTo(lineSum * 4, 6);
    expect(opsBudget({ destination: "mars", crew: 6, days: 259 }).powerKw).toBeCloseTo(lineSum * 6, 6);
  });

  it("Mars irradiance follows the inverse-square law and drives a bigger array than the Moon", () => {
    expect(mars.irradianceKwM2).toBeCloseTo(1.361 / (DESTINATION_AU.mars ** 2), 6);
    const moon = opsBudget({ destination: "moon", crew: 4, days: 259 });
    expect(moon.irradianceKwM2).toBeCloseTo(1.361, 6);
    expect(moon.arrayAreaM2).toBeCloseTo(moon.powerKw / (1.361 * 0.3), 6);
    expect(mars.arrayAreaM2).toBeGreaterThan(moon.arrayAreaM2);
  });

  it("clamps crew and days and labels every power line", () => {
    const tiny = opsBudget({ destination: "moon", crew: 0, days: -5 });
    expect(tiny.crew).toBe(1);
    expect(tiny.days).toBe(0);
    for (const line of ECLSS_POWER) {
      expect(line.note.length).toBeGreaterThan(10);
      expect(["documented", "derived", "estimate"]).toContain(line.confidence);
    }
    expect(mars.rates.confidence).toBe("documented");
  });
});