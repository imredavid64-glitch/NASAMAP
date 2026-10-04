# SUBMISSION — NASA Space Apps 2026

## Entry
- **Name**: NASAMAP — Every human has a seat at the frontier
- **Team**: David (solo)
- **Developer space**: GitHub: imredavid64-glitch/NASAMAP
- **Primary lane**: Space Mission Design Game
- **Also relevant to**: Life Support & ECLSS, Flight — Trajectory & Orbital Mechanics, Live Space Feeds & Simulation, Data Pool & Insights, Open Data for Impact
- **Live URL**: https://nasamap.vercel.app

## Elevator pitch
NASAMAP turns a real Moon-to-Mars mission design into a playable loop: players pick a rocket, crew and surface stay, the engine computes Δv, mass budget, radiation dose, comms light-lag, consumables and a closed-loop life-support budget, then **rerates every change S–D across seven weighted objectives** and stamps GO / NO-GO. On top of the free Mission Lab sit **15 mission briefs** with constraints, objectives and a 0–3 star grade. Every design is a shareable link; every run can be saved as a **mission report card** image.

Beyond the game the same engine powers the "fly" (Apollo 11 / patched-conic / Mars Hohmann with CSV export), "live" (ISS ground track + KML, Voyager Horizons, APOD, NEO, space weather), and a **Cosmic Data Commons** (library, personas, search, passport, challenge aligner). New: **Rocket Builder** (design custom launch vehicles), **Community Gallery** (share & browse missions), **Mission Optimizer** (pre-computed Pareto fronts), and **enhanced physics models** (Badhwar-O'Neill GCR, King SPE, parametric habitat mass).

## How to run it
```bash
npm ci
npm run dev            # http://localhost:3000
npm run validate:data  # schema check on every dataset
npm run lint && npm run typecheck
npx vitest run         # 250 tests
npm run build && npm start
```

## Five-minute judge tour
1. **`/play` → "Artemis: Crewed Lunar Landing"** — set the crew and stay; watch the rating move as the engine re-solves life support, radiation and Δv. Earn 3★ by beating the par score.
2. **Storyboard the proof**: every slider change rewrites the URL (`/play/…?d=mars&v=starship&c=4&s=90`). Copy the link, change seats, the design follows. Complete a mission → **Download the report card SVG** — the image carries the grade, the numbers and the permalink.
3. **`/mission`** — free build. Open the design permalink; note the **personal best** per destination.
4. **`/tools/rocket-builder`** — Design custom rockets from 12 real engines (Merlin, Raptor, RS-25, RL10, BE-4, F-1, J-2, Vulcain) and 15 tanks. Live Δv, TWR, payload (LEO/TLI/GTO), cost. Export to Mission Lab.
4. **`/community`** — Browse shared missions with filters (destination, grade), view full scorecards, deep-link to `/fly` for trajectory replay, upvote & comment.
5. **`/fly`** — Apollo 11 replay, Moon Hohmann, Earth→Mars Kepler solve; export trajectory to **CSV**.
6. **`/live`** — real ISS pass/ground-track with **KML export** (opens in Google Earth), Voyager distances, APOD, NEO, solar weather — all with snapshot fallback.
7. **`/tools/mission-optimizer`** — Pre-computed Pareto-optimal Mars architectures (2028/2031 windows). Interactive Pareto front: IMLEO vs payload vs radiation vs cost. NSGA-II + gradient refinement.
8. **`/library`, `/commons`, `/challenges`** — articles, persona cards (farmer on Mars…), search, and the **Challenge Aligner** with annotated coverage map for 42/86 official 2026 challenges (49%).

## Evidence map (route → engineering)
- Design engine & scoring: `src/lib/mission.ts`, `src/lib/score.ts` (7 weighted objectives; S–D curve; GO/NO-GO gate)
- Scenario game: `src/data/scenarios.json` (15 scenarios), `src/lib/scenarios.ts`, `src/lib/progress.ts`
- Report card: `src/lib/report-card.ts` (SVG, shareable, permalink-embedded)
- Trajectory: `src/lib/trajectory.ts`, `src/lib/rocket.ts` (patched-conic Hohmann, heliocentric Kepler solve)
- Live data: `src/lib/live.ts`, `src/app/api/live/iss/route.ts` (ISS/space station + en-route track via satellite.js; committed snapshot fallback)
- Life support: `src/lib/life.ts` (consumables, ECLSS closed-loop budget, **enhanced radiation: Badhwar-O'Neill GCR + King SPE + storm shelter**; **parametric habitat mass** from TransHab/BA-330 heritage)
- Rocket Builder: `src/lib/rocket-builder.ts` (12 engines, 15 tanks, Tsiolkovsky staged Δv, TWR, payload estimates), `src/app/tools/rocket-builder/`
- Community: `convex/missions.ts` (missions, comments, upvotes), `src/app/community/`, `src/lib/convex-community.ts`
- Mission Optimizer: `src/data/pareto-fronts.ts` (2028/2031 fronts, NSGA-II methodology), `src/app/tools/mission-optimizer/`
- Commons: `src/lib/commons.ts`, `src/lib/search.ts` (MiniSearch index)
- Challenge alignment: `src/data/challenges.ts`, `src/lib/challenges.ts`

## Engineering honesty
- Live data is labelled **live**; anything cached is labelled **snapshot** with a timestamp; snapshots are committed so the demo never dies on stage.
- Estimated parameters (vehicle capability, mass budgets) are tagged `estimate` in the data with a `costConfidence`/provenance field — nothing is fabricated.
- **Enhanced models opt-in**: `useEnhancedModels` flag defaults to false for backward compatibility; legacy fixed values (10t/30t habitat, simple radiation) preserved for all existing tests.
- 250 automated tests cover the physics, datasets, scoring, scenarios, scenarios (15), exports; `validate:data` schema-checks every JSON dataset in CI.
- Fonts are self-hosted; no external network calls from the app at runtime except the documented live-data endpoints.

## Deploy (already on GitHub)
Every change is gated by CI (`.github/workflows/ci.yml`): lint → typecheck → dataset validation → 250 tests → production build. To go live on Vercel:

1. Push `main` to GitHub (repo: `imredavid64-glitch/NASAMAP`).
2. Go to **vercel.com/import** → select GitHub repo → it auto-detects Next.js; keep defaults, click Deploy.
3. (Optional) set `NEXT_PUBLIC_SITE_URL` to the production URL for sitemap/robots.
4. Put the live URL in **"Live URL"** above and in `README.md`.

## Credits
- Data: NASA (ISS tracks via satellite.js, Horizons ephemeris, APOD, NEO, SWPC), JPL, NOAA.
- Built with Next.js, React Three Fiber, MiniSearch, Recharts — all open source.