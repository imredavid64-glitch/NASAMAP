/**
 * Mission design engine — composes the rocket, comm, and life-support cores
 * into one readable mission design. Pure and unit-tested in tests/mission.test.ts.
 */

import { hohmannTransfer } from "@/lib/rocket";
import { lightTime } from "@/lib/comm";
import { missionConsumables, radiationDose, type ConsumablesTotals, type RadiationEnv } from "@/lib/life";
import constants from "@/data/constants.json";
import launchVehicles from "@/data/launch-vehicles.json";

export type Destination = "moon" | "mars";

export interface MissionDesignOptions {
  destination: Destination;
  vehicleId: string;
  crew: number;
  surfaceDays: number;
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

/** Assumed pressurized module dry mass per mission — design assumption, NASA-class values not exact. */
export const HABITATION_MODULE_KG: Record<Destination, number> = {
  moon: 10_000,
  mars: 30_000,
};

/** Moon TLI departure burn magnitude (Apollo-class, documented ≈3.0–3.2 km/s). */
export const MOON_TLI_DV_KM_S = 3.1;

export const MARS_SYNODIC_DAYS = 779.94; // = 1/(1/365.25 − 1/686.98), 26-month launch cadence

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

export function designMission(opts: MissionDesignOptions): MissionDesign {
  const vehicle = findVehicle(opts.vehicleId);
  const crew = Math.max(1, Math.min(6, opts.crew));
  const surfaceDays = Math.max(0, opts.surfaceDays);
  const notes: string[] = [];

  let transferDays: number;
  let totalDeltaVKmS: number;
  let transitEnv: RadiationEnv;
  let surfaceEnv: RadiationEnv;
  let arrivalLt: { oneWayLabel: string; oneWaySec: number; roundTripLabel: string };

  if (opts.destination === "mars") {
    const h = hohmannTransfer(
      constants.mu.sun,
      constants.astronomicalUnitKm,
      constants.astronomicalUnitKm * 1.524, // Mars mean orbit (NASA Fact Sheet)
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
  const transitDose = radiationDose(transferDays, transitEnv);
  const surfaceDose = radiationDose(surfaceDays, surfaceEnv);
  const radiationMsvTotal = transitDose.mSvTotal + surfaceDose.mSvTotal;
  const radiationNote = `transit ${transitEnv} (${transitDose.benchmarkNote}) + surface ${surfaceEnv} (${surfaceDose.benchmarkNote})`;

  const consumables = missionConsumables(crew, totalDays);
  const consumablesTotalKg = consumables.oxygenKg + consumables.waterKg + consumables.foodKg;
  const habitationModuleKg = HABITATION_MODULE_KG[opts.destination];
  const requiredMassKg = consumablesTotalKg + habitationModuleKg;

  // Launch gate: the vehicle must be documented to lift the whole stack to orbit,
  // and (for the Moon) throw it on to TLI.
  const payloadCapacityKg =
    opts.destination === "moon"
      ? vehicle.payloadTLIKg > 0
        ? vehicle.payloadTLIKg
        : null
      : vehicle.payloadLEOKg;

  let launchGate: MissionDesign["launchGate"];
  if (payloadCapacityKg == null) {
    launchGate = "unknown";
    notes.push(`No documented TLI payload published for ${vehicle.name}; translunar capability is unverified.`);
  } else if (payloadCapacityKg >= requiredMassKg) {
    launchGate = "pass";
    notes.push(
      `Mass budget ${(requiredMassKg / 1000).toFixed(1)} t fits within ${vehicle.name}'s documented ${(payloadCapacityKg / 1000).toFixed(0)} t ${opts.destination === "moon" ? "TLI" : "LEO"} payload.`,
    );
  } else {
    launchGate = "fail";
    notes.push(
      `Mass budget ${(requiredMassKg / 1000).toFixed(1)} t exceeds ${vehicle.name}'s documented ${(payloadCapacityKg / 1000).toFixed(0)} t ${opts.destination === "moon" ? "TLI" : "LEO"} payload — stack won't leave the pad.`,
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
    transitEnv,
    surfaceEnv,
    radiationMsvTotal,
    radiationNote,
    consumables,
    consumablesTotalKg,
    habitationModuleKg,
    requiredMassKg,
    payloadCapacityKg,
    launchGate,
    totalDeltaVKmS,
    notes,
  };
}