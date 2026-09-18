import { describe, it, expect } from "vitest";
import { designMission } from "@/lib/mission";
import { scoreMission } from "@/lib/score";
import { scenarioById } from "@/lib/scenarios";
import { reportCardSvg } from "@/lib/report-card";

function run(vehicleId = "starship", crew = 4, surfaceDays = 90) {
  const design = designMission({ destination: "mars", vehicleId, crew, surfaceDays });
  const scorecard = scoreMission(design);
  return { design, scorecard };
}

describe("reportCardSvg", () => {
  it("renders a full SVG with the grade and score", () => {
    const { design, scorecard } = run();
    const svg = reportCardSvg({
      design,
      scorecard,
      stars: 2,
      missionId: "NASAMAP-A1B2",
      issuedUTC: "2026-09-18T00:00:00.000Z",
      permalink: "/play/first-boots-on-mars?d=mars&v=starship&c=4&s=90",
    });
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain("</svg>");
    expect(svg).toContain(scorecard.grade);
    expect(svg).toContain(`${scorecard.score}<tspan`);
  });

  it("paints as many stars as earned", () => {
    const { design, scorecard } = run();
    const svg = reportCardSvg({
      design,
      scorecard,
      stars: 3,
      missionId: "x",
      issuedUTC: "2026-09-18T00:00:00.000Z",
      permalink: "/mission",
    });
    expect(svg.match(/★/g)).toHaveLength(3);
  });

  it("escapes the scenario title and permalink", () => {
    const { design, scorecard } = run("starship", 4, 30);
    const svg = reportCardSvg({
      design,
      scorecard,
      scenario: scenarioById("recycling-on-mars"),
      stars: 1,
      missionId: "x",
      issuedUTC: "2026-09-18T00:00:00.000Z",
      permalink: "/play/<tricky>&path=d",
    });
    expect(svg).toContain("Recycling on Mars");
    expect(svg).toContain("/play/&lt;tricky&gt;&amp;path=d");
    expect(svg).not.toContain("<tricky>");
  });

  it("labels free-play runs as Mission Lab", () => {
    const { design, scorecard } = run();
    const svg = reportCardSvg({
      design,
      scorecard,
      stars: 0,
      missionId: "x",
      issuedUTC: "2026-09-18T00:00:00.000Z",
      permalink: "/mission",
    });
    expect(svg).toContain("Mission Lab");
  });

  it("pins the headline engine numbers on the card", () => {
    const { design, scorecard } = run("sls-block-1", 4, 60);
    const svg = reportCardSvg({
      design,
      scorecard,
      stars: 2,
      missionId: "x",
      issuedUTC: "2026-09-18T00:00:00.000Z",
      permalink: "/mission",
    });
    expect(svg).toContain(String(design.crew));
    expect(svg).toContain(design.vehicle.name);
    expect(svg).toContain(`${design.radiationMsvTotal.toFixed(0)} mSv`);
    expect(svg).toContain(`${design.totalDeltaVKmS.toFixed(2)} km/s`);
  });
});