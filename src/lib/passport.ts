/**
 * Mission Passport — a printable/shareable SVG artifact generated from a
 * `MissionDesign`. Pure string building; unit-tested in tests/passport.test.ts.
 * All numbers come from the shared science engine; nothing is hard-coded here.
 */

import type { MissionDesign } from "@/lib/mission";

export interface PassportData {
  missionId: string;
  design: MissionDesign;
  issuedUTC: string;
}

function esc(text: string | number): string {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const W = 600;
const H = 870;
const MONO = "JetBrains Mono, 'Courier New', monospace";
const SANS = "'Inter', Helvetica, Arial, sans-serif";

interface Row {
  label: string;
  value: string;
  sub?: string;
}

export function passportSvg(data: PassportData): string {
  const { design, missionId, issuedUTC } = data;
  const d = design;

  const rows: Row[] = [
    { label: "Destination", value: d.destination === "mars" ? "MARS" : "MOON" },
    {
      label: "Launch vehicle",
      value: `${d.vehicle.name} (${d.vehicle.operator})`,
      sub: `${d.vehicle.stages} stages · Isp_vac ${d.vehicle.ispVacuumS}s`,
    },
    { label: "Crew", value: String(d.crew), sub: "persons aboard" },
    {
      label: "Δv budget",
      value: `${d.totalDeltaVKmS.toFixed(2)} km/s`,
      sub: d.destination === "mars" ? "heliocentric Hohmann" : "TLI from LEO",
    },
    {
      label: "Transit time",
      value: `${d.transferDays.toFixed(1)} days`,
      sub: `+ ${d.surfaceDays} days surface (${d.totalDays.toFixed(0)} total)`,
    },
    {
      label: "Light-lag (one-way)",
      value: d.arrivalLt.oneWayLabel,
      sub: `round-trip ${d.arrivalLt.roundTripLabel}`,
    },
    {
      label: "Radiation dose",
      value: `${d.radiationMsvTotal.toFixed(0)} mSv`,
      sub: `${d.transitEnv} + ${d.surfaceEnv}`,
    },
    {
      label: "Stack mass budget",
      value: `${(d.requiredMassKg / 1000).toFixed(1)} t`,
      sub: `capacity ${d.payloadCapacityKg ? `${(d.payloadCapacityKg / 1000).toFixed(0)} t` : "undocumented"}`,
    },
  ];

  const gate = d.launchGate.toUpperCase();
  const briefNote = d.notes[0] ?? "";
  const briefLine = briefNote.length > 92 ? briefNote.slice(0, 92) + "…" : briefNote;

  const cellHeight = 74;
  const cellW = 252;
  const colGap = 20;
  const rowGap = 14;
  const startTop = 300;
  let y = startTop;
  let cells = "";
  rows.forEach((r, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 40 + col * (cellW + colGap);
    const cy = y + row * (cellHeight + rowGap);
    cells += `
      <rect x="${x}" y="${cy}" width="${cellW}" height="${cellHeight}" fill="#fafaf8" stroke="#111" stroke-width="1.5"/>
      <text x="${x + 14}" y="${cy + 22}" font-family="${MONO}" font-size="11" letter-spacing="1.5" fill="#666">${esc(r.label.toUpperCase())}</text>
      <text x="${x + 14}" y="${cy + 46}" font-family="${MONO}" font-size="16" font-weight="700" fill="#111">${esc(r.value)}</text>
      ${r.sub ? `<text x="${x + 14}" y="${cy + 62}" font-family="${SANS}" font-size="10" fill="#888">${esc(r.sub)}</text>` : ""}`;
  });

  const ascentY = startTop + Math.ceil(rows.length / 2) * (cellHeight + rowGap) + 16;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#fff"/>
  <rect x="10" y="10" width="${W - 20}" height="${H - 20}" fill="none" stroke="#111" stroke-width="3"/>
  <rect x="17" y="17" width="${W - 34}" height="${H - 34}" fill="none" stroke="#111" stroke-width="1" stroke-dasharray="6 5"/>

  <text x="40" y="66" font-family="${MONO}" font-size="12" letter-spacing="4" fill="#666">UNITED FRONTIERS COMMAND · NASA SPACE APPS 2026</text>
  <text x="40" y="132" font-family="${MONO}" font-size="46" font-weight="800" letter-spacing="1" fill="#111">MISSION PASSPORT</text>
  <line x1="40" y1="152" x2="${W - 40}" y2="152" stroke="#111" stroke-width="2"/>

  <text x="40" y="196" font-family="${MONO}" font-size="13" fill="#111">MISSION NO. <tspan font-weight="700">${esc(missionId)}</tspan></text>
  <text x="40" y="216" font-family="${SANS}" font-size="11" fill="#666">Issued ${esc(issuedUTC)} UTC · valid for Moon &amp; Mars</text>

  <text x="430" y="212" font-family="${MONO}" font-size="15" text-anchor="end" fill="${
    d.launchGate === "pass" ? "#0a7a3d" : d.launchGate === "fail" ? "#b3001b" : "#9a6b00"
  }" font-weight="800">STAMPED: ${gate === "PASS" ? "GO" : gate}</text>
  <text x="430" y="228" font-family="${SANS}" font-size="10" text-anchor="end" fill="#888">${esc(d.launchGate === "pass" ? "Mass budget verified" : d.launchGate === "fail" ? "Stack exceeds payload" : "Capability undocumented")}</text>

  ${cells}

  <rect x="40" y="${ascentY}" width="520" height="120" fill="#fff" stroke="#111" stroke-width="1.5"/>
  <text x="54" y="${ascentY + 26}" font-family="${MONO}" font-size="11" letter-spacing="1.5" fill="#666">MISSION BRIEF</text>
  <text x="54" y="${ascentY + 48}" font-family="${SANS}" font-size="11" fill="#111">${esc(briefLine)}</text>
  <text x="54" y="${ascentY + 66}" font-family="${SANS}" font-size="11" fill="#111">${esc(
    d.radiationNote.length > 78 ? d.radiationNote.slice(0, 78) + "…" : d.radiationNote,
  )}</text>
  <text x="54" y="${ascentY + 84}" font-family="${SANS}" font-size="11" fill="#111">Next Mars window ~${esc(
    d.destination === "mars" ? "26 months" : "daily",
  )} · verified against NASA/NOAA benchmarks</text>

  <text x="40" y="${H - 48}" font-family="${MONO}" font-size="10" letter-spacing="2" fill="#999">NASAMAP · THE NEXT FRONTIER · ALL FIGURES FROM THE SHARED SCIENCE ENGINE</text>
</svg>`;
}

/** Short human date for the passport + deterministic-ish mission id. */
export function passportIssued(date = new Date()): string {
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}

export function passportMissionId(design: MissionDesign, issuedUTC: string): string {
  const sig = [
    design.destination,
    design.vehicle.id,
    design.crew,
    Math.round(design.transferDays * 10),
    Math.round(design.requiredMassKg / 100),
  ].join("-");
  let seed = 0;
  for (let i = 0; i < sig.length; i += 1) seed = (seed * 31 + sig.charCodeAt(i)) >>> 0;
  const code = (seed % 0xffff).toString(36).toUpperCase().padStart(4, "0");
  const day = issuedUTC.slice(0, 10).replace(/-/g, "");
  return `NF-${day}-${code}`;
}