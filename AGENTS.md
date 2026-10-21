# NASAMAP — Agent Guide

NASAMAP is a **no-database, offline-first** mission-design platform (Next.js 16 App Router, React 19,
TypeScript, Tailwind). It is the entry for the **NASA Space Apps Challenge 2026**.

## Non-negotiables

1. **No database, no backend.** All curated data lives in `src/data/*.json` (git-as-database) and is
   validated by `scripts/validate-data.ts`. Shared mission designs in the community layer live in the
   browser's `localStorage` (`src/lib/community.ts`). Do not add a server, a DB driver, or an API key.
2. **Never fabricate a number.** Every physical/operational figure must come from the shared engine in
   `src/lib/*` and be tagged `documented`, `derived`, or `estimate`. Live values must be labelled
   `live` or `snapshot` with a date, and every live feed needs a committed fallback snapshot.
3. **The engine is pure and unit-tested.** Anything in `src/lib/*` that computes physics, scoring,
   trajectories, budgets or artifacts must stay side-effect free and be covered in `tests/`.
4. **Verify in a real browser**, not just with tests. `npm run dev` and click through the route you
   changed. React/Next runtime errors only surface in the browser.

## Layout

```
src/app/        routes (mission, play, fly, live, library, search, commons, challenges, community, tools, api/live/*)
src/components/ UI kit, 3D canvas wrappers, mission artifacts
src/lib/        the science engine + pure helpers (pure, unit-tested)
src/data/       curated + snapshotted JSON datasets
tests/          vitest suites, one per engine module
scripts/        validate-data, challenge extraction
```

## Quality gates — all must pass before a change lands

```bash
npm run typecheck    # tsc --noEmit
npm run test         # vitest run
npm run lint         # eslint
npm run validate:data
npm run build        # next build --webpack
```

**Builder note:** `dev` and `build` run Next with `--webpack` on purpose. `next-pwa` (the offline service
worker) and the OpenNext/Cloudflare pipeline both need the webpack builder, and Next 16 defaults to
Turbopack — which rejects a `webpack` config outright. OpenNext shells out to `npm run build`, so the
webpack builder (and the regenerated `public/sw.js`) is used there too.

**Windows note:** `next build` fails with `Cannot find module './NNNN.js'` / `ENOENT pages-manifest.json`
if a `next dev` server ran against the same `.next` directory. Kill node processes and
`Remove-Item -Recurse -Force .next` before rebuilding. This is a cache artifact, not a code defect.

**Streamed boundaries:** React completes a streamed `<Suspense>` boundary from a `requestAnimationFrame`
callback, which is paused in hidden/occluded tabs and headless browsers. The root layout pre-seeds
`window.$RT` so React schedules that completion with `setTimeout` instead. Keep that script in place.

## Conventions

- Server Components by default; add `"use client"` only for interactivity, and keep the client boundary
  as low in the tree as possible.
- `params` in dynamic routes is a **Promise** — `await params`, never `params as unknown as {...}`.
- Event handlers cannot be passed from a Server Component to a Client Component; move the handler into
  the client component and use `useRouter()` for navigation.
- SVG must be wrapped in `<svg>`; bare SVG children (e.g. `<circle>`) are invalid DOM.
- Dark space theme; reuse the `src/components/ui/*` primitives rather than ad-hoc markup.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
