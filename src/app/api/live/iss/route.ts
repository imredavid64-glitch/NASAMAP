import { getIssTle } from "@/lib/live";
import { predictPasses, subpointAt, type GeoPoint, type Observer } from "@/lib/orbit";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const lat = Number(url.searchParams.get("lat"));
  const lon = Number(url.searchParams.get("lon"));
  const wantTrack = url.searchParams.get("track") === "1";

  const tleRes = await getIssTle();
  const tle = { name: tleRes.data.name, line1: tleRes.data.line1, line2: tleRes.data.line2 };
  const now = new Date();

  let subpoint = null;
  let passes: ReturnType<typeof predictPasses> = [];
  let track: GeoPoint[] = [];
  try {
    subpoint = subpointAt(tle, now);
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      const obs: Observer = { latDeg: lat, lonDeg: lon, minElevationDeg: 10 };
      passes = predictPasses(tle, obs, now, 24).slice(0, 5);
    }
    if (wantTrack) {
      // ~1.5 orbits centred on now, one sample per minute.
      const startMs = now.getTime() - 45 * 60 * 1000;
      for (let i = 0; i <= 135; i += 1) {
        try {
          track.push(subpointAt(tle, new Date(startMs + i * 60 * 1000)));
        } catch {
          // skip a bad sample rather than losing the whole track
        }
      }
    }
  } catch {
    subpoint = null;
  }

  return Response.json({
    source: tleRes.source,
    fetchedAt: tleRes.fetchedAt,
    tle: { name: tleRes.data.name },
    subpoint,
    passes,
    track,
  });
}