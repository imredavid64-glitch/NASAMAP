# NASAMAP — 2-Minute Demo Video Script
## NASA Space Apps Challenge 2026 Submission

---

### 🎬 **Opening (0:00–0:15)**
**Visual**: NASAMAP hero at `https://nasamap.vercel.app` — dark space theme, animated starfield, "Every human has a seat at the frontier"

**Voiceover**:
> "NASAMAP turns real Moon-to-Mars mission design into a playable, physics-honest loop. Pick a rocket, crew, and surface stay — the engine computes Δv, mass budget, radiation dose, comms lag, consumables, and a closed-loop life-support budget. Then it rerates every change S–D across seven weighted objectives and stamps GO / NO-GO."

**Action**: Scroll to reveal four act cards: **Play & Plan**, **Fly**, **Live**, **Share**

---

### 🎮 **Act I — Play & Plan (0:15–0:55)**

**0:15** — Click **"Play & Plan"** → `/play`
> "Six mission briefs with hard constraints. Let's do **Artemis: Crewed Lunar Landing**."

**0:20** — Select scenario → `/play/artemis-crewed-landing`
> "Constraints: SLS or Saturn V, 2–4 crew, 3–14 surface days, 600 mSv career limit. Three objectives: lift the stack, stay under radiation, meaningful surface time."

**0:28** — Adjust sliders: Crew 4, Surface Days 7, Vehicle SLS Block 1
> "Watch the rating update live — S–D grade, seven objective scores, GO/NO-GO gate. Every number comes from the shared engine: Tsiolkovsky rocket equation, NASA ISS ECLSS recovery rates, MSL RAD radiation model, CODATA constants."

**0:40** — Hit **"Launch Mission"** → 3★ grade achieved
> "Beat the par score of 78. Earn three stars. Progress persists locally across sessions."

**0:45** — Click **"Download Report Card"** → SVG downloads
> "Shareable artifact: grade, all engine numbers, permalink baked into the image. Open the link — exact same design loads."

**0:50** — Navigate to `/mission` (free Mission Lab)
> "Free build mode: Moon or Mars, any vehicle, any crew. Personal best per destination saved locally. URL-encoded design = shareable link."

---

### 🚀 **Act II — Fly (0:55–1:20)**

**0:55** — Click **"Fly"** → `/fly` (Apollo 11 replay default)
> "Three trajectory modes. Default: Apollo 11 event-by-event from interpolated historical timeline."

**1:00** — Scrub timeline → events highlight (Launch, TLI, LOI, Landing, EVA, TEI, Splashdown)
> "Orbit view animates position. Export full trajectory to CSV."

**1:08** — Switch to `?mode=hohmann` (patched-conic Moon transfer)
> "Hohmann transfer solver — Δv, TOF, perilune/apolune."

**1:12** — Switch to `?mode=mars` (Sun-centred Kepler solve)
> "Minimum-energy Earth→Mars ellipse. CSV export in AU."

**1:16** — Click **"Historical Missions"** → browse 15 missions (Apollo 8–17, Voyager, Cassini, etc.)
> "Each with key events, references, replayable trajectory."

---

### 🛰️ **Act III — Live (1:20–1:45)**

**1:20** — Click **"Live"** → `/live`
> "Real-time data with committed snapshot fallback — demo never dies on stage."

**1:23** — ISS card: ground track, next pass, **KML export** button
> "Opens in Google Earth. Full-orbit track from SGP4 propagation via satellite.js."

**1:30** — Voyager 1 & 2: live range from JPL Horizons (light-hours, AU)
> "Snapshot labeled with timestamp. Honest about data freshness."

**1:35** — APOD, NEO feed (NASA NeoWs), NOAA space weather (SWPC)
> "All labelled **live** or **snapshot** with date. Zero fabrication."

---

### 📚 **Act IV — Share (1:45–2:05)**

**1:45** — `/library` — curated articles (transfer windows, radiation, ISRU, etc.)
**1:48** — `/commons` — persona cards (Farmer on Mars, Habitat Architect, etc.) + full-text search
**1:52** — `/passport` & `/patch` — generate printable artifacts from any mission design
**1:56** — `/challenges` — **Challenge Aligner: 37 of 86 official 2026 challenges mapped**
> "Each badge deep-links to the feature that serves it. Filter by lane. Submission playbook included."

---

### 🏁 **Closing (2:05–2:15)**

**Visual**: Split screen — code on left (249 tests, pure engine), running app on right

**Voiceover**:
> "249 unit tests pin every number to a published reference. No database, no secrets, no network required to demo. Deployed on Vercel, CI gates every push. NASAMAP — the mission design platform that doesn't lie to you."

**Text on screen**:
```
Live: https://nasamap.vercel.app
GitHub: github.com/imredavid64-glitch/NASAMAP
Tests: 249 passing | Build: passing | Honesty: guaranteed
```

---

## 🎥 **Recording Tips**

| Scene | Duration | Notes |
|-------|----------|-------|
| Hero scroll | 5s | Smooth scroll, show all 4 acts |
| Play scenario | 25s | Show sliders moving, rating updating live |
| Report card download | 10s | Click, show file, open permalink |
| Mission Lab | 10s | Quick Moon→Mars switch, show personal best |
| Fly modes | 20s | Quick cuts: Apollo 11 → Hohmann → Mars |
| Historical missions | 10s | Browse list, click one, show replay |
| Live ISS KML | 10s | Click export, mention Google Earth |
| Live data labels | 5s | Point out "live" vs "snapshot" badges |
| Challenge Aligner | 10s | Show filter, click badge → deep link |
| Closing split | 10s | Code + app side by side |

**Total target: ~2:15** (trim pauses for 2:00 flat)

---

## 📋 **Pre-Recording Checklist**

- [ ] Browser: Chrome/Edge, 1920×1080, no extensions visible
- [ ] Clear cache, hard reload `https://nasamap.vercel.app`
- [ ] Verify all 4 acts load without errors
- [ ] Test report card SVG download opens correctly
- [ ] Test KML export downloads (don't need to open Google Earth)
- [ ] Confirm Convex community page loads (if deployed)
- [ ] Record in one take or segment by act, edit together
- [ ] Add captions for accessibility
- [ ] Upload to YouTube (unlisted) + link in SUBMISSION.md

---

## 🔗 **Deep Links for Quick Demo Navigation**

| Feature | URL |
|---------|-----|
| Play — Artemis scenario | `/play/artemis-crewed-landing` |
| Mission Lab — Moon | `/mission?d=moon&v=sls-block-1&c=4&s=7` |
| Mission Lab — Mars | `/mission?d=mars&v=starship&c=4&s=90` |
| Fly — Apollo 11 | `/fly` |
| Fly — Hohmann Moon | `/fly?mode=hohmann` |
| Fly — Mars Kepler | `/fly?mode=mars` |
| Fly — Historical Apollo 11 | `/fly/historical/apollo-11` |
| Live — ISS KML | `/live` (click Export KML on ISS card) |
| Challenges — Mission Design lane | `/challenges?lane=mission-design` |
| Challenges — Life Support lane | `/challenges?lane=life-support` |
| Library — Mars Windows | `/library/mars-windows-explained` |
| Passport generator | `/passport` |
| Patch generator | `/patch` |

---

## 🎯 **Key Talking Points for Judges**

1. **"Physics-honest"** — Every number traced to NASA/CODATA/NOAA source, tagged documented/derived/estimate
2. **"Offline-first"** — No DB, no API keys, snapshots committed, works on airplane mode
3. **"Shareable by design"** — URL encodes entire mission state; report card SVG carries permalink
4. **"Challenge-aligned"** — 43% of 2026 challenges served, each with deep link to evidence
5. **"Tested"** — 249 tests, CI gates: lint → typecheck → validate → test → build
6. **"Extensible"** — Pure engine (`src/lib/*`) decoupled from UI; new scenarios = JSON only