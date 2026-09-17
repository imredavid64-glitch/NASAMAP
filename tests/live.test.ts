import { describe, it, expect, vi, afterEach } from "vitest";
import { assembleVoyager, kpLevel, getIssTle, getSpaceWeather, getVoyager } from "@/lib/live";
import snapshots from "@/data/live-snapshots.json";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("live formatting helpers", () => {
  it("maps Kp to a plain-language level", () => {
    expect(kpLevel(1)).toBe("quiet");
    expect(kpLevel(3)).toBe("unsettled");
    expect(kpLevel(4)).toBe("active");
    expect(kpLevel(5)).toBe("geomagnetic storm (G1-G2)");
    expect(kpLevel(7)).toBe("severe storm (G3+)");
  });

  it("converts Voyager range in AU into distance and light-time", () => {
    const v1 = assembleVoyager("Voyager 1", "-31", 171.873966746212);
    expect(v1.distanceKm).toBeGreaterThan(2.5e10);
    expect(v1.distanceKm).toBeLessThan(2.6e10);
    // ~171 AU one-way is about 23-24 light-hours
    expect(v1.oneWayLabel).toMatch(/^2[0-9]h /);
    expect(v1.roundTripLabel).toMatch(/^4[0-9]h /);
  });

  it("ships a coherent snapshot file", () => {
    expect(snapshots.iss.line1.startsWith("1 ")).toBe(true);
    expect(snapshots.iss.line2.startsWith("2 ")).toBe(true);
    expect(snapshots.voyager.voyager1.distanceAu).toBeGreaterThan(snapshots.voyager.voyager2.distanceAu);
    expect(snapshots.apod.media_type).toBe("image");
  });
});

describe("graceful fallback when upstream is unreachable", () => {
  it("falls back to the ISS snapshot", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("offline"))));
    const res = await getIssTle();
    expect(res.source).toBe("snapshot");
    expect(res.data.line1).toBe(snapshots.iss.line1);
    expect(res.fetchedAt).toBe(snapshots.fetchedAt);
  });

  it("falls back to the Voyager snapshot", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("offline"))));
    const res = await getVoyager();
    expect(res.source).toBe("snapshot");
    expect(res.data.bodies).toHaveLength(2);
    expect(res.data.bodies[0].name).toBe("Voyager 1");
  });

  it("falls back to the space-weather snapshot", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("offline"))));
    const res = await getSpaceWeather();
    expect(res.source).toBe("snapshot");
    expect(res.data.kp).toBe(snapshots.spaceWeather.kp);
  });
});