import { describe, it, expect } from "vitest";
import {
  dataset,
  matchLanes,
  annotateChallenges,
  laneStats,
  servedCount,
  coveragePct,
  laneById,
  LANES,
  LANE_ORDER,
  PLAYBOOK,
} from "@/lib/challenges";

describe("2026 challenge dataset", () => {
  const ds = dataset();

  it("loads the full official catalogue", () => {
    expect(ds.challengeYear).toBe(2026);
    expect(ds.challenges.length).toBe(ds.count);
    expect(ds.count).toBeGreaterThanOrEqual(80);
  });

  it("has unique ids and non-empty titles", () => {
    const ids = new Set(ds.challenges.map((c) => c.id));
    expect(ids.size).toBe(ds.challenges.length);
    for (const c of ds.challenges) {
      expect(c.title.length).toBeGreaterThan(0);
      expect(Array.isArray(c.categories)).toBe(true);
    }
  });

  it("came from the official API, not by hand", () => {
    expect(ds.source).toMatch(/spaceappschallenge\.org/);
    expect(ds.indexUrl).toMatch(/^https:\/\/www\.spaceappschallenge\.org/);
  });
});

describe("relevance lanes", () => {
  it("flags the mission-design titles", () => {
    expect(matchLanes("Space Mission Design Game")).toContain("mission-design");
    expect(matchLanes("Visualize a Space Mission Using Virtual Reality")).toContain("mission-design");
  });

  it("flags life-support titles", () => {
    expect(matchLanes("SpaceTrash Hack: Revolutionizing Recycling on Mars")).toContain("life-support");
    expect(matchLanes("Your Home in Space: The Habitat Layout Creator")).toContain("life-support");
  });

  it("flags a title into multiple lanes", () => {
    const lanes = matchLanes("Interplanetary Survival Guide: Martian Map");
    expect(lanes).toEqual(expect.arrayContaining(["mission-design", "life-support", "flight-3d"]));
  });

  it("flags live-data titles", () => {
    expect(matchLanes("Create an Orrery Web App that Displays Near-Earth Objects")).toEqual(
      expect.arrayContaining(["flight-3d", "live-feeds"]),
    );
    expect(matchLanes("International Space Station 25th Anniversary Apps")).toContain("live-feeds");
    expect(matchLanes("Meteor Madness")).toContain("live-feeds");
  });

  it("returns no lanes for an unrelated title", () => {
    expect(matchLanes("qqq zzz")).toEqual([]);
  });

  it("keeps every lane wired to a real route", () => {
    for (const lane of LANES) {
      expect(lane.href.startsWith("/")).toBe(true);
      expect(lane.blurb.length).toBeGreaterThan(20);
    }
    expect(LANE_ORDER).toEqual(LANES.map((l) => l.id));
    expect(laneById("mission-design")?.href).toBe("/mission");
    expect(laneById("nope")).toBeUndefined();
  });
});

describe("challenge ranking", () => {
  const matches = annotateChallenges();

  it("annotates every challenge with valid lane ids", () => {
    expect(matches.length).toBe(dataset().count);
    for (const m of matches) {
      expect(m.score).toBe(m.lanes.length);
      for (const id of m.lanes) expect(LANE_ORDER).toContain(id);
    }
  });

  it("sorts matched challenges to the top", () => {
    const scores = matches.map((m) => m.score);
    for (let i = 1; i < scores.length; i += 1) expect(scores[i]).toBeLessThanOrEqual(scores[i - 1]);
    expect(matches[0].score).toBeGreaterThan(0);
  });

  it("reports a sensible coverage figure", () => {
    const served = servedCount(matches);
    expect(served).toBeGreaterThan(20);
    expect(served).toBeLessThanOrEqual(matches.length);
    expect(coveragePct(matches)).toBeCloseTo((served / matches.length) * 100, 6);
  });

  it("counts each lane consistently", () => {
    const stats = laneStats(matches);
    expect(stats).toHaveLength(LANES.length);
    const laneMatchTotal = matches.reduce((s, m) => s + m.lanes.length, 0);
    expect(stats.reduce((s, l) => s + l.count, 0)).toBe(laneMatchTotal);
  });
});

describe("submission playbook", () => {
  it("is an ordered, non-trivial walkthrough", () => {
    expect(PLAYBOOK.length).toBeGreaterThanOrEqual(5);
    expect(PLAYBOOK.map((s) => s.n)).toEqual(PLAYBOOK.map((_, i) => i + 1));
  });

  it("gives every step real copy and a route", () => {
    for (const step of PLAYBOOK) {
      expect(step.title.length).toBeGreaterThan(4);
      expect(step.body.length).toBeGreaterThan(40);
      expect(step.cta.length).toBeGreaterThan(0);
      expect(step.href.startsWith("/")).toBe(true);
    }
  });

  it("points at shipped routes, not placeholders", () => {
    const hrefs = PLAYBOOK.map((s) => s.href);
    expect(hrefs).toEqual(expect.arrayContaining(["/mission", "/fly", "/mission#scorecard", "/mission#ops"]));
  });
});
