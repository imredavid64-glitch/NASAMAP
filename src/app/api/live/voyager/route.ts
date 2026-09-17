import { getVoyager } from "@/lib/live";

export const dynamic = "force-dynamic";

export async function GET() {
  const res = await getVoyager();
  return Response.json({ source: res.source, fetchedAt: res.fetchedAt, bodies: res.data.bodies });
}