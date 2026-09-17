/* eslint-disable no-console */
/**
 * Data integrity gate — "GitHub is the database", so every dataset must pass
 * structural checks before the app builds. Run: npm run validate:data
 *
 * Failures exit non-zero so CI / pre-push hooks can enforce schema-as-contract.
 */

interface Body {
  id: string;
  name: string;
  type: string;
  radiusKm: number;
  massKg: number;
  gravityMs2: number;
  muKm3s2: number;
  distanceFromSunAU: number | null;
  orbitalPeriodDays: number | null;
  rotationHours: number;
  axialTiltDeg: number;
  escapeVelocityKmS: number;
  temperatureK: number;
  color: string;
  description: string;
  funFacts: string[];
  source: string;
}

interface LaunchVehicle {
  id: string;
  name: string;
  operator: string;
  heightM: number;
  massKg: number;
  payloadLEOKg: number;
  payloadTLIKg?: number;
  payloadGTOKg?: number;
  stages: number;
  ispSeaLevelS: number;
  ispVacuumS: number;
  firstFlight: string;
  engine: string;
  description: string;
  source: string;
}

interface Persona {
  id: string;
  name: string;
  icon: string;
  tagline: string;
  signals: string[];
  action: string;
  description: string;
}

interface Crop {
  id: string;
  name: string;
  photoperiod: string;
  criticalDayLengthHours: { min: number | null; max: number | null };
  daysToMaturity: { min: number; max: number };
  notes: string;
  sourceNote: string;
}

interface MeteorShower {
  id: string;
  name: string;
  peakMonth: number;
  dateRange: [string, string];
  zhPerHour: number;
  parentBody: string;
  notes: string;
}

import fs from "node:fs";
import path from "node:path";

import bodies from "../src/data/bodies.json";
import constants from "../src/data/constants.json";
import launchVehicles from "../src/data/launch-vehicles.json";
import personas from "../src/data/personas.json";
import crops from "../src/data/crops.json";
import meteorShowers from "../src/data/meteor-showers.json";

let failures = 0;
function check(label: string, pass: boolean, detail = "") {
  if (!pass) {
    failures++;
    console.error(`  FAIL  ${label}${detail ? ` — ${detail}` : ""}`);
  } else {
    console.log(`  ok    ${label}`);
  }
}
function isNum(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

console.log("NASAMAP data validation\n");

console.log("constants.json");
check("mu.sun defined & positive", isNum(constants.mu.sun) && constants.mu.sun > 0);
check("speed of light ≈ 299792.458", Math.abs(constants.speedOfLightKmPerSec - 299792.458) < 1e-6);
check("g0 = 9.80665", Math.abs(constants.g0 - 9.80665) < 1e-9);

console.log("bodies.json");
const bodyIds = new Set<string>();
for (const b of bodies as Body[]) {
  const label = `[${b.id}] ${b.name}`;
  check(`${label} unique id`, !bodyIds.has(b.id));
  bodyIds.add(b.id);
  check(`${label} radiusKm>0`, isNum(b.radiusKm) && b.radiusKm > 0);
  check(`${label} massKg>0`, isNum(b.massKg) && b.massKg > 0);
  check(`${label} muKm3s2>0`, isNum(b.muKm3s2) && b.muKm3s2 > 0);
  check(`${label} escape velocity consistent (±5%) with 2μ/r`,
    Math.abs(Math.sqrt((2 * b.muKm3s2) / b.radiusKm) - b.escapeVelocityKmS) / b.escapeVelocityKmS < 0.05);
  check(`${label} tilt in [-180,180]`, Math.abs(b.axialTiltDeg) <= 180);
  check(`${label} source cited`, typeof b.source === "string" && b.source.length > 0);
}

console.log("launch-vehicles.json");
const lvIds = new Set<string>();
for (const l of launchVehicles as LaunchVehicle[]) {
  check(`[${l.id}] unique id`, !lvIds.has(l.id));
  lvIds.add(l.id);
  check(`[${l.id}] payloadLEOKg>0`, isNum(l.payloadLEOKg) && l.payloadLEOKg > 0);
  check(`[${l.id}] isp vacuum > isp sea-level`, l.ispVacuumS > l.ispSeaLevelS);
  check(`[${l.id}] stages 1..5`, l.stages >= 1 && l.stages <= 5);
  check(`[${l.id}] date parseable`, !Number.isNaN(Date.parse(l.firstFlight)));
}

console.log("personas.json");
const knownSignals = new Set([
  "dayLength", "sunPath", "frostWindow", "gnssRisk", "moonPhase", "tides", "solunar",
  "temperature", "insolation", "solarActivity", "hfPropagation", "aurora", "issPass",
  "meteorShowers", "planetEvents",
]);
const personaIds = new Set<string>();
for (const p of personas as Persona[]) {
  check(`[${p.id}] unique id`, !personaIds.has(p.id));
  personaIds.add(p.id);
  check(`[${p.id}] at least 1 signal`, p.signals.length > 0);
  for (const s of p.signals) {
    check(`[${p.id}] signal "${s}" known`, knownSignals.has(s));
  }
}

console.log("crops.json");
const cropIds = new Set<string>();
const photoperiods = new Set(["short-day", "long-day", "day-neutral", "day-neutral"]);
for (const c of crops as Crop[]) {
  check(`[${c.id}] unique id`, !cropIds.has(c.id));
  cropIds.add(c.id);
  check(`[${c.id}] photoperiod valid`, photoperiods.has(c.photoperiod));
  const lo = c.criticalDayLengthHours.min;
  const hi = c.criticalDayLengthHours.max;
  if (lo !== null) check(`[${c.id}] photoperiod min sane`, lo >= 8 && lo <= 20);
  if (hi !== null) check(`[${c.id}] photoperiod max sane`, hi >= 8 && hi <= 20);
  check(`[${c.id}] maturity min<=max`, c.daysToMaturity.min <= c.daysToMaturity.max);
}

console.log("meteor-showers.json");
const showerIds = new Set<string>();
for (const m of meteorShowers as MeteorShower[]) {
  check(`[${m.id}] unique id`, !showerIds.has(m.id));
  showerIds.add(m.id);
  check(`[${m.id}] peakMonth 1..12`, m.peakMonth >= 1 && m.peakMonth <= 12);
  check(`[${m.id}] ZHR sanity`, isNum(m.zhPerHour) && m.zhPerHour > 0 && m.zhPerHour < 1000);
  check(`[${m.id}] dates ISO + ordered`, !Number.isNaN(Date.parse(m.dateRange[0])) && m.dateRange[0] <= m.dateRange[1]);
}

console.log(`\n${failures === 0 ? "✓ ALL DATASETS VALID" : `✗ ${failures} FAILURE(S)`}`);
process.exit(failures === 0 ? 0 : 1);

export { constants };