import { describe, it, expect } from "vitest";
import {
  DEFAULT_DESIGN,
  CREW_MAX,
  CREW_MIN,
  SURFACE_DAYS_MAX,
  SURFACE_DAYS_MIN,
  encodeDesignQuery,
  decodeDesign,
  isCustomDesign,
  type DesignInput,
} from "@/lib/design-link";
import launchVehicles from "@/data/launch-vehicles.json";

const toParams = (query: string): Record<string, string> => Object.fromEntries(new URLSearchParams(query));

describe("design permalink", () => {
  it("encodes all four design fields", () => {
    const q = encodeDesignQuery({ destination: "moon", vehicleId: "sls-block-1", crew: 3, surfaceDays: 14 });
    const p = toParams(q);
    expect(p).toEqual({ d: "moon", v: "sls-block-1", c: "3", s: "14" });
  });

  it("round-trips a custom design", () => {
    const design: DesignInput = { destination: "mars", vehicleId: "falcon-heavy", crew: 6, surfaceDays: 200 };
    expect(decodeDesign(toParams(encodeDesignQuery(design)))).toEqual(design);
  });

  it("falls back to the default for an empty query", () => {
    expect(decodeDesign({})).toEqual(DEFAULT_DESIGN);
  });

  it("rejects an unknown destination and vehicle", () => {
    const d = decodeDesign({ d: "venus", v: "saturn-1b" });
    expect(d.destination).toBe(DEFAULT_DESIGN.destination);
    expect(d.vehicleId).toBe(DEFAULT_DESIGN.vehicleId);
  });

  it("accepts every documented vehicle id", () => {
    for (const v of launchVehicles as { id: string }[]) {
      expect(decodeDesign({ v: v.id }).vehicleId).toBe(v.id);
    }
  });

  it("clamps crew and surface days into range", () => {
    expect(decodeDesign({ c: "0" }).crew).toBe(CREW_MIN);
    expect(decodeDesign({ c: "99" }).crew).toBe(CREW_MAX);
    expect(decodeDesign({ s: "-5" }).surfaceDays).toBe(SURFACE_DAYS_MIN);
    expect(decodeDesign({ s: "9999" }).surfaceDays).toBe(SURFACE_DAYS_MAX);
  });

  it("uses the first value when a param repeats", () => {
    expect(decodeDesign({ c: ["2", "5"], s: ["30", "90"] })).toMatchObject({ crew: 2, surfaceDays: 30 });
  });

  it("flags only non-default designs as custom", () => {
    expect(isCustomDesign(DEFAULT_DESIGN)).toBe(false);
    expect(isCustomDesign({ ...DEFAULT_DESIGN, crew: 5 })).toBe(true);
    expect(isCustomDesign({ ...DEFAULT_DESIGN, destination: "moon" })).toBe(true);
  });
});
