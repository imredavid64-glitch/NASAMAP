/**
 * Quick check for the 2026 Space Apps challenge reveal.
 * The official list publishes at https://spaceappschallenge.org/2026/challenges/
 * backed by a GraphQL API. Run: node scripts/check-challenges.mjs
 */

const API = "https://api.spaceappschallenge.org/graphql";

async function checkChallenges() {
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: "{ viewer { challenges { id title slug } } }" }),
  });
  const json = await res.json();
  const challenges = json?.data?.viewer?.challenges ?? null;
  if (!challenges || challenges.length === 0) {
    console.log("🚫 Challenges not published yet on the API (returned empty/null).");
    console.log("   Re-run later today — title reveal is expected Sept 17, 2026 US-time.");
    return;
  }
  console.log(`Found ${challenges.length} challenges:`);
  for (const c of challenges) {
    console.log(`- ${c.title}  (${c.slug})  https://www.spaceappschallenge.org/2026/challenges/${c.slug}/`);
  }
}

checkChallenges().catch((e) => {
  console.error("Error querying the Space Apps API:", e.message);
});