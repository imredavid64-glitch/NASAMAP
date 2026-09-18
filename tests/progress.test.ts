import { describe, it, expect } from "vitest";
import {
  PROGRESS_STORAGE_KEY,
  readProgress,
  recordScenarioResult,
  starsFor,
  totalStars,
  completedCount,
  type ProgressMap,
} from "@/lib/progress";
import { type KeyValueStore } from "@/lib/best-score";

function memoryStore(initial: Record<string, string> = {}): KeyValueStore & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => {
      data[k] = v;
    },
  };
}

describe("readProgress", () => {
  it("returns an empty map with no store or data", () => {
    expect(readProgress(null)).toEqual({});
    expect(readProgress(memoryStore())).toEqual({});
  });

  it("returns an empty map on malformed JSON", () => {
    expect(readProgress(memoryStore({ [PROGRESS_STORAGE_KEY]: "{oops" }))).toEqual({});
  });

  it("drops invalid entries but keeps valid ones", () => {
    const store = memoryStore({
      [PROGRESS_STORAGE_KEY]: JSON.stringify({
        good: { stars: 2, score: 70, at: "2026-01-01T00:00:00.000Z" },
        bad: { stars: "two", score: 70 },
      }),
    });
    expect(Object.keys(readProgress(store))).toEqual(["good"]);
  });

  it("clamps stars into range", () => {
    const store = memoryStore({
      [PROGRESS_STORAGE_KEY]: JSON.stringify({ hot: { stars: 9, score: 100, at: "x" } }),
    });
    expect(readProgress(store).hot.stars).toBe(3);
  });
});

describe("recordScenarioResult", () => {
  it("stores a first result", () => {
    const store = memoryStore();
    const map = recordScenarioResult(store, "artemis", { stars: 2, score: 75, at: "2026-01-01T00:00:00.000Z" });
    expect(map.artemis).toEqual({ stars: 2, score: 75, at: "2026-01-01T00:00:00.000Z" });
    expect(store.data[PROGRESS_STORAGE_KEY]).toBeDefined();
  });

  it("keeps the best stars, then the best score", () => {
    let map: ProgressMap = { artemis: { stars: 2, score: 75, at: "a" } };
    const store = memoryStore({ [PROGRESS_STORAGE_KEY]: JSON.stringify(map) });
    map = recordScenarioResult(store, "artemis", { stars: 1, score: 99, at: "b" });
    expect(map.artemis.stars).toBe(2);
    expect(map.artemis.score).toBe(75);

    map = recordScenarioResult(store, "artemis", { stars: 3, score: 60, at: "c" });
    expect(map.artemis.stars).toBe(3);
    expect(map.artemis.score).toBe(60);

    map = recordScenarioResult(store, "artemis", { stars: 3, score: 88, at: "d" });
    expect(map.artemis.score).toBe(88);
  });

  it("is a safe no-op without a store", () => {
    const map = recordScenarioResult(null, "x", { stars: 3, score: 90 });
    expect(map.x.stars).toBe(3);
  });
});

describe("progress summaries", () => {
  const map: ProgressMap = {
    a: { stars: 3, score: 90, at: "x" },
    b: { stars: 1, score: 40, at: "x" },
    c: { stars: 2, score: 70, at: "x" },
  };

  it("reports stars per scenario", () => {
    expect(starsFor(map, "a")).toBe(3);
    expect(starsFor(map, "missing")).toBe(0);
  });

  it("totals stars and completed scenarios", () => {
    expect(totalStars(map)).toBe(6);
    expect(completedCount(map)).toBe(2);
  });
});
