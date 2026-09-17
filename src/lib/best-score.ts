/**
 * Local best-score tracking — the replay hook for the Mission Design Game.
 *
 * Keeps a small per-destination personal best in localStorage so a designer can
 * beat their own grade across sessions. The scoring logic is pure and injected
 * with a minimal storage interface, so it is unit-tested in
 * tests/best-score.test.ts without a DOM.
 */

import { type Scorecard } from "@/lib/score";

export interface BestRecord {
  grade: Scorecard["grade"];
  score: number;
  /** ISO timestamp of when the record was set. */
  at: string;
}

/** Minimal slice of the Web Storage API the tracker needs (injectable for tests). */
export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const BEST_STORAGE_PREFIX = "nasamap.best.";

const GRADES: Scorecard["grade"][] = ["D", "C", "B", "A", "S"];

export function bestKey(destination: string): string {
  return `${BEST_STORAGE_PREFIX}${destination}`;
}

function gradeRank(grade: Scorecard["grade"]): number {
  return GRADES.indexOf(grade);
}

/** True when `next` should replace `prev` — higher score, then higher grade. */
export function isBetter(
  next: Pick<BestRecord, "grade" | "score">,
  prev: BestRecord | null,
): boolean {
  if (!prev) return true;
  if (next.score !== prev.score) return next.score > prev.score;
  return gradeRank(next.grade) > gradeRank(prev.grade);
}

/** Keeps whichever record wins; ties keep the existing record. */
export function pickBest(prev: BestRecord | null, next: BestRecord): BestRecord {
  return isBetter(next, prev) ? next : (prev as BestRecord);
}

function isRecord(value: unknown): value is BestRecord {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.score === "number" &&
    GRADES.includes(v.grade as Scorecard["grade"]) &&
    typeof v.at === "string"
  );
}

/** Read and validate the stored best for a destination. Never throws. */
export function readBest(store: KeyValueStore | null | undefined, destination: string): BestRecord | null {
  if (!store) return null;
  try {
    const raw = store.getItem(bestKey(destination));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** Persist a best. No-op when there is no store (SSR) or storage is unavailable. */
export function writeBest(
  store: KeyValueStore | null | undefined,
  destination: string,
  record: BestRecord,
): void {
  if (!store) return;
  try {
    store.setItem(bestKey(destination), JSON.stringify(record));
  } catch {
    // private mode / quota — best tracking is a nicety, never a blocker
  }
}
