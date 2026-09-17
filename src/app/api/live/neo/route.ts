import { getNeo } from "@/lib/live";

export const dynamic = "force-dynamic";

export async function GET() {
  const res = await getNeo();
  return Response.json({ source: res.source, fetchedAt: res.fetchedAt, neo: res.data });
}