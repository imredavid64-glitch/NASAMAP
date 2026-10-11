/**
 * Interstellar mission physics engine
 * Constant acceleration, laser sail, and fusion propulsion models
 * All constants grounded in published physics literature
 */

import constants from "@/data/constants.json";

export type InterstellarPropulsion =
  | "constant-acceleration"
  | "laser-sail"
  | "fusion-rocket"
  | "antimatter-rocket"
  | "orion-pulse";

export interface InterstellarDesignOptions {
  targetId: string;
  propulsion: InterstellarPropulsion;
  crew: number;
  payloadMassKg: number;
  accelerationG?: number;
  laserPowerGW?: number;
  sailAreaKm2?: number;
  sailArealDensityGcm2?: number;
  fusionExhaustVelocityKmS?: number;
  fusionMassRatio?: number;
  useEnhancedModels?: boolean;
}

export interface InterstellarDesign {
  targetId: string;
  targetName: string;
  distanceLy: number;
  propulsion: InterstellarPropulsion;
  crew: number;
  payloadMassKg: number;
  totalMassKg: number;
  transitTimeYears: number;
  transitTimeShipYears: number;
  maxVelocityC: number;
  accelerationG: number;
  deltaVTotalKmS: number;
  energyRequiredJ: number;
  radiationDoseMSv: number;
  notes: string[];
  propulsionParams: Record<string, number>;
  feasibilityFlags: {
    physicsPlausible: boolean;
    engineeringPlausible: boolean;
    energyFeasible: boolean;
  };
}

export interface ExoplanetTarget {
  id: string;
  name: string;
  hostStar: string;
  distanceLy: number;
  stellarType: string;
  stellarTempK: number;
  stellarMassSun: number;
  habitabilityZone: "conservative" | "optimistic" | "none";
  equilibriumTempK: number | null;
  radiusEarth: number;
  massEarth: number | null;
  orbitalPeriodDays: number;
  semiMajorAxisAU: number;
  notable: string;
}

const LIGHT_YEAR_KM = constants.lightYearKm;
const C_KM_S = constants.speedOfLightKmS;
const G_MS2 = constants.g0;

function constantAccelerationTransit(
  distanceLy: number,
  accelerationG: number,
  payloadMassKg: number
): { transitTimeYears: number; transitTimeShipYears: number; maxVelocityC: number; deltaVKmS: number; totalMassKg: number } {
  const a = accelerationG * G_MS2;
  const d = distanceLy * LIGHT_YEAR_KM * 1000;
  const c = C_KM_S * 1000;

  const halfDist = d / 2;
  const tHalf = Math.sqrt(2 * halfDist / a);
  const vMax = a * tHalf;
  const vMaxC = vMax / c;

  let transitTimeShipYears: number;
  let transitTimeYears: number;
  let deltaVKmS: number;

  if (vMaxC >= 0.99) {
    const rapidity = Math.asinh(vMax / c);
    const properTimeHalf = (c / a) * rapidity;
    transitTimeShipYears = (2 * properTimeHalf) / (365.25 * 24 * 3600);
    transitTimeYears = distanceLy + (c / a) * Math.sinh(rapidity) / (365.25 * 24 * 3600);
    deltaVKmS = vMaxC * 2;
  } else {
    transitTimeShipYears = (2 * tHalf) / (365.25 * 24 * 3600);
    transitTimeYears = (2 * tHalf) / (365.25 * 24 * 3600);
    deltaVKmS = (vMax / 1000) * 2;
  }

  return { transitTimeYears, transitTimeShipYears, maxVelocityC: vMaxC, deltaVKmS, totalMassKg: payloadMassKg };
}

function laserSailTransit(
  distanceLy: number,
  laserPowerGW: number,
  sailAreaKm2: number,
  sailArealDensityGcm2: number,
  payloadMassKg: number
): { transitTimeYears: number; transitTimeShipYears: number; maxVelocityC: number; deltaVKmS: number; totalMassKg: number } {
  const P = laserPowerGW * 1e9;
  const A = sailAreaKm2 * 1e6;
  const sigma = sailArealDensityGcm2 * 0.01;
  const c = C_KM_S * 1000;

  const sailMassKg = sigma * A;
  const totalMassKg = payloadMassKg + sailMassKg;

  const force = (2 * P) / c;
  const a = force / totalMassKg;

  const result = constantAccelerationTransit(distanceLy, a / G_MS2, payloadMassKg);
  return { ...result, totalMassKg };
}

function fusionRocketTransit(
  distanceLy: number,
  exhaustVelocityKmS: number,
  massRatio: number,
  payloadMassKg: number
): { transitTimeYears: number; transitTimeShipYears: number; maxVelocityC: number; deltaVKmS: number; totalMassKg: number } {
  const ve = exhaustVelocityKmS * 1000;
  const c = C_KM_S * 1000;
  const vMax = ve * Math.log(massRatio);
  const vMaxC = vMax / c;

  const totalMassKg = payloadMassKg * massRatio;
  const deltaVKmS = vMax;

  if (vMaxC >= 0.99) {
    const rapidity = Math.asinh(vMax / c);
    const properTime = (c / ve) * rapidity;
    const transitTimeShipYears = properTime / (365.25 * 24 * 3600);
    const transitTimeYears = distanceLy / vMaxC + (c / ve) * Math.sinh(rapidity) / (365.25 * 24 * 3600);
    return { transitTimeYears, transitTimeShipYears, maxVelocityC: vMaxC, deltaVKmS, totalMassKg };
  } else {
    const transitTimeYears = distanceLy / vMaxC;
    return { transitTimeYears, transitTimeShipYears: transitTimeYears, maxVelocityC: vMaxC, deltaVKmS, totalMassKg };
  }
}

function orionPulseTransit(
  distanceLy: number,
  payloadMassKg: number
): { transitTimeYears: number; transitTimeShipYears: number; maxVelocityC: number; deltaVKmS: number; totalMassKg: number } {
  const vMaxC = 0.03;
  const vMax = vMaxC * C_KM_S * 1000;
  const massRatio = 100;
  const totalMassKg = payloadMassKg * massRatio;
  const deltaVKmS = vMax / 1000 * 2;
  const transitTimeYears = distanceLy / vMaxC;

  return { transitTimeYears, transitTimeShipYears: transitTimeYears, maxVelocityC: vMaxC, deltaVKmS, totalMassKg };
}

export function designInterstellarMission(
  options: InterstellarDesignOptions,
  target: ExoplanetTarget
): InterstellarDesign {
  const {
    propulsion,
    crew,
    payloadMassKg,
    accelerationG = 1,
    laserPowerGW = 100,
    sailAreaKm2 = 10,
    sailArealDensityGcm2 = 0.1,
    fusionExhaustVelocityKmS = 10000,
    fusionMassRatio = 10,
    useEnhancedModels = false,
  } = options;

  const distanceLy = target.distanceLy;
  const notes: string[] = [];
  let result: {
    transitTimeYears: number;
    transitTimeShipYears: number;
    maxVelocityC: number;
    deltaVKmS: number;
    totalMassKg: number;
  };

  switch (propulsion) {
    case "constant-acceleration": {
      result = constantAccelerationTransit(distanceLy, accelerationG, payloadMassKg);
      notes.push(`Constant ${accelerationG}g acceleration to midpoint, then deceleration.`);
      notes.push(`Ship time: ${result.transitTimeShipYears.toFixed(1)} years; Earth time: ${result.transitTimeYears.toFixed(1)} years.`);
      notes.push(`Max velocity: ${(result.maxVelocityC * 100).toFixed(1)}% c.`);
      break;
    }
    case "laser-sail": {
      result = laserSailTransit(distanceLy, laserPowerGW, sailAreaKm2, sailArealDensityGcm2, payloadMassKg);
      notes.push(`Photon sail: ${laserPowerGW} GW laser, ${sailAreaKm2} km² sail at ${sailArealDensityGcm2} g/cm².`);
      notes.push(`Sail mass: ${(result.totalMassKg - payloadMassKg).toFixed(0)} kg; total: ${result.totalMassKg.toFixed(0)} kg.`);
      notes.push(`Ship time: ${result.transitTimeShipYears.toFixed(1)} years; Earth time: ${result.transitTimeYears.toFixed(1)} years.`);
      break;
    }
    case "fusion-rocket": {
      result = fusionRocketTransit(distanceLy, fusionExhaustVelocityKmS, fusionMassRatio, payloadMassKg);
      notes.push(`Fusion rocket: exhaust velocity ${fusionExhaustVelocityKmS} km/s, mass ratio ${fusionMassRatio}.`);
      notes.push(`Total wet mass: ${result.totalMassKg.toExponential(2)} kg.`);
      notes.push(`Ship time: ${result.transitTimeShipYears.toFixed(1)} years; Earth time: ${result.transitTimeYears.toFixed(1)} years.`);
      break;
    }
    case "antimatter-rocket": {
      const ve = 0.9 * C_KM_S;
      const massRatio = 5;
      result = fusionRocketTransit(distanceLy, ve, massRatio, payloadMassKg);
      notes.push(`Antimatter-catalyzed fusion: exhaust velocity ~0.9c, mass ratio ${massRatio}.`);
      notes.push(`Total wet mass: ${result.totalMassKg.toExponential(2)} kg.`);
      break;
    }
    case "orion-pulse": {
      result = orionPulseTransit(distanceLy, payloadMassKg);
      notes.push(`Project Orion: nuclear pulse propulsion, ~3% c, mass ratio ~100.`);
      notes.push(`Total wet mass: ${result.totalMassKg.toExponential(2)} kg.`);
      break;
    }
    default:
      throw new Error(`Unknown propulsion: ${propulsion}`);
  }

  const radiationDoseMSv = estimateInterstellarRadiation(
    result.transitTimeShipYears,
    result.maxVelocityC,
    useEnhancedModels
  );

  const energyRequiredJ = estimateEnergyRequired(propulsion, result.deltaVKmS, result.totalMassKg, laserPowerGW);

  const feasibilityFlags = assessFeasibility(propulsion, result.maxVelocityC, result.totalMassKg, result.transitTimeYears, energyRequiredJ);

  return {
    targetId: target.id,
    targetName: target.name,
    distanceLy,
    propulsion,
    crew,
    payloadMassKg,
    totalMassKg: result.totalMassKg,
    transitTimeYears: result.transitTimeYears,
    transitTimeShipYears: result.transitTimeShipYears,
    maxVelocityC: result.maxVelocityC,
    accelerationG,
    deltaVTotalKmS: result.deltaVKmS,
    energyRequiredJ,
    radiationDoseMSv,
    notes,
    propulsionParams: extractPropulsionParams(propulsion, options),
    feasibilityFlags,
  };
}

function estimateInterstellarRadiation(shipYears: number, maxVelocityC: number, enhanced: boolean): number {
  const gcrBase = enhanced ? 0.6 : 0.5;
  const gcrDose = shipYears * 365.25 * gcrBase;

  const speDose = shipYears * 10 * (enhanced ? 1.5 : 1.0);

  const shielding = enhanced ? 0.5 : 1.0;

  return (gcrDose + speDose) * shielding;
}

function estimateEnergyRequired(
  propulsion: InterstellarPropulsion,
  deltaVKmS: number,
  totalMassKg: number,
  laserPowerGW?: number
): number {
  const deltaV = deltaVKmS * 1000;
  const ke = 0.5 * totalMassKg * deltaV * deltaV;

  switch (propulsion) {
    case "laser-sail":
      return (laserPowerGW ?? 100) * 1e9 * (deltaV / (C_KM_S * 1000)) * 365.25 * 24 * 3600;
    case "fusion-rocket":
    case "antimatter-rocket":
      return ke * 10;
    case "constant-acceleration":
      return ke * 5;
    case "orion-pulse":
      return ke * 20;
    default:
      return ke;
  }
}

function assessFeasibility(
  propulsion: InterstellarPropulsion,
  maxVelocityC: number,
  totalMassKg: number,
  transitTimeYears: number,
  energyJ: number
): InterstellarDesign["feasibilityFlags"] {
  const physicsPlausible = maxVelocityC < 0.999;
  const engineeringPlausible =
    (propulsion === "constant-acceleration" && totalMassKg < 1e6) ||
    (propulsion === "laser-sail" && totalMassKg < 1e5) ||
    (propulsion === "fusion-rocket" && totalMassKg < 1e7) ||
    (propulsion === "antimatter-rocket" && totalMassKg < 1e6) ||
    (propulsion === "orion-pulse" && totalMassKg < 1e8);
  const energyFeasible = energyJ < 1e20;

  return { physicsPlausible, engineeringPlausible, energyFeasible };
}

function extractPropulsionParams(propulsion: InterstellarPropulsion, options: InterstellarDesignOptions): Record<string, number> {
  const params: Record<string, number> = {};
  switch (propulsion) {
    case "constant-acceleration":
      params.accelerationG = options.accelerationG ?? 1;
      break;
    case "laser-sail":
      params.laserPowerGW = options.laserPowerGW ?? 100;
      params.sailAreaKm2 = options.sailAreaKm2 ?? 10;
      params.sailArealDensityGcm2 = options.sailArealDensityGcm2 ?? 0.1;
      break;
    case "fusion-rocket":
      params.fusionExhaustVelocityKmS = options.fusionExhaustVelocityKmS ?? 10000;
      params.fusionMassRatio = options.fusionMassRatio ?? 10;
      break;
    case "antimatter-rocket":
      params.exhaustVelocityC = 0.9;
      params.massRatio = 5;
      break;
    case "orion-pulse":
      params.maxVelocityC = 0.03;
      params.massRatio = 100;
      break;
  }
  return params;
}

export { LIGHT_YEAR_KM, C_KM_S };