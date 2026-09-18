# NASAMAP â€” *The Next Frontier*

A no-database, offline-first mission-design platform for the Moon â†’ Mars frontier, built for the
**NASA Space Apps Challenge 2026**.

Design a real crewed mission, watch its trajectory fly, close its life-support loop, then take home a
printable **Mission Passport** and embroidered **Mission Patch**. Every figure on screen is computed by a
shared, unit-tested science engine â€” nothing is hard-coded for effect.

---

## The idea

Most "space apps" are a pretty front end bolted onto a lookup table. NASAMAP is the opposite: a small
**physics and operations engine** (`src/lib/*`) that composes real NASA/NOAA/CODATA benchmarks, and a set of
interfaces that expose it. If a number is on the screen, the engine produced it, and a test pins it to a
published reference.

### Four acts

| Act | Route | What it does |
| --- | --- | --- |
| **I Â· Play & Plan** | `/play`, `/mission` | Play the **Space Mission Design Game**: six briefs with hard constraints (vehicle, crew, surface time, radiation), objectives judged by the scoring engine, and a **0â€“3 star** grade with local progress. Every completed run can be saved as a **mission report card** â€” an image that carries the grade, the engine's numbers and a permalink to the exact design. In the free Mission Lab, pick a destination, rocket, crew and surface stay; the engine sums Î”v, mass budget, radiation dose, light-lag, consumables and the closed-loop life-support budget, then **rates the design Sâ€“D** across seven weighted objectives and stamps **GO / NO-GO**. Your best grade per destination is kept locally. The design is encoded in the URL, so a mission is a shareable, bookmarkable link. A **3D surface-ops view** spins one Martian sol to show the array and battery earning their place. |
| **II Â· Fly** | `/fly` | Three trajectory modes: replay **Apollo 11** event-by-event from an interpolated historical timeline; fly a **patched-conic Hohmann transfer** to the Moon (`?mode=hohmann`); or coast Earthâ†’Mars on a Sun-centred **Kepler solve** of the minimum-energy ellipse (`?mode=mars`). Any mode exports its full path to **CSV**. |
| **III Â· Live** | `/live` | Real-time ISS ground track, Voyager 1 & 2 range (JPL Horizons), the day's APOD, near-Earth objects and NOAA space weather â€” with a committed snapshot fallback so the demo never dies on stage. The ISS card exports a full-orbit **ground track as KML** for Google Earth. |
| **IV Â· Share** | `/library`, `/search`, `/commons`, `/challenges` | A curated **Cosmic Data Commons**: explainer articles, persona-based advice cards, a full-text search index, the Mission Passport & Patch you can download and print, and a live **Challenge Aligner** mapping all 86 official 2026 challenges to the platform, plus a recommended **submission playbook** from challenge to evidence. |

---

## How it maps to the judging criteria

- **Impact** â€” one engine answers the questions a real mission planner asks: *can this rocket lift it, will the
  crew survive it, can we keep them alive, and can we talk to them?* The persona cards turn that into advice
  for careers, research and public outreach.
- **Creativity** â€” a **Mission Passport** and **Mission Patch** generated live from the design, a
  physics-driven transfer diagram, and a live/snapshot data model that stays honest when the network is not.
- **Technical depth** â€” Kepler solvers, SGP4 orbit propagation (`satellite.js`), a Hohmann patched-conic
  solver, ECLSS consumable & power budgeting, and an SVG artifact generator â€” all pure and unit-tested
  (**234 tests**, `vitest`).
- **Usability** â€” responsive dark-mode UI, mobile navigation, focus states, print styles, and a
  3D view that degrades gracefully (`ssr:false` client wrappers).
- **Reliability** â€” typed JSON datasets validated in CI-style scripts; every live feed falls back to a dated,
  committed snapshot and labels itself `live` vs `snapshot`. No database, no secrets, no network required to demo.

---

## The science engine

| Module | Responsibility | Grounding |
| --- | --- | --- |
| `src/lib/astro.ts` | Orbits, Kepler, body geometry | CODATA 2018 / IAU 2015 / NASA Planetary Fact Sheet (`src/data/constants.json`) |
| `src/lib/rocket.ts` | Rocket equation, Hohmann transfers, Î”v | Tsiolkovsky; documented vehicle specs (`launch-vehicles.json`) |
| `src/lib/comm.ts` | Light-time, DSN-class link budgets | Speed of light (CODATA), mean Earthâ€“Mars distance |
| `src/lib/life.ts` | Consumables, radiation dose, **closed-loop ECLSS budget** | NASA ISS ECLSS fact sheets, MSL RAD, NASA OGS draw |
| `src/lib/surface.ts` | **Surface ops** â€” Mars solar geometry, array output, battery state over a sol | Standard solar-elevation formula, Mars obliquity 25.19Â° |
| `src/lib/mission.ts` | Composes the above into a mission design | Apollo-class TLI, Hohmann synodic windows |
| `src/lib/score.ts` | **Mission rating** â€” seven weighted objectives, Sâ€“D grade with feasibility caps | NASA-STD-3001 (600 mSv career limit), ISS ECLSS, Apollo-class Î”v |
| `src/lib/best-score.ts` | **Personal best** â€” per-destination high score in localStorage, injected storage for testing | Pure, store-agnostic comparison |
| `src/lib/scenarios.ts` | **Game layer** â€” scenario briefs, constraints, objectives, 0â€“3 star grading | Re-uses the scored objectives, par-score beats |
| `src/lib/progress.ts` | **Star progress** â€” per-scenario best across sessions | Injected storage, validated records |
| `src/lib/report-card.ts` | **Mission report card** â€” a shareable SVG grade image with the permalink baked in | Pure, deterministic string builder |
| `src/lib/orbit.ts` | SGP4 satellite propagation, pass prediction | `satellite.js` |
| `src/lib/trajectory.ts` | Apollo 11 interpolation, patched-conic Moon transfer, Sun-centred Earthâ†’Mars Kepler solve | Committed historical timeline |
| `src/lib/export.ts` | CSV serialisation of trajectories (Earth-Moon scene units / Mars au) and KML of the ISS ground track | RFC-4180 quoting, OGC KML 2.2 |
| `src/lib/design-link.ts` | Validated encode/decode of a mission design into a permalink | Enum + range validation |
| `src/lib/passport.ts` Â· `src/lib/patch.ts` | Deterministic SVG artifacts | Everything drawn from the shared engine |
| `src/lib/commons.ts` Â· `src/lib/search.ts` | Persona advice + MiniSearch index | Curated datasets |

### The honesty rule

> Never fabricate a number. Every power/performance line is tagged **documented**, **derived**, or **estimate**,
> and every live value is labelled **live** or **snapshot** with a date.

For example, the closed-loop life-support budget uses NASA's **~90%** ISS water recovery and the Sabatier
COâ‚‚-reduction assembly's **~50%** oxygen recovery, and derives solar-array area from the **1.361 kW/mÂ˛** solar
constant via the inverse-square law â€” so a Mars array is shown to be larger than a lunar one for the same load.

---

## Run it locally

```bash
npm install
npm run dev          # http://localhost:3000
```

No `.env`, database, or API keys required â€” live feeds are public and every one has a committed fallback.

### Quality gates

```bash
npm test             # vitest â€” 234 tests
npm run lint         # eslint
npm run typecheck    # tsc --noEmit
npm run validate:data
npm run build
```

Runtime smoke test (after `npm run build && npm start`): `/`, `/mission`, `/fly`, `/fly?mode=hohmann`,
`/live`, `/library`, `/library/apollo-11-replay`, `/search`, `/commons`, `/challenges`, `/play`, and every `/api/live/*` route.

### Deploy & CI

Pushing to `main` runs the full gate pipeline in GitHub Actions (`.github/workflows/ci.yml`): lint â†’ typecheck â†’
dataset validation â†’ 234 tests â†’ production build. Live now at **https://nasamap.vercel.app** (standard Next.js
project, zero server env). Optional: set `NEXT_PUBLIC_SITE_URL` to the production URL so `sitemap.xml` / `robots.txt`
point at the real host.

The judges' brief lives in **[`SUBMISSION.md`](SUBMISSION.md)** â€” narrative, a 5-minute tour, an evidence map from
route to source file, and the engineering-honesty notes.

---

## Architecture

- **Next.js 15** App Router Â· React 18 Â· TypeScript
- **three.js** + `@react-three/fiber` + `drei` for 3D (always behind an `ssr:false` client wrapper)
- **Tailwind CSS** dark space theme
- **MiniSearch** for the client-side search index
- **satellite.js** for SGP4
- **Git-as-database** â€” all curated data lives in `src/data/*.json` and is validated by `scripts/validate-data.ts`

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

The official Space Apps 2026 catalogue is **extracted, not typed in**:

```bash
node scripts/extract-challenges.mjs   # writes src/data/challenges-2026.json from the public GraphQL API
node scripts/check-challenges.mjs     # human-readable listing
```

`src/lib/challenges.ts` matches every title against six **relevance lanes** that mirror the four acts.
The result is a live `/challenges` page â€” **37 of 86 challenges (43%)** are served by a shipped capability,
each badge deep-linking to the feature that does the work. The lanes NASAMAP is purpose-built for include:

- **Space Mission Design Game** â€” a real game layer at `/play`: six mission briefs with constraints, objectives, 0â€“3 star grading and local progress, built on the **Sâ€“D mission rating**, Î”v, mass budget and GO / NO-GO gate (`/mission`)
- **Interplanetary Survival Guide: Martian Map** â€” radiation, consumables, ECLSS, transfer geometry (`/mission#ops`)
- **SpaceTrash Hack: Revolutionizing Recycling on Mars** â€” closed-loop recycling and array sizing (`/mission#ops`)
- **Your Home in Space: The Habitat Layout Creator** â€” habitat mass budgets and surface stay (`/mission`)
- **Create an Orrery Web App that Displays Near-Earth Objects** â€” 3D transfer flight + live NEO feed (`/fly`, `/live`)
- **International Space Station 25th Anniversary Apps** â€” live ISS ground track and snapshot fallback (`/live`)

> The API disables GraphQL introspection and `viewer.challenges` returns `null` for anonymous callers; the
> working query is `challenges(first: N) { edges { node { id title categories { name } } } }`. The original
> checker queried a non-existent `slug` field, which made a published catalogue look empty â€” now fixed.

---

## Credits

Physics, orbital and life-support constants are drawn from public NASA, NOAA/SWPC, JPL and CODATA sources,
cited inline next to the values they produce. Live data courtesy of **NASA**, **JPL Horizons**,
**NASA APOD**, **NASA NeoWs**, and **NOAA SWPC**.
