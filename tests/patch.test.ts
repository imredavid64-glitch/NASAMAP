import { describe, it, expect } from "vitest";
import { designMission } from "@/lib/mission";
import { passportIssued, passportMissionId } from "@/lib/passport";
import { missionPatchSvg } from "@/lib/patch";

function patchFor(destination: "moon" | "mars", vehicleId = "starship", crew = 4, surfaceDays = 90) {
  const design = designMission({ destination, vehicleId, crew, surfaceDays });
  const missionId = passportMissionId(design, passportIssued(new Date("2026-09-17T00:00:00Z")));
  return missionPatchSvg({ design, missionId });
}

describe("mission patch", () => {
  it("emits a standalone circular SVG", () => {
    const svg = patchFor("mars");
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain('viewBox="0 0 420 420"');
    expect(svg).toContain("</svg>");
  });

  it("rocks the destination and the challenge name", () => {
    expect(patchFor("mars")).toContain("MARS CREWED TRANSFER");
    expect(patchFor("moon")).toContain("MOON CREWED TRANSFER");
    expect(patchFor("mars")).toContain("THE NEXT FRONTIER · NASA SPACE APPS 2026");
  });

  it("prints crew and transit time from the design", () => {
    const svg = patchFor("mars", "starship", 4);
    expect(svg).toMatch(/\d+ DAYS · 4 CREW/);
  });

  it("stamps GO when the design closes and UNVERIFIED when TLI capability is undocumented", () => {
    expect(patchFor("mars", "starship")).toContain("GO");
    expect(patchFor("moon", "falcon-9")).toContain("UNVERIFIED");
  });

  it("contains no unrendered or non-finite values", () => {
    for (const d of ["moon", "mars"] as const) {
      const svg = patchFor(d);
      expect(svg).not.toMatch(/NaN|undefined|Infinity/);
    }
  });

  it("is deterministic for the same design and id", () => {
    expect(patchFor("mars")).toBe(patchFor("mars"));
  });

  it("escapes mission text so the SVG stays well-formed", () => {
    const design = designMission({ destination: "mars", vehicleId: "starship", crew: 2, surfaceDays: 30 });
    const svg = missionPatchSvg({ design, missionId: "NF-20260917-A<b>&\"x" });
    expect(svg).toContain("&lt;b&gt;");
    expect(svg).not.toContain("A<b>");
  });
});
