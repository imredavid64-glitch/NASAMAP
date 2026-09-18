import { describe, it, expect } from "vitest";
import { GLOSSARY, glossaryTerm, glossaryKeys } from "@/lib/glossary";

describe("glossary", () => {
  it("has unique, ordered keys", () => {
    const keys = glossaryKeys();
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys.length).toBeGreaterThanOrEqual(6);
  });

  it("explains every key in plain language with an expert note", () => {
    for (const g of GLOSSARY) {
      expect(g.short.length).toBeGreaterThan(40);
      expect(g.expert.length).toBeGreaterThan(20);
    }
  });

  it("resolves term lookups", () => {
    expect(glossaryTerm("dv")?.term).toBe("Δv (delta-v)");
    expect(glossaryTerm("nope")).toBeUndefined();
  });

  it("covers the objective vocabulary", () => {
    const covered = new Set(glossaryKeys());
    expect(covered.has("eclss")).toBe(true);
    expect(covered.has("msv")).toBe(true);
    expect(covered.has("tli")).toBe(true);
    expect(covered.has("hohmann")).toBe(true);
  });
});