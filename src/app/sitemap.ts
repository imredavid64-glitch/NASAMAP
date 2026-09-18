import type { MetadataRoute } from "next";
import { loadScenarios } from "@/lib/scenarios";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://nasamap.vercel.app";
  const now = new Date();
  const pages = [
    ["/", 1],
    ["/play", 0.9],
    ["/mission", 0.9],
    ["/fly", 0.8],
    ["/live", 0.8],
    ["/library", 0.8],
    ["/commons", 0.7],
    ["/search", 0.5],
    ["/challenges", 0.7],
  ] as const;

  return [
    ...pages.map(([path, priority]) => ({ url: `${base}${path}`, lastModified: now, changeFrequency: "weekly", priority })),
    ...loadScenarios().map((s) => ({
      url: `${base}/play/${s.id}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    })),
  ] as MetadataRoute.Sitemap;
}