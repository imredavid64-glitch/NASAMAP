import type { RocketDesign, StageConfig } from "@/lib/rocket-builder";

export type { RocketDesign, StageConfig };
export type Stage = StageConfig;

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

export interface StagePerformance {
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
}

export interface RocketPerformance {
  totalHeightM: number;
  maxDiameterM: number;
  totalWetMassKg: number;
  totalDryMassKg: number;
  totalPropellantMassKg: number;
  totalCostUsd: number;
  stages: StagePerformance[];
  payloadLEOKg: number | null;
  payloadTLIKg: number | null;
  payloadGTOKg: number | null;
}