import { describe, it, expect } from "vitest";
import {
  metToSeconds,
  kmToScene,
  formatMet,
  hohmannEarthMoon,
  interpolateApollo11,
  getApollo11Samples,
  getHohmannSamples,
  hohmannTransferSeconds,
  marsTransferDiagram,
  marsTransferSeconds,
  marsAtTime,
  getMarsTransferSamples,
  MOON_ORBIT_RADIUS,
  EARTH_ORBIT_AU,
  MARS_ORBIT_AU,
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

  it("takes about 5 days one-way", () => {
    const days = hohmannTransferSeconds() / 86400;
    expect(days).toBeGreaterThan(4.5);
    expect(days).toBeLessThan(5.5);
  });
});

describe("Hohmann timeline samples", () => {
  it("starts in LEO and ends near the Moon", () => {
    const s = getHohmannSamples(120);
    expect(s).toHaveLength(120);
    const startR = Math.sqrt(s[0].position.x ** 2 + s[0].position.y ** 2);
    const endR = Math.sqrt(s[119].position.x ** 2 + s[119].position.y ** 2);
    expect(startR).toBeLessThan(1.1);
    expect(endR).toBeGreaterThan(55);
    expect(endR).toBeLessThan(65);
  });

  it("labels the start and end events", () => {
    const s = getHohmannSamples(120);
    expect(s[0].event).toBe("TLI Cutoff");
    expect(s[119].event).toBe("Lunar Orbit Insertion");
  });
});

describe("Earth→Mars Hohmann diagram", () => {
  const d = marsTransferDiagram(16);

  it("uses documented orbital radii", () => {
    expect(d.earthOrbitAu).toBe(1);
    expect(d.marsOrbitAu).toBeCloseTo(1.524, 3);
  });

  it("takes ~259 days and needs a ~44° phase lead", () => {
    expect(d.transferDays).toBeGreaterThan(250);
    expect(d.transferDays).toBeLessThan(268);
    expect(d.phaseAngleDeg).toBeGreaterThan(40);
    expect(d.phaseAngleDeg).toBeLessThan(48);
  });

  it("has the correct transfer-ellipse geometry", () => {
    expect(d.semiMajorAu).toBeCloseTo((1 + 1.523679) / 2, 6);
    expect(d.eccentricity).toBeCloseTo(0.2075, 3);
  });

  it("recurs on the ~780-day synodic period", () => {
    expect(d.synodicDays).toBeGreaterThan(775);
    expect(d.synodicDays).toBeLessThan(785);
  });

  it("starts at Earth's orbit and ends at Mars' orbit", () => {
    const start = d.points[0];
    const end = d.points[d.points.length - 1];
    expect(Math.hypot(start.x, start.y)).toBeCloseTo(1, 2);
    expect(Math.hypot(end.x, end.y)).toBeCloseTo(1.523679, 2);
    expect(end.y).toBeCloseTo(0, 6);
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

describe("Earth→Mars transfer (3D fly)", () => {
  const total = marsTransferSeconds();

  it("coasts for ~259 days", () => {
    expect(total / 86_400).toBeGreaterThan(255);
    expect(total / 86_400).toBeLessThan(262);
  });

  it("departs from Earth's orbit at perihelion", () => {
    const s = marsAtTime(0);
    expect(s.craftAu.x).toBeCloseTo(EARTH_ORBIT_AU, 4);
    expect(s.craftAu.y).toBeCloseTo(0, 6);
    expect(s.auFromSun).toBeCloseTo(EARTH_ORBIT_AU, 4);
    expect(s.event).toBe("Trans-Mars Injection");
  });

  it("arrives at Mars' orbit at aphelion", () => {
    const s = marsAtTime(total);
    expect(s.craftAu.x).toBeCloseTo(-MARS_ORBIT_AU, 3);
    expect(s.craftAu.y).toBeCloseTo(0, 3);
    expect(s.auFromSun).toBeCloseTo(MARS_ORBIT_AU, 3);
    expect(s.event).toBe("Mars Orbit Insertion");
  });

  it("holds Earth fixed and marches Mars from the phase angle to 180°", () => {
    const geo = marsTransferDiagram(1);
    const start = marsAtTime(0);
    const end = marsAtTime(total);
    expect(start.earthAu).toEqual({ x: EARTH_ORBIT_AU, y: 0 });
    expect(end.earthAu).toEqual(start.earthAu);
    expect((Math.atan2(start.marsAu.y, start.marsAu.x) * 180) / Math.PI).toBeCloseTo(geo.phaseAngleDeg, 1);
    expect((Math.atan2(end.marsAu.y, end.marsAu.x) * 180) / Math.PI).toBeCloseTo(180, 1);
    expect(Math.sqrt(start.marsAu.x ** 2 + start.marsAu.y ** 2)).toBeCloseTo(MARS_ORBIT_AU, 6);
  });

  it("increases heliocentric distance monotonically across the coast", () => {
    const samples = getMarsTransferSamples(120);
    expect(samples).toHaveLength(120);
    for (let i = 1; i < samples.length; i++) {
      expect(samples[i].auFromSun).toBeGreaterThanOrEqual(samples[i - 1].auFromSun - 1e-9);
      expect(samples[i].met).toBeGreaterThan(samples[i - 1].met);
    }
    expect(samples[samples.length - 1].met).toBeCloseTo(total, 6);
  });

  it("clamps time outside the transfer window", () => {
    const before = marsAtTime(-5000);
    const after = marsAtTime(total * 2);
    expect(before.met).toBe(-5000);
    expect(before.craftAu.x).toBeCloseTo(EARTH_ORBIT_AU, 4);
    expect(after.auFromSun).toBeCloseTo(MARS_ORBIT_AU, 3);
  });
});