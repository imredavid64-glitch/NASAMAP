/**
 * Check the 2026 Space Apps challenge reveal and print the official list.
 * The public list is served by the GraphQL API backing
 * https://spaceappschallenge.org/2026/challenges/ .
 *
 * The schema exposes a `challenges` connection of `ChallengePage` nodes
 * (`viewer.challenges` returns null for anonymous callers). Note that
 * introspection is disabled, so field names here are the verified-working set.
 *
 * Run: node scripts/check-challenges.mjs
 */

const API = "https://api.spaceappschallenge.org/graphql";

const QUERY = `{
  challenges(first: 200) {
    edges { node { id title categories { id name } } }
  }
}`;

async function checkChallenges() {
  const res = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: QUERY }) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (json.errors) throw new Error(json.errors.map((e) => e.message).join("; "));

  const nodes = json?.data?.challenges?.edges?.map((e) => e.node) ?? [];
  if (nodes.length === 0) {
    console.log("🚫 No challenges returned by the API yet.");
    return;
  }
  console.log(`✅ Found ${nodes.length} official 2026 challenges:\n`);
  for (const c of nodes.slice().sort((a, b) => a.title.localeCompare(b.title))) {
    const cats = c.categories.map((x) => x.name).join(" / ");
    console.log(`- ${c.title}${cats ? `  [${cats}]` : ""}`);
  }
  console.log(`\nIndex: https://www.spaceappschallenge.org/2026/challenges/`);
}

checkChallenges().catch((e) => {
  console.error("Error querying the Space Apps API:", e.message);
  process.exitCode = 1;
});
