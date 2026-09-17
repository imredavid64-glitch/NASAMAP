/**
 * Extract the official Space Apps 2026 challenge list into
 * src/data/challenges-2026.json ("GitHub is the database").
 *
 * Run: node scripts/extract-challenges.mjs
 *
 * The API disables introspection, so this uses the verified query shape:
 *   challenges(first: N) { edges { node { id title categories { id name } } } }
 */

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const API = "https://api.spaceappschallenge.org/graphql";
const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "data", "challenges-2026.json");

const QUERY = `{
  challenges(first: 200) {
    edges { node { id title categories { id name } } }
  }
}`;

const res = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: QUERY }) });
if (!res.ok) throw new Error(`HTTP ${res.status}`);
const json = await res.json();
if (json.errors) throw new Error(json.errors.map((e) => e.message).join("; "));

const challenges = (json?.data?.challenges?.edges ?? [])
  .map((e) => e.node)
  .map((n) => ({
    id: n.id,
    title: n.title,
    categories: n.categories.map((c) => c.name),
  }))
  .sort((a, b) => a.title.localeCompare(b.title));

const payload = {
  source: "NASA Space Apps Challenge 2026 official GraphQL API (api.spaceappschallenge.org)",
  indexUrl: "https://www.spaceappschallenge.org/2026/challenges/",
  retrieved: new Date().toISOString().slice(0, 10),
  challengeYear: 2026,
  count: challenges.length,
  challenges,
};

writeFileSync(OUT, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(`✅ Wrote ${challenges.length} challenges to ${OUT}`);
