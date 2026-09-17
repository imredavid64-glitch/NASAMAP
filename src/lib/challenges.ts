/**
 * Challenge relevance engine — maps the official Space Apps 2026 challenge
 * titles (src/data/challenges-2026.json, extracted from the public GraphQL API)
 * onto the capabilities NASAMAP actually ships. Pure and unit-tested in
 * tests/challenges.test.ts; no fabricated data, only title/category matching.
 */

import challengesRaw from "@/data/challenges-2026.json";

export interface ChallengeRecord {
  id: string;
  title: string;
  categories: string[];
}

export interface ChallengeDataset {
  source: string;
  indexUrl: string;
  retrieved: string;
  challengeYear: number;
  count: number;
  challenges: ChallengeRecord[];
}

export interface RelevanceLane {
  id: string;
  label: string;
  href: string;
  blurb: string;
  pattern: RegExp;
}

/** Lanes mirror the four acts of the platform, in display priority order. */
export const LANES: RelevanceLane[] = [
  {
    id: "mission-design",
    label: "Mission design & Δv",
    href: "/mission",
    blurb: "Rocket selection, Hohmann transfers, mass budget and the GO / NO-GO gate.",
    pattern:
      /mission design|space mission|mission plan|interplanetary|orbital|trajectory|transfer|hohmann|delta-?v|\brocket\b|\blaunch\b/i,
  },
  {
    id: "life-support",
    label: "Life support & ECLSS",
    href: "/mission#ops",
    blurb: "Consumables, radiation dose, closed-loop recycling and solar-array sizing.",
    pattern:
      /life support|survival|habitat|recycl|sustainab|potable|\bwater\b|\bfood\b|health monitoring|astronaut health|radiation|\boxygen\b|home in space|eclss/i,
  },
  {
    id: "flight-3d",
    label: "3D flight & visualization",
    href: "/fly",
    blurb: "Apollo 11 replay, patched-conic transfer flight and mission schematics.",
    pattern: /visualiz|virtual reality|\bvr\b|orrery|\b3d\b|immersive|animation|\bmap\b|render|simulat/i,
  },
  {
    id: "live-feeds",
    label: "Live & near-real-time data",
    href: "/live",
    blurb: "ISS ground track, Voyager range, APOD, near-Earth objects and space weather.",
    pattern:
      /near-?earth|\bneo\b|\biss\b|space station|space weather|meteor|real-?time|\blive\b|tracking|geomagnetic|heliophysic|\bsun\b|eclipse/i,
  },
  {
    id: "storytelling",
    label: "Storytelling & outreach",
    href: "/library",
    blurb: "Explainer library, mission passport & patch, persona advice cards.",
    pattern: /story|outreach|classroom|game|\bart\b|\barts\b|music|youth|educat|celebrat|chronicl|journey|party|tourism|guide/i,
  },
  {
    id: "open-data",
    label: "Open data commons",
    href: "/commons",
    blurb: "Git-as-database datasets, full-text search and validated schemas.",
    pattern: /open science|open data|marketplace|knowledge engine|data commons|dataset|catalog|\bbrowser\b|odyssey|standards|data pathway/i,
  },
];

export const LANE_ORDER: string[] = LANES.map((l) => l.id);

export interface ChallengeMatch extends ChallengeRecord {
  lanes: string[];
  score: number;
}

export function dataset(): ChallengeDataset {
  return challengesRaw as unknown as ChallengeDataset;
}

/** Lane ids whose pattern matches the challenge title, in priority order. */
export function matchLanes(title: string): string[] {
  return LANES.filter((lane) => lane.pattern.test(title)).map((lane) => lane.id);
}

export function annotateChallenge(record: ChallengeRecord): ChallengeMatch {
  const lanes = matchLanes(record.title);
  return { ...record, lanes, score: lanes.length };
}

/** All challenges annotated, matched ones first, each group alphabetical. */
export function annotateChallenges(records: ChallengeRecord[] = dataset().challenges): ChallengeMatch[] {
  return records
    .map(annotateChallenge)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
}

export function laneById(id: string): RelevanceLane | undefined {
  return LANES.find((lane) => lane.id === id);
}

export interface LaneStat {
  lane: RelevanceLane;
  count: number;
}

export function laneStats(matches: ChallengeMatch[] = annotateChallenges()): LaneStat[] {
  return LANES.map((lane) => ({ lane, count: matches.filter((m) => m.lanes.includes(lane.id)).length }));
}

export function servedCount(matches: ChallengeMatch[] = annotateChallenges()): number {
  return matches.filter((m) => m.score > 0).length;
}

export function coveragePct(matches: ChallengeMatch[] = annotateChallenges()): number {
  if (matches.length === 0) return 0;
  return (servedCount(matches) / matches.length) * 100;
}
