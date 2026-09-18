/**
 * Mission Report Card — a shareable SVG that turns a scored run into a graphic:
 * grade letter, stars, the engine's headline numbers, and the permalink so the
 * image itself carries the proof. Pure string building; unit-tested in
 * tests/report-card.test.ts.
 */

import type { MissionDesign } from "@/lib/mission";
import type { Scenario } from "@/lib/scenarios";
import type { Scorecard } from "@/lib/score";

export interface ReportCardData {
  design: MissionDesign;
  scorecard: Scorecard;
  scenario?: Scenario;
  stars: number;
  missionId: string;
  issuedUTC: string;
  permalink: string;
}

function esc(text: string | number): string {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const W = 800;
const H = 470;
const MONO = "JetBrains Mono, 'Courier New', monospace";
const SANS = "'Inter', Helvetica, Arial, sans-serif";

const GRADE_COLOR: Record<Scorecard["grade"], string> = {
  S: "#34d399",
  A: "#22d3ee",
  B: "#fbbf24",
  C: "#f87171",
  D: "#f87171",
};

interface Stat {
  label: string;
  value: string;
}

function statsFor(d: MissionDesign): Stat[] {
  return [
    { label: "Vehicle", value: d.vehicle.name },
    { label: "Crew", value: String(d.crew) },
    { label: "Surface", value: `${d.surfaceDays} days` },
    { label: "Mission", value: `${d.totalDays.toFixed(0)} days` },
    { label: "Radiation", value: `${d.radiationMsvTotal.toFixed(0)} mSv` },
    { label: "Δv", value: `${d.totalDeltaVKmS.toFixed(2)} km/s` },
    { label: "Stack", value: `${(d.requiredMassKg / 1000).toFixed(1)} t` },
  ];
}

export function reportCardSvg(data: ReportCardData): string {
  const { design, scorecard, scenario, stars, missionId, issuedUTC, permalink } = data;
  const color = GRADE_COLOR[scorecard.grade];
  const stats = statsFor(design);

  const statCells = stats
    .map(
      (s, i) => {
        const x = 32 + (i % 4) * 190;
        const y = 300 + Math.floor(i / 4) * 62;
        return `<g>
  <text x="${x}" y="${y}" fill="#64748b" font-family="${SANS}" font-size="11" letter-spacing="1.5" text-transform="uppercase">${esc(s.label)}</text>
  <text x="${x}" y="${y + 20}" fill="#e2e8f0" font-family="${MONO}" font-size="16">${esc(s.value)}</text>
</g>`;
      },
    )
    .join("\n");

  const starRow =
    stars > 0
      ? `<text x="32" y="258" fill="#fbbf24" font-family="${SANS}" font-size="26">${"★".repeat(stars)}</text>`
      : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0b1120"/>
      <stop offset="1" stop-color="#030712"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect x="0" y="0" width="${W}" height="6" fill="${color}"/>

  <text x="32" y="44" fill="#22d3ee" font-family="${MONO}" font-size="15" letter-spacing="2" font-weight="600">NASA&#160;MAP&nbsp;·&nbsp;MISSION REPORT</text>
  <text x="${W - 32}" y="44" text-anchor="end" fill="#64748b" font-family="${MONO}" font-size="12">${esc(missionId)} · ${esc(issuedUTC.slice(0, 10))}</text>

  <text x="32" y="112" fill="#94a3b8" font-family="${SANS}" font-size="13" letter-spacing="2" text-transform="uppercase">${scenario ? esc(scenario.title) : "Mission Lab · free design"}</text>
  <text x="32" y="148" fill="#e2e8f0" font-family="${SANS}" font-size="24" font-weight="600">${esc(design.destination === "mars" ? "Earth → Mars" : "Earth → Moon")} · crew of ${design.crew}</text>

  <text x="32" y="208" fill="${color}" font-family="${MONO}" font-size="76" font-weight="800">${esc(scorecard.grade)}</text>
  <text x="124" y="204" fill="#e2e8f0" font-family="${MONO}" font-size="26">${scorecard.score}<tspan fill="#64748b" font-size="18">/100</tspan></text>
  <text x="124" y="230" fill="#64748b" font-family="${SANS}" font-size="12">${esc(scorecard.verdict)}</text>
  ${starRow}

  <line x1="32" y1="278" x2="${W - 32}" y2="278" stroke="#1e293b" stroke-width="1"/>
  ${statCells}

  <text x="32" y="${H - 26}" fill="#475569" font-family="${MONO}" font-size="11">${esc(permalink)}</text>
  <text x="${W - 32}" y="${H - 26}" text-anchor="end" fill="#475569" font-family="${SANS}" font-size="11">S–D rating · NASA-Space Apps 2026</text>
</svg>`;
}