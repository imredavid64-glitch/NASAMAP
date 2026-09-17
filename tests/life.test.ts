import { describe, it, expect } from "vitest";
import { missionConsumables, radiationDose, RADIATION_MSV_DAY } from "@/lib/life";

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