/**
 * Astronomy engine — NOAA Solar Calculator equations (US NOAA) plus Moon phase
 * and sidereal time helpers. All functions are pure and unit-tested against
 * reference values in tests/astro.test.ts.
 *
 * Angles in degrees unless a function name says Rad. Distances in km.
 */

export const DEG = Math.PI / 180;
export const RAD = 180 / Math.PI;
export const SYNODIC_MONTH_DAYS = 29.530588853;
export const NEW_MOON_J2000_JD = 2451550.1; // 2000-01-06 18:14 UT

export function toRad(deg: number): number {
  return deg * DEG;
}
export function toDeg(rad: number): number {
  return rad * RAD;
}
export function norm360(deg: number): number {
  return ((deg % 360) + 360) % 360;
}
export function norm180(deg: number): number {
  return ((((deg + 180) % 360) + 360) % 360) - 180;
}

/** Julian Day from a UTC Date. Fraction added from UT noon (Meeus convention). */
export function julianDate(date: Date): number {
  const Y = date.getUTCFullYear();
  const M = date.getUTCMonth() + 1;
  const D =
    date.getUTCDate() +
    (date.getUTCHours() - 12 + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600) / 24;
  const a = Math.floor((14 - M) / 12);
  const y = Y + 4800 - a;
  const m = M + 12 * a - 3;
  return (
    D +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}

export function julianCentury(jd: number): number {
  return (jd - 2451545.0) / 36525;
}

function geomMeanLongSun(T: number): number {
  return norm360(280.46646 + T * (36000.76983 + T * 0.0003032));
}
function geomMeanAnomalySun(T: number): number {
  return 357.52911 + T * (35999.05029 - T * 0.0001537);
}
function earthOrbitEccentricity(T: number): number {
  return 0.016708634 - T * (0.000042037 + 0.0000001267 * T);
}
function sunEqOfCenter(T: number, Mdeg: number): number {
  const Mr = toRad(Mdeg);
  return (
    Math.sin(Mr) * (1.914602 - T * (0.004817 + 0.000014 * T)) +
    Math.sin(2 * Mr) * (0.019993 - 0.000101 * T) +
    Math.sin(3 * Mr) * 0.000289
  );
}

export interface SunParams {
  declinationDeg: number;
  rightAscensionDeg: number;
  apparentLongitudeDeg: number;
  equationOfTimeMin: number;
  meanAnomalyDeg: number;
  eccentricity: number;
  obliquityDeg: number;
}

/** Full NOAA solar position parameters for a given Julian Century. */
export function sunParams(T: number): SunParams {
  const L0 = geomMeanLongSun(T);
  const M = geomMeanAnomalySun(T);
  const e = earthOrbitEccentricity(T);
  const C = sunEqOfCenter(T, M);
  const sunTrueLong = norm360(L0 + C);
  const omega = toRad(125.04 - 1934.136 * T);
  const appLong = sunTrueLong - 0.00569 - 0.00478 * Math.sin(omega);
  const epsilon0 =
    23 + 26 / 60 + 21.448 / 3600 - (T * (46.815 + T * (0.00059 - T * 0.001813))) / 3600;
  const epsilon = epsilon0 + 0.00256 * Math.cos(omega);
  const decl = toDeg(Math.asin(Math.sin(toRad(epsilon)) * Math.sin(toRad(appLong))));
  let ra = toDeg(
    Math.atan2(Math.cos(toRad(epsilon)) * Math.sin(toRad(appLong)), Math.cos(toRad(appLong))),
  );
  ra = norm360(ra);
  const deltaPsi = -0.00569 - 0.00478 * Math.sin(omega);
  const eotRaw = norm180(L0 - 0.0057183 - ra + deltaPsi * Math.cos(toRad(epsilon)));
  const eot = 4 * eotRaw;
  return {
    declinationDeg: decl,
    rightAscensionDeg: ra,
    apparentLongitudeDeg: appLong,
    equationOfTimeMin: eot,
    meanAnomalyDeg: M,
    eccentricity: e,
    obliquityDeg: epsilon,
  };
}

/** Greenwich Mean Sidereal Time in degrees (0-360) for a UTC Date. */
export function gmstDeg(date: Date): number {
  const jd = julianDate(date);
  const T = julianCentury(jd);
  return norm360(
    280.46061837 +
      360.98564736629 * (jd - 2451545.0) +
      0.000387933 * T * T -
      (T * T * T) / 38710000,
  );
}

export interface SunPosition {
  elevationDeg: number;
  azimuthDeg: number;
  zenithDeg: number;
}

/**
 * Solar elevation and azimuth (degrees) for an observer at lat/lon.
 * Refraction correction applied above the horizon.
 */
export function solarPosition(date: Date, latDeg: number, lonDeg: number): SunPosition {
  const T = julianCentury(julianDate(date));
  const { declinationDeg: dec } = sunParams(T);
  const ra = sunParams(T).rightAscensionDeg;
  const ha = toRad(norm360(gmstDeg(date) + lonDeg - ra));
  const lat = toRad(latDeg);
  const d = toRad(dec);
  const sinElev = Math.sin(lat) * Math.sin(d) + Math.cos(lat) * Math.cos(d) * Math.cos(ha);
  let elev = toDeg(Math.asin(Math.max(-1, Math.min(1, sinElev))));
  if (elev > -1) {
    const elevMinus = elev + 10.3 / (elev + 5.11);
    elev += (1.02 / Math.tan(toRad(elevMinus))) / 60 / 10;
  }
  const az =
    toDeg(
      Math.atan2(Math.sin(ha), Math.cos(ha) * Math.sin(lat) - Math.tan(d) * Math.cos(lat)),
    ) + 180;
  return { elevationDeg: elev, azimuthDeg: norm360(az), zenithDeg: 90 - elev };
}

export interface SunriseSunset {
  sunriseUTC: Date;
  sunsetUTC: Date;
  sunriseMinutesFromUTCMidnight: number;
  sunsetMinutesFromUTCMidnight: number;
  dayLengthMin: number;
  dayLengthHours: number;
  polarDay: boolean;
  polarNight: boolean;
}

/**
 * NOAA sunrise/sunset computation (zenith 90.833° = geometric sunset with
 * refraction), all times UTC against the supplied date's UTC midnight.
 */
export function sunriseSunset(
  date: Date,
  latDeg: number,
  lonDeg: number,
  zenithDeg = 90.833,
): SunriseSunset {
  const T = julianCentury(julianDate(date));
  const { declinationDeg: dec, equationOfTimeMin: eot } = sunParams(T);
  const latRad = toRad(latDeg);
  const decRad = toRad(dec);
  const cosHa =
    (Math.cos(toRad(zenithDeg)) - Math.sin(latRad) * Math.sin(decRad)) /
    (Math.cos(latRad) * Math.cos(decRad));

  const solarNoonMin = 720 - 4 * lonDeg - eot;
  if (cosHa > 1) {
    return {
      ...blankDay(),
      dayLengthMin: 0,
      dayLengthHours: 0,
      polarNight: true,
    };
  }
  if (cosHa < -1) {
    return {
      ...blankDay(),
      dayLengthMin: 1440,
      dayLengthHours: 24,
      polarDay: true,
    };
  }
  const haDeg = toDeg(Math.acos(cosHa));
  const sunriseMin = solarNoonMin - 4 * haDeg;
  const sunsetMin = solarNoonMin + 4 * haDeg;
  const dayLengthMin = sunsetMin - sunriseMin;
  return {
    sunriseUTC: dateFromUTCMinutes(date, sunriseMin),
    sunsetUTC: dateFromUTCMinutes(date, sunsetMin),
    sunriseMinutesFromUTCMidnight: wrapDayMinutes(sunriseMin),
    sunsetMinutesFromUTCMidnight: wrapDayMinutes(sunsetMin),
    dayLengthMin,
    dayLengthHours: dayLengthMin / 60,
    polarDay: false,
    polarNight: false,
  };
}

function wrapDayMinutes(min: number): number {
  const m = ((min % 1440) + 1440) % 1440;
  return m;
}

function dateFromUTCMidnight(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function dateFromUTCMinutes(date: Date, minutesFromUTCNoon: number): Date {
  return new Date(dateFromUTCMidnight(date).getTime() + minutesFromUTCNoon * 60_000);
}

/** Day length (hours) for a given date & latitude, via sunrise/sunset. */
export function dayLengthHours(date: Date, latDeg: number, lonDeg = 0): number {
  return sunriseSunset(date, latDeg, lonDeg).dayLengthHours;
}

export interface MoonPhase {
  ageDays: number;
  fraction: number; // 0..1 of synodic cycle (0 = new)
  illumination: number; // 0..1 lit fraction
  name: string;
  elongationDeg: number;
}

/** Moon phase from a UTC Date using the 2000-01-06 new-moon epoch. */
export function moonPhase(date: Date): MoonPhase {
  const jd = julianDate(date);
  const age =
    (((jd - NEW_MOON_J2000_JD) % SYNODIC_MONTH_DAYS) + SYNODIC_MONTH_DAYS) % SYNODIC_MONTH_DAYS;
  const fraction = age / SYNODIC_MONTH_DAYS;
  const illumination = (1 - Math.cos(toRad((age * 360) / SYNODIC_MONTH_DAYS))) / 2;
  return {
    ageDays: age,
    fraction,
    illumination,
    name: phaseName(fraction),
    elongationDeg: fraction * 360,
  };
}

/** Moon phase name from synodic fraction (0=new, 0.5=full). */
function phaseName(f: number): string {
  if (f < 0.0125) return "New Moon";
  if (f < 0.2375) return "Waxing Crescent";
  if (f < 0.2625) return "First Quarter";
  if (f < 0.4875) return "Waxing Gibbous";
  if (f < 0.5125) return "Full Moon";
  if (f < 0.7375) return "Waning Gibbous";
  if (f < 0.7625) return "Last Quarter";
  if (f < 0.9875) return "Waning Crescent";
  return "New Moon";
}

export interface TideFactors {
  coefficient: number; // 0.5 (neap) .. 1 (spring)
  springTide: boolean;
  name: string;
}

/** Simplified equilibrium-tide spring/neap coefficient from solar-lunar elongation. */
export function tideFactors(date: Date): TideFactors {
  const { elongationDeg } = moonPhase(date);
  const elongRad = toRad(elongationDeg);
  const coefficient = 0.5 + 0.5 * Math.abs(Math.cos(elongRad));
  const springTide = coefficient > 0.85;
  return {
    coefficient,
    springTide,
    name: springTide ? "Spring tide window" : coefficient < 0.6 ? "Neap tide window" : "Moderate tides",
  };
}

/**
 * Simplified solunar score (0..100): moon-transit proximity (major periods)
 * weighted by spring/neap. Documented heuristic, not a prediction service.
 */
export function solunarScore(date: Date, lonDeg = 0): number {
  const phase = moonPhase(date);
  const major = proximityScore(phase.fraction, lonDeg, date);
  const lunarBoost = (phase.illumination - 0.5) * 0.6;
  return clamp(round1((major + 30) * (0.6 + 0.8 * lunarBoost)), 0, 100);
}

function proximityScore(fraction: number, _lonDeg: number, _date: Date): number {
  const now = fraction; // moon transit offset in lunar-day terms relative to solar noon
  const maj = Math.cos(toRad(now * 360));
  const score = (Math.max(maj, Math.cos(toRad(now * 360 + 180))) + 1) / 2 * 60;
  return score;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
function round1(v: number): number {
  return Math.round(v * 10) / 10;
}

/** GMST in decimal hours. */
export function gmstHours(date: Date): number {
  return gmstDeg(date) / 15;
}

function blankDay() {
  return {
    sunriseUTC: new Date(0),
    sunsetUTC: new Date(0),
    sunriseMinutesFromUTCMidnight: 0,
    sunsetMinutesFromUTCMidnight: 0,
    polarDay: false,
    polarNight: false,
  };
}