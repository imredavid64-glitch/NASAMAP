import { describe, it, expect } from "vitest";
import {
  circularVelocity,
  escapeVelocity,
  circularPeriodSec,
  tsiolkovskyDeltaV,
  stagedDeltaV,
  hohmannTransfer,
  surfaceGravity,
} from "@/lib/rocket";
import constants from "@/data/constants.json";

const MU_EARTH = constants.mu.earth;
const MU_SUN = constants.mu.sun;

describe("orbital mechanics", () => {
  it("LEO at 6778 km radius ~7.66 km/s (ISS-class)", () => {
    const v = circularVelocity(MU_EARTH, 6778);
    expect(v).toBeGreaterThan(7.6);
    expect(v).toBeLessThan(7.7);
  });

  it("surface circular velocity ~7.9 km/s at 6378 km", () => {
    const v = circularVelocity(MU_EARTH, 6378);
    expect(v).toBeGreaterThan(7.85);
    expect(v).toBeLessThan(7.95);
  });

  it("Earth escape velocity ~11.19 km/s", () => {
    const v = escapeVelocity(MU_EARTH, 6371);
    expect(v).toBeGreaterThan(11.1);
    expect(v).toBeLessThan(11.3);
  });

  it("ISS orbital period ~92.5 minutes", () => {
    const p = circularPeriodSec(MU_EARTH, 6778);
    expect(p).toBeGreaterThan(5400);
    expect(p).toBeLessThan(5700);
  });

  it("surface gravity Earth ≈ 9.8 m/s²", () => {
    expect(surfaceGravity(MU_EARTH, 6371)).toBeCloseTo(9.8, 1);
  });
});

describe("rocket equation", () => {
  it("Isp 300, 10:1 mass ratio → ~6774 m/s", () => {
    const dv = tsiolkovskyDeltaV(300, 1000, 100);
    expect(dv).toBeGreaterThan(6700);
    expect(dv).toBeLessThan(6850);
  });

  it("staged sum equals sum of stages", () => {
    const staged = stagedDeltaV([
      { ispSeconds: 300, mass0Kg: 1000, massFinalKg: 500 },
      { ispSeconds: 340, mass0Kg: 500, massFinalKg: 100 },
    ]);
    const single = tsiolkovskyDeltaV(300, 1000, 500) + tsiolkovskyDeltaV(340, 500, 100);
    expect(staged).toBeCloseTo(single, 6);
  });

  it("throws on invalid masses", () => {
    expect(() => tsiolkovskyDeltaV(300, 100, 200)).toThrow();
  });
});

describe("Hohmann Earth→Mars (reference values)", () => {
  const AU = constants.astronomicalUnitKm;
  const rEarth = 1.0 * AU;
  const rMars = 1.5237 * AU;

  it("transfer time ≈ 259 days", () => {
    const h = hohmannTransfer(MU_SUN, rEarth, rMars);
    expect(h.transferDays).toBeGreaterThan(255);
    expect(h.transferDays).toBeLessThan(262);
  });

  it("departure Δv ≈ 2.9-3.0 km/s above Earth's orbital velocity", () => {
    const h = hohmannTransfer(MU_SUN, rEarth, rMars);
    expect(h.departureDeltaVKmS).toBeGreaterThan(2.7);
    expect(h.departureDeltaVKmS).toBeLessThan(3.2);
  });

  it("total ≈ 5.6 km/s in Sun frame", () => {
    const h = hohmannTransfer(MU_SUN, rEarth, rMars);
    expect(h.totalDeltaVKmS).toBeGreaterThan(5.0);
    expect(h.totalDeltaVKmS).toBeLessThan(6.2);
  });

  it("Hohmann is symmetric (transfer Earth→Mars ≈ Mars→Earth)", () => {
    const up = hohmannTransfer(MU_SUN, rEarth, rMars);
    const down = hohmannTransfer(MU_SUN, rMars, rEarth);
    expect(up.totalDeltaVKmS).toBeCloseTo(down.totalDeltaVKmS, 1);
  });
});