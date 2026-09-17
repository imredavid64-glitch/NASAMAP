import type { InterpolatedState, MarsTransferState } from "./trajectory";

export type CsvValue = string | number;

/** RFC-4180-ish CSV: quote fields containing comma, quote, CR or LF; double inner quotes. */
function csvCell(value: CsvValue): string {
  const s = String(value);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Join a header row and data rows into a CRLF-delimited CSV document. */
export function toCsv(header: string[], rows: CsvValue[][]): string {
  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

const round = (n: number, places: number): number => {
  const f = 10 ** places;
  return Math.round(n * f) / f;
};

/** Earth-Moon trajectory (Earth-centred scene units; Apollo 11 or a Hohmann transfer) as an analysis-ready CSV. */
export function earthMoonTrajectoryCsv(samples: InterpolatedState[]): string {
  const header = ["met_seconds", "utc", "event", "body", "x", "y", "z", "vx", "vy", "vz"];
  const rows = samples.map((s) => [
    round(s.met, 1),
    s.utc.toISOString(),
    s.event,
    s.body,
    round(s.position.x, 6),
    round(s.position.y, 6),
    round(s.position.z, 6),
    round(s.velocity.x, 6),
    round(s.velocity.y, 6),
    round(s.velocity.z, 6),
  ]);
  return toCsv(header, rows);
}

/** Earth-Mars heliocentric transfer (astronomical units) as an analysis-ready CSV. */
export function marsTrajectoryCsv(samples: MarsTransferState[]): string {
  const header = [
    "met_seconds",
    "utc",
    "event",
    "au_from_sun",
    "craft_x",
    "craft_y",
    "earth_x",
    "earth_y",
    "mars_x",
    "mars_y",
    "vx_au_per_day",
    "vy_au_per_day",
  ];
  const rows = samples.map((s) => [
    round(s.met, 1),
    s.utc.toISOString(),
    s.event,
    round(s.auFromSun, 6),
    round(s.craftAu.x, 6),
    round(s.craftAu.y, 6),
    round(s.earthAu.x, 6),
    round(s.earthAu.y, 6),
    round(s.marsAu.x, 6),
    round(s.marsAu.y, 6),
    round(s.velocityAuPerDay.x, 6),
    round(s.velocityAuPerDay.y, 6),
  ]);
  return toCsv(header, rows);
}

/** Trigger a browser download of a text file (no-op outside the browser). */
export function downloadFile(filename: string, data: string, mime: string): void {
  if (typeof document === "undefined") return;
  const blob = new Blob([data], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Trigger a browser download of a CSV string (no-op outside the browser). */
export function downloadCsv(filename: string, csv: string): void {
  downloadFile(filename, csv, "text/csv");
}

export interface KmlTrackPoint {
  latDeg: number;
  lonDeg: number;
  altitudeKm: number;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * KML for a satellite ground track, ready to open in Google Earth.
 * Coordinates are written lon,lat,alt (metres) with absolute altitude, so the
 * track floats at the real orbital height; a placemark marks the latest point.
 */
export function groundTrackKml(name: string, points: KmlTrackPoint[]): string {
  const coords = points
    .map((p) => `${p.lonDeg.toFixed(5)},${p.latDeg.toFixed(5)},${(p.altitudeKm * 1000).toFixed(1)}`)
    .join(" ");
  const last = points[points.length - 1];
  const placemark = last
    ? `<Placemark><name>${escapeXml(name)} (latest)</name><Point><altitudeMode>absolute</altitudeMode><coordinates>${last.lonDeg.toFixed(5)},${last.latDeg.toFixed(5)},${(last.altitudeKm * 1000).toFixed(1)}</coordinates></Point></Placemark>`
    : "";
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<kml xmlns="http://www.opengis.net/kml/2.2">',
    "<Document>",
    `<name>${escapeXml(name)}</name>`,
    "<Style><LineStyle><color>ff00f0ff</color><width>2</width></LineStyle></Style>",
    `<Placemark><name>${escapeXml(name)}</name><LineString><altitudeMode>absolute</altitudeMode><tessellate>1</tessellate><coordinates>${coords}</coordinates></LineString></Placemark>`,
    placemark,
    "</Document>",
    "</kml>",
  ].join("\n");
}
