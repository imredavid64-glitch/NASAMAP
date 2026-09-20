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
  missionName?: string;
  vehicleName?: string;
}

const SIZE = 420;
const C = SIZE / 2;
const R_OUTER = 200;
const R_RING = 186;
const R_ROCKER = 168;
const R_INNER = 140;

const SANS = "'Inter', Helvetica, Arial, sans-serif";
const MONO = "JetBrains Mono, 'Courier New', monospace";

const GATE_COLOR: Record<MissionDesign["launchGate"], string> = {
  pass: "#10b981",
  fail: "#ef4444",
  unknown: "#f59e0b",
};

const DESTINATION_THEMES = {
  moon: {
    primary: "#b9c8e6",
    secondary: "#5b7fc4",
    accent: "#f5d67b",
    fieldStart: "#15294d",
    fieldMid: "#0a1830",
    fieldEnd: "#050c18",
    rimStops: ["#f8fbff", "#b9c8e6", "#5f7099"],
    emblem: "moon-landing",
    bodyColor: "#e8e8e8",
    bodyAccent: "#9ca3af",
  },
  mars: {
    primary: "#f5d67b",
    secondary: "#c96a4a",
    accent: "#fb923c",
    fieldStart: "#3d2b1f",
    fieldMid: "#1f140a",
    fieldEnd: "#0d0804",
    rimStops: ["#fef3c7", "#f5d67b", "#c96a4a"],
    emblem: "mars-surface",
    bodyColor: "#e2683f",
    bodyAccent: "#fb923c",
  },
} as const;

function esc(text: string | number): string {
  return String(text)
    .replace(/&/g, "&")
    .replace(/</g, "&" + "lt;")
    .replace(/>/g, "&" + "gt;");
}

function hash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededRandom(seed: string) {
  let state = hash(seed) || 1;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}

/** Deterministic starfield inside the ring, seeded by the mission id. */
function stars(seed: string, count: number, maxRadius: number, color: string, opacityRange: [number, number] = [0.25, 0.85]): string {
  const rand = seededRandom(seed);
  let out = "";
  for (let i = 0; i < count; i += 1) {
    const angle = rand() * Math.PI * 2;
    const radius = Math.sqrt(rand()) * maxRadius;
    const x = C + Math.cos(angle) * radius;
    const y = C + Math.sin(angle) * radius;
    const r = 0.4 + rand() * 1.4;
    const o = opacityRange[0] + rand() * (opacityRange[1] - opacityRange[0]);
    out += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="${color}" opacity="${o.toFixed(2)}"/>`;
  }
  return out;
}

/** Draw a simple lunar module silhouette */
function lunarModule(x: number, y: number, scale: number, color: string): string {
  const s = scale;
  return `
    <g transform="translate(${x}, ${y}) scale(${s})" fill="${color}">
      <!-- Descent stage -->
      <path d="M-12,0 L-8,-10 L8,-10 L12,0 L8,10 L-8,10 Z" opacity="0.9"/>
      <path d="M-10,0 L-6,-7 L6,-7 L10,0 L6,7 L-6,7 Z" opacity="0.6"/>
      <!-- Ascent stage -->
      <path d="M-6,-10 L-3,-18 L3,-18 L6,-10 Z" opacity="0.9"/>
      <path d="M-4,-12 L-2,-16 L2,-16 L4,-12 Z" fill="#fff" opacity="0.3"/>
      <!-- Legs -->
      <line x1="-12" y1="10" x2="-18" y2="18" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="12" y1="10" x2="18" y2="18" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="-8" y1="10" x2="-12" y2="18" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="8" y1="10" x2="12" y2="18" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/>
    </g>
  `;
}

/** Draw a Mars rover silhouette */
function marsRover(x: number, y: number, scale: number, color: string): string {
  const s = scale;
  return `
    <g transform="translate(${x}, ${y}) scale(${s})" fill="${color}">
      <!-- Body -->
      <rect x="-10" y="-8" width="20" height="14" rx="2" opacity="0.9"/>
      <rect x="-7" y="-14" width="14" height="8" rx="1" opacity="0.7"/>
      <!-- Mast -->
      <line x1="0" y1="-14" x2="0" y2="-22" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/>
      <circle cx="0" cy="-22" r="2" fill="${color}" opacity="0.8"/>
      <!-- Wheels -->
      <g stroke="${color}" stroke-width="2" fill="none">
        <circle cx="-11" cy="6" r="5"/>
        <circle cx="11" cy="6" r="5"/>
        <circle cx="-11" cy="-6" r="5"/>
        <circle cx="11" cy="-6" r="5"/>
      </g>
      <!-- Solar panels -->
      <rect x="-22" y="-10" width="14" height="6" rx="1" fill="${color}" opacity="0.5"/>
      <rect x="8" y="-10" width="14" height="6" rx="1" fill="${color}" opacity="0.5"/>
    </g>
  `;
}

/** Draw Olympus Mons silhouette */
function olympusMons(x: number, y: number, scale: number, color: string): string {
  const s = scale;
  return `
    <g transform="translate(${x}, ${y}) scale(${s})" fill="${color}">
      <path d="M-35,10 Q-5,10 -5,-30 Q-5,-30 5,-30 Q5,-30 35,10 Z" opacity="0.6"/>
      <path d="M-20,10 Q0,10 0,-20 Q0,-20 20,10 Z" opacity="0.8"/>
      <ellipse cx="0" cy="-28" rx="8" ry="4" fill="${color}" opacity="0.9"/>
    </g>
  `;
}

/** Draw a rocket launch silhouette */
function rocketLaunch(x: number, y: number, scale: number, color: string): string {
  const s = scale;
  return `
    <g transform="translate(${x}, ${y}) scale(${s})" fill="${color}">
      <!-- Rocket body -->
      <path d="M-4,0 L-4,-30 L-1,-38 L1,-38 L4,-30 L4,0 Z" opacity="0.9"/>
      <path d="M-2,0 L-2,-26 L0,-32 L2,-26 L2,0 Z" fill="#fff" opacity="0.3"/>
      <!-- Fins -->
      <path d="M-4,0 L-10,8 L-2,4 Z" opacity="0.8"/>
      <path d="M4,0 L10,8 L2,4 Z" opacity="0.8"/>
      <!-- Exhaust -->
      <path d="M-3,0 L-1,10 L1,10 L3,0 Z" fill="${color}" opacity="0.6"/>
      <path d="M-2,0 L0,14 L0,0 Z" fill="#fb923c" opacity="0.8"/>
    </g>
  `;
}

/** Draw Earth with continents hint */
function earthGlobe(x: number, y: number, radius: number, color: string): string {
  return `
    <circle cx="${x}" cy="${y}" r="${radius}" fill="${color}" opacity="0.9"/>
    <ellipse cx="${x - radius * 0.3}" cy="${y - radius * 0.1}" rx="${radius * 0.4}" ry="${radius * 0.3}" fill="#2d7a2d" opacity="0.6"/>
    <ellipse cx="${x + radius * 0.2}" cy="${y + radius * 0.2}" rx="${radius * 0.3}" ry="${radius * 0.25}" fill="#2d7a2d" opacity="0.5"/>
  `;
}

/** Draw a simple crater */
function crater(x: number, y: number, radius: number, color: string): string {
  return `
    <circle cx="${x}" cy="${y}" r="${radius}" fill="${color}" opacity="0.4"/>
    <circle cx="${x}" cy="${y}" r="${radius * 0.6}" fill="${color}" opacity="0.2"/>
  `;
}

/** Get vehicle icon based on vehicle ID */
function getVehicleIcon(vehicleId: string): { name: string; icon: (x: number, y: number, scale: number, color: string) => string } {
  const id = vehicleId.toLowerCase();
  if (id.includes("starship") || id.includes("super heavy")) {
    return { name: "Starship", icon: rocketLaunch };
  }
  if (id.includes("sls") || id.includes("space launch")) {
    return { name: "SLS", icon: rocketLaunch };
  }
  if (id.includes("falcon heavy")) {
    return { name: "Falcon Heavy", icon: rocketLaunch };
  }
  if (id.includes("falcon 9")) {
    return { name: "Falcon 9", icon: rocketLaunch };
  }
  if (id.includes("new glenn")) {
    return { name: "New Glenn", icon: rocketLaunch };
  }
  if (id.includes("vulcan")) {
    return { name: "Vulcan", icon: rocketLaunch };
  }
  if (id.includes("ariane")) {
    return { name: "Ariane", icon: rocketLaunch };
  }
  return { name: "Rocket", icon: rocketLaunch };
}

/**
 * Circular mission patch with destination-specific emblems.
 * Orbits in the motif are drawn to scale relative to one another (Earth 1.00 au, Mars 1.52 au).
 */
export function missionPatchSvg(data: PatchData): string {
  const { design, missionId, missionName, vehicleName } = data;
  const theme = DESTINATION_THEMES[design.destination];
  const gate = GATE_COLOR[design.launchGate];
  const dest = design.destination === "mars" ? "MARS" : "MOON";
  const topRocker = missionName ? esc(missionName).toUpperCase() : `${dest} CREWED TRANSFER`;
  const bottomRocker = vehicleName ? `${esc(vehicleName).toUpperCase()} · NASA SPACE APPS 2026` : "THE NEXT FRONTIER · NASA SPACE APPS 2026";

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

  // Emblem positioning
  const emblemX = C;
  const emblemY = C + 10;
  const emblemScale = design.destination === "mars" ? 1.2 : 1.0;

  // Vehicle icon
  const vehicleIcon = getVehicleIcon(vehicleName || design.vehicle.name);
  const vehicleX = C - 100;
  const vehicleY = C - 60;

  // Stars with destination-appropriate color
  const starColor = design.destination === "mars" ? "#fef3c7" : "#dbe7ff";
  const starField = stars(missionId + "-stars", 72, R_RING - 16, starColor, [0.2, 0.7]);

  // Gradient definitions
  const fieldGrad = `
    <radialGradient id="patch-field" cx="42%" cy="34%" r="78%">
      <stop offset="0%" stop-color="${theme.fieldStart}"/>
      <stop offset="62%" stop-color="${theme.fieldMid}"/>
      <stop offset="100%" stop-color="${theme.fieldEnd}"/>
    </radialGradient>
  `;
  const rimGrad = `
    <linearGradient id="patch-rim" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${theme.rimStops[0]}"/>
      <stop offset="50%" stop-color="${theme.rimStops[1]}"/>
      <stop offset="100%" stop-color="${theme.rimStops[2]}"/>
    </linearGradient>
  `;

  // Emblem rendering
  let emblemSvg = "";
  if (theme.emblem === "moon-landing") {
    emblemSvg = `
      ${lunarModule(emblemX, emblemY, emblemScale, theme.primary)}
      ${crater(emblemX - 50, emblemY + 40, 12, theme.bodyAccent)}
      ${crater(emblemX + 45, emblemY + 25, 8, theme.bodyAccent)}
      ${crater(emblemX - 30, emblemY - 20, 6, theme.bodyAccent)}
    `;
  } else if (theme.emblem === "mars-surface") {
    emblemSvg = `
      ${olympusMons(emblemX + 20, emblemY + 60, 0.6, theme.secondary)}
      ${marsRover(emblemX - 30, emblemY + 20, emblemScale * 0.8, theme.primary)}
      ${crater(emblemX - 60, emblemY - 10, 10, theme.secondary)}
      ${crater(emblemX + 50, emblemY + 50, 15, theme.secondary)}
      ${crater(emblemX + 10, emblemY - 30, 8, theme.secondary)}
    `;
  }

  // Vehicle icon
  const vehicleSvg = vehicleIcon.icon(vehicleX, vehicleY, 0.6, theme.primary);

  // Earth and Mars bodies
  const earthSvg = earthGlobe(earthX, earthY, 5.2, theme.bodyColor);
  const marsSvg = `<circle cx="${marsX.toFixed(1)}" cy="${marsY.toFixed(1)}" r="4.2" fill="${theme.bodyColor}"/>`;
  const sunSvg = `<circle cx="${C}" cy="${C}" r="4.4" fill="#ffd24a"/><circle cx="${C}" cy="${C}" r="9" fill="#ffd24a" opacity="0.18"/>`;

  const orbitRotation = design.destination === "mars" ? -18 : -18;
  const transferEllipse = design.destination === "mars" ? `
    <ellipse cx="${ellipseCx.toFixed(1)}" cy="${C}" rx="${a.toFixed(1)}" ry="${b.toFixed(1)}" fill="none" stroke="${theme.accent}" stroke-width="1.8" stroke-dasharray="7 5" opacity="0.8"/>
    <circle cx="${(ellipseCx + a).toFixed(1)}" cy="${C}" r="2.6" fill="#f8fbff"/>
  ` : `
    <ellipse cx="${ellipseCx.toFixed(1)}" cy="${C}" rx="${a.toFixed(1)}" ry="${b.toFixed(1)}" fill="none" stroke="${theme.accent}" stroke-width="1.8" stroke-dasharray="7 5" opacity="0.8"/>
  `;

  const gateText = design.launchGate === "pass" ? "GO" : design.launchGate === "unknown" ? "UNVERIFIED" : "NO-GO";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs>
    ${fieldGrad}
    ${rimGrad}
    <clipPath id="patch-clip"><circle cx="${C}" cy="${C}" r="${R_OUTER}"/></clipPath>
  </defs>

  <g clip-path="url(#patch-clip)">
    <circle cx="${C}" cy="${C}" r="${R_OUTER}" fill="url(#patch-field)"/>
    <circle cx="${C}" cy="${C}" r="${R_OUTER}" fill="none" stroke="url(#patch-rim)" stroke-width="12"/>
    <circle cx="${C}" cy="${C}" r="${R_OUTER - 15}" fill="none" stroke="${gate}" stroke-width="2.5" opacity="0.85"/>
    <circle cx="${C}" cy="${C}" r="${R_RING}" fill="none" stroke="#7f8fb5" stroke-width="1.5" stroke-dasharray="3 6" opacity="0.5"/>
    ${starField}

    <!-- Heliocentric orbits -->
    <g transform="rotate(${orbitRotation} ${C} ${C})" opacity="0.9">
      <circle cx="${C}" cy="${C}" r="${rEarth}" fill="none" stroke="${theme.secondary}" stroke-width="1.2" opacity="0.7"/>
      <circle cx="${C}" cy="${C}" r="${rMars}" fill="none" stroke="${theme.bodyAccent}" stroke-width="1.2" opacity="0.7"/>
      ${transferEllipse}
      ${sunSvg}
      ${earthSvg}
      ${marsSvg}
    </g>

    <!-- Destination emblem -->
    <g transform="translate(0, 0)">
      ${emblemSvg}
    </g>

    <!-- Vehicle icon -->
    ${vehicleSvg}

    <!-- Top rocker -->
    <path id="patch-top" d="M ${C - R_ROCKER},${C} A ${R_ROCKER},${R_ROCKER} 0 0 1 ${C + R_ROCKER},${C}" fill="none"/>
    <text font-family="${MONO}" font-size="19" font-weight="700" letter-spacing="3.5" fill="#eaf1ff">
      <textPath href="#patch-top" startOffset="50%" text-anchor="middle">${topRocker}</textPath>
    </text>

    <!-- Bottom rocker -->
    <path id="patch-bottom" d="M ${C - R_ROCKER},${C} A ${R_ROCKER},${R_ROCKER} 0 0 0 ${C + R_ROCKER},${C}" fill="none"/>
    <text font-family="${MONO}" font-size="11" letter-spacing="1.8" fill="#9fb2da">
      <textPath href="#patch-bottom" startOffset="50%" text-anchor="middle">${bottomRocker}</textPath>
    </text>

    <!-- Center info -->
    <text x="${C}" y="${C - 108}" font-family="${MONO}" font-size="13" font-weight="700" letter-spacing="2" text-anchor="middle" fill="${gate}">${esc(gateText)}</text>
    <text x="${C}" y="${C + 120}" font-family="${MONO}" font-size="17" font-weight="800" letter-spacing="1.5" text-anchor="middle" fill="#f3f6ff">${design.transferDays.toFixed(0)} DAYS · ${design.crew} CREW</text>
    <text x="${C}" y="${C + 140}" font-family="${SANS}" font-size="10.5" letter-spacing="1.5" text-anchor="middle" fill="#8ea2cc">${esc(missionId)}</text>
  </g>
</svg>`;
}