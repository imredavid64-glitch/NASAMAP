import { getApod } from "@/lib/live";

export const dynamic = "force-dynamic";

export async function GET() {
  const res = await getApod();
  return Response.json({ source: res.source, fetchedAt: res.fetchedAt, apod: res.data });
}