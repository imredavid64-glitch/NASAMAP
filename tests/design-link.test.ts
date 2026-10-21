import { describe, it, expect } from "vitest";
import {
  DEFAULT_DESIGN,
  CREW_MAX,
  CREW_MIN,
  SURFACE_DAYS_MAX,
  SURFACE_DAYS_MIN,
  encodeDesignQuery,
  encodeDesignSlug,
  decodeDesign,
  decodeDesignSlug,
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

describe("design path slug", () => {
  it("uses only characters that survive a URL path segment unencoded", () => {
    const slug = encodeDesignSlug({ destination: "mars", vehicleId: "falcon-heavy", crew: 6, surfaceDays: 200 });
    expect(slug).toBe("mars-c6-s200-falcon-heavy");
    expect(slug).toMatch(/^[A-Za-z0-9._~-]+$/);
    expect(encodeURIComponent(slug)).toBe(slug);
  });

  it("never emits the query-string separators that break routing", () => {
    for (const v of launchVehicles as { id: string }[]) {
      const slug = encodeDesignSlug({ destination: "moon", vehicleId: v.id, crew: 2, surfaceDays: 30 });
      expect(slug).not.toContain("&");
      expect(slug).not.toContain("?");
      expect(slug).not.toContain("=");
    }
  });

  it("round-trips a design", () => {
    const design: DesignInput = { destination: "mars", vehicleId: "falcon-heavy", crew: 6, surfaceDays: 200 };
    expect(decodeDesignSlug(encodeDesignSlug(design))).toEqual(design);
  });

  it("round-trips every documented vehicle id, including ids with dashes", () => {
    for (const v of launchVehicles as { id: string }[]) {
      const design: DesignInput = { destination: "moon", vehicleId: v.id, crew: 3, surfaceDays: 45 };
      expect(decodeDesignSlug(encodeDesignSlug(design))).toEqual(design);
    }
  });

  it("rejects a malformed, unknown-vehicle or unknown-destination slug", () => {
    expect(decodeDesignSlug("nonsense")).toBeNull();
    expect(decodeDesignSlug("mars-c4-s90-falcon-9-extra")).toBeNull();
    expect(decodeDesignSlug("venus-c4-s90-starship")).toBeNull();
    expect(decodeDesignSlug("mars-c4-s90-not-a-vehicle")).toBeNull();
  });
});

describe("Rocket Builder vehicle handoff", () => {
  const custom: DesignInput = {
    destination: "mars",
    vehicleId: "custom",
    crew: 4,
    surfaceDays: 90,
    customVehicle: {
      name: "Heavy Lifter",
      payloadLEOKg: 42_000,
      payloadTLIKg: 12_500,
      ispVacuumS: 452,
      stages: 2,
      costPerLaunchUsd: 68_000_000,
    },
  };

  it("carries the vehicle spec through the query string", () => {
    const decoded = decodeDesign(toParams(encodeDesignQuery(custom)));
    expect(decoded.vehicleId).toBe("custom");
    expect(decoded.customVehicle).toEqual(custom.customVehicle);
  });

  it("carries the vehicle spec through the path slug", () => {
    const slug = encodeDesignSlug(custom);
    expect(slug).toBe("mars-c4-s90-custom-42000-12500");
    const decoded = decodeDesignSlug(slug);
    expect(decoded?.vehicleId).toBe("custom");
    expect(decoded?.customVehicle?.payloadLEOKg).toBe(42_000);
    expect(decoded?.customVehicle?.payloadTLIKg).toBe(12_500);
  });

  it("treats a design carrying a custom vehicle as custom", () => {
    expect(isCustomDesign(custom)).toBe(true);
  });

  it("ignores a custom-vehicle payload that is missing or non-positive", () => {
    expect(decodeDesign({ v: "custom" }).customVehicle).toBeUndefined();
    expect(decodeDesign({ v: "custom", cvpl: "0" }).customVehicle).toBeUndefined();
    expect(decodeDesign({ v: "custom", cvpl: "-4" }).customVehicle).toBeUndefined();
    expect(decodeDesign({ v: "custom", cvpl: "abc" }).customVehicle).toBeUndefined();
  });

  it("rejects a custom-vehicle slug with no payload", () => {
    expect(decodeDesignSlug("mars-c4-s90-custom-0-0")).toBeNull();
  });
});
