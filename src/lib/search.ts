/**
 * Client-side search index built from static JSON datasets.
 * Uses MiniSearch for fast, zero-config fuzzy search.
 * Import this in any client component; the index is built on first use.
 */

import MiniSearch from "minisearch";
import articles from "@/data/articles.json";
import personas from "@/data/personas.json";
import launchVehicles from "@/data/launch-vehicles.json";
import meteorShowers from "@/data/meteor-showers.json";
import crops from "@/data/crops.json";
import bodies from "@/data/bodies.json";

export interface SearchResult {
  id: string;
  title: string;
  category: string;
  tags: string[];
  excerpt: string;
  score: number;
  type: "article" | "persona" | "vehicle" | "shower" | "crop" | "body";
  url: string;
}

let index: MiniSearch<SearchResult> | null = null;
let docs: SearchResult[] = [];

function buildDocs(): SearchResult[] {
  const result: SearchResult[] = [];

  for (const a of articles) {
    result.push({
      id: `article:${a.slug}`,
      title: a.title,
      category: a.category,
      tags: a.tags,
      excerpt: a.excerpt,
      score: 0,
      type: "article",
      url: `/library/${a.slug}`,
    });
  }

  for (const p of personas) {
    result.push({
      id: `persona:${p.id}`,
      title: p.name,
      category: "Persona",
      tags: p.signals ?? [],
      excerpt: p.description ?? "",
      score: 0,
      type: "persona",
      url: `/commons?persona=${p.id}`,
    });
  }

  for (const v of launchVehicles) {
    result.push({
      id: `vehicle:${v.id}`,
      title: v.name,
      category: "Launch Vehicle",
      tags: [v.operator, `${v.stages}-stage`],
      excerpt: `${v.payloadLEOKg / 1000}t to LEO · ${v.stages} stages`,
      score: 0,
      type: "vehicle",
      url: `/mission?vehicle=${v.id}`,
    });
  }

  for (const m of meteorShowers) {
    result.push({
      id: `shower:${m.id}`,
      title: m.name,
      category: "Meteor Shower",
      tags: [`peak: ${m.peakMonth}`, `ZHR: ${m.zhPerHour}`],
      excerpt: `Peaks around month ${m.peakMonth}, ZHR ${m.zhPerHour}`,
      score: 0,
      type: "shower",
      url: `/commons?shower=${m.id}`,
    });
  }

  for (const c of crops) {
    result.push({
      id: `crop:${c.id}`,
      title: c.name,
      category: "Crop",
      tags: [c.photoperiod],
      excerpt: `${c.daysToMaturity.min}–${c.daysToMaturity.max} days to maturity`,
      score: 0,
      type: "crop",
      url: `/commons?crop=${c.id}`,
    });
  }

  for (const b of bodies) {
    result.push({
      id: `body:${b.id}`,
      title: b.name,
      category: "Celestial Body",
      tags: [`mu: ${b.muKm3s2}`, `radius: ${b.radiusKm} km`],
      excerpt: `μ = ${b.muKm3s2} km³/s², radius ${b.radiusKm} km`,
      score: 0,
      type: "body",
      url: `/library?body=${b.id}`,
    });
  }

  return result;
}

function getIndex(): MiniSearch<SearchResult> {
  if (index) return index;
  docs = buildDocs();
  index = new MiniSearch<SearchResult>({
    fields: ["title", "category", "tags", "excerpt"],
    storeFields: ["title", "category", "tags", "excerpt", "type", "url"],
searchOptions: {
      boost: { title: 3, category: 1, tags: 2, excerpt: 1 },
      fuzzy: 0.2,
      prefix: true,
    },
    idField: "id",
  });
  index.addAll(docs);
  return index;
}

export function search(query: string, limit = 10): SearchResult[] {
  if (!query.trim()) return [];
  const idx = getIndex();
  const hits = idx.search(query);
  return hits.slice(0, limit).map((h) => {
    const doc = docs.find((d) => d.id === h.id);
    return doc ?? ({ ...h } as unknown as SearchResult);
  });
}

export function getAll(): SearchResult[] {
  return [...docs];
}

export function getByType(type: SearchResult["type"]): SearchResult[] {
  return docs.filter((d) => d.type === type);
}

export function getById(id: string): SearchResult | undefined {
  return docs.find((d) => d.id === id);
}