/**
 * AI Mission Advisor — rule-based expert system that analyzes mission designs
 * and provides contextual, actionable advice. Uses the same physics engine and
 * scoring system as the Mission Lab. Pure, deterministic, offline-first.
 */

import { type DesignInput } from "@/lib/design-link";
import { designMission } from "@/lib/mission";
import { scoreMission, type Scorecard } from "@/lib/score";
import { opsBudget } from "@/lib/life";
import { type Scenario } from "@/lib/scenarios";

export interface AdvisorContext {
  design?: ReturnType<typeof designMission>;
  scorecard?: Scorecard;
  scenario?: Scenario;
  userQuestion?: string;
}

export interface AdvisorResponse {
  summary: string;
  insights: Insight[];
  recommendations: Recommendation[];
  dataReferences: string[];
}

export interface Insight {
  type: "success" | "warning" | "error" | "info";
  title: string;
  detail: string;
  affectedObjective?: string;
  severity: "high" | "medium" | "low";
}

export interface Recommendation {
  action: string;
  rationale: string;
  impact: "high" | "medium" | "low";
  tradeoffs?: string[];
  implementation?: string;
}

/**
 * Main advisor function — analyzes a mission design and returns contextual advice
 */
export function adviseMission(context: AdvisorContext): AdvisorResponse {
  const { design, scorecard, scenario, userQuestion } = context;
  
  if (!design || !scorecard) {
    return {
      summary: "No mission design loaded. Build a mission in the Mission Lab first.",
      insights: [],
      recommendations: [],
      dataReferences: [],
    };
  }

  const insights: Insight[] = [];
  const recommendations: Recommendation[] = [];
  const dataReferences: string[] = [];

  // Analyze each scored objective
  for (const obj of scorecard.objectives) {
    const analysis = analyzeObjective(obj, design, scorecard, scenario);
    insights.push(...analysis.insights);
    recommendations.push(...analysis.recommendations);
    dataReferences.push(...analysis.references);
  }

  // Cross-objective analysis
  const crossAnalysis = analyzeCrossObjectives(design, scorecard, scenario);
  insights.push(...crossAnalysis.insights);
  recommendations.push(...crossAnalysis.recommendations);
  dataReferences.push(...crossAnalysis.references);

  // Scenario-specific advice
  if (scenario) {
    const scenarioAnalysis = analyzeScenario(scenario, design, scorecard);
    insights.push(...scenarioAnalysis.insights);
    recommendations.push(...scenarioAnalysis.recommendations);
    dataReferences.push(...scenarioAnalysis.references);
  }

  // Generate summary
  const summary = generateSummary(scorecard, insights);

  return {
    summary,
    insights: deduplicateInsights(insights),
    recommendations: prioritizeRecommendations(recommendations),
    dataReferences: [...new Set(dataReferences)],
  };
}

function analyzeObjective(obj: any, design: any, scorecard: any, scenario?: Scenario) {
  const insights: Insight[] = [];
  const recommendations: Recommendation[] = [];
  const references: string[] = [];

  if (obj.status === "fail") {
    insights.push({
      type: "error",
      title: `${obj.label} — FAIL`,
      detail: obj.detail,
      affectedObjective: obj.id,
      severity: "high",
    });
  } else if (obj.status === "warn") {
    insights.push({
      type: "warning",
      title: `${obj.label} — MARGINAL`,
      detail: obj.detail,
      affectedObjective: obj.id,
      severity: "medium",
    });
  } else {
    insights.push({
      type: "success",
      title: `${obj.label} — PASS`,
      detail: obj.detail,
      affectedObjective: obj.id,
      severity: "low",
    });
  }

  // Objective-specific recommendations
  switch (obj.id) {
    case "lift-stack":
      if (obj.status !== "pass") {
        recommendations.push({
          action: "Reduce stack mass or upgrade launch vehicle",
          rationale: `Stack mass (${(design.requiredMassKg / 1000).toFixed(1)}t) exceeds vehicle capacity (${design.payloadCapacityKg ? (design.payloadCapacityKg / 1000).toFixed(0) : "unknown"}t)`,
          impact: "high",
          tradeoffs: ["Smaller crew", "Less surface hardware", "Shorter surface stay"],
          implementation: "Adjust crew size, surface days, or select a heavier-lift vehicle",
        });
      }
      break;

    case "radiation":
      if (obj.status !== "pass") {
        recommendations.push({
          action: "Reduce transit time or add storm shelter",
          rationale: `Crew dose (${design.radiationMsvTotal} mSv) exceeds NASA career limit (600 mSv)`,
          impact: "high",
          tradeoffs: ["Higher Δv for faster transfer", "Added shelter mass", "Shorter surface stay"],
          implementation: "Use faster transfer trajectory, add dedicated storm shelter (5-10 g/cm²), or reduce cruise duration",
        });
      }
      break;

    case "eclss-loop":
      if (obj.status !== "pass") {
        const ops = opsBudget({ destination: design.destination, crew: design.crew, days: design.totalDays });
        recommendations.push({
          action: "Improve ECLSS closure rate",
          rationale: `Only ${(ops.savedPct * 100).toFixed(0)}% of consumables recycled; target is ≥50%`,
          impact: "high",
          tradeoffs: ["Added ECLSS hardware mass", "Increased power demand", "More complex operations"],
          implementation: "Upgrade to next-gen WPA/UPA, add brine processor, integrate Sabatier CO2 reduction",
        });
      }
      break;

    case "transfer":
      if (obj.status !== "pass") {
        const ref = design.destination === "moon" ? 3.2 : 6.0;
        recommendations.push({
          action: "Optimize transfer trajectory",
          rationale: `Total Δv (${design.totalDeltaVKmS.toFixed(2)} km/s) exceeds reference (${ref} km/s)`,
          impact: "medium",
          tradeoffs: ["Longer transit time", "More gravity assists", "Narrower launch windows"],
          implementation: "Use patched-conic optimization, consider low-energy transfers or gravity assists",
        });
      }
      break;

    case "comms":
      if (obj.status !== "pass") {
        recommendations.push({
          action: "Add relay infrastructure or adjust ops concept",
          rationale: `One-way light time (${design.arrivalLt.oneWayLabel}) exceeds practical ops threshold`,
          impact: "medium",
          tradeoffs: ["Relay satellite mass/cost", "Added latency for relay hop", "Complex ground ops"],
          implementation: "Deploy Mars relay orbiter (e.g., MARCO-class), increase crew autonomy, adjust ground support model",
        });
      }
      break;

    case "surface":
      if (obj.status !== "pass") {
        const min = design.destination === "mars" ? 30 : 3;
        recommendations.push({
          action: "Extend surface stay to minimum viable duration",
          rationale: `Surface stay (${design.surfaceDays} days) below minimum (${min} days) for science return`,
          impact: "medium",
          tradeoffs: ["More consumables", "More radiation exposure", "Longer mission duration"],
          implementation: "Increase surfaceDays parameter; ensure consumables and radiation budgets close",
        });
      }
      break;

    case "duration":
      if (obj.status !== "pass") {
        recommendations.push({
          action: "Compress mission timeline",
          rationale: `Total mission (${design.totalDays} days) exceeds recommended maximum (900 days)`,
          impact: "medium",
          tradeoffs: ["Faster transfers need more Δv", "Less surface science time", "Tighter abort windows"],
          implementation: "Use faster transfer, reduce surface stay, or optimize departure/arrival phasing",
        });
      }
      break;

    case "budget":
      if (obj.status !== "pass") {
        recommendations.push({
          action: "Find cost savings in launch architecture",
          rationale: `Estimated cost (${obj.actual}) exceeds $500M target`,
          impact: "medium",
          tradeoffs: ["Fewer launches", "Less redundancy", "Commercial vs. government launch"],
          implementation: "Consider rideshare, commercial CLPS-style delivery, or international partnerships",
        });
      }
      break;
  }

  references.push(obj.reference);
  return { insights, recommendations, references };
}

function analyzeCrossObjectives(design: any, scorecard: any, scenario?: Scenario) {
  const insights: Insight[] = [];
  const recommendations: Recommendation[] = [];
  const references: string[] = [];

  // Radiation + Duration coupling
  if (design.radiationMsvTotal > 400 && design.totalDays > 700) {
    insights.push({
      type: "warning",
      title: "Radiation-Duration Coupling",
      detail: "High radiation dose combined with long duration compounds cancer risk and limits abort options",
      severity: "high",
    });
    recommendations.push({
      action: "Prioritize transit time reduction over surface time",
      rationale: "Every 30 days of cruise adds ~15-25 mSv GCR dose with no science return",
      impact: "high",
      tradeoffs: ["Less surface science", "Higher Δv cost"],
    });
  }

  // Mass closure coupling
  const massMargin = design.payloadCapacityKg ? (design.payloadCapacityKg - design.requiredMassKg) / design.payloadCapacityKg : 0;
  if (massMargin < 0.1 && massMargin > 0) {
    insights.push({
      type: "warning",
      title: "Thin Mass Margin",
      detail: `Only ${(massMargin * 100).toFixed(0)}% payload margin; any growth breaks closure`,
      severity: "high",
    });
    recommendations.push({
      action: "Identify mass growth margin and contingency allocation",
      rationale: "Standard aerospace practice: 20-30% margin at PDR, 10-15% at CDR",
      impact: "high",
      tradeoffs: ["Requires heavier vehicle or mass reduction"],
    });
  }

  // Power + Thermal coupling on Mars surface
  if (design.destination === "mars") {
    const ops = opsBudget({ destination: "mars", crew: design.crew, days: design.surfaceDays });
    if (ops.powerKw > 8) {
      insights.push({
        type: "info",
        title: "High Surface Power Demand",
        detail: `${ops.powerKw.toFixed(1)} kW requires large solar array (~${(ops.powerKw * 50).toFixed(0)} m² at Mars) with dust mitigation`,
        severity: "low",
      });
    }
  }

  return { insights, recommendations, references };
}

function analyzeScenario(scenario: Scenario, design: any, scorecard: any) {
  const insights: Insight[] = [];
  const recommendations: Recommendation[] = [];
  const references: string[] = [];

  // Check constraint satisfaction
  for (const constraint of [
    { key: "crew", min: scenario.constraints.crew.min, max: scenario.constraints.crew.max, label: "Crew" },
    { key: "surfaceDays", min: scenario.constraints.surfaceDays.min, max: scenario.constraints.surfaceDays.max, label: "Surface Days" },
  ]) {
    const value = design[constraint.key];
    if (value < constraint.min || value > constraint.max) {
      insights.push({
        type: "error",
        title: `Scenario Constraint Violated: ${constraint.label}`,
        detail: `${constraint.label} (${value}) outside allowed range [${constraint.min}, ${constraint.max}]`,
        severity: "high",
      });
    }
  }

  // Par score guidance
  if (scorecard.score < scenario.parScore) {
    const gap = scenario.parScore - scorecard.score;
    insights.push({
      type: "warning",
      title: "Below Par Score",
      detail: `Current score ${scorecard.score} is ${gap} points below par (${scenario.parScore})`,
      severity: "medium",
    });
    recommendations.push({
      action: `Close the ${gap}-point gap to beat par`,
      rationale: "Par score represents a well-balanced, credible mission design for this scenario",
      impact: "medium",
      tradeoffs: ["May require relaxing player preferences", "More conservative design choices"],
    });
  }

  return { insights, recommendations, references };
}

function generateSummary(scorecard: any, insights: Insight[]): string {
  const fails = insights.filter(i => i.severity === "high").length;
  const warns = insights.filter(i => i.severity === "medium").length;
  const passes = insights.filter(i => i.type === "success").length;

  if (scorecard.grade === "S") {
    return `Excellent design — Grade ${scorecard.grade} (${scorecard.score}/100). All ${scorecard.met}/${scorecard.total} objectives met with margin. Ready for Phase A study.`;
  }
  if (scorecard.grade === "A") {
    return `Strong design — Grade ${scorecard.grade} (${scorecard.score}/100). ${scorecard.met}/${scorecard.total} objectives met. Minor margins to recover.`;
  }
  if (scorecard.grade === "B") {
    return `Workable but tight — Grade ${scorecard.grade} (${scorecard.score}/100). ${fails} critical issues, ${warns} margins to watch. Iterate before committing.`;
  }
  if (scorecard.grade === "C") {
    return `Risky design — Grade ${scorecard.grade} (${scorecard.score}/100). ${fails} failures, ${warns} warnings. Major redesign needed.`;
  }
  return `No-go — Grade ${scorecard.grade} (${scorecard.score}/100). ${fails} critical failures. Fundamental architecture changes required.`;
}

function deduplicateInsights(insights: Insight[]): Insight[] {
  const seen = new Set<string>();
  return insights.filter(i => {
    const key = `${i.title}|${i.detail}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function prioritizeRecommendations(recs: Recommendation[]): Recommendation[] {
  const order = { high: 3, medium: 2, low: 1 };
  return recs
    .sort((a, b) => order[b.impact] - order[a.impact])
    .slice(0, 10); // Top 10 most impactful
}

/**
 * Quick question-answering for common mission design questions
 */
export function answerQuestion(question: string, context: AdvisorContext): string {
  const q = question.toLowerCase();
  const { design, scorecard } = context;

  if (!design || !scorecard) {
    return "Please load a mission design first using the Mission Lab.";
  }

  // Radiation questions
  if (q.includes("radiation") || q.includes("dose") || q.includes("msv")) {
    return `Current crew dose: ${design.radiationMsvTotal} mSv (${design.radiationMsvTotal > 600 ? "EXCEEDS" : "within"} NASA 600 mSv career limit). 
    Breakdown: GCR cruise ~${Math.round(design.radiationMsvTotal * 0.6)} mSv, Surface ~${Math.round(design.radiationMsvTotal * 0.3)} mSv, SPE risk ~${Math.round(design.radiationMsvTotal * 0.1)} mSv.
    To reduce: shorten transit, add storm shelter (5-10 g/cm²), or time launch for solar max (better GCR shielding).`;
  }

  // Delta-v questions
  if (q.includes("delta") || q.includes("dv") || q.includes("delta-v") || q.includes("propellant")) {
    return `Total Δv: ${design.totalDeltaVKmS.toFixed(2)} km/s.
    Breakdown: TLI/TMI ~${(design.totalDeltaVKmS * 0.6).toFixed(2)} km/s, Capture/Descent ~${(design.totalDeltaVKmS * 0.25).toFixed(2)} km/s, Margins ~${(design.totalDeltaVKmS * 0.15).toFixed(2)} km/s.
    Reference for ${design.destination}: ${design.destination === "moon" ? "3.2" : "6.0"} km/s (Hohmann/Apollo-class).
    To reduce: use gravity assists, low-energy transfers, or aerocapture at Mars.`;
  }

  // Mass questions
  if (q.includes("mass") || q.includes("weight") || q.includes("payload") || q.includes("margin")) {
    const margin = design.payloadCapacityKg ? (design.payloadCapacityKg - design.requiredMassKg) / design.payloadCapacityKg : 0;
    return `Stack mass: ${(design.requiredMassKg / 1000).toFixed(1)}t / ${design.payloadCapacityKg ? (design.payloadCapacityKg / 1000).toFixed(0) : "?"}t capacity (${(margin * 100).toFixed(0)}% margin).
    Breakdown: Habitat ~${(design.requiredMassKg * 0.35).toFixed(0)}kg, Propulsion ~${(design.requiredMassKg * 0.25).toFixed(0)}kg, ECLSS ~${(design.requiredMassKg * 0.15).toFixed(0)}kg, Consumables ~${(design.requiredMassKg * 0.12).toFixed(0)}kg, Margin/Contingency ~${(design.requiredMassKg * 0.13).toFixed(0)}kg.
    ${margin < 0.15 ? "⚠ Margin below 15% — recommend mass growth allowance." : "✓ Adequate margin."}`;
  }

  // Life support questions
  if (q.includes("life support") || q.includes("eclss") || q.includes("consumable") || q.includes("water") || q.includes("oxygen") || q.includes("food")) {
    const ops = opsBudget({ destination: design.destination, crew: design.crew, days: design.totalDays });
    return `ECLSS Performance: ${(ops.savedPct * 100).toFixed(0)}% of consumables recycled (target ≥50%).
    Open-loop consumption: ${ops.grossResupplyKg.toFixed(0)} kg total.
    Recycled: ${ops.savedKg.toFixed(0)} kg saved.
    Remaining: ${ops.netResupplyKg.toFixed(0)} kg must be launched.
    Water recovery: ~90% (WPA), O2 recovery: ~50% (Sabatier).
    To improve: add brine processor (+10% water), upgrade CO2 reduction (+15% O2).`;
  }

  // Cost questions
  if (q.includes("cost") || q.includes("budget") || q.includes("money") || q.includes("dollar")) {
    return `Estimated mission cost: ${scorecard.objectives.find(o => o.id === "budget")?.actual || "N/A"}.
    Primary driver: ${design.vehicle.name} launch cost × ${Math.ceil(design.requiredMassKg / (design.payloadCapacityKg || 1))} launches.
    To reduce: consider commercial launch (Falcon Heavy), rideshare, or international cost-sharing.`;
  }

  // Timeline questions
  if (q.includes("time") || q.includes("duration") || q.includes("schedule") || q.includes("days")) {
    return `Mission timeline: ${design.totalDays} days total (${design.transferDays * 2} transit + ${design.surfaceDays} surface).
    Transit: ${design.transferDays} days each way (${design.destination === "mars" ? "Hohmann" : "Apollo-class"} transfer).
    Surface: ${design.surfaceDays} days.
    Synodic constraint: Mars windows every ~780 days (${design.destination === "mars" ? "next: 2026, 2028, 2031" : "lunar: near-daily"}).`;
  }

  // General help
  return `I can analyze your mission design and answer questions about:
  • Radiation dose and shielding options
  • Δv budget and trajectory optimization
  • Mass budget and payload margins
  • Life support closure and consumables
  • Mission cost drivers
  • Timeline and launch window constraints
  
  Ask me something specific like "How do I reduce radiation?" or "Why is my Δv so high?"`;
}