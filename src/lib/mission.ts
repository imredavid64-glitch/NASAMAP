/**
 * Mission design engine — composes the rocket, comm, and life-support cores
 * into one readable mission design. Pure and unit-tested in tests/mission.test.ts.
 */

import { hohmannTransfer } from "@/lib/rocket";
import { lightTime } from "@/lib/comm";
import { missionConsumables, radiationDose, enhancedRadiationDose, type ConsumablesTotals, type RadiationEnv } from "@/lib/life";
import { designInterstellarMission, type InterstellarDesign, type ExoplanetTarget } from "@/lib/interstellar";
import constants from "@/data/constants.json";
import launchVehicles from "@/data/launch-vehicles.json";
import { EXOPLANETS } from "@/data/exoplanets";

export type Destination = "moon" | "mars" | "exoplanet";

export interface MissionDesignOptions {
  destination: Destination;
  vehicleId: string;
  crew: number;
  surfaceDays: number;
  /** Optional: use enhanced radiation + parametric habitat models (default: false for backward compat) */
  useEnhancedModels?: boolean;
  /** Optional: areal density of storm shelter (g/cm²) */
  stormShelterGcm2?: number;
  /** Optional: transit habitat shielding (g/cm²) */
  transitShieldingGcm2?: number;
  /** Optional: surface habitat shielding (g/cm²) */
  surfaceShieldingGcm2?: number;
  /** Optional: solar cycle phase for radiation model */
  solarCyclePhase?: "minimum" | "maximum" | "declining" | "rising";
  /** Optional: ECLSS closure level (0-1, default 0.5 for ISS-class) */
  eclssClosureLevel?: number;
  /** Optional: radiation shielding level ("minimal" | "standard" | "enhanced") */
  radiationShielding?: "minimal" | "standard" | "enhanced";
  /** Optional: exoplanet target ID (required when destination === "exoplanet") */
  exoplanetTargetId?: string;
  /** Optional: interstellar propulsion type */
  interstellarPropulsion?: "constant-acceleration" | "laser-sail" | "fusion-rocket" | "antimatter-rocket" | "orion-pulse";
  /** Optional: constant acceleration in g (for constant-acceleration propulsion) */
  accelerationG?: number;
  /** Optional: laser power in GW (for laser-sail propulsion) */
  laserPowerGW?: number;
  /** Optional: sail area in km² (for laser-sail propulsion) */
  sailAreaKm2?: number;
  /** Optional: sail areal density in g/cm² (for laser-sail propulsion) */
  sailArealDensityGcm2?: number;
  /** Optional: fusion exhaust velocity in km/s (for fusion-rocket propulsion) */
  fusionExhaustVelocityKmS?: number;
  /** Optional: fusion mass ratio (for fusion-rocket propulsion) */
  fusionMassRatio?: number;
}

export interface LaunchVehicleLite {
  id: string;
  name: string;
  operator: string;
  payloadLEOKg: number;
  payloadTLIKg: number;
  payloadGTOKg: number;
  ispVacuumS: number;
  stages: number;
  description: string;
  costPerLaunchUsd: number;
  costConfidence: "documented" | "estimate";
  costNote: string;
}

const VEHICLES = launchVehicles as unknown as LaunchVehicleLite[];

/** Documented Apollo-class translunar coast (launch to lunar orbit insertion). NASA. */
export const MOON_TRANSFER_DAYS = 3.17;

/** Moon TLI departure burn magnitude (Apollo-class, documented ≈3.0–3.2 km/s). */
export const MOON_TLI_DV_KM_S = 3.1;

export const MARS_SYNODIC_DAYS = 779.94; // = 1/(1/365.25 − 1/686.98), 26-month launch cadence

/** Shielding areal density presets (g/cm²) */
export const SHIELDING_PRESETS: Record<"minimal" | "standard" | "enhanced", { transit: number; surface: number; storm: number }> = {
  minimal: { transit: 5, surface: 10, storm: 0 },
  standard: { transit: 10, surface: 20, storm: 5 },
  enhanced: { transit: 20, surface: 30, storm: 10 },
};

/**
 * Parametric habitation module mass model.
 * Based on NASA TransHab, Bigelow BA-330, and ISS heritage.
 * 
 * @param crew - Crew size (1-6)
 * @param destination - "moon" or "mars"
 * @param shieldingLevel - "minimal" | "standard" | "enhanced"
 * @param eclssLevel - ECLSS closure fraction (0-1, default 0.5 for ISS-class)
 * @returns Dry mass in kg
 */
export function calculateHabMass(
  crew: number,
  destination: Destination,
  shieldingLevel: "minimal" | "standard" | "enhanced" = "standard",
  eclssLevel: number = 0.5
): number {
  // Base pressure vessel mass (TransHab/BA-330 heritage: ~1.5 t per 100 m³)
  // Volume: ~50 m³ per crew for Mars, ~30 m³ per crew for Moon, ~100 m³ per crew for exoplanet (long duration)
  const volumePerCrew = destination === "mars" ? 50 : destination === "exoplanet" ? 100 : 30;
  const totalVolume = crew * volumePerCrew;
  
  // Pressure vessel: ~15 kg/m³ for inflatable (Vectran/Kevlar) + restraint layer
  const vesselMass = totalVolume * 15;
  
  // ECLSS hardware mass (scales with crew and closure level)
  // ISS WPA ~500 kg, CDRA ~400 kg, OGS ~500 kg, Sabatier ~300 kg for 6 crew
  const baseEclssPerCrew = 300; // kg per crew for basic ECLSS
  const eclssMass = crew * baseEclssPerCrew * (1 + eclssLevel); // more closure = more hardware
  
  // Radiation shielding (areal density * surface area * density)
  const habitatRadius = Math.cbrt(3 * totalVolume / (4 * Math.PI)); // spherical approximation
  const surfaceArea = 4 * Math.PI * habitatRadius * habitatRadius;
  const shielding = SHIELDING_PRESETS[shieldingLevel];
  // Average of transit + surface shielding for combined habitat
  const avgShielding = (shielding.transit + shielding.surface) / 2;
  const shieldingMass = surfaceArea * 10000 * avgShielding * 1.2; // cm²→m², *1.2 g/cm³ for polyethylene
  
  // Internal outfitting (racks, wiring, plumbing, ~20% of dry mass)
  const outfittingMass = (vesselMass + eclssMass + shieldingMass) * 0.2;
  
  // Margin (20% for growth)
  const subtotal = vesselMass + eclssMass + shieldingMass + outfittingMass;
  const margin = subtotal * 0.2;
  
  return Math.round(subtotal + margin);
}

/** Legacy fixed masses for backward compatibility */
export const HABITATION_MODULE_KG: Record<Destination, number> = {
  moon: 10_000,
  mars: 30_000,
  exoplanet: 50_000,
};

export interface MissionDesign {
  destination: Destination;
  vehicle: LaunchVehicleLite;
  crew: number;
  surfaceDays: number;
  totalDays: number;
  transferDays: number;
  transferHours: number;
  arrivalLt: { oneWayLabel: string; oneWaySec: number; roundTripLabel: string };
  transitEnv: RadiationEnv;
  surfaceEnv: RadiationEnv;
  radiationMsvTotal: number;
  radiationNote: string;
  consumables: ConsumablesTotals;
  consumablesTotalKg: number;
  habitationModuleKg: number;
  requiredMassKg: number;
  payloadCapacityKg: number | null;
  launchGate: "pass" | "fail" | "unknown";
  totalDeltaVKmS: number;
  notes: string[];
  // Interstellar fields (populated when destination === "exoplanet")
  interstellar?: {
    targetId: string;
    targetName: string;
    distanceLy: number;
    propulsion: string;
    transitTimeYears: number;
    transitTimeShipYears: number;
    maxVelocityC: number;
    deltaVTotalKmS: number;
    totalMassKg: number;
    energyRequiredJ: number;
    feasibilityFlags: {
      physicsPlausible: boolean;
      engineeringPlausible: boolean;
      energyFeasible: boolean;
    };
    propulsionParams: Record<string, number>;
  };
}

function findVehicle(vehicleId: string): LaunchVehicleLite {
  const v = VEHICLES.find((x) => x.id === vehicleId);
  if (!v) throw new Error(`Unknown launch vehicle: ${vehicleId}`);
  return v;
}

const MOON_ENV: RadiationEnv = "moon-surface";
const MARS_ENV: RadiationEnv = "mars-surface";
const TRANSIT_MOON: RadiationEnv = "cislunar";
const TRANSIT_MARS: RadiationEnv = "transit-mars";

/** Exoplanet radiation environment for interstellar transit */
const INTERSTELLAR_ENV: RadiationEnv = "transit-mars";

export function designMission(opts: MissionDesignOptions): MissionDesign {
  const vehicle = findVehicle(opts.vehicleId);
  const crew = Math.max(1, Math.min(6, opts.crew));
  const surfaceDays = Math.max(0, opts.surfaceDays);
  const notes: string[] = [];

  // Defaults for optional params
  const stormShelterGcm2 = opts.stormShelterGcm2 ?? SHIELDING_PRESETS[opts.radiationShielding ?? "standard"].storm;
  const transitShieldingGcm2 = opts.transitShieldingGcm2 ?? SHIELDING_PRESETS[opts.radiationShielding ?? "standard"].transit;
  const surfaceShieldingGcm2 = opts.surfaceShieldingGcm2 ?? SHIELDING_PRESETS[opts.radiationShielding ?? "standard"].surface;
  const solarCyclePhase = opts.solarCyclePhase ?? "declining";
  const eclssLevel = opts.eclssClosureLevel ?? 0.5;
  const radiationShielding = opts.radiationShielding ?? "standard";

  let transferDays = 0;
  let totalDeltaVKmS = 0;
  let transitEnv: RadiationEnv = "cislunar";
  let surfaceEnv: RadiationEnv = "moon-surface";
  let arrivalLt = { oneWayLabel: "", oneWaySec: 0, roundTripLabel: "" };
  let interstellar: MissionDesign["interstellar"] | undefined;

  if (opts.destination === "exoplanet") {
    if (!opts.exoplanetTargetId) {
      throw new Error("exoplanetTargetId is required when destination === 'exoplanet'");
    }
    const target = EXOPLANETS.find((p) => p.id === opts.exoplanetTargetId);
    if (!target) {
      throw new Error(`Unknown exoplanet target: ${opts.exoplanetTargetId}`);
    }

    const interstellarDesign = designInterstellarMission(
      {
        targetId: target.id,
        propulsion: opts.interstellarPropulsion ?? "fusion-rocket",
        crew,
        payloadMassKg: 50_000,
        accelerationG: opts.accelerationG,
        laserPowerGW: opts.laserPowerGW,
        sailAreaKm2: opts.sailAreaKm2,
        sailArealDensityGcm2: opts.sailArealDensityGcm2,
        fusionExhaustVelocityKmS: opts.fusionExhaustVelocityKmS,
        fusionMassRatio: opts.fusionMassRatio,
        useEnhancedModels: opts.useEnhancedModels,
      },
      target
    );

    transferDays = interstellarDesign.transitTimeShipYears * 365.25;
    totalDeltaVKmS = interstellarDesign.deltaVTotalKmS;
    transitEnv = INTERSTELLAR_ENV;
    surfaceEnv = INTERSTELLAR_ENV;
    arrivalLt = {
      oneWayLabel: `${interstellarDesign.distanceLy.toFixed(2)} ly`,
      oneWaySec: interstellarDesign.distanceLy * constants.lightYearKm / constants.speedOfLightKmS,
      roundTripLabel: `${(interstellarDesign.distanceLy * 2).toFixed(2)} ly`,
    };

    notes.push(
      `Interstellar mission to ${target.name} (${target.distanceLy} ly) via ${interstellarDesign.propulsion}.`,
      `Ship time: ${interstellarDesign.transitTimeShipYears.toFixed(1)} years; Earth time: ${interstellarDesign.transitTimeYears.toFixed(1)} years.`,
      `Max velocity: ${(interstellarDesign.maxVelocityC * 100).toFixed(1)}% c.`,
      `Total Δv: ${interstellarDesign.deltaVTotalKmS.toFixed(0)} km/s.`,
      `Total wet mass: ${(interstellarDesign.totalMassKg / 1000).toFixed(0)} t.`,
      ...interstellarDesign.notes,
    );

    interstellar = {
      targetId: interstellarDesign.targetId,
      targetName: interstellarDesign.targetName,
      distanceLy: interstellarDesign.distanceLy,
      propulsion: interstellarDesign.propulsion,
      transitTimeYears: interstellarDesign.transitTimeYears,
      transitTimeShipYears: interstellarDesign.transitTimeShipYears,
      maxVelocityC: interstellarDesign.maxVelocityC,
      deltaVTotalKmS: interstellarDesign.deltaVTotalKmS,
      totalMassKg: interstellarDesign.totalMassKg,
      energyRequiredJ: interstellarDesign.energyRequiredJ,
      feasibilityFlags: interstellarDesign.feasibilityFlags,
      propulsionParams: interstellarDesign.propulsionParams,
    };
  } else if (opts.destination === "mars") {
    const h = hohmannTransfer(
      constants.mu.sun,
      constants.astronomicalUnitKm,
      constants.astronomicalUnitKm * 1.524,
    );
    transferDays = h.transferDays;
    totalDeltaVKmS = h.totalDeltaVKmS;
    transitEnv = TRANSIT_MARS;
    surfaceEnv = MARS_ENV;
    const meanDist = constants.distanceKm.earthMarsMean;
    const lt = lightTime(meanDist);
    arrivalLt = { oneWayLabel: lt.oneWayLabel, oneWaySec: lt.oneWaySec, roundTripLabel: lt.roundTripLabel };
    notes.push(
      `Hohmann transfer Earth→Mars coast ≈ ${h.transferDays.toFixed(1)} days; total heliocentric Δv ≈ ${h.totalDeltaVKmS.toFixed(2)} km/s (computed from ${constants.mu.sun.toExponential(2)} km³/s²).`,
      `Launch windows recur every ${(MARS_SYNODIC_DAYS / 365.25).toFixed(1)} years (~26 months, synodic period).`,
    );
  } else {
    transferDays = MOON_TRANSFER_DAYS;
    totalDeltaVKmS = MOON_TLI_DV_KM_S;
    transitEnv = TRANSIT_MOON;
    surfaceEnv = MOON_ENV;
    arrivalLt = (() => {
      const lt = lightTime(constants.distanceKm.earthMoonMean);
      return { oneWayLabel: lt.oneWayLabel, oneWaySec: lt.oneWaySec, roundTripLabel: lt.roundTripLabel };
    })();
    notes.push(
      `Apollo-class translunar coast ≈ ${MOON_TRANSFER_DAYS} days (launch to lunar-orbit insertion, NASA).`,
      `Trans-lunar injection Δv ≈ ${MOON_TLI_DV_KM_S.toFixed(1)} km/s from low Earth orbit (documented Apollo-class).`,
    );
  }

  const totalDays = transferDays + surfaceDays;

  const useEnhanced = opts.useEnhancedModels ?? false;

  let radiationMsvTotal: number;
  let radiationNote: string;
  let habitationModuleKg: number;
  let radResult: ReturnType<typeof enhancedRadiationDose> | null = null;

  if (useEnhanced) {
    radResult = enhancedRadiationDose({
      transitDays: transferDays,
      surfaceDays,
      env: opts.destination === "mars" ? TRANSIT_MARS : opts.destination === "exoplanet" ? INTERSTELLAR_ENV : TRANSIT_MOON,
      solarCyclePhase,
      stormShelterGcm2,
      transitShieldingGcm2,
      surfaceShieldingGcm2,
    });
    radiationMsvTotal = radResult.totalExpectedMSv;
    radiationNote = radResult.breakdown;
    habitationModuleKg = calculateHabMass(crew, opts.destination, radiationShielding, eclssLevel);
  } else {
    const transitDose = radiationDose(transferDays, transitEnv);
    const surfaceDose = radiationDose(surfaceDays, surfaceEnv);
    radiationMsvTotal = transitDose.mSvTotal + surfaceDose.mSvTotal;
    radiationNote = `${transitDose.benchmarkNote} in transit + ${surfaceDose.benchmarkNote} on the surface`;
    habitationModuleKg = HABITATION_MODULE_KG[opts.destination];
  }

  const consumables = missionConsumables(crew, totalDays);
  const consumablesTotalKg = consumables.oxygenKg + consumables.waterKg + consumables.foodKg;
  const requiredMassKg = consumablesTotalKg + habitationModuleKg;

  // For exoplanet, the required mass is the interstellar total mass
  const finalRequiredMassKg = opts.destination === "exoplanet" && interstellar
    ? interstellar.totalMassKg
    : requiredMassKg;

  // Launch gate: the vehicle must be documented to lift the whole stack to orbit
  const payloadCapacityKg =
    opts.destination === "moon"
      ? vehicle.payloadTLIKg > 0
        ? vehicle.payloadTLIKg
        : null
      : vehicle.payloadLEOKg;

  let launchGate: MissionDesign["launchGate"];
  if (opts.destination === "exoplanet") {
    launchGate = "unknown";
    notes.push(`Interstellar missions require in-space assembly; launch gate not applicable.`);
  } else if (payloadCapacityKg == null) {
    launchGate = "unknown";
    notes.push(`No documented TLI payload published for ${vehicle.name}; translunar capability is unverified.`);
  } else if (payloadCapacityKg >= finalRequiredMassKg) {
    launchGate = "pass";
    notes.push(
      `Mass budget ${(finalRequiredMassKg / 1000).toFixed(1)} t fits within ${vehicle.name}'s documented ${(payloadCapacityKg / 1000).toFixed(0)} t ${opts.destination === "moon" ? "TLI" : "LEO"} payload.`,
    );
  } else {
    launchGate = "fail";
    notes.push(
      `Mass budget ${(finalRequiredMassKg / 1000).toFixed(1)} t exceeds ${vehicle.name}'s documented ${(payloadCapacityKg / 1000).toFixed(0)} t ${opts.destination === "moon" ? "TLI" : "LEO"} payload — stack won't leave the pad.`,
    );
  }

  if (useEnhanced && radResult) {
    notes.push(
      `Radiation: ${radResult.gcrMSv.toFixed(0)} mSv GCR + ${radResult.speExpectedMSv.toFixed(0)} mSv SPE (expected) | P95: ${radResult.totalP95MSv.toFixed(0)} mSv. Storm shelter: ${stormShelterGcm2} g/cm².`,
      `Habitat: ${(habitationModuleKg / 1000).toFixed(1)} t dry mass (${radiationShielding} shielding, ${(eclssLevel * 100).toFixed(0)}% ECLSS closure).`,
    );
  }

  return {
    destination: opts.destination,
    vehicle,
    crew,
    surfaceDays,
    totalDays,
    transferDays,
    transferHours: transferDays * 24,
    arrivalLt: { oneWayLabel: `${arrivalLt.oneWayLabel}`, oneWaySec: arrivalLt.oneWaySec, roundTripLabel: arrivalLt.roundTripLabel },
    transitEnv: opts.destination === "mars" ? TRANSIT_MARS : opts.destination === "exoplanet" ? INTERSTELLAR_ENV : TRANSIT_MOON,
    surfaceEnv: opts.destination === "mars" ? MARS_ENV : opts.destination === "exoplanet" ? INTERSTELLAR_ENV : MOON_ENV,
    radiationMsvTotal,
    radiationNote,
    consumables,
    consumablesTotalKg,
    habitationModuleKg,
    requiredMassKg: finalRequiredMassKg,
    payloadCapacityKg: opts.destination === "exoplanet" ? null : payloadCapacityKg,
    launchGate,
    totalDeltaVKmS,
    notes,
    interstellar,
  };
}