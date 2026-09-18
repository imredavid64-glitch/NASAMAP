import { describe, it, expect } from "vitest";
import { designMission } from "@/lib/mission";
import { scoreMission, RADIATION_LIMIT_MSV, RADIATION_WAIVER_MSV, DV_REFERENCE_KM_S } from "@/lib/score";

const tuned = () => designMission({ destination: "mars", vehicleId: "starship", crew: 4, surfaceDays: 30 });

describe("mission scoring", () => {
  it("judges eight weighted objectives totalling 100 points", () => {
    const card = scoreMission(tuned());
    expect(card.objectives).toHaveLength(8);
    expect(card.maxScore).toBe(100);
    expect(card.objectives.reduce((s, o) => s + o.weight, 0)).toBe(100);
    expect(card.total).toBe(8);
    expect(card.objectives.map((o) => o.id)).toContain("budget");
  });

  it("keeps the score in range and picks a valid grade", () => {
    for (const dest of ["moon", "mars"] as const) {
      const card = scoreMission(designMission({ destination: dest, vehicleId: "starship", crew: 4, surfaceDays: 90 }));
      expect(card.score).toBeGreaterThanOrEqual(0);
      expect(card.score).toBeLessThanOrEqual(100);
      expect(["S", "A", "B", "C", "D"]).toContain(card.grade);
    }
  });

  it("maps status to points: full, half, zero", () => {
    const card = scoreMission(designMission({ destination: "mars", vehicleId: "starship", crew: 4, surfaceDays: 900 }));
    for (const o of card.objectives) {
      const expected = o.status === "pass" ? o.weight : o.status === "warn" ? o.weight / 2 : 0;
      expect(o.earned).toBe(expected);
    }
  });

  it("awards a flight-ready grade to a well-tuned Mars mission", () => {
    const card = scoreMission(tuned());
    expect(card.met).toBe(card.total);
    expect(card.score).toBe(100);
    expect(card.grade).toBe("S");
  });

  it("fails the radiation and duration objectives on an over-long Mars stay", () => {
    const card = scoreMission(designMission({ destination: "mars", vehicleId: "starship", crew: 4, surfaceDays: 900 }));
    const rad = card.objectives.find((o) => o.id === "radiation");
    const dur = card.objectives.find((o) => o.id === "duration");
    expect(rad?.status).toBe("fail");
    expect(dur?.status).toBe("fail");
    expect(card.score).toBeLessThan(100);
    expect(card.met).toBeLessThan(card.total);
  });

  it("caps the grade when translunar capability is undocumented", () => {
    const card = scoreMission(designMission({ destination: "moon", vehicleId: "falcon-9", crew: 2, surfaceDays: 7 }));
    const lift = card.objectives.find((o) => o.id === "lift-stack");
    expect(lift?.status).toBe("warn");
    expect(card.capped).toBe(true);
    expect(card.grade).not.toBe("S");
    expect(card.capReason).toMatch(/undocumented/i);
  });

  it("never awards a flight-ready grade when the stack will not lift", () => {
    const card = scoreMission(
      designMission({ destination: "mars", vehicleId: "falcon-9", crew: 6, surfaceDays: 365 }),
    );
    if (card.objectives.find((o) => o.id === "lift-stack")?.status === "fail") {
      expect(card.grade).toBe("D");
      expect(card.capped).toBe(true);
    }
  });

  it("is deterministic and cites a reference for every objective", () => {
    const a = scoreMission(tuned());
    const b = scoreMission(tuned());
    expect(a).toEqual(b);
    for (const o of a.objectives) {
      expect(o.reference.length).toBeGreaterThan(8);
      expect(o.actual.length).toBeGreaterThan(0);
      expect(o.target.length).toBeGreaterThan(0);
      expect(o.detail.length).toBeGreaterThan(10);
    }
  });

  it("uses the grounded NASA career limit", () => {
    expect(RADIATION_LIMIT_MSV).toBe(600);
    expect(RADIATION_WAIVER_MSV).toBeGreaterThan(RADIATION_LIMIT_MSV);
    expect(DV_REFERENCE_KM_S.mars).toBeGreaterThan(DV_REFERENCE_KM_S.moon);
  });

  it("defaults to expert mode with the same score across modes", () => {
    const expert = scoreMission(tuned());
    const beginner = scoreMission(tuned(), { mode: "beginner" });
    expect(expert.mode).toBe("expert");
    expect(beginner.mode).toBe("beginner");
    expect(beginner.score).toBe(expert.score);
    expect(beginner.objectives.map((o) => o.status)).toEqual(expert.objectives.map((o) => o.status));
  });

  it("adds plain-language coach hints only in beginner mode", () => {
    const expert = scoreMission(tuned());
    const beginner = scoreMission(tuned(), { mode: "beginner" });
    expect(expert.objectives.every((o) => o.coach === undefined)).toBe(true);
    expect(beginner.objectives.every((o) => typeof o.coach === "string" && o.coach.length > 10)).toBe(true);
  });

  it("uses a gentler grade curve in beginner mode", () => {
    const expert = scoreMission(
      designMission({ destination: "mars", vehicleId: "sls-block-1", crew: 4, surfaceDays: 150 }),
    );
    const beginner = scoreMission(
      designMission({ destination: "mars", vehicleId: "sls-block-1", crew: 4, surfaceDays: 150 }),
      { mode: "beginner" },
    );
    expect(expert.grade).toBe("A");
    expect(beginner.grade).toBe("S");
    expect(beginner.score).toBe(expert.score);
  });

  it("keeps feasibility caps in beginner mode", () => {
    const beginner = scoreMission(
      designMission({ destination: "moon", vehicleId: "falcon-9", crew: 2, surfaceDays: 7 }),
      { mode: "beginner" },
    );
    expect(beginner.capped).toBe(true);
    expect(beginner.grade).toBe("B");
  });
});
