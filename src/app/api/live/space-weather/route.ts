import { getSpaceWeather } from "@/lib/live";

export const dynamic = "force-dynamic";

export async function GET() {
  const res = await getSpaceWeather();
  return Response.json({ source: res.source, fetchedAt: res.fetchedAt, spaceWeather: res.data });
}