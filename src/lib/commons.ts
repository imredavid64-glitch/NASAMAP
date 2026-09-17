/**
 * Cosmic Commons engine — turns shared sky data into one actionable card per
 * persona. Everything computable offline comes from the astro engine; signals
 * that genuinely require a live feed (solar wind, TLE passes) are marked "live"
 * and never fabricated. Unit-tested in tests/commons.test.ts.
 */

import {
  sunriseSunset,
  dayLengthHours,
  moonPhase,
  tideFactors,
  solunarScore,
  sunParams,
  julianCentury,
  julianDate,
  toRad,
  toDeg,
} from "@/lib/astro";
import personasData from "@/data/personas.json";
import cropsData from "@/data/crops.json";
import showersData from "@/data/meteor-showers.json";

export interface Persona {
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
  photoperiod: "short-day" | "long-day" | "day-neutral";
  criticalDayLengthHours: { min: number | null; max: number | null };
  notes: string;
  sourceNote: string;
}

interface Shower {
  id: string;
  name: string;
  peakMonth: number;
  dateRange: [string, string];
  zhPerHour: number;
  notes: string;
}

export const PERSONAS = personasData as Persona[];
const CROPS = cropsData as Crop[];
const SHOWERS = showersData as unknown as Shower[];

export type SignalStatus = "computed" | "seasonal" | "live";

export interface SkySignal {
  id: string;
  label: string;
  value: string;
  status: SignalStatus;
  detail: string;
  source: string;
}

export interface SkyCard {
  persona: Persona;
  dateISO: string;
  latDeg: number;
  lonDeg: number;
  rating: number | null;
  ratingLabel: string;
  action: string;
  signals: SkySignal[];
  cropHint?: { name: string; status: string };
  honesty: string;
}

export interface CommonsOptions {
  personaId: string;
  date: Date;
  latDeg: number;
  lonDeg: number;
}

function f1(v: number): string {
  return (Math.round(v * 10) / 10).toString();
}

function dayOfYear(date: Date): number {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  return Math.floor((date.getTime() - start) / 86400000);
}

function maxSolarElevation(date: Date, latDeg: number): number {
  const T = julianCentury(julianDate(date));
  const { declinationDeg } = sunParams(T);
  return 90 - Math.abs(latDeg - declinationDeg);
}

/** Clear-sky relative insolation vs the same latitude's equinox baseline (index, not kWh). */
export function insolationIndex(date: Date, latDeg: number): number {
  const dl = dayLengthHours(date, latDeg);
  const elevNow = Math.max(0, maxSolarElevation(date, latDeg));
  const now = dl * Math.sin(toRad(elevNow));
  const equinox = 12 * Math.sin(toRad(90 - Math.abs(latDeg)));
  if (equinox <= 0) return 0;
  return now / equinox;
}

function dayLengthTrend(date: Date, latDeg: number): number {
  const future = new Date(date.getTime() + 10 * 86400000);
  return (dayLengthHours(future, latDeg) - dayLengthHours(date, latDeg)) / 10; // hours per day
}

function nearestShower(date: Date): { shower: Shower; daysTo: number } | null {
  let best: { shower: Shower; daysTo: number } | null = null;
  for (const s of SHOWERS) {
    const peak = new Date(`${s.dateRange[0]}T00:00:00Z`);
    let diffDays = Math.abs((peak.getTime() - date.getTime()) / 86400000);
    if (diffDays > 182) diffDays = 365 - diffDays; // wrap the year
    if (!best || diffDays < best.daysTo) best = { shower: s, daysTo: diffDays };
  }
  return best;
}

function frostBand(date: Date, latDeg: number): { band: string; detail: string } {
  const month = date.getUTCMonth() + 1;
  const north = latDeg >= 0;
  const seasonMonth = north ? month : ((month + 5) % 12) + 1;
  const dl = dayLengthHours(date, latDeg);
  if (seasonMonth <= 2 || seasonMonth >= 11) {
    return { band: "high", detail: `deep winter, ${f1(dl)} h of daylight — hard-freeze window` };
  }
  if (seasonMonth <= 4 || seasonMonth >= 9) {
    return { band: "elevated", detail: `shoulder season, ${f1(dl)} h of daylight — frost nights still likely` };
  }
  if (seasonMonth <= 5 || seasonMonth >= 8) {
    return { band: "low", detail: `late-season, ${f1(dl)} h of daylight — watch radiational frost` };
  }
  return { band: "minimal", detail: `peak season, ${f1(dl)} h of daylight` };
}

function cropHint(date: Date, latDeg: number): { name: string; status: string } {
  const dl = dayLengthHours(date, latDeg);
  const trend = dayLengthTrend(date, latDeg);
  const matching = CROPS.filter((c) => {
    if (c.photoperiod === "short-day") return trend < 0 && dl < 14;
    if (c.photoperiod === "long-day") return trend > 0 && dl > 12;
    return true;
  });
  const pick = matching[0] ?? CROPS.find((c) => c.photoperiod === "day-neutral")!;
  const status =
    pick.photoperiod === "day-neutral"
      ? "day-neutral — temperature, not daylight, sets the clock"
      : trend < 0
        ? "short-day signal building"
        : "long-day signal building";
  return { name: pick.name, status };
}

type Ctx = { date: Date; latDeg: number; lonDeg: number };

const BUILDERS: Record<string, (ctx: Ctx) => SkySignal> = {
  dayLength: ({ date, latDeg, lonDeg }) => {
    const s = sunriseSunset(date, latDeg, lonDeg);
    const trend = dayLengthTrend(date, latDeg);
    return {
      id: "dayLength",
      label: "Day length",
      value: `${f1(s.dayLengthHours)} h`,
      status: "computed",
      detail: `${trend >= 0 ? "lengthening" : "shortening"} ${f1(Math.abs(trend) * 60)} min/day${
        s.polarDay ? " · midnight sun" : s.polarNight ? " · polar night" : ""
      }`,
      source: "NOAA Solar Calculator equations",
    };
  },
  sunPath: ({ date, latDeg }) => {
    const elev = Math.max(0, maxSolarElevation(date, latDeg));
    return {
      id: "sunPath",
      label: "Peak sun",
      value: `${f1(elev)}° elevation`,
      status: "computed",
      detail: `optimal fixed panel tilt ≈ ${f1(Math.abs(latDeg))}° for the year`,
      source: "NOAA solar geometry",
    };
  },
  moonPhase: ({ date }) => {
    const p = moonPhase(date);
    return {
      id: "moonPhase",
      label: "Moon",
      value: `${Math.round(p.illumination * 100)}% lit`,
      status: "computed",
      detail: `${p.name} · ${f1(p.ageDays)} days into the cycle`,
      source: "Synodic-cycle model (epoch 2000-01-06)",
    };
  },
  tides: ({ date }) => {
    const t = tideFactors(date);
    return {
      id: "tides",
      label: "Tide coefficient",
      value: `${Math.round(t.coefficient * 100)} / 100`,
      status: "computed",
      detail: t.name,
      source: "Equilibrium tide (solar-lunar elongation)",
    };
  },
  solunar: ({ date, lonDeg }) => {
    const score = solunarScore(date, lonDeg);
    return {
      id: "solunar",
      label: "Solunar activity",
      value: `${Math.round(score)} / 100`,
      status: "computed",
      detail: "major feeding windows near moon transit — heuristic, not a prediction service",
      source: "Solunar heuristic (documented)",
    };
  },
  insolation: ({ date, latDeg }) => {
    const idx = insolationIndex(date, latDeg);
    return {
      id: "insolation",
      label: "Clear-sky sun index",
      value: `${Math.round(idx * 100)} %`,
      status: "computed",
      detail: "relative to this latitude's equinox noon baseline (index, not kWh)",
      source: "NOAA geometry",
    };
  },
  frostWindow: ({ date, latDeg }) => {
    const fb = frostBand(date, latDeg);
    return {
      id: "frostWindow",
      label: "Frost risk",
      value: fb.band,
      status: "seasonal",
      detail: `${fb.detail} · confirm with your local station`,
      source: "Seasonal photoperiod estimate",
    };
  },
  meteorShowers: ({ date }) => {
    const near = nearestShower(date);
    if (!near) {
      return {
        id: "meteorShowers",
        label: "Meteor shower",
        value: "none logged",
        status: "seasonal",
        detail: "no shower in the catalogue near this date",
        source: "IMO annual shower catalogue (stored in repo)",
      };
    }
    return {
      id: "meteorShowers",
      label: "Meteor shower",
      value: near.daysTo < 1 ? "peak tonight" : near.daysTo < 2 ? "peaking now" : `${Math.round(near.daysTo)} days out`,
      status: "seasonal",
      detail: `${near.shower.name} · ZHR ≈ ${near.shower.zhPerHour}/h · ${near.shower.notes}`,
      source: "IMO annual shower catalogue (stored in repo)",
    };
  },
};

const LIVE_FEEDS: Record<string, { label: string; detail: string; source: string }> = {
  solarActivity: {
    label: "Solar activity",
    detail: "sunspot number & flare class arrive from NOAA SWPC at runtime",
    source: "NOAA SWPC (live)",
  },
  hfPropagation: {
    label: "HF propagation",
    detail: "ionospheric MUF/foF2 forecast from the live space-weather feed",
    source: "NOAA SWPC (live)",
  },
  gnssRisk: {
    label: "GNSS integrity",
    detail: "GPS/GNSS disturbance level from the live space-weather feed",
    source: "NOAA SWPC (live)",
  },
  aurora: {
    label: "Aurora",
    detail: "Kp index & oval forecast from the live space-weather feed",
    source: "NOAA SWPC (live)",
  },
  issPass: {
    label: "ISS pass",
    detail: "needs live TLEs propagated at request time",
    source: "CelesTrak TLE (live)",
  },
  planetEvents: {
    label: "Planet events",
    detail: "conjunctions & oppositions from the live almanac feed",
    source: "NASA/JPL almanac (live)",
  },
  temperature: {
    label: "Air temperature",
    detail: "from the local weather feed at runtime",
    source: "Weather feed (live)",
  },
  solarFlux: {
    label: "Solar flux",
    detail: "F10.7 cm flux from the live space-weather feed",
    source: "NOAA SWPC (live)",
  },
};

function buildSignal(id: string, ctx: Ctx): SkySignal {
  const builder = BUILDERS[id];
  if (builder) return builder(ctx);
  const live = LIVE_FEEDS[id];
  return {
    id,
    label: live?.label ?? id,
    value: "live feed",
    status: "live",
    detail: live?.detail ?? "requires a live feed",
    source: live?.source ?? "live",
  };
}

function rate(personaId: string, ctx: Ctx): { rating: number | null; label: string } {
  const { date, latDeg, lonDeg } = ctx;
  switch (personaId) {
    case "farmer": {
      const dl = dayLengthHours(date, latDeg);
      const trend = dayLengthTrend(date, latDeg);
      const band = frostBand(date, latDeg).band;
      const bandPenalty = band === "high" ? 35 : band === "elevated" ? 20 : band === "low" ? 8 : 0;
      const photoperiod = Math.max(0, Math.min(100, ((dl - 8) / 6) * 100));
      const drift = trend > 0 ? 70 : 40;
      return {
        rating: Math.round(Math.max(0, Math.min(100, 0.5 * photoperiod + 0.5 * drift - bandPenalty))),
        label: "field-day suitability",
      };
    }
    case "fisher": {
      const score = solunarScore(date, lonDeg);
      const tide = tideFactors(date).coefficient * 100;
      return { rating: Math.round(0.6 * score + 0.4 * tide), label: "casting conditions" };
    }
    case "beekeeper": {
      const dl = dayLengthHours(date, latDeg);
      return { rating: Math.round(Math.max(0, Math.min(100, ((dl - 9) / 6) * 100))), label: "forage window" };
    }
    case "solar": {
      const idx = insolationIndex(date, latDeg);
      return { rating: Math.round(Math.max(0, Math.min(100, idx * 100))), label: "generation potential" };
    }
    case "astrophotographer": {
      const dark = 1 - moonPhase(date).illumination;
      const near = nearestShower(date);
      const showerBonus = near && near.daysTo < 3 ? 25 : 0;
      return { rating: Math.round(Math.min(100, dark * 100 + showerBonus)), label: "dark-sky window" };
    }
    case "family": {
      const near = nearestShower(date);
      const showerBoost = near && near.daysTo < 14 ? 30 : 0;
      return { rating: Math.min(100, 55 + showerBoost), label: "skywatching appeal" };
    }
    case "student":
      return { rating: 100, label: "lesson-ready" };
    default:
      return { rating: null, label: "awaiting live feed" };
  }
}

export function buildSkyCard(opts: CommonsOptions): SkyCard {
  const persona = PERSONAS.find((p) => p.id === opts.personaId) ?? PERSONAS[0];
  const ctx: Ctx = { date: opts.date, latDeg: opts.latDeg, lonDeg: opts.lonDeg };
  const { rating, label } = rate(persona.id, ctx);
  const signals = persona.signals.map((id) => buildSignal(id, ctx));
  const hasLive = signals.some((s) => s.status === "live");

  return {
    persona,
    dateISO: opts.date.toISOString().slice(0, 10),
    latDeg: opts.latDeg,
    lonDeg: opts.lonDeg,
    rating,
    ratingLabel: label,
    action: persona.action,
    signals,
    cropHint: persona.id === "farmer" ? cropHint(opts.date, opts.latDeg) : undefined,
    honesty: hasLive
      ? "Marked signals need a live feed (NOAA SWPC / CelesTrak) and are shown as pending by design — offline snapshots are stored in the repo."
      : "All figures on this card are computed offline from stored, cited datasets.",
  };
}

export const SIGNAL_LIBRARY = [...Object.keys(BUILDERS), ...Object.keys(LIVE_FEEDS)];
export { dayOfYear, maxSolarElevation, nearestShower };