/**
 * Live data layer. Every helper tries an upstream NASA/NOAA/CelesTrak feed and
 * falls back to a real, sourced snapshot committed in src/data/live-snapshots.json.
 * Responses always carry `source` so the UI can be honest about freshness.
 * Server-side only (route handlers); never imported into client components.
 */

import { lightTime } from "@/lib/comm";
import snapshots from "@/data/live-snapshots.json";

export type FeedSource = "live" | "snapshot";

export interface LiveResult<T> {
  source: FeedSource;
  fetchedAt: string;
  data: T;
}

const TIMEOUT_MS = 6000;

export const SNAPSHOT_FETCHED_AT = snapshots.fetchedAt;

async function getText(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal, cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

async function getJson<T>(url: string): Promise<T> {
  return JSON.parse(await getText(url)) as T;
}

function live<T>(data: T): LiveResult<T> {
  return { source: "live", fetchedAt: new Date().toISOString(), data };
}
function snapshot<T>(data: T): LiveResult<T> {
  return { source: "snapshot", fetchedAt: snapshots.fetchedAt, data };
}

/* ---------------------------------- ISS ---------------------------------- */

export interface IssTleData {
  name: string;
  line1: string;
  line2: string;
}

const ISS_TLE_URL = "https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=TLE";

export async function getIssTle(): Promise<LiveResult<IssTleData>> {
  try {
    const raw = await getText(ISS_TLE_URL);
    const lines = raw
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    const [name, line1, line2] = lines;
    if (!line1?.startsWith("1 ") || !line2?.startsWith("2 ")) throw new Error("bad TLE");
    return live({ name: name ?? "ISS", line1, line2 });
  } catch {
    return snapshot({ name: snapshots.iss.name, line1: snapshots.iss.line1, line2: snapshots.iss.line2 });
  }
}

/* -------------------------------- Voyager -------------------------------- */

export interface VoyagerBody {
  name: string;
  objectId: string;
  distanceAu: number;
  distanceKm: number;
  oneWayLabel: string;
  roundTripLabel: string;
}

export interface VoyagerData {
  bodies: VoyagerBody[];
}

const HORIZONS = "https://ssd.jpl.nasa.gov/api/horizons.api";

async function horizonsRangeAu(objectId: string): Promise<number> {
  const params = new URLSearchParams({
    format: "text",
    COMMAND: `'${objectId}'`,
    EPHEM_TYPE: "OBSERVER",
    CENTER: "'500@399'",
    START_TIME: "'now'",
    STOP_TIME: "'+1d'",
    STEP_SIZE: "'1d'",
    QUANTITIES: "'20'",
  });
  const text = await getText(`${HORIZONS}?${params.toString()}`);
  const soe = text.indexOf("SOE");
  const eoe = text.indexOf("$$EOE");
  if (soe < 0 || eoe < 0) throw new Error("Horizons block missing");
  const block = text.slice(soe + 3, eoe).trim();
  const firstLine = block.split(/\r?\n/).find((l) => l.trim().length > 0);
  const cols = firstLine?.trim().split(/\s+/) ?? [];
  // DATE is two tokens (yyyy-Mon-dd hh:mm); range (AU) is the next numeric 2-token group.
  const numeric = cols.filter((c) => /^-?\d+(\.\d+)?$/.test(c));
  const au = Number(numeric[numeric.length - 2] ?? numeric[0]);
  if (!Number.isFinite(au) || au <= 0) throw new Error("no range value");
  return au;
}

export async function getVoyager(): Promise<LiveResult<VoyagerData>> {
  try {
    const [v1, v2] = await Promise.all([horizonsRangeAu("-31"), horizonsRangeAu("-32")]);
    return live({ bodies: [assembleVoyager("Voyager 1", "-31", v1), assembleVoyager("Voyager 2", "-32", v2)] });
  } catch {
    const s = snapshots.voyager;
    return snapshot({
      bodies: [
        assembleVoyager(s.voyager1.name, s.voyager1.objectId, s.voyager1.distanceAu),
        assembleVoyager(s.voyager2.name, s.voyager2.objectId, s.voyager2.distanceAu),
      ],
    });
  }
}

const AU_KM = 149_597_870.7;

export function assembleVoyager(name: string, objectId: string, distanceAu: number): VoyagerBody {
  const distanceKm = distanceAu * AU_KM;
  const lt = lightTime(distanceKm);
  return {
    name,
    objectId,
    distanceAu,
    distanceKm,
    oneWayLabel: lt.oneWayLabel,
    roundTripLabel: lt.roundTripLabel,
  };
}

/* ---------------------------------- APOD --------------------------------- */

export interface ApodData {
  date: string;
  title: string;
  mediaType: string;
  url: string;
  hdurl?: string;
  copyright?: string;
}

export async function getApod(): Promise<LiveResult<ApodData>> {
  try {
    const raw = await getJson<{
      date: string;
      title: string;
      media_type: string;
      url: string;
      hdurl?: string;
      copyright?: string;
    }>(`https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY`);
    return live({
      date: raw.date,
      title: raw.title,
      mediaType: raw.media_type,
      url: raw.url,
      hdurl: raw.hdurl,
      copyright: raw.copyright?.split("\n")[0]?.trim(),
    });
  } catch {
    const s = snapshots.apod;
    return snapshot({
      date: s.date,
      title: s.title,
      mediaType: s.media_type,
      url: s.url,
      hdurl: s.hdurl,
      copyright: s.copyright,
    });
  }
}

/* ---------------------------------- NEO ---------------------------------- */

export interface NeoObject {
  name: string;
  hazardous: boolean;
  diameterKm: number;
  missKm: number;
  velocityKps: number;
}
export interface NeoData {
  date: string;
  count: number;
  objects: NeoObject[];
}

function utcToday(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function getNeo(): Promise<LiveResult<NeoData>> {
  const day = utcToday();
  try {
    const raw = await getJson<{
      element_count: number;
      near_earth_objects: Record<
        string,
        {
          name: string;
          is_potentially_hazardous_asteroid: boolean;
          estimated_diameter: { kilometers: { estimated_diameter_max: number } };
          close_approach_data: { miss_distance: { kilometers: string }; relative_velocity: { kilometers_per_second: string } }[];
        }[]
      >;
    }>(`https://api.nasa.gov/neo/rest/v1/feed?start_date=${day}&end_date=${day}&api_key=DEMO_KEY`);
    const list = raw.near_earth_objects[day] ?? [];
    return live({
      date: day,
      count: raw.element_count,
      objects: list.slice(0, 5).map((o) => ({
        name: o.name,
        hazardous: o.is_potentially_hazardous_asteroid,
        diameterKm: o.estimated_diameter.kilometers.estimated_diameter_max,
        missKm: Number(o.close_approach_data[0]?.miss_distance.kilometers ?? 0),
        velocityKps: Number(o.close_approach_data[0]?.relative_velocity.kilometers_per_second ?? 0),
      })),
    });
  } catch {
    const s = snapshots.neo;
    return snapshot({ date: s.date, count: s.elementCount, objects: s.sample });
  }
}

/* ----------------------------- Space weather ----------------------------- */

export interface SpaceWeatherData {
  kp: number;
  observedAt: string;
  level: string;
}

export function kpLevel(kp: number): string {
  if (kp >= 7) return "severe storm (G3+)";
  if (kp >= 5) return "geomagnetic storm (G1-G2)";
  if (kp >= 4) return "active";
  if (kp >= 3) return "unsettled";
  return "quiet";
}

export async function getSpaceWeather(): Promise<LiveResult<SpaceWeatherData>> {
  try {
    const rows = await getJson<{ time_tag: string; Kp: number }[]>(
      "https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json",
    );
    const data = rows.slice(1);
    const last = data[data.length - 1];
    if (!last) throw new Error("empty Kp series");
    const kp = Number(last.Kp);
    return live({ kp, observedAt: `${last.time_tag}Z`, level: kpLevel(kp) });
  } catch {
    const s = snapshots.spaceWeather;
    return snapshot({ kp: s.kp, observedAt: s.observedAt, level: s.level });
  }
}