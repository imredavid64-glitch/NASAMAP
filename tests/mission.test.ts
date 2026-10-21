import { describe, it, expect } from "vitest";
import { designMission, materializeCustomVehicle, MOON_TRANSFER_DAYS, HABITATION_MODULE_KG } from "@/lib/mission";
import { hohmannTransfer } from "@/lib/rocket";
import constants from "@/data/constants.json";

describe("mission design: Rocket Builder vehicle", () => {
  const heavy = {
    name: "Heavy Lifter",
    payloadLEOKg: 42_000,
    payloadTLIKg: 12_500,
    ispVacuumS: 452,
    stages: 2,
    costPerLaunchUsd: 68_000_000,
  };

  it("uses the custom vehicle instead of the catalogue entry", () => {
    const d = designMission({
      destination: "mars",
      vehicleId: "custom",
      crew: 4,
      surfaceDays: 90,
      customVehicle: heavy,
    });
    expect(d.vehicle.id).toBe("custom");
    expect(d.vehicle.name).toBe("Heavy Lifter");
    expect(d.vehicle.payloadLEOKg).toBe(42_000);
  });

  it("tags the modelled cost as an estimate, never as documented", () => {
    const v = materializeCustomVehicle(heavy);
    expect(v.costConfidence).toBe("estimate");
    expect(v.costNote).toMatch(/not a published price/i);
  });

  it("gates the launch on the custom vehicle's payload capacity", () => {
    const roomy = designMission({
      destination: "mars",
      vehicleId: "custom",
      crew: 4,
      surfaceDays: 90,
      customVehicle: { ...heavy, payloadLEOKg: 200_000 },
    });
    const tiny = designMission({
      destination: "mars",
      vehicleId: "custom",
      crew: 4,
      surfaceDays: 90,
      customVehicle: { ...heavy, payloadLEOKg: 10 },
    });
    expect(roomy.launchGate).toBe("pass");
    expect(tiny.launchGate).toBe("fail");
  });

  it("never labels a modelled payload as documented", () => {
    const d = designMission({
      destination: "mars",
      vehicleId: "custom",
      crew: 4,
      surfaceDays: 90,
      customVehicle: heavy,
    });
    expect(d.notes.some((n) => n.includes("documented"))).toBe(false);
    expect(d.notes.some((n) => n.includes("modelled"))).toBe(true);
  });
});

describe("mission design: Earth → Moon", () => {
  const d = designMission({ destination: "moon", vehicleId: "saturn-v", crew: 3, surfaceDays: 30 });

  it("uses the documented Apollo-class transit time", () => {
    expect(d.transferDays).toBe(MOON_TRANSFER_DAYS);
    expect(d.transferHours).toBeCloseTo(MOON_TRANSFER_DAYS * 24, 6);
  });

  it("surface stay is added to lifetime radiation dose", () => {
    const noStay = designMission({ destination: "moon", vehicleId: "saturn-v", crew: 3, surfaceDays: 0 });
    const stay = designMission({ destination: "moon", vehicleId: "saturn-v", crew: 3, surfaceDays: 100 });
    expect(stay.radiationMsvTotal).toBeGreaterThan(noStay.radiationMsvTotal);
  });

  it("returns a GO for Saturn V against the Apollo-class stack", () => {
    expect(d.launchGate).toBe("pass");
    expect(d.requiredMassKg).toBeGreaterThan(0);
  });
});

describe("mission design: Earth → Mars", () => {
  const reference = hohmannTransfer(
    constants.mu.sun,
    constants.astronomicalUnitKm,
    constants.astronomicalUnitKm * 1.524,
  );
  const d = designMission({ destination: "mars", vehicleId: "starship", crew: 4, surfaceDays: 90 });

  it("coast time matches the classic Hohmann transfer (≈259 days)", () => {
    expect(d.transferDays).toBeCloseTo(reference.transferDays, 6);
    expect(d.transferDays).toBeGreaterThan(255);
    expect(d.transferDays).toBeLessThan(262);
  });

  it("heliocentric Δv budget is ≈5.5 km/s", () => {
    expect(d.totalDeltaVKmS).toBeGreaterThan(5.3);
    expect(d.totalDeltaVKmS).toBeLessThan(5.7);
  });

  it("one-way light-lag at mean distance is ≈750 s", () => {
    expect(d.arrivalLt.oneWaySec).toBeGreaterThan(700);
    expect(d.arrivalLt.oneWaySec).toBeLessThan(800);
  });

  it("Starship (150 t LEO) passes the 34 t-class stack", () => {
    expect(d.launchGate).toBe("pass");
  });
});

describe("mission design: launch gate", () => {
  it("Falcon 9 cannot lift a 30 t-class Mars habitat stack", () => {
    const d = designMission({ destination: "mars", vehicleId: "falcon-9", crew: 4, surfaceDays: 90 });
    expect(d.launchGate).toBe("fail");
  });

  it("works with minimum crew and zero surface days", () => {
    const d = designMission({ destination: "moon", vehicleId: "sls-block-1", crew: 1, surfaceDays: 0 });
    expect(d.crew).toBe(1);
    expect(d.radiationMsvTotal).toBeGreaterThan(0);
  });
});

describe("mission design internals", () => {
  it("habitation module mass is destination-specific, not fabricated", () => {
    expect(HABITATION_MODULE_KG.moon).toBe(10_000);
    expect(HABITATION_MODULE_KG.mars).toBe(30_000);
  });
});