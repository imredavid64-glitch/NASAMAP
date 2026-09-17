import { describe, it, expect } from "vitest";
import { designMission } from "@/lib/mission";
import { passportSvg, passportMissionId, passportIssued } from "@/lib/passport";

const design = designMission({ destination: "mars", vehicleId: "starship", crew: 4, surfaceDays: 90 });
const issued = "2026-09-17T12:00:00Z";
const id = passportMissionId(design, issued);

describe("passport SVG", () => {
  const svg = passportSvg({ design, missionId: id, issuedUTC: issued });

  it("emits a well-formed standalone SVG", () => {
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(svg.trimEnd().endsWith("</svg>")).toBe(true);
  });

  it("carries the mission identity", () => {
    expect(svg).toContain("MISSION PASSPORT");
    expect(svg).toContain(id);
    expect(svg).toContain(issued);
  });

  it("prints the mission numbers computed by the engine", () => {
    expect(svg).toContain("MARS");
    expect(svg).toContain(design.vehicle.name);
    expect(svg).toContain(design.transferDays.toFixed(1));
    expect(svg).toContain(`${design.requiredMassKg / 1000}`.slice(0, 3));
  });

  it("stamps GO / NO-GO from the launch gate", () => {
    expect(svg).toContain("STAMPED: GO");
  });

  it("marks a Falcon 9 Mars stack as NO-GO", () => {
    const bad = designMission({ destination: "mars", vehicleId: "falcon-9", crew: 4, surfaceDays: 90 });
    const badSvg = passportSvg({ design: bad, missionId: "X", issuedUTC: issued });
    expect(badSvg).toContain("STAMPED: FAIL");
  });

  it("escapes untrusted text (no raw injection)", () => {
    const evil = { ...design, vehicle: { ...design.vehicle, name: 'B<ad> & "Rocket"' } };
    const out = passportSvg({ design: evil, missionId: id, issuedUTC: issued });
    expect(out).not.toContain("<ad>");
    expect(out).toContain("B&lt;ad&gt;");
  });
});

describe("passport identifiers", () => {
  it("mission id is stable for the same design and issue time", () => {
    expect(passportMissionId(design, issued)).toBe(passportMissionId(design, issued));
  });

  it("mission id changes when the mission changes", () => {
    const other = designMission({ destination: "moon", vehicleId: "saturn-v", crew: 3, surfaceDays: 10 });
    expect(passportMissionId(other, issued)).not.toBe(passportMissionId(design, issued));
  });

  it("mission id encodes the issue date and a code", () => {
    expect(id).toMatch(/^NF-20260917-[0-9A-Z]{4}$/);
  });

  it("issued timestamp is ISO without milliseconds", () => {
    expect(passportIssued(new Date("2026-09-17T12:00:00.123Z"))).toBe("2026-09-17T12:00:00Z");
  });
});