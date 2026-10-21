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
npx vitest run         # 272 tests
npm run build && npm start
```

## Five-minute judge tour
1. **`/play` → "Artemis: Crewed Lunar Landing"** — set the crew and stay; watch the rating move as the engine re-solves life support, radiation and Δv. Earn 3★ by beating the par score.
2. **Storyboard the proof**: every slider change rewrites the URL (`/play/…?d=mars&v=starship&c=4&s=90`). Copy the link, change seats, the design follows. Complete a mission → **Download the report card SVG** — the image carries the grade, the numbers and the permalink.
3. **`/mission`** — free build. Open the design permalink; note the **personal best** per destination.
4. **`/tools/rocket-builder`** — Design custom rockets from 12 real engines (Merlin, Raptor, RS-25, RL10, BE-4, F-1, J-2, Vulcain) and 15 tanks. Live Δv, TWR, payload (LEO/TLI/GTO), cost. **Use in Mission Lab** hands the rocket over as a real custom vehicle — its payload, Isp, stage count and cost travel in the link, it appears in the vehicle dropdown, and the launch gate is scored against it.
5. **`/community`** — Browse shared missions with filters (destination, grade), view full scorecards, open the exact design in the Mission Lab, upvote & comment.
6. **`/fly`** — Apollo 11 replay, Moon Hohmann, Earth→Mars Kepler solve; export trajectory to **CSV**.
7. **`/live`** — real ISS pass/ground-track with **KML export** (opens in Google Earth), Voyager distances, APOD, NEO, solar weather — all with snapshot fallback.
8. **`/tools/mission-optimizer`** — Pre-computed Pareto-optimal Mars architectures (2028/2031 windows). Interactive Pareto front: IMLEO vs payload vs radiation vs cost. NSGA-II + gradient refinement.
9. **`/library`, `/commons`, `/challenges`** — articles, persona cards (farmer on Mars…), search, and the **Challenge Aligner** with annotated coverage map for 43/86 official 2026 challenges (50%).

## Evidence map (route → engineering)
- Design engine & scoring: `src/lib/mission.ts`, `src/lib/score.ts` (7 weighted objectives; S–D curve; GO/NO-GO gate)
- Scenario game: `src/data/scenarios.json` (15 scenarios), `src/lib/scenarios.ts`, `src/lib/progress.ts`
- Report card: `src/lib/report-card.ts` (SVG, shareable, permalink-embedded)
- Trajectory: `src/lib/trajectory.ts`, `src/lib/rocket.ts` (patched-conic Hohmann, heliocentric Kepler solve)
- Live data: `src/lib/live.ts`, `src/app/api/live/iss/route.ts` (ISS/space station + en-route track via satellite.js; committed snapshot fallback)
- Life support: `src/lib/life.ts` (consumables, ECLSS closed-loop budget, **enhanced radiation: Badhwar-O'Neill GCR + King SPE + storm shelter**; **parametric habitat mass** from TransHab/BA-330 heritage)
- Rocket Builder: `src/lib/rocket-builder.ts` (12 engines, 15 tanks, Tsiolkovsky staged Δv, TWR, payload estimates), `src/app/tools/rocket-builder/`
- Rocket Builder → Mission Lab handoff: `src/lib/design-link.ts` (query + path-safe slug carry the custom vehicle), `src/lib/mission.ts` (`materializeCustomVehicle`, modelled payload/cost provenance)
- Community: `src/lib/community.ts` (missions, comments, upvotes — localStorage, no server), `src/app/community/`
- Mission Optimizer: `src/data/pareto-fronts.ts` (2028/2031 fronts, NSGA-II methodology), `src/app/tools/mission-optimizer/`
- Commons: `src/lib/commons.ts`, `src/lib/search.ts` (MiniSearch index)
- Challenge alignment: `src/data/challenges.ts`, `src/lib/challenges.ts`

## Engineering honesty
- Live data is labelled **live**; anything cached is labelled **snapshot** with a timestamp; snapshots are committed so the demo never dies on stage.
- Estimated parameters (vehicle capability, mass budgets) are tagged `estimate` in the data with a `costConfidence`/provenance field — nothing is fabricated.
- **Enhanced models opt-in**: `useEnhancedModels` flag defaults to false for backward compatibility; legacy fixed values (10t/30t habitat, simple radiation) preserved for all existing tests.
- **Rocket Builder vehicles are labelled as modelled**, never documented: their payload, Isp and cost are estimates from the component model, and the launch gate says so.
- 272 automated tests cover the physics, datasets, scoring, scenarios, exports, and the design-link encoding; `validate:data` schema-checks every JSON dataset in CI.
- Fonts are self-hosted; no external network calls from the app at runtime except the documented live-data endpoints.

## Deploy (already on GitHub)
Every change is gated by CI (`.github/workflows/ci.yml`): lint → typecheck → dataset validation → 272 tests → production build. To go live on Vercel:

1. Push `main` to GitHub (repo: `imredavid64-glitch/NASAMAP`).
2. Go to **vercel.com/import** → select GitHub repo → it auto-detect Next.js; keep defaults, click Deploy.
3. (Optional) set `NEXT_PUBLIC_SITE_URL` to the production URL for sitemap/robots.
4. Put the live URL in **"Live URL"** above and in `README.md`.

A **Cloudflare Workers** target is also wired up (`freebuff.open-next.config.ts`, `freebuff.wrangler.jsonc`):
`npx opennextjs-cloudflare build --openNextConfigPath freebuff.open-next.config.ts --config freebuff.wrangler.jsonc`.
`build` and `dev` run Next with `--webpack` on purpose — `next-pwa` (the offline service worker) and the
OpenNext pipeline both need the webpack builder, and Next 16 defaults to Turbopack.

## Credits
- Data: NASA (ISS tracks via satellite.js, Horizons ephemeris, APOD, NEO, SWPC), JPL, NOAA.
- Built with Next.js 16, React 19, React Three Fiber, MiniSearch, Recharts — all open source.