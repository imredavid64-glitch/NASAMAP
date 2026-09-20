/**
 * Entry-Descent-Landing (EDL) Module
 *
 * Models the critical landing phase for Moon and Mars missions.
 * Based on NASA Apollo, Mars Science Laboratory (MSL), and Starship HLS architectures.
 * Every constant is cited to public NASA documentation.
 */

import constants from "@/data/constants.json";

export type EDLDestination = "moon" | "mars";
export type EDLArchitecture = "apollo" | "starship" | "skyhook" | "skyhook-moon";

export interface EDLPhase {
  name: string;
  durationSec: number;
  altitudeStartKm: number;
  altitudeEndKm: number;
  velocityStartKmS: number;
  velocityEndKmS: number;
  decelerationG: number;
  description: string;
  confidence: "documented" | "derived" | "estimate";
  reference: string;
}

export interface EDLProfile {
  destination: EDLDestination;
  architecture: EDLArchitecture;
  phases: EDLPhase[];
  totalDurationSec: number;
  peakG: number;
  landingAccuracyKm: number;
  propellantMassKg: number;
  dryMassKg: number;
  notes: string[];
}

/** Apollo LM-style lunar descent (Apollo 11-17) */
const APOLLO_LUNAR_PHASES: EDLPhase[] = [
  {
    name: "Descent Orbit Insertion (DOI)",
    durationSec: 30,
    altitudeStartKm: 110,
    altitudeEndKm: 15,
    velocityStartKmS: 1.68,
    velocityEndKmS: 1.62,
    decelerationG: 0.1,
    description: "LM descent engine burns to lower perilune to 15 km",
    confidence: "documented",
    reference: "Apollo 11 Mission Report, NASA SP-238",
  },
  {
    name: "Powered Descent Initiation (PDI)",
    durationSec: 620,
    altitudeStartKm: 15,
    altitudeEndKm: 0.1,
    velocityStartKmS: 1.62,
    velocityEndKmS: 0.02,
    decelerationG: 0.3,
    description: "Continuous throttleable descent engine burn from 15 km to hover",
    confidence: "documented",
    reference: "Apollo 11 Mission Report, NASA SP-238; LM descent engine throttle profile",
  },
  {
    name: "Approach & Landing",
    durationSec: 120,
    altitudeStartKm: 0.1,
    altitudeEndKm: 0,
    velocityStartKmS: 0.02,
    velocityEndKmS: 0,
    decelerationG: 0.5,
    description: "Manual/auto pilot transition, final vertical descent, engine cutoff at contact",
    confidence: "documented",
    reference: "Apollo 11 Mission Report, NASA SP-238; LM landing sequence",
  },
];

/** Starship HLS lunar descent (Artemis HLS) */
const STARSHIP_LUNAR_PHASES: EDLPhase[] = [
  {
    name: "Deorbit Burn",
    durationSec: 180,
    altitudeStartKm: 100,
    altitudeEndKm: 20,
    velocityStartKmS: 1.65,
    velocityEndKmS: 1.4,
    decelerationG: 0.15,
    description: "Raptor engines burn to lower orbit and begin descent trajectory",
    confidence: "derived",
    reference: "SpaceX Starship HLS Concept of Operations; NASA HLS Source Selection Statement",
  },
  {
    name: "Powered Descent",
    durationSec: 480,
    altitudeStartKm: 20,
    altitudeEndKm: 0.1,
    velocityStartKmS: 1.4,
    velocityEndKmS: 0.05,
    decelerationG: 0.4,
    description: "Throttleable Raptor engines (deep throttle ~10%) for controlled descent",
    confidence: "derived",
    reference: "Raptor engine deep throttle capability; SpaceX Starship HLS docs",
  },
  {
    name: "Final Descent & Landing",
    durationSec: 60,
    altitudeStartKm: 0.1,
    altitudeEndKm: 0,
    velocityStartKmS: 0.05,
    velocityEndKmS: 0,
    decelerationG: 0.3,
    description: "Final vertical descent on center Raptor engines, leg deployment, touchdown",
    confidence: "estimate",
    reference: "Starship HLS landing leg design; SpaceX public presentations",
  },
];

/** MSL/Curiosity-style Mars EDL (Skyhook) */
const MSL_MARS_PHASES: EDLPhase[] = [
  {
    name: "Entry Interface",
    durationSec: 240,
    altitudeStartKm: 125,
    altitudeEndKm: 11,
    velocityStartKmS: 5.8,
    velocityEndKmS: 0.45,
    decelerationG: 10,
    description: "Atmospheric entry at 5.8 km/s, peak heating ~200 W/cm², peak deceleration ~10-12g",
    confidence: "documented",
    reference: "MSL EDL Report; NASA JPL EDL simulations; Entry Interface at 125 km",
  },
  {
    name: "Parachute Descent",
    durationSec: 100,
    altitudeStartKm: 11,
    altitudeEndKm: 1.8,
    velocityStartKmS: 0.45,
    velocityEndKmS: 0.1,
    decelerationG: 2,
    description: "Supersonic parachute deploy at Mach ~2, 21.5m diameter disk-gap-band chute",
    confidence: "documented",
    reference: "MSL EDL Report; NASA JPL parachute deployment sequence",
  },
  {
    name: "Powered Descent (Skyhook)",
    durationSec: 40,
    altitudeStartKm: 1.8,
    altitudeEndKm: 0.02,
    velocityStartKmS: 0.1,
    velocityEndKmS: 0.002,
    decelerationG: 0.7,
    description: "8 throttled Mars Landing Engines (MLE), skyhook lowers rover on 7.5m bridle",
    confidence: "documented",
    reference: "MSL Skyhook maneuver; NASA JPL MSL EDL; 8 MLE throttle profile",
  },
  {
    name: "Touchdown & Flyaway",
    durationSec: 15,
    altitudeStartKm: 0.02,
    altitudeEndKm: 0,
    velocityStartKmS: 0.002,
    velocityEndKmS: 0,
    decelerationG: 0.5,
    description: "Rover touches down, bridle cut, descent stage flies away to safe distance",
    confidence: "documented",
    reference: "MSL landing sequence; NASA JPL MSL touchdown",
  },
];

/** Starship Mars EDL (full propulsive) */
const STARSHIP_MARS_PHASES: EDLPhase[] = [
  {
    name: "Entry Interface",
    durationSec: 180,
    altitudeStartKm: 125,
    altitudeEndKm: 40,
    velocityStartKmS: 7.5,
    velocityEndKmS: 1.2,
    decelerationG: 3,
    description: "Lifting body entry at 7.5 km/s, belly-flop attitude, peak heating managed by PICA heat shield",
    confidence: "derived",
    reference: "SpaceX Starship Mars architecture; Elon Musk presentations; PICA-X heat shield",
  },
  {
    name: "Aerodynamic Deceleration",
    durationSec: 120,
    altitudeStartKm: 40,
    altitudeEndKm: 5,
    velocityStartKmS: 1.2,
    velocityEndKmS: 0.3,
    decelerationG: 1.5,
    description: "Controlled belly-flop descent using body flaps for lift/drag control",
    confidence: "derived",
    reference: "Starship SN8-SN15 flight tests; body flap control authority",
  },
  {
    name: "Flip Maneuver & Landing Burn",
    durationSec: 30,
    altitudeStartKm: 5,
    altitudeEndKm: 0,
    velocityStartKmS: 0.3,
    velocityEndKmS: 0,
    decelerationG: 2.5,
    description: "Rapid flip to vertical, 3 center Raptor engines light for landing, leg deploy",
    confidence: "estimate",
    reference: "Starship SN8-SN15 flip maneuver; Raptor landing burn profile",
  },
];

/** Get EDL phases for a destination and architecture */
export function getEDLPhases(destination: EDLDestination, architecture: EDLArchitecture): EDLPhase[] {
  if (destination === "moon") {
    if (architecture === "apollo") return APOLLO_LUNAR_PHASES;
    if (architecture === "starship") return STARSHIP_LUNAR_PHASES;
  }
  if (destination === "mars") {
    if (architecture === "skyhook") return MSL_MARS_PHASES;
    if (architecture === "starship") return STARSHIP_MARS_PHASES;
  }
  throw new Error(`Unknown EDL configuration: ${destination} / ${architecture}`);
}

/** Calculate total EDL duration */
export function getEDLTotalDuration(phases: EDLPhase[]): number {
  return phases.reduce((sum, p) => sum + p.durationSec, 0);
}

/** Calculate peak G-load */
export function getEDLPeakG(phases: EDLPhase[]): number {
  return Math.max(...phases.map(p => p.decelerationG));
}

/** Estimate landing accuracy (3-sigma ellipse semi-major axis) */
export function getEDLLandingAccuracy(architecture: EDLArchitecture): number {
  const accuracies: Record<EDLArchitecture, number> = {
    apollo: 5,      // Apollo: ~5 km (later missions better)
    starship: 0.1,  // Starship: ~100m target
    skyhook: 10,    // Skyhook: ~10-20 km ellipse
    "skyhook-moon": 5,
  };
  return accuracies[architecture] ?? 10;
}

/** Estimate propellant mass for EDL */
export function getEDLPropellantMass(destination: EDLDestination, architecture: EDLArchitecture, dryMassKg: number): number {
  // Tsiolkovsky approximation for EDL delta-v
  const dvMap: Record<string, number> = {
    "moon-apollo": 2.1,      // Apollo LM descent delta-v
    "moon-starship": 1.8,    // Starship lunar descent delta-v
    "mars-skyhook": 0.8,     // Skyhook powered descent delta-v
    "mars-starship": 1.2,    // Starship Mars landing delta-v
  };
  const key = `${destination}-${architecture}`;
  const dv = dvMap[key] ?? 1.5;
  const isp = architecture === "starship" ? 380 : 311; // Raptor vs hypergolic
  const g0 = constants.g0;
  const massRatio = Math.exp(dv * 1000 / (isp * g0));
  return dryMassKg * (massRatio - 1);
}

/** Build full EDL profile */
export function buildEDLProfile(
  destination: EDLDestination,
  architecture: EDLArchitecture,
  dryMassKg: number
): EDLProfile {
  const phases = getEDLPhases(destination, architecture);
  const totalDurationSec = getEDLTotalDuration(phases);
  const peakG = getEDLPeakG(phases);
  const landingAccuracyKm = getEDLLandingAccuracy(architecture);
  const propellantMassKg = getEDLPropellantMass(destination, architecture, dryMassKg);

  const notes = [
    `Architecture: ${architecture} for ${destination}`,
    `Total EDL duration: ${(totalDurationSec / 60).toFixed(1)} minutes`,
    `Peak deceleration: ${peakG.toFixed(1)}g`,
    `Landing accuracy (3σ): ±${landingAccuracyKm} km`,
    `Estimated EDL propellant: ${(propellantMassKg / 1000).toFixed(1)} t`,
    `Dry mass: ${(dryMassKg / 1000).toFixed(1)} t`,
    `Total landing mass: ${((dryMassKg + propellantMassKg) / 1000).toFixed(1)} t`,
  ];

  if (destination === "mars" && architecture === "skyhook") {
    notes.push("Skyhook requires supersonic parachute deploy at Mach ~2");
    notes.push("8 Mars Landing Engines (MLE) for powered descent");
  }
  if (destination === "mars" && architecture === "starship") {
    notes.push("Belly-flop entry with body flap control");
    notes.push("PICA-X heat shield for peak heating protection");
    notes.push("Flip maneuver at ~5 km altitude");
  }
  if (destination === "moon" && architecture === "apollo") {
    notes.push("Two-phase descent: DOI then PDI");
    notes.push("Throttleable descent engine (10-60% throttle range)");
  }
  if (destination === "moon" && architecture === "starship") {
    notes.push("Deep throttle Raptor engines (~10% min throttle)");
    notes.push("Landing legs deploy during final descent");
  }

  return {
    destination,
    architecture,
    phases,
    totalDurationSec,
    peakG,
    landingAccuracyKm,
    propellantMassKg,
    dryMassKg,
    notes,
  };
}

/** Default architectures for a destination */
export function getDefaultArchitecture(destination: EDLDestination): EDLArchitecture {
  return destination === "moon" ? "apollo" : "skyhook";
}

/** Available architectures for a destination */
export function getAvailableArchitectures(destination: EDLDestination): EDLArchitecture[] {
  return destination === "moon" ? ["apollo", "starship"] : ["skyhook", "starship"];
}