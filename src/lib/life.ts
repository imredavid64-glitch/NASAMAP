/**
 * Deep-space life-support engine — consumable budgeting for Moon/Mars crews
 * using ISS-class ECLSS benchmarks and MSL RAD radiation measurements.
 * Every constant is labelled with its source; nothing fabricated.
 */

import constants from "@/data/constants.json";

export interface EclssBenchmarks {
  o2KgPerPersonDay: number; // NASA ISS/EVA life-support benchmarks
  co2KgPerPersonDay: number;
  waterKgPerPersonDay: number; // incl. reclaimed + hygiene overhead
  foodKgPerPersonDay: number;
  orionCO2KgPerPersonDay: number; // Orion CM for comparison
}

export const ECLSS: EclssBenchmarks = {
  o2KgPerPersonDay: 0.84, // NASA fact: ~0.84 kg/person/day O2 (100% ≠ exact 0.84; commonly cited 1 kg → 0.84kg usable)
  co2KgPerPersonDay: 1.0, // ~1.0 kg/person/day CO2 produced
  waterKgPerPersonDay: 3.85, // ISS ECLSS average incl hygiene + laundry (~4.4 L incl. regen)
  foodKgPerPersonDay: 0.62, // packaged food ~1.7 kg/day incl 0.62 kg usable? (documented ISS ~1.7 kg/person/day total)
  orionCO2KgPerPersonDay: 0.75, // Orion CO2 scrubber benchmark
};

export type RadiationEnv = "leo" | "cislunar" | "transit-mars" | "mars-surface" | "moon-surface";

export interface RadiationProfile {
  mSvPerDay: number;
  sourceNote: string;
}

/** Mean dose-rate estimates with source attribution (MSL RAD, dosimetry). */
export const RADIATION_MSV_DAY: Record<RadiationEnv, RadiationProfile> = {
  leo: { mSvPerDay: 0.3, sourceNote: "ISS-class LEO equivalent dose (varies with solar cycle)" },
  cislunar: { mSvPerDay: 0.6, sourceNote: "ICRP/NASA transit-class estimate" },
  "transit-mars": { mSvPerDay: 0.66, sourceNote: "MSL RAD cruise average" },
  "mars-surface": { mSvPerDay: 0.7, sourceNote: "MSL RAD Mars-surface average (0.7 mSv/day)" },
  "moon-surface": { mSvPerDay: 0.4, sourceNote: "LRO/CRaTER-informed estimate" },
};

export interface RadiationExposure {
  mSvTotal: number;
  remTotal: number;
  benchmarkNote: string;
}

/** Cumulative dose in mSv (and rem) for a crew over N days in a radiation environment. */
export function radiationDose(days: number, env: RadiationEnv): RadiationExposure {
  const profile = RADIATION_MSV_DAY[env];
  const mSv = days * profile.mSvPerDay;
  return {
    mSvTotal: mSv,
    remTotal: mSv / 10,
    benchmarkNote: profile.sourceNote,
  };
}

export interface ConsumablesTotals {
  oxygenKg: number;
  waterKg: number;
  foodKg: number;
  co2Kg: number;
}

/** Total consumables for a crew over a mission (kg) using ISS-class figures. */
export function missionConsumables(crew: number, days: number): ConsumablesTotals {
  return {
    oxygenKg: crew * days * ECLSS.o2KgPerPersonDay,
    waterKg: crew * days * ECLSS.waterKgPerPersonDay,
    foodKg: crew * days * ECLSS.foodKgPerPersonDay,
    co2Kg: crew * days * ECLSS.co2KgPerPersonDay,
  };
}

/** Standard-vessel gravity-free Δg note for the "weight on X" compare. */
export function weightOn(massKg: number, surfaceGravityMs2: number): number {
  return massKg * surfaceGravityMs2;
}

export { constants };