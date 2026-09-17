import { describe, it, expect } from "vitest";
import { toCsv, earthMoonTrajectoryCsv, marsTrajectoryCsv, groundTrackKml, downloadCsv } from "@/lib/export";
import {
  getApollo11Samples,
  getMarsTransferSamples,
  interpolateApollo11,
  marsAtTime,
} from "@/lib/trajectory";

describe("CSV export", () => {
  it("joins header and rows with CRLF and a trailing newline", () => {
    const csv = toCsv(["a", "b"], [
      [1, 2],
      [3, 4],
    ]);
    expect(csv).toBe("a,b\r\n1,2\r\n3,4\r\n");
  });

  it("quotes cells containing commas, quotes or newlines", () => {
    const csv = toCsv(
      ["x", "y"],
      [
        ["a,b", 'he said "hi"'],
        ["line1\nline2", "plain"],
      ],
    );
    expect(csv).toContain('"a,b"');
    expect(csv).toContain('"he said ""hi"""');
    expect(csv).toContain('"line1\nline2"');
  });

  it("emits the Apollo header and one row per sample", () => {
    const samples = getApollo11Samples(20);
    const lines = earthMoonTrajectoryCsv(samples).trimEnd().split("\r\n");
    expect(lines[0]).toBe("met_seconds,utc,event,body,x,y,z,vx,vy,vz");
    expect(lines).toHaveLength(21);
  });

  it("carries real interpolated position through for Apollo", () => {
    const t = 0;
    const s = interpolateApollo11(t);
    const row = earthMoonTrajectoryCsv([s]).trimEnd().split("\r\n")[1].split(",");
    expect(Number(row[0])).toBe(0);
    expect(Number(row[4])).toBeCloseTo(s.position.x, 5);
    expect(row[3]).toBe(s.body);
  });

  it("writes heliocentric au values for the Mars transfer", () => {
    const samples = getMarsTransferSamples(10);
    const lines = marsTrajectoryCsv(samples).trimEnd().split("\r\n");
    expect(lines[0].startsWith("met_seconds,utc,event,au_from_sun")).toBe(true);
    expect(lines).toHaveLength(11);
    const first = lines[1].split(",");
    expect(Number(first[3])).toBeCloseTo(1.0, 5);
    expect(Number(first[6])).toBeCloseTo(1.0, 5); // earth_x
    const last = lines[lines.length - 1].split(",");
    expect(Number(last[3])).toBeCloseTo(1.523679, 4);
  });

  it("uses the event label from the transfer state", () => {
    const row = marsTrajectoryCsv([marsAtTime(0)]).trimEnd().split("\r\n")[1];
    expect(row).toContain("Trans-Mars Injection");
  });
});

describe("KML export", () => {
  const track = [
    { latDeg: 29.56, lonDeg: -95.09, altitudeKm: 420.1 },
    { latDeg: 30.12, lonDeg: -94.2, altitudeKm: 421.3 },
    { latDeg: 31.0, lonDeg: -93.0, altitudeKm: 422.0 },
  ];

  it("emits a valid KML document with a LineString", () => {
    const kml = groundTrackKml("ISS ground track", track);
    expect(kml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(kml).toContain('xmlns="http://www.opengis.net/kml/2.2"');
    expect(kml).toContain("<LineString>");
    expect(kml).toContain("</kml>");
  });

  it("writes coordinates as lon,lat,alt in metres", () => {
    const kml = groundTrackKml("ISS", track);
    expect(kml).toContain("-95.09000,29.56000,420100.0");
    expect(kml).toContain("-93.00000,31.00000,422000.0");
  });

  it("marks the latest point with a placemark", () => {
    const kml = groundTrackKml("ISS", track);
    expect(kml).toContain("(latest)");
    expect(kml.match(/<Placemark>/g)).toHaveLength(2);
  });

  it("escapes XML special characters in the name", () => {
    const kml = groundTrackKml('ISS <A&B> "test"', track);
    expect(kml).toContain("ISS &lt;A&amp;B&gt; &quot;test&quot;");
    expect(kml).not.toContain("<A&B>");
  });

  it("handles an empty track without a placemark", () => {
    const kml = groundTrackKml("ISS", []);
    expect(kml).toContain("<LineString>");
    expect(kml).not.toContain("(latest)");
  });

  it("downloadCsv is a safe no-op outside the browser", () => {
    expect(() => downloadCsv("x.csv", "a,b\r\n")).not.toThrow();
  });
});
