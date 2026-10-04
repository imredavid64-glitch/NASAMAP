# 30-Second Pitch Video Script — NASAMAP

**Target**: NASA Space Apps 2026 Global Nominees submission
**Format**: Screen-recorded demo + voiceover
**Length**: 30 seconds exactly (aim for 28-32s)
**Tone**: Confident, technical, inspiring

---

## SHOT LIST & TIMING

| Time | Visual | Audio (Voiceover) |
|------|--------|-------------------|
| 0:00–0:04 | **Cold open**: NASAMAP landing page → click "Play & Plan" | "Every human has a seat at the frontier. NASAMAP turns real Moon-to-Mars mission design into a playable, physics-driven loop." |
| 0:04–0:09 | **Mission Lab**: Drag sliders (rocket, crew, surface days) → watch S–D score update live, GO/NO-GO stamp | "Pick a rocket, crew, and surface stay. The engine computes Δv, mass budget, radiation dose, comms lag, and a closed-loop life-support budget — then rates it S through D across seven weighted objectives." |
| 0:09–0:13 | **Scenario Game**: Select "Artemis: Crewed Lunar Landing" → adjust → earn 3 stars → download Report Card SVG | "Fifteen mission briefs with hard constraints. Beat the par score, earn stars, and download a Mission Report Card — an image that carries the grade, the numbers, and a permalink to the exact design." |
| 0:13–0:17 | **Rocket Builder**: Design custom rocket → live Δv, TWR, payload → Export to Mission Lab | "Design your own rocket from 12 real engines and 15 tanks. Live Δv, TWR, payload to LEO, TLI, GTO. Export directly to Mission Lab." |
| 0:17–0:20 | **Fly View**: Apollo 11 replay → toggle to Mars Hohmann → export CSV | "Fly it: Apollo 11 event-by-event, patched-conic Moon transfer, or Kepler-solved Earth→Mars — every trajectory exports to CSV." |
| 0:20–0:23 | **Live View**: ISS ground track → click KML export → Voyager distances → APOD | "Live ISS track with KML for Google Earth, Voyager range from JPL Horizons, APOD, near-Earth objects, space weather — all with committed snapshot fallbacks so the demo never dies." |
| 0:23–0:26 | **Mission Optimizer**: Pareto front for Mars 2028 → IMLEO vs payload vs radiation vs cost | "Pre-computed Pareto-optimal architectures for Mars 2028/2031 windows. NSGA-II optimization across IMLEO, payload, radiation, cost — every point is a non-dominated solution." |
| 0:26–0:28 | **Artifacts**: Mission Passport + Patch generated from design → print preview | "Every design generates a Mission Passport and Patch — print-ready artifacts from the same engine, not a template." |
| 0:28–0:30 | **Challenge Aligner**: Show 42/86 challenges mapped → final logo + URL | "42 of 86 official 2026 challenges served by shipped capabilities. NASAMAP — nasamap.vercel.app" |

---

## RECORDING NOTES

### Setup
- Browser: Chrome/Edge, 1920×1080, device toolbar off
- Zoom: 100% (or 90% if UI feels cramped)
- Hide bookmarks bar, extensions
- Use dark mode (default)

### Recording Flow (Single Take Preferred)
1. Start at `https://nasamap.vercel.app` (or localhost:3000)
2. Click **Play & Plan** in nav (0:00)
3. Click **Mission Lab** card or go to `/mission` (0:04)
4. Drag **Vehicle** → Starship, **Crew** → 4, **Surface Days** → 90 (0:05–0:08)
5. Point at **Score Card** (S grade, GO) (0:08–0:09)
6. Navigate to `/play` → click **"Artemis: Crewed Lunar Landing"** (0:09)
7. Adjust sliders → hit **3★** → click **Download Report Card** (0:10–0:12)
8. Navigate to `/tools/rocket-builder` → design custom rocket → click **Use in Mission Lab** (0:13–0:16)
9. Navigate to `/fly` → show **Apollo 11** replay scrub (0:17)
10. Toggle **Mars Hohmann** → click **Export CSV** (0:18–0:19)
11. Navigate to `/live` → show **ISS card** → click **Export KML** (0:20)
12. Scroll to **Voyager**, **APOD**, **NEO** cards (0:21–0:22)
13. Navigate to `/tools/mission-optimizer` → show Pareto front (0:23–0:25)
14. Navigate to `/mission` → scroll to **Passport & Patch** → click **Download** both (0:26–0:27)
15. Navigate to `/challenges` → show **lane badges** on a few cards (0:28)
16. End on homepage with logo + URL (0:29–0:30)

### Voiceover Tips
- Record audio separately (phone voice memo is fine) → sync in editor
- Speak at ~160 wpm; 30s = ~80 words
- Emphasize: **"physics-driven"**, **"seven weighted objectives"**, **"closed-loop life-support"**, **"committed snapshot fallbacks"**, **"print-ready artifacts"**, **"Pareto-optimal"**
- No "ums" — pause instead

### Post-Production (5 min in CapCut/DaVinci/Clipchamp)
- Import screen recording + voiceover
- Trim to 30s exactly
- Add subtle zoom-ins on key UI moments (score card, GO/NO-GO, KML button, Pareto front)
- Lower-third text at 0:00: **"NASAMAP — Mission Design Engine"**
- Lower-third at 0:28: **"42/86 challenges • nasamap.vercel.app"**
- Export: H.264, 1080p, 30fps, <50MB

---

## ALTERNATE: 60-Second Extended Cut (for project page)

Add these beats after 0:30:
- **0:30–0:38**: Surface Ops 3D view — "One Martian sol: solar array and battery earning their place"
- **0:38–0:45**: Commons/Library — "Curated articles, persona advice cards, full-text search"
- **0:45–0:52**: Engineering honesty — "Every number tagged: documented, derived, or estimate. 250 tests. Zero secrets."
- **0:52–1:00**: Team + call to action — "Built solo. Open source. GitHub link in description. Every human has a seat at the frontier."

---

## KEY SOUNDBITES FOR JUDGES (if asked)

> "The engine doesn't just calculate Δv — it closes the life-support loop. ISS-class 90% water recovery, 50% oxygen recovery via Sabatier, solar array sized from the actual load at Mars' 1.52 AU. That's not a lookup table. That's physics."

> "The GO/NO-GO gate isn't cosmetic. If your stack exceeds the vehicle's documented TLI payload, or your crew dose blows NASA-STD-3001's 600 mSv career limit, the grade caps at D — no matter how pretty the rest looks."

> "The Challenge Aligner doesn't keyword-match — it maps each official challenge to the specific capability that answers it. 42 of 86. That's not coverage theater. That's evidence."

> "The Mission Optimizer shows you the mathematically optimal architectures. NSGA-II across IMLEO, payload, radiation, cost — every point on that front is a non-dominated solution. No human bias, just the physics."

---

## FILES TO HAVE READY

- [ ] `VIDEO_SCRIPT.md` (this file)
- [ ] Screen recording (30s)
- [ ] Voiceover audio (30s)
- [ ] Edited final (MP4, <50MB)
- [ ] Thumbnail: NASAMAP logo + "30s Demo" text
- [ ] YouTube/Vimeo unlisted link for submission form

---

## NEW FEATURES TO HIGHLIGHT IN JUDGE Q&A

| Feature | File | Talking Point |
|---------|------|---------------|
| Rocket Builder | `src/app/tools/rocket-builder/` | 12 real engines, 15 tanks, live Δv/TWR/payload, Mission Lab export |
| Community Gallery | `src/app/community/` | Browse shared missions, filter by grade/destination, deep-link to Fly |
| Mission Optimizer | `src/app/tools/mission-optimizer/` | NSGA-II Pareto fronts for Mars 2028/2031, interactive IMLEO/payload/radiation/cost |
| Enhanced Radiation | `src/lib/life.ts` | Badhwar-O'Neill 2010 GCR (φ), King 1974 SPE, storm shelter factor, ICRP 103 organ doses |
| Parametric Habitat | `src/lib/mission.ts` | TransHab/BA-330 heritage: volume/crew, vessel/ECLSS/shielding/outfitting/margin |
| Opt-in Enhanced Models | `src/lib/mission.ts` | `useEnhancedModels` flag defaults false — backward compatible, 250 tests pass |

---

## FILES TO HAVE READY

- [ ] `VIDEO_SCRIPT.md` (this file)
- [ ] Screen recording (30s)
- [ ] Voiceover audio (30s)
- [ ] Edited final (MP4, <50MB)
- [ ] Thumbnail: NASAMAP logo + "30s Demo" text
- [ ] YouTube/Vimeo unlisted link for submission form