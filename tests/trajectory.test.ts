import { describe, it, expect } from "vitest";
import {
  metToSeconds,
  kmToScene,
  formatMet,
  hohmannEarthMoon,
  interpolateApollo11,
  getApollo11Samples,
  MOON_ORBIT_RADIUS,
} from "@/lib/trajectory";
import trajectory from "@/data/apollo11-trajectory.json";

describe("trajectory helpers", () => {
  it("parses MET strings to seconds", () => {
    expect(metToSeconds("00:00:00")).toBe(0);
    expect(metToSeconds("02:44:16")).toBe(2 * 3600 + 44 * 60 + 16);
    expect(metToSeconds("102:45:40")).toBe(102 * 3600 + 45 * 60 + 40);
  });

  it("normalizes km to scene units (Earth radius = 1)", () => {
    expect(kmToScene(6371.0088)).toBeCloseTo(1, 6);
  });

  it("formats seconds back to hh:mm:ss", () => {
    expect(formatMet(0)).toBe("00:00:00");
    expect(formatMet(2 * 3600 + 44 * 60 + 16)).toBe("02:44:16");
    expect(formatMet(102 * 3600 + 45 * 60 + 40)).toBe("102:45:40");
  });

  it("places the Moon at the mean Earth-Moon distance", () => {
    expect(MOON_ORBIT_RADIUS).toBeGreaterThan(59);
    expect(MOON_ORBIT_RADIUS).toBeLessThan(61);
  });
});

describe("Hohmann Earth→Moon transfer", () => {
  it("starts at the parking-orbit radius", () => {
    const { position } = hohmannEarthMoon(0);
    const r = Math.sqrt(position.x ** 2 + position.y ** 2);
    expect(r).toBeGreaterThan(1.0);
    expect(r).toBeLessThan(1.1);
  });

  it("reaches the Moon's distance at half the transfer period", () => {
    // Transfer period for a= (r1+r2)/2 ~ 195,500 km is ~ 5.1 days one-way
    const halfPeriodSec = Math.PI * Math.sqrt(((6371 + 185 + 384400) / 2) ** 3 / 398600.4418);
    const { position } = hohmannEarthMoon(halfPeriodSec);
    const r = Math.sqrt(position.x ** 2 + position.y ** 2);
    expect(r).toBeGreaterThan(55);
    expect(r).toBeLessThan(65);
  });

  it("is faster than escape at the start (LEO speed sanity)", () => {
    const { velocity } = hohmannEarthMoon(0);
    const speedScenePerHour = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
    const speedKmS = (speedScenePerHour * 6371) / 3600;
    expect(speedKmS).toBeGreaterThan(9);
    expect(speedKmS).toBeLessThan(12);
  });
});

describe("Apollo 11 interpolation", () => {
  it("ships 15 historical timeline points", () => {
    expect(trajectory).toHaveLength(15);
  });

  it("returns Launch at MET 0", () => {
    const s = interpolateApollo11(0);
    expect(s.event).toBe("Launch");
    expect(s.body).toBe("earth");
    expect(s.position.x).toBeCloseTo(1.0, 5);
  });

  it("returns Touchdown at the final MET", () => {
    const total = metToSeconds(trajectory[trajectory.length - 1].met);
    const s = interpolateApollo11(total);
    expect(s.event).toContain("Touchdown");
    expect(s.body).toBe("moon");
  });

  it("linearly interpolates between bracketing events", () => {
    const t0 = metToSeconds("72:00:00");
    const t1 = metToSeconds("75:49:50");
    const mid = (t0 + t1) / 2;
    const s = interpolateApollo11(mid);
    const p0 = { x: -0.98, y: 0.02, z: 0.18 };
    const p1 = { x: -0.9, y: 0.05, z: 0.22 };
    expect(s.position.x).toBeCloseTo((p0.x + p1.x) / 2, 5);
    expect(s.position.y).toBeCloseTo((p0.y + p1.y) / 2, 5);
    expect(s.position.z).toBeCloseTo((p0.z + p1.z) / 2, 5);
  });

  it("produces monotonic MET samples", () => {
    const samples = getApollo11Samples(50);
    expect(samples).toHaveLength(50);
    for (let i = 1; i < samples.length; i++) {
      expect(samples[i].met).toBeGreaterThan(samples[i - 1].met);
    }
  });
});