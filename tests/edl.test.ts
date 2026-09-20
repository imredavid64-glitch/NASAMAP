import { describe, it, expect } from "vitest";
import { getEDLPhases, buildEDLProfile, getDefaultArchitecture, getAvailableArchitectures, getEDLTotalDuration, getEDLPeakG, getEDLPropellantMass } from "@/lib/edl";

describe("EDL Module", () => {
  it("returns Apollo lunar phases", () => {
    const phases = getEDLPhases("moon", "apollo");
    expect(phases.length).toBe(3);
    expect(phases[0].name).toBe("Descent Orbit Insertion (DOI)");
    expect(phases[1].name).toBe("Powered Descent Initiation (PDI)");
    expect(phases[2].name).toBe("Approach & Landing");
  });

  it("returns Starship lunar phases", () => {
    const phases = getEDLPhases("moon", "starship");
    expect(phases.length).toBe(3);
    expect(phases[0].name).toBe("Deorbit Burn");
  });

  it("returns MSL Skyhook Mars phases", () => {
    const phases = getEDLPhases("mars", "skyhook");
    expect(phases.length).toBe(4);
    expect(phases[0].name).toBe("Entry Interface");
    expect(phases[2].name).toBe("Powered Descent (Skyhook)");
  });

  it("returns Starship Mars phases", () => {
    const phases = getEDLPhases("mars", "starship");
    expect(phases.length).toBe(3);
    expect(phases[0].name).toBe("Entry Interface");
  });

  it("throws on unknown configuration", () => {
    expect(() => getEDLPhases("moon", "unknown" as any)).toThrow();
  });

  it("builds Apollo lunar profile", () => {
    const profile = buildEDLProfile("moon", "apollo", 15000);
    expect(profile.destination).toBe("moon");
    expect(profile.architecture).toBe("apollo");
    expect(profile.phases.length).toBe(3);
    expect(profile.totalDurationSec).toBeGreaterThan(700);
    expect(profile.peakG).toBeGreaterThan(0);
    expect(profile.propellantMassKg).toBeGreaterThan(0);
    expect(profile.notes.length).toBeGreaterThan(0);
  });

  it("builds Starship lunar profile", () => {
    const profile = buildEDLProfile("moon", "starship", 200000);
    expect(profile.architecture).toBe("starship");
    expect(profile.propellantMassKg).toBeGreaterThan(0);
  });

  it("builds MSL Mars profile", () => {
    const profile = buildEDLProfile("mars", "skyhook", 900);
    expect(profile.architecture).toBe("skyhook");
    expect(profile.phases.length).toBe(4);
    expect(profile.totalDurationSec).toBeGreaterThan(350);
  });

  it("builds Starship Mars profile", () => {
    const profile = buildEDLProfile("mars", "starship", 100000);
    expect(profile.architecture).toBe("starship");
    expect(profile.phases.length).toBe(3);
  });

  it("returns correct default architecture", () => {
    expect(getDefaultArchitecture("moon")).toBe("apollo");
    expect(getDefaultArchitecture("mars")).toBe("skyhook");
  });

  it("returns available architectures", () => {
    expect(getAvailableArchitectures("moon")).toEqual(["apollo", "starship"]);
    expect(getAvailableArchitectures("mars")).toEqual(["skyhook", "starship"]);
  });

  it("calculates total duration correctly", () => {
    const phases = getEDLPhases("moon", "apollo");
    const total = getEDLTotalDuration(phases);
    expect(total).toBe(phases.reduce((sum, p) => sum + p.durationSec, 0));
  });

  it("calculates peak G correctly", () => {
    const phases = getEDLPhases("mars", "skyhook");
    const peak = getEDLPeakG(phases);
    expect(peak).toBe(Math.max(...phases.map(p => p.decelerationG)));
  });

  it("calculates propellant mass", () => {
    const propellant = getEDLPropellantMass("moon", "apollo", 15000);
    expect(propellant).toBeGreaterThan(0);
    expect(propellant).toBeLessThan(15000); // Should be less than dry mass for this delta-v
  });

  it("includes all required phase properties", () => {
    const phases = getEDLPhases("mars", "skyhook");
    for (const phase of phases) {
      expect(phase.name).toBeTruthy();
      expect(phase.durationSec).toBeGreaterThan(0);
      expect(phase.altitudeStartKm).toBeGreaterThan(phase.altitudeEndKm);
      expect(phase.velocityStartKmS).toBeGreaterThanOrEqual(phase.velocityEndKmS);
      expect(phase.decelerationG).toBeGreaterThan(0);
      expect(phase.description).toBeTruthy();
      expect(["documented", "derived", "estimate"]).toContain(phase.confidence);
      expect(phase.reference).toBeTruthy();
    }
  });
});