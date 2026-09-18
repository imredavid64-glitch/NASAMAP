/**
 * Mission scoring engine â€” the "game layer" over the design engine.
 *
 * Turns a MissionDesign into a set of judged objectives with a 0â€“100 score and
 * a letter grade, so the planner has a win condition and replay value. Every
 * threshold is anchored to a published reference (NASA-STD-3001, NASA ISS
 * ECLSS, Apollo-class Î”v). Pure and unit-tested in tests/score.test.ts.
 */

import { type MissionDesign } from "@/lib/mission";
import { opsBudget } from "@/lib/life";
import { estimateMissionCost, formatUsd } from "@/lib/cost";

export type ObjectiveStatus = "pass" | "warn" | "fail";

/** NASA-STD-3001 (2022/23) universal career effective dose limit. */
export const RADIATION_LIMIT_MSV = 600;
/** Above the career limit a mission needs an agency waiver. */
export const RADIATION_WAIVER_MSV = 800;

/** Reference total Î”v (km/s) above which a transfer is penalised. */
export const DV_REFERENCE_KM_S: Record<MissionDesign["destination"], number> = {
  moon: 3.2,
  mars: 6.0,
};

export interface ObjectiveResult {
  id: string;
  label: string;
  detail: string;
  reference: string;
  status: ObjectiveStatus;
  weight: number;
  earned: number;
  actual: string;
  target: string;
}

export interface Scorecard {
  score: number;
  maxScore: number;
  grade: "S" | "A" | "B" | "C" | "D";
  met: number;
  total: number;
  verdict: string;
  capped: boolean;
  capReason?: string;
  objectives: ObjectiveResult[];
}

interface Judgement {
  status: ObjectiveStatus;
  actual: string;
  target: string;
}

interface Objective {
  id: string;
  label: string;
  detail: string;
  reference: string;
  weight: number;
  judge: (design: MissionDesign) => Judgement;
}

function tier(value: number, pass: number, warn: number): ObjectiveStatus {
  if (value <= pass) return "pass";
  if (value <= warn) return "warn";
  return "fail";
}

const OBJECTIVES: Objective[] = [
  {
    id: "lift-stack",
    label: "Lift the stack",
    detail: "The chosen vehicle must be documented to carry the whole mass budget.",
    reference: "Published vehicle payload (launch-vehicles.json)",
    weight: 18,
    judge: (d) => ({
      status: d.launchGate === "pass" ? "pass" : d.launchGate === "unknown" ? "warn" : "fail",
      actual: `${(d.requiredMassKg / 1000).toFixed(1)} t stack`,
      target: d.payloadCapacityKg ? `${(d.payloadCapacityKg / 1000).toFixed(0)} t capacity` : "undocumented TLI",
    }),
  },
  {
    id: "radiation",
    label: "Respect the radiation career limit",
    detail: "Keep the crew's total mission dose under NASA's universal career limit.",
    reference: "NASA-STD-3001: < 600 mSv career effective dose",
    weight: 18,
    judge: (d) => ({
      status: tier(d.radiationMsvTotal, RADIATION_LIMIT_MSV, RADIATION_WAIVER_MSV),
      actual: `${d.radiationMsvTotal.toFixed(0)} mSv`,
      target: `< ${RADIATION_LIMIT_MSV} mSv`,
    }),
  },
  {
    id: "eclss-loop",
    label: "Close the life-support loop",
    detail: "An ISS-class regenerative ECLSS should carry most of the consumable load.",
    reference: "NASA ISS ECLSS (~90% water, ~50% Oâ‚‚ recovery)",
    weight: 13,
    judge: (d) => {
      const ops = opsBudget({ destination: d.destination, crew: d.crew, days: d.totalDays });
      return {
        status: ops.savedPct >= 0.5 ? "pass" : ops.savedPct >= 0.35 ? "warn" : "fail",
        actual: `${(ops.savedPct * 100).toFixed(0)}% recycled`,
        target: "â‰Ą 50% of consumables",
      };
    },
  },
  {
    id: "comms",
    label: "Keep a workable comms window",
    detail: "One-way light-lag must stay inside remote-operations tolerance.",
    reference: "Speed of light over mean Earthâ€“Mars distance",
    weight: 8,
    judge: (d) => ({
      status: tier(d.arrivalLt.oneWaySec, 1300, 2400),
      actual: `${d.arrivalLt.oneWayLabel} one-way`,
      target: "â‰¤ 21.7 min",
    }),
  },
  {
    id: "transfer",
    label: "Fly an efficient transfer",
    detail: "Total Î”v should sit near the Hohmann / Apollo-class optimum for the destination.",
    reference: "Hohmann transfer & Apollo-class TLI (rocket.ts)",
    weight: 13,
    judge: (d) => {
      const ref = DV_REFERENCE_KM_S[d.destination];
      return {
        status: tier(d.totalDeltaVKmS, ref, ref * 1.3),
        actual: `${d.totalDeltaVKmS.toFixed(2)} km/s`,
        target: `â‰¤ ${ref.toFixed(2)} km/s`,
      };
    },
  },
  {
    id: "surface",
    label: "Do meaningful surface work",
    detail: "The crew should have time on the surface to justify the trip.",
    reference: "Mission design intent",
    weight: 8,
    judge: (d) => {
      const min = d.destination === "mars" ? 30 : 3;
      return {
        status: d.surfaceDays >= min ? "pass" : d.surfaceDays > 0 ? "warn" : "fail",
        actual: `${d.surfaceDays.toFixed(0)} days`,
        target: `â‰Ą ${min} days`,
      };
    },
  },
{
    id: "duration",
    label: "Keep the mission duration sane",
    detail: "Longer missions compound consumables, radiation and human factors.",
    reference: "Mission design intent",
    weight: 8,
    judge: (d) => ({
      status: tier(d.totalDays, 900, 1100),
      actual: `${d.totalDays.toFixed(0)} days`,
      target: "≤ 900 days",
    }),
  },
  {
    id: "budget",
    label: "Respect the budget",
    detail: "Pick the cheapest proven stack that still closes — overruns kill missions before launch.",
    reference: "Estimated per-launch cost (launch-vehicles.json, tagged)",
    weight: 14,
    judge: (d) => {
      const total = estimateMissionCost(d).totalUsd;
      return {
        status: tier(total, 500_000_000, 1_500_000_000),
        actual: formatUsd(total),
        target: "≤ $500 M",
      };
    },
  },
];

const MAX_SCORE = OBJECTIVES.reduce((sum, o) => sum + o.weight, 0);

/** Stable list of judgeable objective ids, used by the scenario layer. */
export const SCORE_OBJECTIVE_IDS: string[] = OBJECTIVES.map((o) => o.id);

const GRADE_ORDER: Scorecard["grade"][] = ["D", "C", "B", "A", "S"];

function gradeFor(score: number): Scorecard["grade"] {
  if (score >= 90) return "S";
  if (score >= 80) return "A";
  if (score >= 65) return "B";
  if (score >= 50) return "C";
  return "D";
}

function capGrade(grade: Scorecard["grade"], cap: Scorecard["grade"]): Scorecard["grade"] {
  return GRADE_ORDER.indexOf(grade) <= GRADE_ORDER.indexOf(cap) ? grade : cap;
}

const VERDICTS: Record<Scorecard["grade"], string> = {
  S: "Flight-ready. This design closes on every axis.",
  A: "Strong design â€” minor margin to recover.",
  B: "Workable, but the margins are thin.",
  C: "Risky. Rework the budget before committing.",
  D: "No-go. This stack will not survive the frontier.",
};

export function scoreMission(design: MissionDesign): Scorecard {
  const objectives: ObjectiveResult[] = OBJECTIVES.map((o) => {
    const { status, actual, target } = o.judge(design);
    const earned = status === "pass" ? o.weight : status === "warn" ? o.weight / 2 : 0;
    return {
      id: o.id,
      label: o.label,
      detail: o.detail,
      reference: o.reference,
      status,
      weight: o.weight,
      earned,
      actual,
      target,
    };
  });

  const earned = objectives.reduce((sum, o) => sum + o.earned, 0);
  const score = Math.round((earned / MAX_SCORE) * 100);

  // Feasibility caps: a stack that will not lift, or a crew that blows the
  // radiation limit, cannot be flight-ready no matter how clean the rest is.
  const lift = objectives.find((o) => o.id === "lift-stack")?.status;
  const radiation = objectives.find((o) => o.id === "radiation")?.status;
  const caps: string[] = [];
  let grade = gradeFor(score);
  if (lift === "fail") {
    grade = capGrade(grade, "D");
    caps.push("the stack exceeds the vehicle's documented payload");
  } else if (lift === "warn") {
    grade = capGrade(grade, "B");
    caps.push("translunar capability is undocumented for this vehicle");
  }
  if (radiation === "fail") {
    grade = capGrade(grade, "B");
    caps.push("the crew dose exceeds NASA's career limit");
  }

  return {
    score,
    maxScore: MAX_SCORE,
    grade,
    met: objectives.filter((o) => o.status === "pass").length,
    total: objectives.length,
    verdict: VERDICTS[grade],
    capped: caps.length > 0 && grade !== gradeFor(score),
    capReason: caps.length > 0 ? `Grade capped: ${caps.join("; ")}.` : undefined,
    objectives,
  };
}
