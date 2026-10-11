# NASAMAP — Video Script Brief for AI Assistant

## Project Identity
- **Name**: NASAMAP — Every human has a seat at the frontier
- **Team**: David (solo)
- **Event**: NASA Space Apps Challenge 2026
- **Primary Lane**: Space Mission Design Game
- **Also Relevant**: Life Support & ECLSS, Flight — Trajectory & Orbital Mechanics, Live Space Feeds & Simulation, Data Pool & Insights, Open Data for Impact
- **Live URL**: https://nasamap.vercel.app
- **GitHub**: https://github.com/imredavid64-glitch/NASAMAP

## Elevator Pitch (1 sentence)
NASAMAP turns real Moon-to-Mars mission design into a playable, physics-driven loop: pick a rocket/crew/surface stay → engine computes Δv, mass budget, radiation dose, comms lag, closed-loop life support → rates S–D across 7 weighted objectives → stamps GO/NO-GO.

## Four Acts (The Product)

### Act I — Play & Plan (`/play`, `/mission`)
- **Space Mission Design Game** (`/play`): 15 scenarios with hard constraints (vehicle, crew, surface days, radiation), 0–3 star grading, par scores, local progress persistence
- **Mission Lab** (`/mission`): Free-form design, URL-encoded shareable permalinks, personal best per destination
- **Engine**: Tsiolkovsky rocket eq, NASA ISS ECLSS (90% water, 50% O₂ recovery), MSL RAD radiation, CODATA constants
- **Artifacts**: Mission Report Card SVG (grade + numbers + permalink), Mission Passport, Mission Patch

### Act II — Fly (`/fly`)
- **Apollo 11 Replay**: Event-by-event from interpolated historical timeline
- **Hohmann Transfer** (`?mode=hohmann`): Patched-conic Earth→Moon
- **Mars Kepler** (`?mode=mars`): Sun-centered minimum-energy ellipse
- **All export CSV** (trajectory data)
- **Historical Missions**: 15 missions (Apollo 8–17, Voyager, Cassini, etc.)

### Act III — Live (`/live`)
- **ISS**: Real-time ground track via SGP4 (satellite.js), next pass, **KML export for Google Earth**
- **Voyager 1 & 2**: Live range from JPL Horizons (light-hours, AU)
- **APOD**: NASA Astronomy Picture of the Day
- **NEO**: Near-Earth Objects from NASA NeoWs
- **Space Weather**: NOAA SWPC solar storm levels
- **Honesty**: Every feed labeled **live** or **snapshot** with timestamp; committed fallbacks so demo never dies

### Act IV — Share (`/library`, `/commons`, `/challenges`, `/tools/*`)
- **Library**: Curated articles (transfer windows, radiation, ISRU, cost, ECLSS, scoring)
- **Commons**: Persona advice cards (Farmer on Mars, Habitat Architect, etc.), MiniSearch full-text index
- **Challenge Aligner**: **42 of 86 official 2026 challenges** mapped to shipped capabilities with deep-links
- **Rocket Builder** (`/tools/rocket-builder`): 12 real engines, 15 tanks, live Δv/TWR/payload/cost, export to Mission Lab
- **Mission Optimizer** (`/tools/mission-optimizer`): Pre-computed Pareto fronts for Mars 2028/2031, NSGA-II + gradient refinement
- **Community** (`/community`): Browse shared missions, filter by grade/destination, deep-link to Fly, upvote/comment

## Technical Depth (Judging Criteria Evidence)

| Criterion | How NASAMAP Wins |
|-----------|------------------|
| **Impact** | One engine answers real mission planner questions: can it lift, will crew survive, can we keep them alive, can we talk? Persona cards turn this into career/outreach advice. |
| **Creativity** | Mission Passport + Patch generated live from design, physics-driven transfer diagram, live/snapshot data model that stays honest offline. |
| **Technical Depth** | Kepler solvers, SGP4 orbit propagation, Hohmann patched-conic, ECLSS consumable/power budgeting, SVG artifact generator — all pure TypeScript, **250 unit tests** (vitest). |
| **Usability** | Responsive dark mode, mobile nav, focus states, print styles, 3D degrades gracefully (`ssr:false` client wrappers). |
| **Reliability** | Typed JSON datasets validated in CI; every live feed falls back to committed snapshot; labels itself `live` vs `snapshot`. No database, no secrets, no network required to demo. |

## Science Engine Modules (`src/lib/*`)

| Module | Responsibility | Grounding |
|--------|----------------|-----------|
| `astro.ts` | Orbits, Kepler, body geometry | CODATA 2018 / IAU 2015 / NASA Planetary Fact Sheet |
| `rocket.ts` | Rocket equation, Hohmann, Δv | Tsiolkovsky; documented vehicle specs |
| `comm.ts` | Light-time, DSN link budgets | Speed of light (CODATA), mean Earth–Mars distance |
| `life.ts` | Consumables, radiation, **closed-loop ECLSS** | NASA ISS ECLSS, MSL RAD, NASA OGS draw |
| `surface.ts` | **Mars surface ops** — solar geometry, array output, battery over sol | Solar elevation formula, Mars obliquity 25.19° |
| `mission.ts` | Composes above into mission design | Apollo-class TLI, Hohmann synodic windows |
| `score.ts` | **Mission rating** — 7 weighted objectives, S–D grade, GO/NO-GO caps | NASA-STD-3001 (600 mSv), ISS ECLSS, Apollo Δv |
| `scenarios.ts` | **Game layer** — 15 briefs, constraints, 0–3 stars | Re-uses scored objectives |
| `report-card.ts` | Shareable SVG with permalink baked in | Pure, deterministic |
| `trajectory.ts` | Apollo 11 interp, patched-conic, Kepler solve | Committed historical timeline |
| `export.ts` | CSV (Earth-Moon / Mars AU), KML (ISS ground track) | RFC-4180, OGC KML 2.2 |
| `passport.ts` / `patch.ts` | Deterministic SVG artifacts | All drawn from shared engine |

## Enhanced Models (Opt-in, Backward Compatible)
- **Radiation**: Badhwar-O'Neill 2010 GCR (solar modulation φ) + King 1974 SPE + storm shelter factor + ICRP 103 organ doses
- **Habitat Mass**: Parametric (TransHab/BA-330 heritage) — volume/crew, vessel/ECLSS/shielding/outfitting/margin
- **Flag**: `useEnhancedModels` defaults `false` — all 250 tests pass unchanged

## Challenge Alignment
- **Official 2026 catalogue extracted via GraphQL** (not typed in)
- **42/86 challenges (49%)** served by shipped capabilities
- Each badge deep-links to the feature that does the work
- Lanes covered: Space Mission Design Game, Rocket Builder, Mission Optimizer, Collaborative Mission Design, Interplanetary Survival Guide, SpaceTrash Hack, Habitat Layout Creator, NEO Orrery, ISS 25th Anniversary

## Engineering Honesty (Critical for Judges)
- Every number tagged **documented** / **derived** / **estimate**
- Live data labeled **live** or **snapshot** with date
- Estimated vehicle capabilities tagged with `costConfidence` + provenance
- Enhanced models opt-in only — legacy fixed values preserved for all tests
- 250 automated tests + `validate:data` schema-checks every JSON dataset in CI
- Fonts self-hosted; zero external network calls at runtime except documented live endpoints

## Architecture
- **Next.js 15** App Router · React 18 · TypeScript
- **three.js** + `@react-three/fiber` + `drei` for 3D (client-only wrappers)
- **Tailwind CSS** dark space theme
- **MiniSearch** client-side search index
- **satellite.js** for SGP4
- **Git-as-database** — all curated data in `src/data/*.json`, validated by `scripts/validate-data.ts`
- **Convex** for community features (missions, comments, upvotes, presence)

## CI/CD Pipeline (`.github/workflows/ci.yml`)
`lint → typecheck → validate:data → 250 tests → production build` on every push to main.

## Key Soundbites for Script

> "The engine doesn't just calculate Δv — it closes the life-support loop. ISS-class 90% water recovery, 50% oxygen recovery via Sabatier, solar array sized from the actual load at Mars' 1.52 AU. That's not a lookup table. That's physics."

> "The GO/NO-GO gate isn't cosmetic. If your stack exceeds the vehicle's documented TLI payload, or your crew dose blows NASA-STD-3001's 600 mSv career limit, the grade caps at D — no matter how pretty the rest looks."

> "The Challenge Aligner doesn't keyword-match — it maps each official challenge to the specific capability that answers it. 42 of 86. That's not coverage theater. That's evidence."

> "The Mission Optimizer shows you the mathematically optimal architectures. NSGA-II across IMLEO, payload, radiation, cost — every point on that front is a non-dominated solution. No human bias, just the physics."

## Video Requirements (NASA Official)
- **30 seconds max** (strict)
- Hosted on YouTube (unlisted), Google Drive, OneDrive, or Dropbox — **publicly accessible**
- English or **English subtitles required**
- **No NASA branding** (logo, flag, mission patches, "NASA" in title/thumbnail)
- **AI disclosure** in video description
- **No minors** (recognizable faces/voices under 18)
- Music/assets must be royalty-free

## Files in Repo for Reference
- `VIDEO_SCRIPT.md` — 30s shot list + timing
- `DEMO_SCRIPT.md` — 2-min demo walkthrough
- `SUBMISSION.md` — Official submission narrative
- `README.md` — Full project documentation

## Quick Test Commands
```bash
npm run build        # passes
npm test             # 250/250 pass
npm run lint         # 0 errors
npm run validate:data # all datasets valid
```

## Judge Mode URL
`https://nasamap.vercel.app/?judge=1` — auto-starts guided tour overlay

---

**For the AI writing the script**: Use `VIDEO_SCRIPT.md` for the 30s frame-by-frame, `DEMO_SCRIPT.md` for the 2-min extended cut. Emphasize the **physics-honest engine**, **7 weighted objectives with feasibility caps**, **printable artifacts from engine data**, **42/86 challenge coverage with deep links**, and **250 tests + zero-secrets offline capability**. These are the differentiators judges look for.