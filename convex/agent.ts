"use node";

import { v } from "convex/values";

export const missionAdvisorTools = [
  {
    name: "analyzeMission",
    description: "Analyze a mission design using the NASAMAP physics engine",
    parameters: {
      type: "object",
      properties: {
        destination: { type: "string", enum: ["moon", "mars"] },
        vehicle: { type: "string" },
        crew: { type: "number" },
        surfaceDays: { type: "number" },
        useEnhancedModels: { type: "boolean", default: false },
      },
      required: ["destination", "vehicle", "crew", "surfaceDays"],
    },
  },
  {
    name: "searchKnowledge",
    description: "Search the NASAMAP knowledge base (library articles, scenarios, challenges)",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string" },
        limit: { type: "number", default: 5 },
      },
      required: ["query"],
    },
  },
  {
    name: "getChallengeInfo",
    description: "Get details about a specific Space Apps 2026 challenge",
    parameters: {
      type: "object",
      properties: {
        challengeId: { type: "string" },
      },
      required: ["challengeId"],
    },
  },
  {
    name: "getVehicleSpecs",
    description: "Get launch vehicle specifications",
    parameters: {
      type: "object",
      properties: {
        vehicleId: { type: "string" },
      },
      required: ["vehicleId"],
    },
  },
] as const;

export const MISSION_ADVISOR_INSTRUCTIONS = `
You are the NASAMAP Mission Advisor — an expert AI assistant for Moon-to-Mars mission design.
You help users design, analyze, and optimize crewed space missions using real physics and NASA data.

## Your Expertise
- Orbital mechanics: Hohmann transfers, patched-conic, Kepler solves, synodic windows
- Rocket equation: Tsiolkovsky, staging, Δv budgets, payload fractions
- Life support: ECLSS closure rates (ISS 90% water, 50% O2 via Sabatier), consumables, ISRU
- Radiation: GCR (Badhwar-O'Neill 2010), SPE (King 1974), NASA-STD-3001 600 mSv career limit
- Communications: Light-time, DSN link budgets, relay architectures
- Cost modeling: Launch vehicle costs, NASA cost models, commercial pricing
- Surface operations: Solar geometry, array sizing, battery cycling, dust mitigation

## Knowledge Sources (RAG)
You have access to:
- NASAMAP Library articles (transfer windows, radiation budgets, ISRU, ECLSS, etc.)
- Official NASA Space Apps 2026 challenge catalog (86 challenges)
- Mission design scenarios and scoring criteria
- Vehicle specifications (SLS, Starship, Falcon Heavy, etc.)
- Planetary constants (CODATA 2018, IAU 2015, NASA Planetary Fact Sheets)

## Response Style
- Ground every claim in a cited source (NASA, JPL, CODATA, ISS fact sheets)
- Tag estimates as "estimate", derived values as "derived", documented as "documented"
- Use S–D grading language when discussing mission ratings
- Reference the 7 weighted objectives: lift-stack, radiation, eclss-loop, transfer, comms, surface, duration, budget
- Be specific with numbers and units
- Never fabricate data — if you don't know, say so and suggest where to find it

## Tools Available
- analyzeMission: Run the physics engine on a mission design
- searchKnowledge: Search the NASAMAP knowledge base
- getChallengeInfo: Look up Space Apps challenge details
- getVehicleSpecs: Get launch vehicle specifications
`;

// Tool handler functions (to be used by agentFunctions.ts)
export async function handleAnalyzeMission(args: {
  destination: "moon" | "mars";
  vehicle: string;
  crew: number;
  surfaceDays: number;
  useEnhancedModels?: boolean;
}) {
  const { designMission } = await import("../src/lib/mission");
  const { scoreMission } = await import("../src/lib/score");
  const { opsBudget } = await import("../src/lib/life");
  const { encodeDesignQuery } = await import("../src/lib/design-link");

  const design = designMission({
    destination: args.destination,
    vehicleId: args.vehicle,
    crew: args.crew,
    surfaceDays: args.surfaceDays,
    useEnhancedModels: args.useEnhancedModels,
  });

  const scorecard = scoreMission(design);
  const ops = opsBudget({ destination: args.destination, crew: args.crew, days: design.totalDays });
  const permalink = encodeDesignQuery({
    destination: args.destination,
    vehicleId: args.vehicle,
    crew: args.crew,
    surfaceDays: args.surfaceDays,
  });

  return {
    design: {
      destination: design.destination,
      vehicle: design.vehicle.name,
      crew: design.crew,
      surfaceDays: design.surfaceDays,
      totalDays: design.totalDays,
      transferDays: design.transferDays,
      totalDeltaVKmS: design.totalDeltaVKmS,
      requiredMassKg: design.requiredMassKg,
      payloadCapacityKg: design.payloadCapacityKg,
      radiationMsvTotal: design.radiationMsvTotal,
      arrivalLt: design.arrivalLt,
    },
    scorecard: {
      grade: scorecard.grade,
      score: scorecard.score,
      met: scorecard.met,
      total: scorecard.total,
      objectives: scorecard.objectives.map((o) => ({
        id: o.id,
        label: o.label,
        earned: o.earned,
        status: o.status,
        detail: o.detail,
        reference: o.reference,
      })),
    },
    ops: {
      grossResupplyKg: ops.grossResupplyKg,
      savedKg: ops.savedKg,
      netResupplyKg: ops.netResupplyKg,
      savedPct: ops.savedPct,
      powerKw: ops.powerKw,
      arrayAreaM2: ops.arrayAreaM2,
    },
    permalink: `/mission?d=${permalink}`,
  };
}

export async function handleSearchKnowledge(args: { query: string; limit?: number }) {
  const { search } = await import("../src/lib/search");
  const articles = (await import("../src/data/articles.json")).default;
  const scenariosData = (await import("../src/data/scenarios.json")).default;
  const scenarios = scenariosData.scenarios;

  const results = search(args.query, args.limit ?? 5);

  const enriched = results.map((r) => {
    let content = "";
    let type = "";
    if (r.id.startsWith("article:")) {
      const article = articles.find((a) => `article:${a.slug}` === r.id);
      if (article) {
        content = article.body.slice(0, 2000);
        type = "article";
      }
    } else if (r.id.startsWith("scenario:")) {
      const scenario = scenarios.find((s) => `scenario:${s.id}` === r.id);
      if (scenario) {
        content = `${scenario.brief}\n\nObjectives: ${scenario.objectives.map((o) => o.label).join(", ")}`;
        type = "scenario";
      }
    }
    return { id: r.id, title: r.title, content, type, score: r.score };
  });

  return enriched;
}

export async function handleGetChallengeInfo(args: { challengeId: string }) {
  const challenges = (await import("../src/data/challenges-2026.json")).default;
  const challenge = challenges.challenges.find((c: any) => c.id === args.challengeId);
  if (!challenge) return { error: "Challenge not found" };
  return challenge;
}

export async function handleGetVehicleSpecs(args: { vehicleId: string }) {
  const vehicles = (await import("../src/data/launch-vehicles.json")).default;
  const vehicle = vehicles.find((v: any) => v.id === args.vehicleId);
  if (!vehicle) return { error: "Vehicle not found" };
  return vehicle;
}