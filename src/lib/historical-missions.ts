/**
 * Historical Mission Replay Library
 * 
 * Provides access to curated historical mission data with
 * interpolated trajectory positions for animation/visualization.
 */

import historicalMissionsRaw from "@/data/historical-missions.json";

export type HistoricalMissionDestination = "moon" | "mars" | "saturn" | "interstellar";
export type TrajectoryType = "free-return" | "hohmann" | "distant-retrograde" | "gravity-assist";

export interface HistoricalMissionEvent {
  name: string;
  timeSec: number;
  description: string;
}

export interface HistoricalMission {
  id: string;
  name: string;
  description: string;
  destination: HistoricalMissionDestination;
  launchDate: string;
  durationDays: number;
  crew: string[];
  vehicle: string;
  keyEvents: HistoricalMissionEvent[];
  trajectoryType: TrajectoryType;
  references: string[];
}

interface HistoricalMissionsFile {
  version: number;
  missions: HistoricalMission[];
}

export function loadHistoricalMissions(): HistoricalMission[] {
  return (historicalMissionsRaw as unknown as HistoricalMissionsFile).missions;
}

export function getHistoricalMission(id: string): HistoricalMission | undefined {
  return loadHistoricalMissions().find(m => m.id === id);
}

export function getMissionsByDestination(dest: HistoricalMissionDestination): HistoricalMission[] {
  return loadHistoricalMissions().filter(m => m.destination === dest);
}

export function getMissionsByTrajectoryType(type: TrajectoryType): HistoricalMission[] {
  return loadHistoricalMissions().filter(m => m.trajectoryType === type);
}

/** Interpolate position along a trajectory at a given time fraction (0-1) */
export interface TrajectoryPosition {
  x: number;
  y: number;
  z: number;
  velocityKmS: number;
  altitudeKm: number;
  eventName?: string;
}

export interface MissionTrajectory {
  mission: HistoricalMission;
  positions: TrajectoryPosition[];
  totalDurationSec: number;
}

/** 
 * Generate interpolated trajectory positions for a historical mission.
 * Uses simplified orbital mechanics for visualization.
 */
export function generateMissionTrajectory(mission: HistoricalMission, steps: number = 500): MissionTrajectory {
  const totalDurationSec = mission.durationDays * 24 * 3600;
  const positions: TrajectoryPosition[] = [];
  
  // Create event map for quick lookup
  const eventMap = new Map<number, HistoricalMissionEvent>();
  for (const event of mission.keyEvents) {
    eventMap.set(event.timeSec, event);
  }
  
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const timeSec = t * totalDurationSec;
    
    // Find current event
    let currentEvent: HistoricalMissionEvent | undefined;
    for (const event of mission.keyEvents) {
      if (event.timeSec <= timeSec) {
        currentEvent = event;
      } else {
        break;
      }
    }
    
    // Generate position based on trajectory type and mission phase
    const pos = interpolatePosition(mission, timeSec, totalDurationSec, currentEvent);
    positions.push(pos);
  }
  
  return {
    mission,
    positions,
    totalDurationSec,
  };
}

function interpolatePosition(
  mission: HistoricalMission,
  timeSec: number,
  totalDurationSec: number,
  currentEvent?: HistoricalMissionEvent
): TrajectoryPosition {
  const t = timeSec / totalDurationSec;
  
  // Simplified trajectory interpolation based on mission type
  switch (mission.trajectoryType) {
    case "free-return":
      return interpolateFreeReturn(mission, t, currentEvent);
    case "hohmann":
      return interpolateHohmann(mission, t, currentEvent);
    case "distant-retrograde":
      return interpolateDistantRetrograde(mission, t, currentEvent);
    case "gravity-assist":
      return interpolateGravityAssist(mission, t, currentEvent);
    default:
      return interpolateFreeReturn(mission, t, currentEvent);
  }
}

function interpolateFreeReturn(mission: HistoricalMission, t: number, currentEvent?: HistoricalMissionEvent): TrajectoryPosition {
  // Earth-Moon free-return trajectory
  // Earth at origin, Moon at ~384,400 km
  const moonDistance = 384400;
  const earthRadius = 6371;
  const moonRadius = 1737;
  
  // Phase 0-0.15: Launch and TLI
  // Phase 0.15-0.45: Coast to Moon
  // Phase 0.45-0.55: Lunar orbit/operations
  // Phase 0.55-0.85: Return coast
  // Phase 0.85-1.0: Entry and splashdown
  
  let x = 0, y = 0, z = 0;
  let altitudeKm = earthRadius;
  let velocityKmS = 7.8;
  
  if (t < 0.15) {
    // Launch and TLI
    const phase = t / 0.15;
    altitudeKm = earthRadius + 200 + 50000 * phase;
    velocityKmS = 7.8 + 3.2 * phase;
    x = (earthRadius + altitudeKm) * Math.sin(phase * Math.PI);
    y = (earthRadius + altitudeKm) * Math.cos(phase * Math.PI);
  } else if (t < 0.45) {
    // Coast to Moon
    const phase = (t - 0.15) / 0.3;
    const distance = 384400 * phase;
    altitudeKm = distance;
    velocityKmS = 1.1 - 0.3 * phase;
    x = distance * Math.sin(phase * Math.PI);
    y = distance * Math.cos(phase * Math.PI);
  } else if (t < 0.55) {
    // Lunar orbit/operations
    const phase = (t - 0.45) / 0.1;
    altitudeKm = 384400;
    velocityKmS = 1.0;
    const angle = phase * 2 * Math.PI;
    x = 384400 * Math.sin(angle);
    y = 384400 * Math.cos(angle);
  } else if (t < 0.85) {
    // Return coast
    const phase = (t - 0.55) / 0.3;
    const distance = 384400 * (1 - phase);
    altitudeKm = distance;
    velocityKmS = 1.1 + 0.5 * phase;
    x = distance * Math.sin((1 - phase) * Math.PI);
    y = distance * Math.cos((1 - phase) * Math.PI);
  } else {
    // Entry and splashdown
    const phase = (t - 0.85) / 0.15;
    altitudeKm = Math.max(earthRadius, 6371 + 100 * (1 - phase));
    velocityKmS = 11.2 * (1 - phase) + 7.8 * phase;
    x = 0;
    y = altitudeKm;
  }
  
  return {
    x,
    y,
    z: 0,
    velocityKmS,
    altitudeKm: altitudeKm - earthRadius,
    eventName: currentEvent?.name,
  };
}

function interpolateHohmann(mission: HistoricalMission, t: number, currentEvent?: HistoricalMissionEvent): TrajectoryPosition {
  // Earth-Mars Hohmann transfer
  // Earth at 1 AU, Mars at 1.52 AU
  const au = 149597870.7;
  const earthOrbit = 1 * au;
  const marsOrbit = 1.52 * au;
  
  // Phase 0-0.05: Launch and departure
  // Phase 0.05-0.95: Hohmann transfer coast
  // Phase 0.95-1.0: Arrival and EDL
  
  let x = 0, y = 0, z = 0;
  let velocityKmS = 29.8; // Earth orbital velocity
  let altitudeKm = 0;
  
  if (t < 0.05) {
    // Launch and escape
    const phase = t / 0.05;
    velocityKmS = 29.8 + 3.6 * phase;
    const r = earthOrbit * (1 + 0.1 * phase);
    const angle = 2 * Math.PI * phase;
    x = r * Math.cos(angle);
    y = r * Math.sin(angle);
    altitudeKm = (r - earthOrbit) / 1000;
  } else if (t < 0.95) {
    // Hohmann transfer coast
    const phase = (t - 0.05) / 0.9;
    // Hohmann ellipse: Earth at perihelion, Mars at aphelion
    const a = (earthOrbit + marsOrbit) / 2;
    const e = (marsOrbit - earthOrbit) / (marsOrbit + earthOrbit);
    const theta = Math.PI * phase; // True anomaly from Earth to Mars
    const r = a * (1 - e * e) / (1 + e * Math.cos(theta));
    const angle = Math.PI * phase;
    
    x = r * Math.cos(angle);
    y = r * Math.sin(angle);
    altitudeKm = (r - earthOrbit) / 1000;
    
    // Velocity from vis-viva equation
    const mu = 1.327e11; // km^3/s^2
    velocityKmS = Math.sqrt(mu * (2 / r - 1 / a));
  } else {
    // Mars arrival and EDL
    const phase = (t - 0.95) / 0.05;
    const r = marsOrbit;
    x = r * Math.cos(Math.PI);
    y = r * Math.sin(Math.PI);
    altitudeKm = 125; // Entry interface
    velocityKmS = 5.8 * (1 - phase);
  }
  
  return {
    x: x / 1000, // Convert to thousands of km for display
    y: y / 1000,
    z: 0,
    velocityKmS,
    altitudeKm,
    eventName: currentEvent?.name,
  };
}

function interpolateDistantRetrograde(mission: HistoricalMission, t: number, currentEvent?: HistoricalMissionEvent): TrajectoryPosition {
  // Similar to free-return but with DRO phase
  const base = interpolateFreeReturn(mission, t, currentEvent);
  
  // Modify for DRO phase (around t=0.3-0.7)
  if (t > 0.3 && t < 0.7) {
    const phase = (t - 0.3) / 0.4;
    const droRadius = 70000; // km from Moon
    const angle = phase * 4 * Math.PI; // 2 orbits in DRO
    
    const moonX = 384400;
    base.x = moonX + droRadius * Math.cos(angle);
    base.y = droRadius * Math.sin(angle);
    base.altitudeKm = droRadius;
    base.velocityKmS = 0.5; // DRO orbital velocity
  }
  
  return base;
}

function interpolateGravityAssist(mission: HistoricalMission, t: number, currentEvent?: HistoricalMissionEvent): TrajectoryPosition {
  // Simplified gravity assist trajectory
  // Multiple planetary flybys
  const planets = [
    { name: "Venus", distance: 0.72, flybys: 2 },
    { name: "Earth", distance: 1.0, flybys: 1 },
    { name: "Jupiter", distance: 5.2, flybys: 1 },
    { name: "Saturn", distance: 9.5, flybys: 1 },
    { name: "Uranus", distance: 19.2, flybys: 1 },
    { name: "Neptune", distance: 30.1, flybys: 1 },
  ];
  
  // Simplified: just show current heliocentric distance
  const totalDistance = 30 * 149597870.7; // Neptune distance in km
  const progress = Math.min(t * 1.2, 1.0); // Accelerate for visualization
  const currentDistance = totalDistance * progress;
  
  const angle = t * 4 * Math.PI;
  const x = currentDistance * Math.cos(angle) / 1000;
  const y = currentDistance * Math.sin(angle) / 1000;
  
  return {
    x,
    y,
    z: 0,
    velocityKmS: 15 + 5 * t,
    altitudeKm: currentDistance / 1000,
    eventName: currentEvent?.name,
  };
}

/** Export trajectory to CSV */
export function exportTrajectoryCSV(trajectory: MissionTrajectory): string {
  const headers = "time_fraction,time_sec,x_km,y_km,z_km,velocity_km_s,altitude_km,event\n";
  const rows = trajectory.positions.map((pos, i) => {
    const t = i / (trajectory.positions.length - 1);
    const timeSec = t * trajectory.totalDurationSec;
    return `${t.toFixed(6)},${timeSec.toFixed(1)},${pos.x.toFixed(3)},${pos.y.toFixed(3)},${pos.z.toFixed(3)},${pos.velocityKmS.toFixed(3)},${pos.altitudeKm.toFixed(1)},"${pos.eventName || ""}"`;
  }).join("\n");
  
  return headers + rows;
}

/** Get mission summary for UI display */
export function getMissionSummary(mission: HistoricalMission): string {
  return `${mission.name} (${mission.launchDate}) - ${mission.durationDays.toFixed(1)} days - ${mission.vehicle}`;
}