import { describe, it, expect } from "vitest";
import { buildSkyCard, insolationIndex, nearestShower, PERSONAS } from "@/lib/commons";

const date = new Date("2026-08-12T12:00:00Z"); // Perseids peak, northern summer
const opts = { date, latDeg: 39.74, lonDeg: -104.99 };

describe("sky cards: computed persona data", () => {
  it("farmer gets photoperiod, sun, frost and a crop hint", () => {
    const card = buildSkyCard({ personaId: "farmer", ...opts });
    const ids = card.signals.map((s) => s.id);
    expect(ids).toContain("dayLength");
    expect(ids).toContain("frostWindow");
    expect(card.cropHint).toBeDefined();
    expect(card.rating).not.toBeNull();
    expect(card.rating!).toBeGreaterThanOrEqual(0);
    expect(card.rating!).toBeLessThanOrEqual(100);
  });

  it("fisher card is built from moon, tide and solunar signals", () => {
    const card = buildSkyCard({ personaId: "fisher", ...opts });
    expect(card.signals.map((s) => s.id).sort()).toEqual(["moonPhase", "solunar", "tides"]);
    expect(card.signals.every((s) => s.status === "computed")).toBe(true);
    expect(card.rating!).toBeGreaterThanOrEqual(0);
  });

  it("marks live-only personas honestly instead of fabricating numbers", () => {
    const card = buildSkyCard({ personaId: "ham-radio", ...opts });
    expect(card.rating).toBeNull();
    expect(card.signals.every((s) => s.status === "live")).toBe(true);
    expect(card.honesty).toMatch(/live feed/i);
  });

  it("hiker ties daylight, frost and showers into one trail-day rating", () => {
    const card = buildSkyCard({ personaId: "hiker", ...opts });
    expect(card.signals.map((s) => s.id).sort()).toEqual([
      "dayLength",
      "frostWindow",
      "meteorShowers",
      "sunPath",
      "temperature",
    ]);
    expect(card.rating!).toBeGreaterThanOrEqual(0);
    expect(card.rating!).toBeLessThanOrEqual(100);
    expect(card.ratingLabel).toBe("trail-day suitability");
  });
});

describe("sky cards: rating behaviour", () => {
  it("astrophotographer prefers a dark (new) moon", () => {
    const newMoon = buildSkyCard({ personaId: "astrophotographer", date: new Date("2026-08-12"), latDeg: 0, lonDeg: 0 });
    const fullMoon = buildSkyCard({ personaId: "astrophotographer", date: new Date("2026-08-28"), latDeg: 0, lonDeg: 0 });
    expect(newMoon.rating!).toBeGreaterThan(fullMoon.rating!);
  });

  it("unknown personas fall back to the first catalogue entry", () => {
    const card = buildSkyCard({ personaId: "astronaut", ...opts });
    expect(card.persona.id).toBe(PERSONAS[0].id);
  });
});

describe("solar geometry helpers", () => {
  it("insolation index is higher in local summer than winter", () => {
    const summer = insolationIndex(new Date("2026-06-21"), 40);
    const winter = insolationIndex(new Date("2026-12-21"), 40);
    expect(summer).toBeGreaterThan(winter);
  });

  it("nearest shower finds the Perseids in mid-August", () => {
    const near = nearestShower(new Date("2026-08-12T00:00:00Z"));
    expect(near?.shower.name).toBe("Perseids");
    expect(near!.daysTo).toBeLessThanOrEqual(1);
  });

  it("handles polar day without throwing", () => {
    const card = buildSkyCard({ personaId: "student", date: new Date("2026-06-21"), latDeg: 80, lonDeg: 0 });
    const dayLength = card.signals.find((s) => s.id === "dayLength");
    expect(dayLength).toBeDefined();
    expect(card.rating).toBe(100);
  });
});