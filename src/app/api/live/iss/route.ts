import { getIssTle } from "@/lib/live";
import { predictPasses, subpointAt, type Observer } from "@/lib/orbit";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const lat = Number(url.searchParams.get("lat"));
  const lon = Number(url.searchParams.get("lon"));

  const tleRes = await getIssTle();
  const tle = { name: tleRes.data.name, line1: tleRes.data.line1, line2: tleRes.data.line2 };
  const now = new Date();

  let subpoint = null;
  let passes: ReturnType<typeof predictPasses> = [];
  try {
    subpoint = subpointAt(tle, now);
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      const obs: Observer = { latDeg: lat, lonDeg: lon, minElevationDeg: 10 };
      passes = predictPasses(tle, obs, now, 24).slice(0, 5);
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
  });
}