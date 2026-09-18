/**
 * Glossary — plain-language definitions for the terms the scoring engine uses,
 * each with a source when a hard number is named. Pure data; unit-tested in
 * tests/glossary.test.ts.
 */

export interface GlossaryTerm {
  key: string;
  term: string;
  short: string;
  expert: string;
}

export const GLOSSARY: GlossaryTerm[] = [
  {
    key: "dv",
    term: "Δv (delta-v)",
    short: "A measure of how much a rocket can change its flight path — the 'fuel budget' of a mission. More Δv means more places it can reach.",
    expert: "Change in velocity (km/s) needed to execute a trajectory; used here to compare transfer budgets (Hohmann-class references).",
  },
  {
    key: "leo",
    term: "LEO",
    short: "Low Earth Orbit — the zone of orbits a couple hundred kilometres above Earth where the ISS and most satellites fly.",
    expert: "Low Earth Orbit (< ~2,000 km altitude); launch vehicles are rated by how much they can lift to LEO.",
  },
  {
    key: "tli",
    term: "TLI",
    short: "Trans-Lunar Injection — the big kick that sends a spacecraft from low Earth orbit toward the Moon.",
    expert: "Trans-Lunar Injection burn applied from LEO onto a Moon-bound trajectory; a vehicle must be documented to lift the stack to TLI.",
  },
  {
    key: "hohmann",
    term: "Hohmann transfer",
    short: "The most fuel-efficient path between two orbits — a big burn at each end, a long coast in between.",
    expert: "Minimum-energy elliptical transfer between circular orbits; 180°-apart burns. Used as the Δv reference for Earth–Moon/Earth–Mars.",
  },
  {
    key: "sol",
    term: "Sol",
    short: "A day on Mars — 24 hours 39 minutes 35 seconds, just under 40 minutes longer than an Earth day.",
    expert: "Mars sidereal day: 24 h 39 m 35.2 s; the surface clock used by the crew.",
  },
  {
    key: "eclss",
    term: "ECLSS",
    short: "Environmental Control and Life-Support System — the machinery that keeps the crew alive: air, water and temperature loops.",
    expert: "Environmental Control and Life-Support System; regenerative ISS-class loops recover ~90% of water and ~50% of oxygen.",
  },
  {
    key: "msv",
    term: "mSv",
    short: "Millisievert — the unit teams use to tot up how much radiation an astronaut absorbs on a mission.",
    expert: "Millisievert, effective dose. NASA-STD-3001 sets a 600 mSv universal career limit; harm scales with cumulative dose.",
  },
  {
    key: "comms-lag",
    term: "Comms lag",
    short: "The one-way delay — a few seconds to the Moon, up to about 22 minutes to Mars. Conversations get long pauses.",
    expert: "One-way light-time (true range / c); Mars can reach ~1 300 s at closest approach, which drives remote-operations tolerance.",
  },
  {
    key: "grade",
    term: "Mission grade",
    short: "An S–D rating for the whole design. An S means every check came back green.",
    expert: "Letter rating from the 8 weighted objectives (0–100, capped by feasibility gates: stack lift and crew radiation).",
  },
];

export function glossaryTerm(key: string): GlossaryTerm | undefined {
  return GLOSSARY.find((g) => g.key === key);
}

export function glossaryKeys(): string[] {
  return GLOSSARY.map((g) => g.key);
}