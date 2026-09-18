/**
 * Scenario progress — local star record so the game has continuity across
 * sessions. Mirrors best-score's injectable storage so it is testable without a
 * DOM. Pure and unit-tested in tests/progress.test.ts.
 */

import { type KeyValueStore } from "@/lib/best-score";

export const PROGRESS_STORAGE_KEY = "nasamap.progress.v1";

export interface ScenarioProgress {
  stars: number;
  score: number;
  /** ISO timestamp of the best run. */
  at: string;
}

export type ProgressMap = Record<string, ScenarioProgress>;

export const MAX_STARS = 3;

export function readProgress(store: KeyValueStore | null | undefined): ProgressMap {
  if (!store) return {};
  try {
    const raw = store.getItem(PROGRESS_STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return {};
    const out: ProgressMap = {};
    for (const [id, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof value !== "object" || value === null) continue;
      const v = value as Record<string, unknown>;
      if (typeof v.stars !== "number" || typeof v.score !== "number" || typeof v.at !== "string") continue;
      out[id] = {
        stars: Math.min(MAX_STARS, Math.max(0, Math.round(v.stars))),
        score: v.score,
        at: v.at,
      };
    }
    return out;
  } catch {
    return {};
  }
}

function wins(next: ScenarioProgress, prev: ScenarioProgress | undefined): boolean {
  if (!prev) return true;
  if (next.stars !== prev.stars) return next.stars > prev.stars;
  return next.score > prev.score;
}

/** Records a run, keeping only the best stars/score per scenario. */
export function recordScenarioResult(
  store: KeyValueStore | null | undefined,
  id: string,
  result: { stars: number; score: number; at?: string },
): ProgressMap {
  const map = readProgress(store);
  const candidate: ScenarioProgress = {
    stars: Math.min(MAX_STARS, Math.max(0, Math.round(result.stars))),
    score: result.score,
    at: result.at ?? new Date().toISOString(),
  };
  if (wins(candidate, map[id])) {
    const updated: ProgressMap = { ...map, [id]: candidate };
    if (store) {
      try {
        store.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // storage unavailable — progress is a nicety, never a blocker
      }
    }
    return updated;
  }
  return map;
}

export function starsFor(map: ProgressMap, id: string): number {
  return map[id]?.stars ?? 0;
}

export function totalStars(map: ProgressMap): number {
  return Object.values(map).reduce((sum, p) => sum + p.stars, 0);
}

/** A scenario counts as completed once its objectives and constraints are met (≥2 stars). */
export function completedCount(map: ProgressMap): number {
  return Object.values(map).filter((p) => p.stars >= 2).length;
}
