import { describe, it, expect } from "vitest";
import {
  BEST_STORAGE_PREFIX,
  bestKey,
  isBetter,
  pickBest,
  readBest,
  writeBest,
  type BestRecord,
  type KeyValueStore,
} from "@/lib/best-score";

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

const rec = (grade: BestRecord["grade"], score: number, at = "2026-01-01T00:00:00.000Z"): BestRecord => ({
  grade,
  score,
  at,
});

describe("bestKey", () => {
  it("namespaces per destination", () => {
    expect(bestKey("mars")).toBe(`${BEST_STORAGE_PREFIX}mars`);
    expect(bestKey("moon")).toBe("nasamap.best.moon");
  });
});

describe("isBetter", () => {
  it("any record beats none", () => {
    expect(isBetter(rec("D", 10), null)).toBe(true);
  });
  it("higher score wins", () => {
    expect(isBetter(rec("C", 60), rec("A", 55))).toBe(true);
    expect(isBetter(rec("S", 70), rec("S", 90))).toBe(false);
  });
  it("breaks score ties by grade", () => {
    expect(isBetter(rec("A", 80), rec("B", 80))).toBe(true);
    expect(isBetter(rec("B", 80), rec("A", 80))).toBe(false);
  });
  it("an identical record is not better", () => {
    expect(isBetter(rec("A", 80), rec("A", 80))).toBe(false);
  });
});

describe("pickBest", () => {
  it("returns the next record when it wins", () => {
    const next = rec("S", 95);
    expect(pickBest(rec("B", 70), next)).toBe(next);
  });
  it("keeps the previous record on a tie", () => {
    const prev = rec("A", 80);
    expect(pickBest(prev, rec("A", 80, "2026-02-02T00:00:00.000Z"))).toBe(prev);
  });
});

describe("readBest / writeBest", () => {
  it("round-trips a record", () => {
    const store = memoryStore();
    writeBest(store, "mars", rec("A", 82));
    expect(readBest(store, "mars")).toEqual(rec("A", 82));
  });

  it("returns null when nothing is stored", () => {
    expect(readBest(memoryStore(), "moon")).toBeNull();
  });

  it("returns null on malformed JSON", () => {
    const store = memoryStore({ "nasamap.best.mars": "{not json" });
    expect(readBest(store, "mars")).toBeNull();
  });

  it("rejects a structurally invalid record", () => {
    const store = memoryStore({ "nasamap.best.mars": JSON.stringify({ grade: "Z", score: "x" }) });
    expect(readBest(store, "mars")).toBeNull();
  });

  it("is a safe no-op without a store", () => {
    expect(readBest(null, "mars")).toBeNull();
    expect(() => writeBest(undefined, "mars", rec("S", 99))).not.toThrow();
  });

  it("survives a store that throws", () => {
    const hostile: KeyValueStore = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };
    expect(readBest(hostile, "mars")).toBeNull();
    expect(() => writeBest(hostile, "mars", rec("S", 99))).not.toThrow();
  });
});
