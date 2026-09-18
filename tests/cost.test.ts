import { describe, it, expect } from "vitest";
import { designMission } from "@/lib/mission";
import { estimateMissionCost, formatUsd, costClass, CREW_RATE_USD_PER_PERSON_DAY, SURFACE_RATE_USD_PER_PERSON_DAY } from "@/lib/cost";

describe("estimateMissionCost", () => {
  it("prices a documented Falcon 9 Moon mission with the published launch price", () => {
    const design = designMission({ destination: "moon", vehicleId: "falcon-9", crew: 3, surfaceDays: 7 });
    const cost = estimateMissionCost(design);
    const launch = cost.lines.find((l) => l.label.includes("Falcon 9 launch"));
    expect(launch?.valueUsd).toBe(67_000_000);
    expect(launch?.confidence).toBe("documented");
    expect(cost.bestConfidence).toBe("documented");
  });

  it("tags SLS as an estimate with the OIG-reported price", () => {
    const design = designMission({ destination: "moon", vehicleId: "sls-block-1", crew: 3, surfaceDays: 7 });
    const cost = estimateMissionCost(design);
    const launch = cost.lines.find((l) => l.label.includes("SLS Block 1 launch"));
    expect(launch?.valueUsd).toBe(2_200_000_000);
    expect(launch?.confidence).toBe("estimate");
  });

  it("adds crew and surface line items, and sums the total", () => {
    const design = designMission({ destination: "mars", vehicleId: "starship", crew: 4, surfaceDays: 90 });
    const cost = estimateMissionCost(design);
    expect(cost.lines.length).toBe(3);
    const crewOps = design.crew * design.totalDays * CREW_RATE_USD_PER_PERSON_DAY;
    expect(cost.lines[1].valueUsd).toBe(Math.round(crewOps));
    expect(cost.lines[2].valueUsd).toBe(Math.round(4 * 90 * SURFACE_RATE_USD_PER_PERSON_DAY));
    expect(cost.totalUsd).toBe(cost.lines.reduce((s, l) => s + l.valueUsd, 0));
  });

  it("is deterministic for the same design", () => {
    const a = designMission({ destination: "mars", vehicleId: "starship", crew: 4, surfaceDays: 90 });
    const b = designMission({ destination: "mars", vehicleId: "starship", crew: 4, surfaceDays: 90 });
    expect(estimateMissionCost(a)).toEqual(estimateMissionCost(b));
  });
});

describe("formatUsd", () => {
  it("renders billions, millions, and thousands", () => {
    expect(formatUsd(2_200_000_000)).toBe("$2.20 B");
    expect(formatUsd(67_000_000)).toBe("$67.0 M");
    expect(formatUsd(900_000)).toBe("$900 K");
    expect(formatUsd(1_200)).toBe("$1 K");
  });
});

describe("costClass", () => {
  it("classifies by magnitude", () => {
    expect(costClass(2_200_000_000)).toBe("flagship");
    expect(costClass(150_000_000)).toBe("commercial");
    expect(costClass(20_000_000)).toBe("research");
  });
});