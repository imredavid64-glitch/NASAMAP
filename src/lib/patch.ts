/**
 * Mission Patch — a circular embroidered-style insignia generated from a
 * `MissionDesign`. Pure string building; unit-tested in tests/patch.test.ts.
 * Every figure comes from the shared science engine; only the artwork is
 * synthesised here.
 */

import type { MissionDesign } from "@/lib/mission";

export interface PatchData {
  design: MissionDesign;
  missionId: string;
}

const SIZE = 420;
const C = SIZE / 2;
const R_OUTER = 200;
const R_RING = 186;
const R_ROCKER = 168;

const SANS = "'Inter', Helvetica, Arial, sans-serif";
const MONO = "JetBrains Mono, 'Courier New', monospace";

const GATE_COLOR: Record<MissionDesign["launchGate"], string> = {
  pass: "#10b981",
  fail: "#ef4444",
  unknown: "#f59e0b",
};

function esc(text: string | number): string {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function hash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Deterministic starfield inside the ring, seeded by the mission id. */
function stars(seed: string): string {
  let state = hash(seed) || 1;
  const rand = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
  let out = "";
  for (let i = 0; i < 64; i += 1) {
    const angle = rand() * Math.PI * 2;
    const radius = Math.sqrt(rand()) * (R_RING - 14);
    const x = C + Math.cos(angle) * radius;
    const y = C + Math.sin(angle) * radius;
    const r = 0.5 + rand() * 1.3;
    const o = 0.25 + rand() * 0.6;
    out += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="#dbe7ff" opacity="${o.toFixed(2)}"/>`;
  }
  return out;
}

/**
 * Circular mission patch. Orbits in the motif are drawn to scale relative to
 * one another (Earth 1.00 au, Mars 1.52 au); bodies are not to scale.
 */
export function missionPatchSvg(data: PatchData): string {
  const { design, missionId } = data;
  const gate = GATE_COLOR[design.launchGate];
  const dest = design.destination === "mars" ? "MARS" : "MOON";
  const topRocker = `${dest} CREWED TRANSFER`;
  const bottomRocker = "THE NEXT FRONTIER · NASA SPACE APPS 2026";

  // Heliocentric motif, radii proportional to the 1.00 / 1.52 au orbits.
  const rEarth = 58;
  const rMars = rEarth * 1.523679; // ≈ 88.4
  const a = (rEarth + rMars) / 2;
  const c = (rMars - rEarth) / 2;
  const e = c / a;
  const b = a * Math.sqrt(1 - e * e);
  const ellipseCx = C - c;

  const phase = design.destination === "mars" ? 44 : 0;
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const earthX = C + Math.cos(rad(180)) * rEarth;
  const earthY = C + Math.sin(rad(180)) * rEarth;
  const marsAng = 180 + phase;
  const marsX = C + Math.cos(rad(marsAng)) * rMars;
  const marsY = C + Math.sin(rad(marsAng)) * rMars;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs>
    <radialGradient id="patch-field" cx="42%" cy="34%" r="78%">
      <stop offset="0%" stop-color="#15294d"/>
      <stop offset="62%" stop-color="#0a1830"/>
      <stop offset="100%" stop-color="#050c18"/>
    </radialGradient>
    <linearGradient id="patch-rim" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f8fbff"/>
      <stop offset="50%" stop-color="#b9c8e6"/>
      <stop offset="100%" stop-color="#5f7099"/>
    </linearGradient>
    <clipPath id="patch-clip"><circle cx="${C}" cy="${C}" r="${R_OUTER}"/></clipPath>
  </defs>

  <g clip-path="url(#patch-clip)">
    <circle cx="${C}" cy="${C}" r="${R_OUTER}" fill="url(#patch-field)"/>
    <circle cx="${C}" cy="${C}" r="${R_OUTER}" fill="none" stroke="url(#patch-rim)" stroke-width="12"/>
    <circle cx="${C}" cy="${C}" r="${R_OUTER - 15}" fill="none" stroke="${gate}" stroke-width="2.5" opacity="0.85"/>
    <circle cx="${C}" cy="${C}" r="${R_RING}" fill="none" stroke="#7f8fb5" stroke-width="1.5" stroke-dasharray="3 6" opacity="0.6"/>
    ${stars(missionId)}

    <g transform="rotate(-18 ${C} ${C})" opacity="0.95">
      <circle cx="${C}" cy="${C}" r="${rEarth}" fill="none" stroke="#5b7fc4" stroke-width="1.2" opacity="0.7"/>
      <circle cx="${C}" cy="${C}" r="${rMars}" fill="none" stroke="#c96a4a" stroke-width="1.2" opacity="0.7"/>
      <ellipse cx="${ellipseCx.toFixed(1)}" cy="${C}" rx="${a.toFixed(1)}" ry="${b.toFixed(1)}" fill="none" stroke="#f5d67b" stroke-width="1.8" stroke-dasharray="7 5"/>
      <circle cx="${C}" cy="${C}" r="4.4" fill="#ffd24a"/>
      <circle cx="${C}" cy="${C}" r="9" fill="#ffd24a" opacity="0.18"/>
      <circle cx="${earthX.toFixed(1)}" cy="${earthY.toFixed(1)}" r="5.2" fill="#4f8ef7"/>
      <circle cx="${marsX.toFixed(1)}" cy="${marsY.toFixed(1)}" r="4.2" fill="#e2683f"/>
      <circle cx="${(ellipseCx + a).toFixed(1)}" cy="${C}" r="2.6" fill="#f8fbff"/>
    </g>

    <path id="patch-top" d="M ${C - R_ROCKER},${C} A ${R_ROCKER},${R_ROCKER} 0 0 1 ${C + R_ROCKER},${C}" fill="none"/>
    <path id="patch-bottom" d="M ${C - R_ROCKER},${C} A ${R_ROCKER},${R_ROCKER} 0 0 0 ${C + R_ROCKER},${C}" fill="none"/>
    <text font-family="${MONO}" font-size="19" font-weight="700" letter-spacing="3.5" fill="#eaf1ff">
      <textPath href="#patch-top" startOffset="50%" text-anchor="middle">${esc(topRocker)}</textPath>
    </text>
    <text font-family="${MONO}" font-size="12" letter-spacing="2.2" fill="#9fb2da">
      <textPath href="#patch-bottom" startOffset="50%" text-anchor="middle">${esc(bottomRocker)}</textPath>
    </text>

    <text x="${C}" y="${C - 108}" font-family="${MONO}" font-size="13" font-weight="700" letter-spacing="2" text-anchor="middle" fill="${gate}">${esc(
      design.launchGate === "pass" ? "GO" : design.launchGate === "unknown" ? "UNVERIFIED" : "NO-GO",
    )}</text>
    <text x="${C}" y="${C + 120}" font-family="${MONO}" font-size="17" font-weight="800" letter-spacing="1.5" text-anchor="middle" fill="#f3f6ff">${design.transferDays.toFixed(0)} DAYS · ${design.crew} CREW</text>
    <text x="${C}" y="${C + 140}" font-family="${SANS}" font-size="10.5" letter-spacing="1.5" text-anchor="middle" fill="#8ea2cc">${esc(missionId)}</text>
  </g>
</svg>`;
}
