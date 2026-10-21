import { describe, it, expect } from "vitest";
import {
  loadNarrativeScenarios,
  createInitialNarrativeState,
  applyNarrativeChoice,
  getAvailableChoices,
  evaluateNarrativeState,
  narrativeById,
  type NarrativeScenario,
  type NarrativeState,
} from "@/lib/narrative";
import { designMission } from "@/lib/mission";
import { scoreMission } from "@/lib/score";
import type { DesignInput } from "@/lib/design-link";

const scenarios = loadNarrativeScenarios();

function nodeById(scenario: NarrativeScenario, id: string) {
  return scenario.nodes.find((n) => n.id === id);
}

/** Walk every reachable choice path and collect the endings they land on. */
function reachableEndings(scenario: NarrativeScenario): Set<string> {
  const endings = new Set<string>();
  const seen = new Set<string>();
  const stack: NarrativeState[] = [createInitialNarrativeState(scenario)];

  while (stack.length) {
    const state = stack.pop()!;
    const signature = `${state.currentNodeId}|${Array.from(state.flags).sort().join(",")}`;
    if (seen.has(signature)) continue;
    seen.add(signature);

    const node = nodeById(scenario, state.currentNodeId);
    if (!node) continue;
    if (node.isEnding || getAvailableChoices(scenario, state).length === 0) {
      endings.add(node.id);
      continue;
    }
    for (const choice of getAvailableChoices(scenario, state)) {
      stack.push(applyNarrativeChoice(scenario, state, choice.id));
    }
  }

  return endings;
}

function play(scenario: NarrativeScenario, choiceIds: string[]): NarrativeState {
  return choiceIds.reduce(
    (state, choiceId) => applyNarrativeChoice(scenario, state, choiceId),
    createInitialNarrativeState(scenario),
  );
}

function evaluate(scenario: NarrativeScenario, state: NarrativeState) {
  const design = designMission(state.design as DesignInput);
  return evaluateNarrativeState(scenario, state, scoreMission(design));
}

describe("narrative scenarios", () => {
  it("ships at least three playable stories", () => {
    expect(scenarios.length).toBeGreaterThanOrEqual(3);
  });

  it("only points choices at nodes that exist", () => {
    for (const scenario of scenarios) {
      const ids = new Set(scenario.nodes.map((n) => n.id));
      for (const node of scenario.nodes) {
        for (const choice of node.choices) {
          if (choice.unlocks) {
            expect(ids.has(choice.unlocks), `${scenario.id}/${node.id}/${choice.id} -> ${choice.unlocks}`).toBe(true);
          }
          for (const rule of choice.unlockRules ?? []) {
            expect(ids.has(rule.node), `${scenario.id}/${node.id}/${choice.id} rule -> ${rule.node}`).toBe(true);
          }
        }
      }
    }
  });

  it("can reach every ending through some sequence of choices", () => {
    for (const scenario of scenarios) {
      const endings = scenario.nodes.filter((n) => n.isEnding).map((n) => n.id);
      const reached = reachableEndings(scenario);

      expect(endings.length).toBeGreaterThan(0);
      for (const ending of endings) {
        expect(reached.has(ending), `${scenario.id}: ${ending} is unreachable`).toBe(true);
      }
    }
  });

  it("routes each crop to its own water crisis, then to the harvest", () => {
    const farmer = narrativeById("first-farmer-mars")!;

    expect(play(farmer, ["potatoes"]).currentNodeId).toBe("water_crisis");
    expect(play(farmer, ["soybeans"]).currentNodeId).toBe("water_crisis_soy");
    expect(play(farmer, ["mixed"]).currentNodeId).toBe("water_crisis_mixed");

    expect(play(farmer, ["soybeans", "repair_wpa_soy"]).currentNodeId).toBe("harvest");
    expect(play(farmer, ["mixed", "ice_mining_mixed"]).currentNodeId).toBe("harvest");
    expect(play(farmer, ["potatoes", "mine_ice"]).currentNodeId).toBe("harvest");
  });

  it("lets an earlier decision override the final branch", () => {
    const geologist = narrativeById("artemis-geologist")!;

    // Sticking to the plan leaves the thorium anomaly for the next crew, no
    // matter which samples are loaded at the end.
    expect(play(geologist, ["rim_traverse", "stick_to_plan", "keep_kreep"]).currentNodeId).toBe(
      "ending_conservative",
    );

    expect(play(geologist, ["rim_traverse", "investigate_anomaly", "keep_kreep"]).currentNodeId).toBe(
      "ending_science_star",
    );
    expect(play(geologist, ["rim_traverse", "investigate_anomaly", "balanced"]).currentNodeId).toBe(
      "ending_solid",
    );
  });

  it("turns the risky NASA patch into a delayed Gateway", () => {
    const gateway = narrativeById("gateway-assembly-lead")!;

    expect(
      play(gateway, ["ppe_first", "nasa_patch", "both_minimal", "maintenance_first"]).currentNodeId,
    ).toBe("ending_gateway_delayed");

    expect(
      play(gateway, ["ppe_first", "esa_patch", "both_minimal", "maintenance_first"]).currentNodeId,
    ).toBe("ending_gateway_operational");
  });
});

describe("narrative scoring", () => {
  it("awards no stars until the story is finished", () => {
    const farmer = narrativeById("first-farmer-mars")!;
    const opening = evaluate(farmer, createInitialNarrativeState(farmer));
    expect(opening.stars).toBe(0);
    expect(opening.endingType).toBeNull();
  });

  it("caps stars for a partial or failed ending", () => {
    const farmer = narrativeById("first-farmer-mars")!;

    const failure = evaluate(farmer, play(farmer, ["potatoes", "repair_wpa", "harvest_failure"]));
    expect(failure.endingType).toBe("failure");
    expect(failure.stars).toBeLessThanOrEqual(1);

    const partial = evaluate(farmer, play(farmer, ["potatoes", "repair_wpa", "harvest_partial"]));
    expect(partial.endingType).toBe("partial");
    expect(partial.stars).toBeLessThanOrEqual(2);
  });
});
