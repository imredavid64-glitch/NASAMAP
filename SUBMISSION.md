# SUBMISSION — NASA Space Apps 2026

## Entry
- **Name**: NASAMAP — Every human has a seat at the frontier
- **Team**: (fill in team name)
- **Developer space**: (fill in)
- **Primary lane**: Space Mission Design Game
- **Also relevant to**: Life Support & ECLSS, Flight — Trajectory & Orbital Mechanics, Live Space Feeds & Simulation, Data Pool & Insights, Open Data for Impact
- **Live URL**: https://nasamap.vercel.app

## Elevator pitch
NASAMAP turns a real Moon-to-Mars mission design into a playable loop: players pick a rocket, crew and surface stay, the engine computes Δv, mass budget, radiation dose, comms light-lag, consumables and a closed-loop life-support budget, then **rerates every change S–D across seven weighted objectives** and stamps GO / NO-GO. On top of the free Mission Lab sit **six mission briefs** with constraints, objectives and a 0–3 star grade. Every design is a shareable link; every run can be saved as a **mission report card** image.

Beyond the game the same engine powers the "fly" (Apollo 11 / patched-conic / Mars Hohmann with CSV export), "live" (ISS ground track + KML, Voyager Horizons, APOD, NEO, space weather), and a **Cosmic Data Commons** (library, personas, search, passport, challenge aligner).

## How to run it
```bash
npm ci
npm run dev            # http://localhost:3000
npm run validate:data  # schema check on every dataset
npm run lint && npm run typecheck
npx vitest run         # 219 tests
npm run build && npm start
```

## Five-minute judge tour
1. **`/play` → "Artemis: Crewed Lunar Landing"** — set the crew and stay; watch the rating move as the engine re-solves life support, radiation and Δv. Earn 3★ by beating the par score.
2. **Storyboard the proof**: every slider change rewrites the URL (`/play/…?d=mars&v=starship&c=4&s=90`). Copy the link, change seats, the design follows. Complete a mission → **Download the report card SVG** — the image carries the grade, the numbers and the permalink.
3. **`/mission`** — free build. Open the design permalink; note the **personal best** per destination.
4. **`/fly`** — Apollo 11 replay, Moon Hohmann, Earth→Mars Kepler solve; export the trajectory to **CSV**.
5. **`/live`** — real ISS pass/ground-track with **KML export** (opens in Google Earth), Voyager distances, APOD, NEO, solar weather.
6. **`/library`, `/commons`, `/challenges`** — articles, persona cards (farmer on Mars…), search, and the **Challenge Aligner** with an annotated coverage map for all 86 official 2026 challenges.

## Evidence map (route → engineering)
- Design engine & scoring: `src/lib/mission.ts`, `src/lib/score.ts` (7 weighted objectives; S–D curve; GO/NO-GO gate)
- Scenario game: `src/data/scenarios.json`, `src/lib/scenarios.ts`, `src/lib/progress.ts`
- Report card: `src/lib/report-card.ts` (SVG, shareable, permalink-embedded)
- Trajectory: `src/lib/trajectory.ts`, `src/lib/rocket.ts` (patched-conic Hohmann, heliocentric Kepler solve)
- Live data: `src/lib/live.ts`, `src/app/api/live/iss/route.ts` (ISS/space station + en-route track via satellite.js; committed snapshot fallback so the demo survives a dead network)
- Life support: `src/lib/life.ts` (consumables, ECLSS closed-loop budget, radiation)
- Commons: `src/lib/commons.ts` (astro + agriculture read-if-the-day), `src/lib/search.ts` (MiniSearch index)
- Challenge alignment: `src/data/challenges.ts`, `src/lib/challenges.ts`

## Engineering honesty
- Live data is labelled **live**; anything cached is labelled **snapshot** with a timestamp; snapshots are committed so the demo never dies on stage.
- Estimated parameters (vehicle capability, mass budgets) are tagged `estimate` in the data with a `costConfidence`/provenance field — nothing is fabricated.
- 219 automated tests cover the physics, datasets, scoring, scenarios and exports; `validate:data` schema-checks every JSON dataset in CI.
- Fonts are self-hosted; no external network calls from the app at runtime except the documented live-data endpoints.

## Deploy (already on GitHub)
Every change is gated by CI (`.github/workflows/ci.yml`): lint → typecheck → dataset validation → 219 tests → production build. To go live on Vercel:

1. Push `main` to GitHub (repo: `imredavid64-glitch/NASAMAP`).
2. Go to **vercel.com/import** → select GitHub repo → it auto-detects Next.js; keep defaults, click Deploy.
3. (Optional) set `NEXT_PUBLIC_SITE_URL` to the production URL for sitemap/robots.
4. Put the live URL in **"Live URL"** above and in `README.md`.

## Credits
- Data: NASA (ISS tracks via satellite.js, Horizons ephemeris, APOD, NEO, SWPC), JPL, NOAA.
- Built with Next.js, React Three Fiber, MiniSearch — all open source.