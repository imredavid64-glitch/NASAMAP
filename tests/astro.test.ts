import { describe, it, expect } from "vitest";
import {
  julianDate,
  julianCentury,
  sunParams,
  gmstDeg,
  gmstHours,
  solarPosition,
  sunriseSunset,
  dayLengthHours,
  moonPhase,
  tideFactors,
} from "@/lib/astro";

describe("julian date", () => {
  it("J2000 epoch is JD 2451545.0", () => {
    const jd = julianDate(new Date(Date.UTC(2000, 0, 1, 12, 0, 0)));
    expect(jd).toBeCloseTo(2451545.0, 4);
  });

  it("advances 365 days from 2023-01-01 to 2024-01-01", () => {
    const a = julianDate(new Date(Date.UTC(2023, 0, 1)));
    const b = julianDate(new Date(Date.UTC(2024, 0, 1)));
    expect(b - a).toBeCloseTo(365, 3);
  });
});

describe("sun declination & equation of time (NOAA solar reference)", () => {
  it("declination near +23.4° at June solstice 2023", () => {
    const T = julianCentury(julianDate(new Date(Date.UTC(2023, 5, 21, 12))));
    const dec = sunParams(T).declinationDeg;
    expect(dec).toBeGreaterThan(23.2);
    expect(dec).toBeLessThan(23.46);
  });

  it("declination ~0° at March equinox 2024", () => {
    const T = julianCentury(julianDate(new Date(Date.UTC(2024, 2, 20, 6))));
    const dec = sunParams(T).declinationDeg;
    expect(Math.abs(dec)).toBeLessThan(0.4);
  });

  it("equation of time ~ -14 min near Feb 11 (winter minimum)", () => {
    const T = julianCentury(julianDate(new Date(Date.UTC(2023, 1, 11, 12))));
    const eot = sunParams(T).equationOfTimeMin;
    expect(eot).toBeGreaterThan(-17);
    expect(eot).toBeLessThan(-11);
  });

  it("equation of time ~ +16 min near early November (spring/fall maximum)", () => {
    const T = julianCentury(julianDate(new Date(Date.UTC(2023, 10, 3, 12))));
    const eot = sunParams(T).equationOfTimeMin;
    expect(eot).toBeGreaterThan(13);
    expect(eot).toBeLessThan(17.5);
  });
});

describe("GMST", () => {
  it("GMST at J2000 noon ≈ 280.46° ≈ 18.70 h", () => {
    const d = new Date(Date.UTC(2000, 0, 1, 12));
    expect(gmstDeg(d)).toBeGreaterThan(280.3);
    expect(gmstDeg(d)).toBeLessThan(280.6);
    expect(gmstHours(d)).toBeGreaterThan(18.6);
    expect(gmstHours(d)).toBeLessThan(18.75);
  });
});

describe("solar position", () => {
  it("sun near zenith at solar noon on the equator at equinox", () => {
    const d = new Date(Date.UTC(2024, 2, 20, 12, 0, 0)); // equinox noon
    const pos = solarPosition(d, 0, 0);
    expect(pos.elevationDeg).toBeGreaterThan(80); // near-zenith w/ refraction
  });
});

describe("sunrise/sunset day length", () => {
  it("Mexico City ~13h16m on 2023-06-21 (observed local times)", () => {
    const min = dayLengthHours(new Date(Date.UTC(2023, 5, 21)), 19.4326) * 60;
    expect(min).toBeGreaterThan(780);
    expect(min).toBeLessThan(810);
  });

  it("equator ≈ 12h year-round (11:50–12:20)", () => {
    const min = dayLengthHours(new Date(Date.UTC(2023, 5, 21)), 0) * 60;
    expect(min).toBeGreaterThan(710);
    expect(min).toBeLessThan(740);
  });

  it("north polar summer has very long days", () => {
    const h = dayLengthHours(new Date(Date.UTC(2023, 5, 21)), 70);
    expect(h).toBeGreaterThan(23); // polar day region
  });
});

describe("moon phase", () => {
  it("near-new moon at the 2000-01-06 epoch", () => {
    const m = moonPhase(new Date(Date.UTC(2000, 0, 6, 18, 0)));
    expect(m.ageDays).toBeLessThan(1);
    expect(m.illumination).toBeLessThan(0.02);
  });

  it("full moon 2023-02-05 is >97% illuminated", () => {
    const m = moonPhase(new Date(Date.UTC(2023, 1, 5, 18, 30)));
    expect(m.illumination).toBeGreaterThan(0.97);
  });

  it("solar-eclipse new moon 2024-04-08 is nearly dark", () => {
    const m = moonPhase(new Date(Date.UTC(2024, 3, 8, 18, 21)));
    expect(m.illumination).toBeLessThan(0.05);
  });
});

describe("tides", () => {
  it("spring tide near the new moon (2024-04-08 eclipse)", () => {
    expect(tideFactors(new Date(Date.UTC(2024, 3, 8))).springTide).toBe(true);
  });
});