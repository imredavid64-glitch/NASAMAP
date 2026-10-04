import constants from "@/data/constants.json";
import enginesRaw from "@/data/engines.json";
import tanksRaw from "@/data/tanks.json";
import type { Stage } from "@/lib/rocket-builder-types";

export const G0 = constants.g0;

export interface Engine {
  id: string;
  name: string;
  manufacturer: string;
  cycle: string;
  propellant: string;
  thrustSeaLevelKg: number;
  thrustVacuumKg: number;
  ispSeaLevelS: number;
  ispVacuumS: number;
  massKg: number;
  lengthM: number;
  diameterM: number;
  chamberPressureMPa: number;
  expansionRatio: number;
  throttleRange: string;
  gimbalDeg: number;
  firstFlight: string;
  status: string;
  source: string;
  costPerUnitUsd: number;
  costConfidence: string;
}

export interface Tank {
  id: string;
  name: string;
  type: string;
  propellantMassKg: number;
  dryMassKg: number;
  lengthM: number;
  diameterM: number;
  material: string;
  insulation: string;
  pressurization: string;
  source: string;
  costUsd: number;
  costConfidence: string;
}

export interface StageConfig {
  id: string;
  name: string;
  engines: { engineId: string; count: number }[];
  tankId: string;
  interstageMassKg: number;
  avionicsMassKg: number;
  tpsMassKg: number;
  recoveryMassKg: number;
  isBooster: boolean;
  separationMechanism: "pyrotechnic" | "pneumatic" | "none";
}

export interface RocketDesign {
  id: string;
  name: string;
  description: string;
  stages: StageConfig[];
  createdAt: string;
  updatedAt: string;
  version: number;
}

export const ENGINES = enginesRaw as unknown as Engine[];
export const TANKS = tanksRaw as unknown as Tank[];

export function getEngine(id: string): Engine | undefined {
  return ENGINES.find(e => e.id === id);
}

export function getTank(id: string): Tank | undefined {
  return TANKS.find(t => t.id === id);
}

export function getEnginesByPropellant(propellant: string): Engine[] {
  return ENGINES.filter(e => e.propellant === propellant);
}

export function getTanksByType(type: string): Tank[] {
  return TANKS.filter(t => t.type === type);
}

/** Calculate total engine mass for a stage */
export function calculateEngineMass(stage: StageConfig): number {
  return stage.engines.reduce((sum, e) => {
    const engine = getEngine(e.engineId);
    return sum + (engine ? engine.massKg * e.count : 0);
  }, 0);
}

/** Calculate total engine thrust (sea level and vacuum) */
export function calculateEngineThrust(stage: StageConfig): { seaLevelN: number; vacuumN: number } {
  return stage.engines.reduce((acc, e) => {
    const engine = getEngine(e.engineId);
    if (!engine) return acc;
    return {
      seaLevelN: acc.seaLevelN + engine.thrustSeaLevelKg * G0 * e.count,
      vacuumN: acc.vacuumN + engine.thrustVacuumKg * G0 * e.count,
    };
  }, { seaLevelN: 0, vacuumN: 0 });
}

/** Calculate weighted average Isp for stage */
export function calculateStageIsp(stage: StageConfig): { seaLevelS: number; vacuumS: number } {
  const thrust = calculateEngineThrust(stage);
  if (thrust.seaLevelN === 0 && thrust.vacuumN === 0) return { seaLevelS: 0, vacuumS: 0 };

  const totalMassFlowSL = stage.engines.reduce((sum, e) => {
    const engine = getEngine(e.engineId);
    if (!engine || engine.ispSeaLevelS === 0) return sum;
    return sum + (engine.thrustSeaLevelKg * G0 / engine.ispSeaLevelS) * e.count;
  }, 0);

  const totalMassFlowVac = stage.engines.reduce((sum, e) => {
    const engine = getEngine(e.engineId);
    if (!engine || engine.ispVacuumS === 0) return sum;
    return sum + (engine.thrustVacuumKg * G0 / engine.ispVacuumS) * e.count;
  }, 0);

  return {
    seaLevelS: totalMassFlowSL > 0 ? thrust.seaLevelN / totalMassFlowSL : 0,
    vacuumS: totalMassFlowVac > 0 ? thrust.vacuumN / totalMassFlowVac : 0,
  };
}

/** Calculate stage masses */
export function calculateStageMasses(stage: StageConfig, tank: Tank): {
  wetMassKg: number;
  dryMassKg: number;
  propellantMassKg: number;
} {
  const engineMass = calculateEngineMass(stage);
  const structuralMass = tank.dryMassKg + stage.interstageMassKg + stage.avionicsMassKg + stage.tpsMassKg + stage.recoveryMassKg;
  const dryMassKg = structuralMass + engineMass;
  const propellantMassKg = tank.propellantMassKg;
  const wetMassKg = dryMassKg + propellantMassKg;

  return { wetMassKg, dryMassKg, propellantMassKg };
}

/** Calculate total rocket performance using Tsiolkovsky rocket equation */
export function calculateRocketPerformance(design: RocketDesign): {
  totalHeightM: number;
  maxDiameterM: number;
  totalWetMassKg: number;
  totalDryMassKg: number;
  totalPropellantMassKg: number;
  totalCostUsd: number;
  stages: Array<{
    name: string;
    wetMassKg: number;
    dryMassKg: number;
    propellantMassKg: number;
    massRatio: number;
    deltaVVacKmS: number;
    deltaVSeaLevelKmS: number;
    thrustSeaLevelKN: number;
    thrustVacuumKN: number;
    twrSeaLevel: number;
    ispSeaLevelS: number;
    ispVacuumS: number;
    burnTimeS: number;
  }>;
  payloadLEOKg: number | null;
  payloadTLIKg: number | null;
  payloadGTOKg: number | null;
} {
  const stageResults = design.stages.map((stage, i) => {
    const tank = getTank(stage.tankId)!;
    const masses = calculateStageMasses(stage, tank);
    const thrust = calculateEngineThrust(stage);
    const isp = calculateStageIsp(stage);

    const massRatio = masses.wetMassKg / masses.dryMassKg;
    const deltaVVacKmS = isp.vacuumS > 0 ? (isp.vacuumS * G0 * Math.log(massRatio)) / 1000 : 0;
    const deltaVSeaLevelKmS = isp.seaLevelS > 0 ? (isp.seaLevelS * G0 * Math.log(massRatio)) / 1000 : 0;

    // Burn time
    const totalMassFlow = stage.engines.reduce((sum, e) => {
      const engine = getEngine(e.engineId);
      if (!engine) return sum;
      return sum + (engine.thrustVacuumKg * G0 / engine.ispVacuumS) * e.count;
    }, 0);
    const burnTimeS = totalMassFlow > 0 ? (masses.propellantMassKg / totalMassFlow) : 0;

    // TWR at sea level
    const twrSeaLevel = thrust.seaLevelN > 0 ? thrust.seaLevelN / (masses.wetMassKg * G0) : 0;

    return {
      name: stage.name,
      wetMassKg: masses.wetMassKg,
      dryMassKg: masses.dryMassKg,
      propellantMassKg: masses.propellantMassKg,
      massRatio,
      deltaVVacKmS,
      deltaVSeaLevelKmS,
      thrustSeaLevelKN: thrust.seaLevelN / 1000,
      thrustVacuumKN: thrust.vacuumN / 1000,
      twrSeaLevel,
      ispSeaLevelS: isp.seaLevelS,
      ispVacuumS: isp.vacuumS,
      burnTimeS,
    };
  });

  const totalHeightM = design.stages.reduce((sum, s, i) => {
    const tank = getTank(s.tankId)!;
    const engineLengths = s.engines.map(e => getEngine(e.engineId)?.lengthM ?? 0);
    const maxEngineLength = engineLengths.length > 0 ? Math.max(...engineLengths) : 0;
    return sum + tank.lengthM + maxEngineLength;
  }, 0);

  const maxDiameterM = Math.max(...design.stages.map(s => getTank(s.tankId)!.diameterM));

  const totalWetMassKg = stageResults.reduce((sum, s) => sum + s.wetMassKg, 0);
  const totalDryMassKg = stageResults.reduce((sum, s) => sum + s.dryMassKg, 0);
  const totalPropellantMassKg = stageResults.reduce((sum, s) => sum + s.propellantMassKg, 0);

  const totalCostUsd = design.stages.reduce((sum, s) => {
    const tank = getTank(s.tankId)!;
    const engineCost = s.engines.reduce((esum, e) => {
      const engine = getEngine(e.engineId);
      return esum + (engine ? engine.costPerUnitUsd * e.count : 0);
    }, 0);
    return sum + tank.costUsd + engineCost + s.interstageMassKg * 1000 + s.avionicsMassKg * 5000 + s.tpsMassKg * 2000;
  }, 0);

  // Simple payload estimates based on total delta-V and TWR
  const totalDeltaVVac = stageResults.reduce((sum, s) => sum + s.deltaVVacKmS, 0);
  const firstStageTWR = stageResults[0]?.twrSeaLevel ?? 0;

  let payloadLEOKg: number | null = null;
  let payloadTLIKg: number | null = null;
  let payloadGTOKg: number | null = null;

  if (firstStageTWR > 1.2 && totalDeltaVVac > 9.0) {
    // Very rough estimate: payload fraction ~1-4% of liftoff mass for expendable, 0.5-2% for reusable
    const payloadFraction = design.stages.some(s => s.recoveryMassKg > 0) ? 0.015 : 0.03;
    payloadLEOKg = totalWetMassKg * payloadFraction;

    // TLI payload ~30-40% of LEO for expendable upper stage, 20-30% for reusable
    const tliFraction = design.stages.some(s => s.recoveryMassKg > 0) ? 0.25 : 0.35;
    payloadTLIKg = payloadLEOKg * tliFraction;

    // GTO payload ~40-50% of LEO
    const gtoFraction = 0.45;
    payloadGTOKg = payloadLEOKg * gtoFraction;
  }

  return {
    totalHeightM,
    maxDiameterM,
    totalWetMassKg,
    totalDryMassKg,
    totalPropellantMassKg,
    totalCostUsd,
    stages: stageResults,
    payloadLEOKg,
    payloadTLIKg,
    payloadGTOKg,
  };
}

/** Create a default empty rocket design */
export function createDefaultRocket(name = "Custom Rocket"): RocketDesign {
  return {
    id: `rocket-${Date.now()}`,
    name,
    description: "",
    stages: [{
      id: "stage-1",
      name: "Stage 1",
      engines: [{ engineId: "merlin-1d", count: 9 }],
      tankId: "falcon-9-tank",
      interstageMassKg: 500,
      avionicsMassKg: 200,
      tpsMassKg: 100,
      recoveryMassKg: 0,
      isBooster: false,
      separationMechanism: "pyrotechnic",
    }],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
  };
}

/** Serialize rocket design to JSON string */
export function serializeRocket(design: RocketDesign): string {
  return JSON.stringify(design, null, 2);
}

/** Deserialize rocket design from JSON string */
export function deserializeRocket(json: string): RocketDesign {
  return JSON.parse(json);
}

/** Validate rocket design */
export function validateRocket(design: RocketDesign): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!design.name.trim()) errors.push("Rocket name is required");
  if (design.stages.length === 0) errors.push("At least one stage is required");

  design.stages.forEach((stage, i) => {
    if (!stage.name.trim()) errors.push(`Stage ${i + 1}: name is required`);
    if (stage.engines.length === 0) errors.push(`Stage ${i + 1}: at least one engine required`);
    if (!getTank(stage.tankId)) errors.push(`Stage ${i + 1}: invalid tank`);

    stage.engines.forEach((e, j) => {
      if (!getEngine(e.engineId)) errors.push(`Stage ${i + 1}, engine ${j + 1}: invalid engine`);
      if (e.count < 1) errors.push(`Stage ${i + 1}, engine ${j + 1}: count must be >= 1`);
    });

    // Check propellant compatibility
    const tank = getTank(stage.tankId);
    if (tank) {
      const enginePropellants = stage.engines.map(e => getEngine(e.engineId)?.propellant).filter(Boolean);
      const uniquePropellants = [...new Set(enginePropellants)];
      if (uniquePropellants.length > 1) {
        errors.push(`Stage ${i + 1}: mixed propellants not supported (${uniquePropellants.join(", ")})`);
      }
      if (uniquePropellants[0] && !tank.type.includes(uniquePropellants[0].split("/")[0])) {
        errors.push(`Stage ${i + 1}: engine propellant (${uniquePropellants[0]}) may not match tank type (${tank.type})`);
      }
    }
  });

  return { valid: errors.length === 0, errors };
}