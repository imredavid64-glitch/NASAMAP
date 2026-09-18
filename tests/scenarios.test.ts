import { describe, it, expect } from "vitest";
import { designMission } from "@/lib/mission";
import { scoreMission } from "@/lib/score";
import {
  loadScenarios,
  scenarioById,
  applyScenarioDefaults,
  clampDesignToScenario,
  evaluateScenario,
  validateScenarios,
  type Scenario,
} from "@/lib/scenarios";

const scenarios = loadScenarios();

function run(scenario: Scenario, input: { vehicleId: string; crew: number; surfaceDays: number }) {
  const design = designMission({ destination: scenario.destination, ...input });
  return { design, scorecard: scoreMission(design), result: evaluateScenario(scenario, design, scoreMission(design)) };
}

describe("scenario dataset", () => {
  it("ships a set of playable scenarios", () => {
    expect(scenarios.length).toBeGreaterThanOrEqual(6);
  });

  it("passes its own integrity check", () => {
    const { ok, errors } = validateScenarios();
    expect(errors).toEqual([]);
    expect(ok).toBe(true);
  });

  it("looks scenarios up by id", () => {
    expect(scenarioById("first-boots-on-mars")?.destination).toBe("mars");
    expect(scenarioById("nope")).toBeUndefined();
    expect(scenarioById(undefined)).toBeUndefined();
  });

  it("has unique ids", () => {
    expect(new Set(scenarios.map((s) => s.id)).size).toBe(scenarios.length);
  });
});

describe("scenario defaults and clamping", () => {
  it("seeds every scenario inside its own constraints", () => {
    for (const s of scenarios) {
      const d = applyScenarioDefaults(s);
      expect(s.constraints.allowedVehicleIds).toContain(d.vehicleId);
      expect(d.crew).toBeGreaterThanOrEqual(s.constraints.crew.min);
      expect(d.crew).toBeLessThanOrEqual(s.constraints.crew.max);
      expect(d.surfaceDays).toBeGreaterThanOrEqual(s.constraints.surfaceDays.min);
      expect(d.surfaceDays).toBeLessThanOrEqual(s.constraints.surfaceDays.max);
    }
  });

  it("clamps a wild design back into the scenario", () => {
    const s = scenarioById("artemis-crewed-landing")!;
    const fixed = clampDesignToScenario(s, {
      destination: "mars",
      vehicleId: "starship",
      crew: 99,
      surfaceDays: 999,
    });
    expect(fixed.destination).toBe("moon");
    expect(s.constraints.allowedVehicleIds).toContain(fixed.vehicleId);
    expect(fixed.crew).toBe(s.constraints.crew.max);
    expect(fixed.surfaceDays).toBe(s.constraints.surfaceDays.max);
  });
});

describe("evaluateScenario", () => {
  it("a valid run clears its objectives", () => {
    const s = scenarioById("artemis-crewed-landing")!;
    const { result } = run(s, { vehicleId: "saturn-v", crew: 4, surfaceDays: 12 });
    expect(result.constraintsMet).toBe(true);
    expect(result.objectivesMet).toBe(true);
    expect(result.completed).toBe(true);
    expect(result.stars).toBeGreaterThanOrEqual(2);
  });

  it("grades out-of-constraint designs zero stars", () => {
    const s = scenarioById("artemis-crewed-landing")!;
    const { result } = run(s, { vehicleId: "saturn-v", crew: 6, surfaceDays: 20 });
    expect(result.constraintsMet).toBe(false);
    expect(result.completed).toBe(false);
    expect(result.stars).toBe(0);
    // constraint goals are still reported so the UI can explain the miss
    expect(result.goals.some((g) => g.id === "constraint-crew" && !g.met)).toBe(true);
  });

  it("flags a single failed objective without zeroing the run", () => {
    const synthetic: Scenario = {
      id: "synthetic",
      title: "Synthetic",
      lane: "mission-design",
      difficulty: "Intermediate",
      brief: "test",
      destination: "moon",
      constraints: {
        allowedVehicleIds: ["falcon-9"],
        crew: { min: 1, max: 6 },
        surfaceDays: { min: 0, max: 365 },
      },
      objectives: [{ id: "lift-stack", label: "documented TLI" }],
      parScore: 80,
    };
    // Falcon 9 has no documented TLI payload → lift objective is a warn, not a pass.
    const { result } = run(synthetic, { vehicleId: "falcon-9", crew: 2, surfaceDays: 0 });
    expect(result.constraintsMet).toBe(true);
    expect(result.objectivesMet).toBe(false);
    expect(result.stars).toBe(1);
    expect(result.completed).toBe(false);
  });

  it("accepts a warn when the objective asks only for warn", () => {
    const synthetic: Scenario = {
      id: "synthetic-warn",
      title: "Synthetic warn",
      lane: "mission-design",
      difficulty: "Intermediate",
      brief: "test",
      destination: "moon",
      constraints: {
        allowedVehicleIds: ["falcon-9"],
        crew: { min: 1, max: 6 },
        surfaceDays: { min: 0, max: 365 },
      },
      objectives: [{ id: "lift-stack", label: "undocumented is fine", require: "warn" }],
      parScore: 0,
    };
    const { result } = run(synthetic, { vehicleId: "falcon-9", crew: 2, surfaceDays: 0 });
    expect(result.objectivesMet).toBe(true);
    expect(result.stars).toBe(3);
  });

  it("reserves the third star for beating par", () => {
    const base: Scenario = {
      id: "synthetic-par",
      title: "Par",
      lane: "mission-design",
      difficulty: "Advanced",
      brief: "test",
      destination: "moon",
      constraints: {
        allowedVehicleIds: ["saturn-v"],
        crew: { min: 1, max: 6 },
        surfaceDays: { min: 0, max: 365 },
      },
      objectives: [],
      parScore: 101,
    };
    const hard = run(base, { vehicleId: "saturn-v", crew: 3, surfaceDays: 3 });
    expect(hard.result.stars).toBe(2);

    const easy = run({ ...base, parScore: 0 }, { vehicleId: "saturn-v", crew: 3, surfaceDays: 3 });
    expect(easy.result.stars).toBe(3);
  });

  it("reports an unknown objective as failed rather than throwing", () => {
    const synthetic: Scenario = {
      id: "synthetic-unknown",
      title: "Unknown objective",
      lane: "mission-design",
      difficulty: "Intermediate",
      brief: "test",
      destination: "moon",
      constraints: {
        allowedVehicleIds: ["saturn-v"],
        crew: { min: 1, max: 6 },
        surfaceDays: { min: 0, max: 365 },
      },
      objectives: [{ id: "does-not-exist", label: "ghost" }],
      parScore: 0,
    };
    const { result } = run(synthetic, { vehicleId: "saturn-v", crew: 3, surfaceDays: 3 });
    expect(result.objectivesMet).toBe(false);
    expect(result.goals.find((g) => g.id === "does-not-exist")?.detail).toBe("not evaluated");
  });
});

describe("validateScenarios", () => {
  it("catches unknown vehicles and objectives", () => {
    const bad: Scenario = {
      id: "bad",
      title: "Bad",
      lane: "mission-design",
      difficulty: "Intermediate",
      brief: "test",
      destination: "mars",
      constraints: {
        allowedVehicleIds: ["not-a-rocket"],
        crew: { min: 2, max: 1 },
        surfaceDays: { min: 0, max: 10 },
      },
      objectives: [{ id: "not-an-objective", label: "x" }],
      parScore: 80,
    };
    const { ok, errors } = validateScenarios([bad]);
    expect(ok).toBe(false);
    expect(errors.join(" ")).toMatch(/unknown vehicle/);
    expect(errors.join(" ")).toMatch(/unknown objective/);
    expect(errors.join(" ")).toMatch(/crew range inverted/);
  });
});
