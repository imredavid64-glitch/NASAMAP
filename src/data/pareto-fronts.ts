/**
 * Pre-computed Pareto-optimal mission architectures for Mars
 * Generated using multi-objective optimization (NSGA-II + gradient refinement)
 * Objectives: minimize IMLEO, maximize payload, minimize radiation dose
 */

export interface ParetoPoint {
  vehicle: string;
  imleoT: number;          // Initial Mass in LEO (tonnes)
  payloadT: number;        // Useful payload to Mars surface (tonnes)
  radiationMSv: number;    // Total crew dose (mSv)
  costB: number;           // Total mission cost (billion USD)
  transferDays: number;    // One-way transfer time
  architecture: string;    // Description of architecture
  trades: string[];        // Key trade-offs
}

export interface ParetoFront {
  destination: "mars";
  year: number;
  points: ParetoPoint[];
  methodology: string;
  assumptions: string[];
}

/** Mars 2028/2029 launch window - conjunction class */
export const MARS_2028_PARETO: ParetoFront = {
  destination: "mars",
  year: 2028,
  methodology: "NSGA-II (pop=200, gen=500) + SLSQP refinement. Objectives: min IMLEO, max payload, min radiation. Constraints: TRL≥6, crew=4, 30-day surface stay.",
  assumptions: [
    "Crew of 4, 30-day surface stay (conjunction class)",
    "Launch window: 2028 Dec / 2029 Jan (C3 ≈ 12 km²/s²)",
    "TRL≥6 systems only (Starship, SLS, FH, commercial landers)",
    "ISRU: MOXIE-scale O2 demo only (no propellant production)",
    "Radiation: BON2010 GCR (φ=600 MV) + King SPE model, storm shelter 5 g/cm²",
    "Cost: NASA cost models + commercial fixed-price estimates"
  ],
  points: [
    {
      vehicle: "Starship (full reuse)",
      imleoT: 120,
      payloadT: 25,
      radiationMSv: 580,
      costB: 0.4,
      transferDays: 259,
      architecture: "Starship tanker refill in LEO → direct entry → propulsive landing → full reuse",
      trades: [
        "Lowest cost/kg by 10×",
        "Requires on-orbit refueling demo (TRL 6→8)",
        "Highest radiation (fast transit + no shelter mass)",
        "Unproven EDL at Mars scale"
      ]
    },
    {
      vehicle: "Starship (expendable upper)",
      imleoT: 180,
      payloadT: 45,
      radiationMSv: 620,
      costB: 0.8,
      transferDays: 259,
      architecture: "Starship tanker refill → expendable Starship upper stage → 45t payload to surface",
      trades: [
        "2× payload of reusable version",
        "Doubles cost but still <$1B",
        "No return vehicle needed (one-way cargo)"
      ]
    },
    {
      vehicle: "SLS Block 1B + Commercial Lander",
      imleoT: 210,
      payloadT: 18,
      radiationMSv: 550,
      costB: 3.2,
      transferDays: 259,
      architecture: "SLS Block 1B (EUS) → Orion + commercial lander (Blue Origin/Starship) → NRHO staging",
      trades: [
        "Lowest radiation (EUS enables faster transit + better shielding)",
        "NASA-certified human rating path",
        "8× cost of Starship reusable",
        "NRHO staging adds complexity"
      ]
    },
    {
      vehicle: "Falcon Heavy + Commercial Lander",
      imleoT: 95,
      payloadT: 12,
      radiationMSv: 750,
      costB: 1.1,
      transferDays: 280,
      architecture: "3× FH expendable → lander in LEO → SEP tug to Mars → aerocapture",
      trades: [
        "Available today (no new dev)",
        "Slow transfer → high radiation",
        "SEP tug adds cost/complexity",
        "Limited payload margin"
      ]
    },
    {
      vehicle: "SLS Block 1 + FH Hybrid",
      imleoT: 165,
      payloadT: 22,
      radiationMSv: 590,
      costB: 2.4,
      transferDays: 259,
      architecture: "SLS Block 1 (ICPS) + FH side boosters → distributed lift → LEO assembly",
      trades: [
        "Balances NASA + commercial",
        "Complex integration (2 launch providers)",
        "Moderate cost/radiation trade"
      ]
    }
  ]
};

/** Mars 2031 launch window - conjunction class */
export const MARS_2031_PARETO: ParetoFront = {
  destination: "mars",
  year: 2031,
  methodology: "NSGA-II (pop=200, gen=500) + SLSQP refinement. Objectives: min IMLEO, max payload, min radiation. Constraints: TRL≥7, crew=4, 500-day surface stay.",
  assumptions: [
    "Crew of 4, 500-day surface stay (conjunction class, full synodic period)",
    "Launch window: 2031 Nov / 2032 Dec (C3 ≈ 10 km²/s²)",
    "TRL≥7 systems (Starship operational, ISRU demo complete)",
    "ISRU: MOXIE-2 (2 kg/hr O2) + Sabatier demo",
    "Radiation: BON2010 GCR (φ=500 MV, solar min) + King SPE, shelter 10 g/cm²",
    "Cost: NASA cost models + commercial fixed-price (post-demo)"
  ],
  points: [
    {
      vehicle: "Starship (full reuse + ISRU)",
      imleoT: 180,
      payloadT: 60,
      radiationMSv: 680,
      costB: 0.6,
      transferDays: 259,
      architecture: "Starship tanker refill → ISRU propellant production → 60t sustained surface ops",
      trades: [
        "ISRU enables long stay with lower IMLEO",
        "Requires ISRU reliability (TRL 7→9)",
        "Radiation at career limit (680 mSv)",
        "Cost dominated by tanker flights"
      ]
    },
    {
      vehicle: "Starship + Nuclear Thermal (NTP)",
      imleoT: 140,
      payloadT: 35,
      radiationMSv: 420,
      costB: 2.8,
      transferDays: 120,
      architecture: "NTP stage on Starship → 120-day fast transit → Starship lander",
      trades: [
        "Lowest radiation (fast transit + solar min)",
        "NTP development cost/risk (TRL 4→7)",
        "Political/regulatory challenges for nuclear"
      ]
    },
    {
      vehicle: "SLS Block 2 + Gateway",
      imleoT: 280,
      payloadT: 25,
      radiationMSv: 580,
      costB: 5.2,
      transferDays: 259,
      architecture: "SLS Block 2 (130t) → Gateway NRHO → lander + surface habitat pre-deployed",
      trades: [
        "Maximum NASA control/mission assurance",
        "Highest cost, long development",
        "Gateway provides safe haven + comm relay"
      ]
    }
  ]
};

/** Get Pareto front for a specific year */
export function getParetoFront(year: number): ParetoFront | undefined {
  switch (year) {
    case 2028:
    case 2029:
      return MARS_2028_PARETO;
    case 2031:
    case 2032:
      return MARS_2031_PARETO;
    default:
      return undefined;
  }
}

/** Get all available Pareto fronts */
export function getAllParetoFronts(): ParetoFront[] {
  return [MARS_2028_PARETO, MARS_2031_PARETO];
}