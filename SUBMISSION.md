# SUBMISSION â€” NASA Space Apps 2026

## Entry
- **Name**: NASAMAP â€” Every human has a seat at the frontier
- **Team**: David (solo)
- **Developer space**: GitHub: imredavid64-glitch/NASAMAP
- **Primary lane**: Space Mission Design Game
- **Also relevant to**: Life Support & ECLSS, Flight â€” Trajectory & Orbital Mechanics, Live Space Feeds & Simulation, Data Pool & Insights, Open Data for Impact
- **Live URL**: https://nasamap.vercel.app

## Elevator pitch
NASAMAP turns a real Moon-to-Mars mission design into a playable loop: players pick a rocket, crew and surface stay, the engine computes Î”v, mass budget, radiation dose, comms light-lag, consumables and a closed-loop life-support budget, then **rerates every change Sâ€“D across seven weighted objectives** and stamps GO / NO-GO. On top of the free Mission Lab sit **six mission briefs** with constraints, objectives and a 0â€“3 star grade. Every design is a shareable link; every run can be saved as a **mission report card** image.

Beyond the game the same engine powers the "fly" (Apollo 11 / patched-conic / Mars Hohmann with CSV export), "live" (ISS ground track + KML, Voyager Horizons, APOD, NEO, space weather), and a **Cosmic Data Commons** (library, personas, search, passport, challenge aligner).

## How to run it
```bash
npm ci
npm run dev            # http://localhost:3000
npm run validate:data  # schema check on every dataset
npm run lint && npm run typecheck
npx vitest run         # 249 tests
npm run build && npm start
```

## Five-minute judge tour
1. **`/play` â†’ "Artemis: Crewed Lunar Landing"** â€” set the crew and stay; watch the rating move as the engine re-solves life support, radiation and Î”v. Earn 3â… by beating the par score.
2. **Storyboard the proof**: every slider change rewrites the URL (`/play/â€¦?d=mars&v=starship&c=4&s=90`). Copy the link, change seats, the design follows. Complete a mission â†’ **Download the report card SVG** â€” the image carries the grade, the numbers and the permalink.
3. **`/mission`** â€” free build. Open the design permalink; note the **personal best** per destination.
4. **`/fly`** â€” Apollo 11 replay, Moon Hohmann, Earthâ†’Mars Kepler solve; export the trajectory to **CSV**.
5. **`/live`** â€” real ISS pass/ground-track with **KML export** (opens in Google Earth), Voyager distances, APOD, NEO, solar weather.
6. **`/library`, `/commons`, `/challenges`** â€” articles, persona cards (farmer on Marsâ€¦), search, and the **Challenge Aligner** with an annotated coverage map for all 86 official 2026 challenges.

## Evidence map (route â†’ engineering)
- Design engine & scoring: `src/lib/mission.ts`, `src/lib/score.ts` (7 weighted objectives; Sâ€“D curve; GO/NO-GO gate)
- Scenario game: `src/data/scenarios.json`, `src/lib/scenarios.ts`, `src/lib/progress.ts`
- Report card: `src/lib/report-card.ts` (SVG, shareable, permalink-embedded)
- Trajectory: `src/lib/trajectory.ts`, `src/lib/rocket.ts` (patched-conic Hohmann, heliocentric Kepler solve)
- Live data: `src/lib/live.ts`, `src/app/api/live/iss/route.ts` (ISS/space station + en-route track via satellite.js; committed snapshot fallback so the demo survives a dead network)
- Life support: `src/lib/life.ts` (consumables, ECLSS closed-loop budget, radiation)
- Commons: `src/lib/commons.ts` (astro + agriculture read-if-the-day), `src/lib/search.ts` (MiniSearch index)
- Challenge alignment: `src/data/challenges.ts`, `src/lib/challenges.ts`

## Engineering honesty
- Live data is labelled **live**; anything cached is labelled **snapshot** with a timestamp; snapshots are committed so the demo never dies on stage.
- Estimated parameters (vehicle capability, mass budgets) are tagged `estimate` in the data with a `costConfidence`/provenance field â€” nothing is fabricated.
- 249 automated tests cover the physics, datasets, scoring, scenarios and exports; `validate:data` schema-checks every JSON dataset in CI.
- Fonts are self-hosted; no external network calls from the app at runtime except the documented live-data endpoints.

## Deploy (already on GitHub)
Every change is gated by CI (`.github/workflows/ci.yml`): lint â†’ typecheck â†’ dataset validation â†’ 234 tests â†’ production build. To go live on Vercel:

1. Push `main` to GitHub (repo: `imredavid64-glitch/NASAMAP`).
2. Go to **vercel.com/import** â†’ select GitHub repo â†’ it auto-detects Next.js; keep defaults, click Deploy.
3. (Optional) set `NEXT_PUBLIC_SITE_URL` to the production URL for sitemap/robots.
4. Put the live URL in **"Live URL"** above and in `README.md`.

## Credits
- Data: NASA (ISS tracks via satellite.js, Horizons ephemeris, APOD, NEO, SWPC), JPL, NOAA.
- Built with Next.js, React Three Fiber, MiniSearch â€” all open source.