/**
 * Narrative Scenarios — character-driven missions with branching choices
 * that feed into the mission design engine. Each choice modifies design
 * parameters and unlocks new narrative beats.
 */

import { type DesignInput, type Destination } from "@/lib/design-link";
import { type MissionDesign } from "@/lib/mission";
import { type Scorecard } from "@/lib/score";
import narrativesRaw from "@/data/narrative-scenarios.json";

export type NarrativeDifficulty = "Beginner" | "Intermediate" | "Advanced";

export interface NarrativeChoice {
  id: string;
  text: string;
  /** Modifies the design when this choice is made. */
  designDelta?: Partial<DesignInput>;
  /** Narrative consequence text shown after selection. */
  consequence: string;
  /** Optional: unlocks a new node or sets a flag. */
  unlocks?: string;
  /** Optional: sets a flag for later reference. */
  setsFlag?: string;
}

export interface NarrativeNode {
  id: string;
  /** The narrative text for this beat. */
  narrative: string;
  /** Character speaking or scene description. */
  speaker?: string;
  /** Choices available at this node. */
  choices: NarrativeChoice[];
  /** Optional: required flag to unlock this node. */
  requiresFlag?: string;
  /** Optional: this is an ending node. */
  isEnding?: boolean;
  /** Optional: ending type for scoring. */
  endingType?: "success" | "partial" | "failure";
}

export interface NarrativeScenario {
  id: string;
  title: string;
  /** Character archetype for this narrative. */
  persona: "farmer" | "geologist" | "commander";
  difficulty: NarrativeDifficulty;
  /** Starting design parameters. */
  initialDesign: DesignInput;
  /** The narrative graph - nodes connected by choices. */
  nodes: NarrativeNode[];
  /** Starting node ID. */
  startNode: string;
  /** Target score for 3 stars (par). */
  parScore: number;
  /** Challenge lane this maps to. */
  lane: string;
  /** Brief for the scenario selection screen. */
  brief: string;
}

export interface NarrativeState {
  currentNodeId: string;
  design: DesignInput;
  scorecard?: Scorecard;
  visitedNodes: string[];
  flags: Set<string>;
  history: Array<{
    nodeId: string;
    choiceId: string;
    designBefore: DesignInput;
    designAfter: DesignInput;
  }>;
}

/** Evaluate the current narrative state against the mission engine. */
export function evaluateNarrativeState(
  scenario: NarrativeScenario,
  state: NarrativeState,
  scorecard: Scorecard,
): {
  score: number;
  grade: Scorecard["grade"];
  stars: 0 | 1 | 2 | 3;
  completed: boolean;
  narrativeComplete: boolean;
  endingType: "success" | "partial" | "failure" | null;
} {
  const isEnding = scenario.nodes.find((n) => n.id === state.currentNodeId)?.isEnding ?? false;
  const endingType = scenario.nodes.find((n) => n.id === state.currentNodeId)?.endingType ?? null;

  // Base score from the scorecard
  const baseScore = scorecard.score;

  // Narrative completion bonus
  let narrativeBonus = 0;
  if (isEnding) {
    if (endingType === "success") narrativeBonus = 10;
    else if (endingType === "partial") narrativeBonus = 5;
    else narrativeBonus = -10;
  }

  const finalScore = Math.min(100, Math.max(0, baseScore + narrativeBonus));

  // Determine stars
  let stars: 0 | 1 | 2 | 3 = 0;
  if (finalScore >= scenario.parScore) stars = 3;
  else if (finalScore >= scenario.parScore - 15) stars = 2;
  else if (finalScore >= scenario.parScore - 30) stars = 1;

  return {
    score: finalScore,
    grade: scorecard.grade,
    stars,
    completed: isEnding && (endingType === "success" || endingType === "partial"),
    narrativeComplete: isEnding,
    endingType,
  };
}

/** Create initial narrative state from a scenario. */
export function createInitialNarrativeState(scenario: NarrativeScenario): NarrativeState {
  return {
    currentNodeId: scenario.startNode,
    design: { ...scenario.initialDesign },
    visitedNodes: [scenario.startNode],
    flags: new Set(),
    history: [],
  };
}

/** Apply a choice and advance the narrative. */
export function applyNarrativeChoice(
  scenario: NarrativeScenario,
  state: NarrativeState,
  choiceId: string,
): NarrativeState {
  const currentNode = scenario.nodes.find((n) => n.id === state.currentNodeId);
  if (!currentNode) throw new Error(`Node not found: ${state.currentNodeId}`);

  const choice = currentNode.choices.find((c) => c.id === choiceId);
  if (!choice) throw new Error(`Choice not found: ${choiceId}`);

  const designBefore = { ...state.design };
  const designAfter = { ...state.design, ...choice.designDelta };

  // Check if choice unlocks a new node
  const newFlags = new Set(state.flags);
  if (choice.setsFlag) newFlags.add(choice.setsFlag);

  // Determine next node
  let nextNodeId = choice.unlocks ?? scenario.nodes.find((n) => n.requiresFlag === choice.setsFlag)?.id;

  // If no explicit unlock, find next node that doesn't require a flag or whose flag we have
  if (!nextNodeId) {
    const availableNodes = scenario.nodes.filter(
      (n) => !n.requiresFlag || newFlags.has(n.requiresFlag) || n.id === currentNode.id,
    );
    const currentIndex = availableNodes.findIndex((n) => n.id === state.currentNodeId);
    if (currentIndex + 1 < availableNodes.length) {
      nextNodeId = availableNodes[currentIndex + 1].id;
    }
  }

  // If still no next node, stay at current (ending)
  if (!nextNodeId) nextNodeId = state.currentNodeId;

  return {
    currentNodeId: nextNodeId,
    design: designAfter,
    visitedNodes: [...state.visitedNodes, nextNodeId],
    flags: newFlags,
    history: [
      ...state.history,
      { nodeId: state.currentNodeId, choiceId, designBefore, designAfter },
    ],
  };
}

/** Get available choices for the current node, filtering by flags. */
export function getAvailableChoices(
  scenario: NarrativeScenario,
  state: NarrativeState,
): NarrativeChoice[] {
  const currentNode = scenario.nodes.find((n) => n.id === state.currentNodeId);
  if (!currentNode) return [];

  return currentNode.choices.filter((choice) => {
    // Always show choices that don't require flags
    if (!choice.designDelta?.vehicleId) return true;
    // Vehicle choices are always available
    return true;
  });
}

interface NarrativeFile {
  version: number;
  scenarios: NarrativeScenario[];
}

export function loadNarrativeScenarios(): NarrativeScenario[] {
  return (narrativesRaw as unknown as NarrativeFile).scenarios;
}

export function narrativeById(id: string | undefined): NarrativeScenario | undefined {
  if (!id) return undefined;
  return loadNarrativeScenarios().find((s) => s.id === id);
}