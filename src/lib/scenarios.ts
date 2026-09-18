/**
 * Scenario layer — turns the free-play mission designer into a game.
 *
 * Each scenario pairs a brief with hard constraints (vehicle, crew, surface
 * time, radiation, duration) and a set of objectives that reference the scoring
 * engine's objective ids. A run is graded 0–3 stars. Pure and unit-tested in
 * tests/scenarios.test.ts.
 */

import scenariosRaw from "@/data/scenarios.json";
import launchVehicles from "@/data/launch-vehicles.json";
import { type DesignInput, type Destination } from "@/lib/design-link";
import { type MissionDesign } from "@/lib/mission";
import { type ObjectiveStatus, type Scorecard, SCORE_OBJECTIVE_IDS } from "@/lib/score";

export type ScenarioDifficulty = "Beginner/Youth" | "Intermediate" | "Advanced";

export interface ScenarioConstraints {
  allowedVehicleIds: string[];
  crew: { min: number; max: number };
  surfaceDays: { min: number; max: number };
  maxRadiationMsv?: number;
  maxTotalDays?: number;
}

export interface ScenarioObjective {
  id: string;
  label: string;
  /** Defaults to "pass". */
  require?: "pass" | "warn";
}

export interface Scenario {
  id: string;
  title: string;
  lane: string;
  difficulty: ScenarioDifficulty;
  brief: string;
  destination: Destination;
  constraints: ScenarioConstraints;
  objectives: ScenarioObjective[];
  parScore: number;
}

interface ScenarioFile {
  version: number;
  scenarios: Scenario[];
}

const DIFFICULTIES: ScenarioDifficulty[] = ["Beginner/Youth", "Intermediate", "Advanced"];

export function loadScenarios(): Scenario[] {
  return (scenariosRaw as unknown as ScenarioFile).scenarios;
}

export function scenarioById(id: string | undefined): Scenario | undefined {
  if (!id) return undefined;
  return loadScenarios().find((s) => s.id === id);
}

/** The scenario that follows this one in catalogue order (for "next mission"). */
export function nextScenarioId(id: string): string | undefined {
  const all = loadScenarios();
  const i = all.findIndex((s) => s.id === id);
  return i >= 0 && i + 1 < all.length ? all[i + 1].id : undefined;
}

const STATUS_RANK: Record<ObjectiveStatus, number> = { fail: 0, warn: 1, pass: 2 };

function statusMeets(status: ObjectiveStatus, require: "pass" | "warn"): boolean {
  return STATUS_RANK[status] >= STATUS_RANK[require];
}

export interface GoalResult {
  id: string;
  label: string;
  met: boolean;
  detail: string;
}

export interface ScenarioResult {
  goals: GoalResult[];
  constraintsMet: boolean;
  objectivesMet: boolean;
  stars: 0 | 1 | 2 | 3;
  /** Cleared the constraints and every required objective. */
  completed: boolean;
}

function rangeDetail(value: number, min: number, max: number): string {
  return `${value} (allowed ${min}–${max})`;
}

export function evaluateScenario(
  scenario: Scenario,
  design: MissionDesign,
  scorecard: Scorecard,
): ScenarioResult {
  const c = scenario.constraints;
  const constraintGoals: GoalResult[] = [
    {
      id: "constraint-vehicle",
      label: `Fly a documented vehicle`,
      met: c.allowedVehicleIds.includes(design.vehicle.id),
      detail: design.vehicle.name,
    },
    {
      id: "constraint-crew",
      label: `Crew size ${c.crew.min}–${c.crew.max}`,
      met: design.crew >= c.crew.min && design.crew <= c.crew.max,
      detail: rangeDetail(design.crew, c.crew.min, c.crew.max),
    },
    {
      id: "constraint-surface",
      label: `Surface stay ${c.surfaceDays.min}–${c.surfaceDays.max} days`,
      met: design.surfaceDays >= c.surfaceDays.min && design.surfaceDays <= c.surfaceDays.max,
      detail: rangeDetail(design.surfaceDays, c.surfaceDays.min, c.surfaceDays.max),
    },
  ];

  if (c.maxRadiationMsv != null) {
    constraintGoals.push({
      id: "constraint-radiation",
      label: `Crew dose ≤ ${c.maxRadiationMsv} mSv`,
      met: design.radiationMsvTotal <= c.maxRadiationMsv,
      detail: `${design.radiationMsvTotal.toFixed(0)} mSv`,
    });
  }
  if (c.maxTotalDays != null) {
    constraintGoals.push({
      id: "constraint-duration",
      label: `Mission ≤ ${c.maxTotalDays} days`,
      met: design.totalDays <= c.maxTotalDays,
      detail: `${design.totalDays.toFixed(0)} days`,
    });
  }

  const constraintsMet = constraintGoals.every((g) => g.met);

  const objectiveGoals: GoalResult[] = scenario.objectives.map((o) => {
    const scored = scorecard.objectives.find((x) => x.id === o.id);
    const require = o.require ?? "pass";
    const status: ObjectiveStatus = scored?.status ?? "fail";
    return {
      id: o.id,
      label: o.label,
      met: statusMeets(status, require),
      detail: scored ? scored.actual : "not evaluated",
    };
  });

  const objectivesMet = objectiveGoals.every((g) => g.met);

  let stars: ScenarioResult["stars"];
  if (!constraintsMet) stars = 0;
  else if (!objectivesMet) stars = 1;
  else if (scorecard.score >= scenario.parScore) stars = 3;
  else stars = 2;

  return {
    goals: [...constraintGoals, ...objectiveGoals],
    constraintsMet,
    objectivesMet,
    stars,
    completed: constraintsMet && objectivesMet,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}

/** Seed design inputs from a scenario, always inside its constraints. */
export function applyScenarioDefaults(scenario: Scenario): DesignInput {
  const c = scenario.constraints;
  return {
    destination: scenario.destination,
    vehicleId: c.allowedVehicleIds[0],
    crew: clamp(4, c.crew.min, c.crew.max),
    surfaceDays: clamp(30, c.surfaceDays.min, c.surfaceDays.max),
  };
}

/** Keep a design inside a scenario's hard constraints (used as the player edits). */
export function clampDesignToScenario(scenario: Scenario, design: DesignInput): DesignInput {
  const c = scenario.constraints;
  return {
    destination: scenario.destination,
    vehicleId: c.allowedVehicleIds.includes(design.vehicleId) ? design.vehicleId : c.allowedVehicleIds[0],
    crew: clamp(design.crew, c.crew.min, c.crew.max),
    surfaceDays: clamp(design.surfaceDays, c.surfaceDays.min, c.surfaceDays.max),
  };
}

export interface ScenarioValidation {
  ok: boolean;
  errors: string[];
}

/**
 * Integrity check for the scenario dataset: unique ids, real vehicle ids,
 * objectives that exist in the scoring engine, and sane constraint ranges.
 */
export function validateScenarios(
  scenarios: Scenario[] = loadScenarios(),
  vehicleIds: string[] = (launchVehicles as { id: string }[]).map((v) => v.id),
  objectiveIds: string[] = SCORE_OBJECTIVE_IDS,
): ScenarioValidation {
  const errors: string[] = [];
  const seen = new Set<string>();

  for (const s of scenarios) {
    if (seen.has(s.id)) errors.push(`duplicate scenario id: ${s.id}`);
    seen.add(s.id);
    if (!s.title || !s.brief) errors.push(`${s.id}: missing title or brief`);
    if (!DIFFICULTIES.includes(s.difficulty)) errors.push(`${s.id}: unknown difficulty ${s.difficulty}`);
    if (s.parScore < 0 || s.parScore > 100) errors.push(`${s.id}: parScore out of range`);

    const c = s.constraints;
    if (c.allowedVehicleIds.length === 0) errors.push(`${s.id}: no allowed vehicles`);
    for (const v of c.allowedVehicleIds) {
      if (!vehicleIds.includes(v)) errors.push(`${s.id}: unknown vehicle ${v}`);
    }
    if (c.crew.min > c.crew.max) errors.push(`${s.id}: crew range inverted`);
    if (c.surfaceDays.min > c.surfaceDays.max) errors.push(`${s.id}: surface range inverted`);
    if (s.objectives.length === 0) errors.push(`${s.id}: no objectives`);
    for (const o of s.objectives) {
      if (!objectiveIds.includes(o.id)) errors.push(`${s.id}: unknown objective ${o.id}`);
    }
  }

  return { ok: errors.length === 0, errors };
}
