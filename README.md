# NASAMAP — *The Next Frontier*

A no-database, offline-first mission-design platform for the Moon → Mars frontier, built for the
**NASA Space Apps Challenge 2026**.

Design a real crewed mission, watch its trajectory fly, close its life-support loop, then take home a
printable **Mission Passport** and embroidered **Mission Patch**. Every figure on screen is computed by a
shared, unit-tested science engine — nothing is hard-coded for effect.

---

## The idea

Most "space apps" are a pretty front end bolted onto a lookup table. NASAMAP is the opposite: a small
**physics and operations engine** (`src/lib/*`) that composes real NASA/NOAA/CODATA benchmarks, and a set of
interfaces that expose it. If a number is on the screen, the engine produced it, and a test pins it to a
published reference.

### Four acts

| Act | Route | What it does |
| --- | --- | --- |
| **I · Plan** | `/mission` | Pick a destination, rocket, crew and surface stay. The engine sums Δv, mass budget, radiation dose, light-lag, consumables and the closed-loop life-support budget, then stamps **GO / NO-GO**. |
| **II · Fly** | `/fly` | Replay **Apollo 11** event-by-event from an interpolated historical timeline, or fly a **patched-conic Hohmann transfer** (Earth→Moon, or Earth→Mars via `?mode=`). |
| **III · Live** | `/live` | Real-time ISS ground track, Voyager 1 & 2 range (JPL Horizons), the day's APOD, near-Earth objects and NOAA space weather — with a committed snapshot fallback so the demo never dies on stage. |
| **IV · Share** | `/library`, `/search`, `/commons` | A curated **Cosmic Data Commons**: explainer articles, persona-based advice cards, a full-text search index, plus the Mission Passport & Patch you can download and print. |

---

## How it maps to the judging criteria

- **Impact** — one engine answers the questions a real mission planner asks: *can this rocket lift it, will the
  crew survive it, can we keep them alive, and can we talk to them?* The persona cards turn that into advice
  for careers, research and public outreach.
- **Creativity** — a **Mission Passport** and **Mission Patch** generated live from the design, a
  physics-driven transfer diagram, and a live/snapshot data model that stays honest when the network is not.
- **Technical depth** — Kepler solvers, SGP4 orbit propagation (`satellite.js`), a Hohmann patched-conic
  solver, ECLSS consumable & power budgeting, and an SVG artifact generator — all pure and unit-tested
  (**111 tests**, `vitest`).
- **Usability** — responsive dark-mode UI, mobile navigation, focus states, print styles, and a
  3D view that degrades gracefully (`ssr:false` client wrappers).
- **Reliability** — typed JSON datasets validated in CI-style scripts; every live feed falls back to a dated,
  committed snapshot and labels itself `live` vs `snapshot`. No database, no secrets, no network required to demo.

---

## The science engine

| Module | Responsibility | Grounding |
| --- | --- | --- |
| `src/lib/astro.ts` | Orbits, Kepler, body geometry | CODATA 2018 / IAU 2015 / NASA Planetary Fact Sheet (`src/data/constants.json`) |
| `src/lib/rocket.ts` | Rocket equation, Hohmann transfers, Δv | Tsiolkovsky; documented vehicle specs (`launch-vehicles.json`) |
| `src/lib/comm.ts` | Light-time, DSN-class link budgets | Speed of light (CODATA), mean Earth–Mars distance |
| `src/lib/life.ts` | Consumables, radiation dose, **closed-loop ECLSS budget** | NASA ISS ECLSS fact sheets, MSL RAD, NASA OGS draw |
| `src/lib/mission.ts` | Composes the above into a mission design | Apollo-class TLI, Hohmann synodic windows |
| `src/lib/orbit.ts` | SGP4 satellite propagation, pass prediction | `satellite.js` |
| `src/lib/trajectory.ts` | Apollo 11 interpolation, transfer-diagram geometry | Committed historical timeline |
| `src/lib/passport.ts` · `src/lib/patch.ts` | Deterministic SVG artifacts | Everything drawn from the shared engine |
| `src/lib/commons.ts` · `src/lib/search.ts` | Persona advice + MiniSearch index | Curated datasets |

### The honesty rule

> Never fabricate a number. Every power/performance line is tagged **documented**, **derived**, or **estimate**,
> and every live value is labelled **live** or **snapshot** with a date.

For example, the closed-loop life-support budget uses NASA's **~90%** ISS water recovery and the Sabatier
CO₂-reduction assembly's **~50%** oxygen recovery, and derives solar-array area from the **1.361 kW/m²** solar
constant via the inverse-square law — so a Mars array is shown to be larger than a lunar one for the same load.

---

## Run it locally

```bash
npm install
npm run dev          # http://localhost:3000
```

No `.env`, database, or API keys required — live feeds are public and every one has a committed fallback.

### Quality gates

```bash
npm test             # vitest — 111 tests
npm run lint         # eslint
npm run typecheck    # tsc --noEmit
npm run validate:data
npm run build
```

Runtime smoke test (after `npm run build && npm start`): `/`, `/mission`, `/fly`, `/fly?mode=hohmann`,
`/live`, `/library`, `/library/apollo-11-replay`, `/search`, `/commons`, and every `/api/live/*` route.

---

## Architecture

- **Next.js 15** App Router · React 18 · TypeScript
- **three.js** + `@react-three/fiber` + `drei` for 3D (always behind an `ssr:false` client wrapper)
- **Tailwind CSS** dark space theme
- **MiniSearch** for the client-side search index
- **satellite.js** for SGP4
- **Git-as-database** — all curated data lives in `src/data/*.json` and is validated by `scripts/validate-data.ts`

```
src/
  app/        # routes: mission, fly, live, library, search, commons, api/live/*
  components/ # UI kit, 3D canvas wrappers, mission artifacts
  lib/        # the science engine (pure, unit-tested)
  data/       # curated + snapshotted JSON datasets
tests/        # vitest suites, one per engine module
scripts/      # validate-data, check-challenges
```

---

## Challenge alignment

Built for the **2026 "The Next Frontier"** challenge. Challenge titles are fetched from the official
Space Apps API by `scripts/check-challenges.mjs`; when the full statements publish, each one is mapped to a
relevance lane in the Data Commons.

---

## Credits

Physics, orbital and life-support constants are drawn from public NASA, NOAA/SWPC, JPL and CODATA sources,
cited inline next to the values they produce. Live data courtesy of **NASA**, **JPL Horizons**,
**NASA APOD**, **NASA NeoWs**, and **NOAA SWPC**.
