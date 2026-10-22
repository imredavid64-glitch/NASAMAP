"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Rocket,
  Compass,
  Radio,
  CheckCircle2,
  Award,
  BookOpen,
  ExternalLink,
  Target,
  Shield,
  Zap,
  Globe,
  Code,
  TestTube2,
  Download,
  Video,
  Timer,
  ArrowRight,
  ChevronRight,
  Check,
  X,
  Info,
  AlertTriangle,
} from "lucide-react";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { SpaceCanvas } from "@/components/space-canvas";

const JUDGE_STEPS = [
  {
    id: "overview",
    title: "5-Minute Overview",
    icon: Timer,
    href: "/",
    description: "Start here — landing page shows all four acts and live data ribbon",
    time: "1 min",
  },
  {
    id: "play",
    title: "Play & Plan — Space Mission Design Game",
    icon: Rocket,
    href: "/play/artemis-crewed-landing",
    description: "Six briefs with hard constraints, 0–3 star grading, par scores, local progress",
    time: "2 min",
    deepLinks: [
      { label: "Artemis Crewed Landing (Beginner)", href: "/play/artemis-crewed-landing" },
      { label: "First Boots on Mars (Intermediate)", href: "/play/first-boots-on-mars" },
      { label: "Mars Outpost One (Advanced)", href: "/play/mars-outpost-one" },
      { label: "Free Mission Lab", href: "/mission" },
    ],
  },
  {
    id: "fly",
    title: "Fly — Trajectory Replay & Solvers",
    icon: Compass,
    href: "/fly",
    description: "Apollo 11 event-by-event, patched-conic Moon transfer, Kepler Earth→Mars, CSV export",
    time: "1 min",
    deepLinks: [
      { label: "Apollo 11 Replay", href: "/fly" },
      { label: "Hohmann Moon Transfer", href: "/fly?mode=hohmann" },
      { label: "Mars Kepler Solve", href: "/fly?mode=mars" },
      { label: "Historical Missions (15)", href: "/fly/historical" },
    ],
  },
  {
    id: "live",
    title: "Live — Real-Time Space Data",
    icon: Radio,
    href: "/live",
    description: "ISS ground track + KML export, Voyager range, APOD, NEO, space weather — all with snapshot fallback",
    time: "1 min",
    deepLinks: [
      { label: "ISS Card → Export KML", href: "/live" },
      { label: "Voyager 1 & 2 Live Range", href: "/live" },
      { label: "NEO Feed & Space Weather", href: "/live" },
    ],
  },
  {
    id: "tools",
    title: "Tools — Advanced Capabilities",
    icon: Zap,
    href: "/tools/rocket-builder",
    description: "Rocket Builder, Mission Optimizer (Pareto fronts), ISRU Designer, Porkchop plots, Monte Carlo",
    time: "2 min",
    deepLinks: [
      { label: "Rocket Builder (12 engines, 15 tanks)", href: "/tools/rocket-builder" },
      { label: "Mission Optimizer (NSGA-II Pareto)", href: "/tools/mission-optimizer" },
      { label: "ISRU Plant Designer", href: "/tools/isru-designer" },
      { label: "Porkchop Plot", href: "/tools/porkchop" },
      { label: "Monte Carlo Uncertainty", href: "/tools/montecarlo" },
    ],
  },
  {
    id: "share",
    title: "Share — Commons, Library, Challenge Aligner",
    icon: Globe,
    href: "/challenges",
    description: "42/86 official challenges mapped with deep links, persona cards, articles, Passport & Patch",
    time: "1 min",
    deepLinks: [
      { label: "Challenge Aligner (42 served)", href: "/challenges" },
      { label: "Mission Library (9 articles)", href: "/library" },
      { label: "Commons (Persona Cards)", href: "/commons" },
      { label: "Community Gallery", href: "/community" },
    ],
  },
  {
    id: "evidence",
    title: "Engineering Evidence",
    icon: Code,
    href: "#evidence",
    description: "272 tests, honesty tags, Git-as-database, CI pipeline, zero secrets",
    time: "1 min",
    isAnchor: true,
  },
];

const EVIDENCE_ITEMS = [
  {
    title: "Physics Engine Purity",
    detail: "All calculations in `src/lib/*` — pure TypeScript, no side effects, unit-tested against NASA/CODATA references",
    badge: "Verified",
    icon: TestTube2,
  },
  {
    title: "272 Automated Tests",
    detail: "vitest suites cover every module: astro, rocket, comm, life, surface, mission, score, scenarios, trajectory, export, orbit, passport, patch, design-link, challenges",
    badge: "272 passing",
    icon: CheckCircle2,
  },
  {
    title: "Engineering Honesty Tags",
    detail: "Every number tagged: documented / derived / estimate. Live data labeled live / snapshot with timestamp. No fabrication.",
    badge: "Enforced",
    icon: Shield,
  },
  {
    title: "Git-as-Database",
    detail: "All curated data in `src/data/*.json` validated by `scripts/validate-data.ts` in CI. No runtime DB, no secrets.",
    badge: "Zero-secrets",
    icon: BookOpen,
  },
  {
    title: "CI/CD Pipeline",
    detail: "GitHub Actions: lint → typecheck → validate:data → 272 tests → production build on every push to main",
    badge: "Automated",
    icon: Zap,
  },
  {
    title: "Offline-First / PWA",
    detail: "Service worker caches all routes. Works on airplane mode. `next-pwa` configured with fallback `offline` page.",
    badge: "Verified",
    icon: Download,
  },
  {
    title: "Challenge Alignment Evidence",
    detail: "42/86 official 2026 challenges mapped to shipped capabilities via regex lanes — each badge deep-links to the feature",
    badge: "49% coverage",
    icon: Target,
  },
  {
    title: "Artifacts from Engine",
    detail: "Mission Passport, Patch, Report Card SVG — all generated deterministically from the same design object",
    badge: "Deterministic",
    icon: Award,
  },
];

const HONESTY_NOTES = [
  "Live feeds (ISS, Voyager, APOD, NEO, Space Weather) attempt real API calls first, then fall back to committed JSON snapshots with timestamps",
  "Snapshots are checked into Git so the demo never fails on stage — each card shows a **live** or **snapshot** badge with date",
  "Vehicle capabilities (payload TLI, cost) tagged with `costConfidence: documented | estimate` and provenance note",
  "Enhanced radiation (Badhwar-O'Neill GCR, King SPE) and parametric habitat mass are opt-in via `useEnhancedModels` flag (defaults false)",
  "All 272 tests pass with legacy fixed values — enhanced models are additive, not breaking",
  "Fonts self-hosted; zero external network calls at runtime except documented live-data endpoints",
];

export function JudgeTourContent() {
  const searchParams = useSearchParams();
  const [activeStep, setActiveStep] = useState(0);
  const [showHonesty, setShowHonesty] = useState(false);

  useEffect(() => {
    const tour = searchParams.get("tour");
    if (tour === "judge") {
      // Auto-scroll to first step after mount
      setTimeout(() => {
        const el = document.getElementById("step-0");
        el?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [searchParams]);

  const currentStep = JUDGE_STEPS[activeStep];
  const progress = ((activeStep + 1) / JUDGE_STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-space-950 text-white">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-space-900 z-50">
        <div
          className="h-full bg-gradient-to-r from-space-cyan to-space-emerald transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Header */}
      <header className="relative border-b border-white/10 bg-space-950/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-space-cyan/20">
                <Award className="h-6 w-6 text-space-cyan" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">NASAMAP — Judge Tour</h1>
                <p className="text-xs text-slate-400">
                  Step {activeStep + 1} of {JUDGE_STEPS.length} · {currentStep.time}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone="cyan" className="text-xs">
                Space Apps 2026
              </Badge>
              <Badge tone="emerald" className="text-xs">
                272 Tests ✓
              </Badge>
              <Button variant="ghost" size="sm" onClick={() => window.open("https://github.com/imredavid64-glitch/NASAMAP", "_blank")}>
                <ExternalLink className="h-4 w-4" /> Source
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-20">
          <div>
            <Badge tone="cyan" className="mb-5">
              NASA Space Apps 2026 · Judge Evaluation Mode
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Every human has a seat{" "}
              <span className="bg-gradient-to-r from-space-cyan to-space-emerald bg-clip-text text-transparent">
                at the frontier.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-400">
              This guided tour walks you through the submission in ~8 minutes. Each step links to the live feature
              with context on what to look for. All data is physics-honest, tested, and works offline.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                size="lg"
                onClick={() => setActiveStep(0)}
                className="bg-space-cyan text-space-950 hover:bg-space-cyan/80"
              >
                Start Tour <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
              <Button variant="outline" size="lg" onClick={() => setShowHonesty(true)}>
                <Shield className="h-4 w-4 mr-2" /> Engineering Honesty
              </Button>
            </div>
          </div>
          <div className="h-[420px] overflow-hidden rounded-2xl border border-white/10 bg-black/30 sm:h-[520px]">
            <SpaceCanvas bodyId="mars" cameraDistance={2.8} />
          </div>
        </div>
      </section>

      {/* Steps Navigation */}
      <nav className="border-y border-white/10 bg-white/[0.02] sticky top-14 z-30" aria-label="Judge tour steps">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto gap-2 py-3" role="tablist">
            {JUDGE_STEPS.map((step, index) => (
              <button
                key={step.id}
                role="tab"
                aria-selected={activeStep === index}
                onClick={() => {
                  setActiveStep(index);
                  const el = document.getElementById(`step-${index}`);
                  el?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className={`flex shrink-0 items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                  activeStep === index
                    ? "bg-space-cyan/20 text-space-cyan border border-space-cyan/40"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <step.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{step.title}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Step Content */}
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {JUDGE_STEPS.map((step, index) => (
          <section
            key={step.id}
            id={`step-${index}`}
            className={`mb-20 scroll-mt-28 transition-opacity duration-300 ${
              activeStep === index ? "opacity-100" : "opacity-60"
            }`}
          >
            <div className="flex items-center gap-3 mb-6">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                  activeStep === index
                    ? "bg-space-cyan/20 text-space-cyan"
                    : "bg-white/5 text-slate-500"
                }`}
              >
                <step.icon className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{step.title}</h2>
                <p className="text-slate-400">{step.description}</p>
              </div>
              <Badge tone={activeStep === index ? "cyan" : "slate"} className="ml-auto text-xs">
                {step.time}
              </Badge>
            </div>

            {step.deepLinks && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-6">
                {step.deepLinks.map((link, i) => (
                  <Link
                    key={i}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 transition hover:border-space-cyan/40 hover:bg-space-cyan/5"
                  >
                    <ArrowRight className="h-5 w-5 text-space-cyan group-hover:translate-x-1 transition-transform" />
                    <span className="text-sm font-medium text-white">{link.label}</span>
                  </Link>
                ))}
              </div>
            )}

            {step.isAnchor && (
              <div id="evidence" className="space-y-6">
                <SectionHeading
                  kicker="Engineering Evidence"
                  title="What makes this submission verifiable"
                />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {EVIDENCE_ITEMS.map((item, i) => (
                    <Card key={i} className="h-full">
                      <CardBody>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-space-cyan/20">
                            <item.icon className="h-5 w-5 text-space-cyan" />
                          </div>
                          <Badge tone="emerald" className="text-xs">
                            {item.badge}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg">{item.title}</CardTitle>
                        <p className="mt-2 text-sm text-slate-400">{item.detail}</p>
                      </CardBody>
                    </Card>
                  ))}
                </div>

                <SectionHeading
                  kicker="Engineering Honesty"
                  title="No fabricated numbers — ever"
                />
                <Card>
                  <CardBody>
                    <ul className="space-y-3">
                      {HONESTY_NOTES.map((note, i) => (
                        <li key={i} className="flex gap-3 text-sm text-slate-300">
                          <CheckCircle2 className="h-5 w-5 shrink-0 text-space-emerald mt-0.5" />
                          <span>{note}</span>
                        </li>
                      ))}
                    </ul>
                  </CardBody>
                </Card>
              </div>
            )}

            {!step.isAnchor && (
              <Card className="border-space-cyan/30 bg-space-cyan/5">
                <CardBody>
                  <p className="flex items-center gap-2 text-sm text-space-cyan">
                    <Info className="h-4 w-4" />
                    <strong>Tip:</strong> Open the links in new tabs — each deep-links to the exact feature.
                    URL encodes the full mission state (try changing crew/surface days on <code className="bg-white/5 px-1 rounded font-mono">/mission</code>).
                  </p>
                </CardBody>
              </Card>
            )}
          </section>
        ))}

        {/* Completion */}
        <section id="complete" className="scroll-mt-28">
          <div className="rounded-2xl border border-space-emerald/30 bg-space-emerald/5 p-8 text-center">
            <Award className="h-16 w-16 mx-auto mb-4 text-space-emerald" />
            <h2 className="text-3xl font-bold text-white">Tour Complete</h2>
            <p className="mt-4 max-w-2xl mx-auto text-slate-400">
              You've seen the core submission. For deeper evaluation, every route is reachable from the navbar.
              The engine is in <code className="bg-white/5 px-2 rounded font-mono">src/lib/</code> — 100% pure, 100% tested.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/mission?d=mars&v=starship&c=4&s=90" className="btn-primary">
                Try a Mars Mission →
              </Link>
              <Link href="/challenges?lane=mission-design" className="btn-secondary">
                View Challenge Coverage →
              </Link>
              <a
                href="https://github.com/imredavid64-glitch/NASAMAP"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
              >
                <ExternalLink className="h-4 w-4 inline mr-1" /> Source on GitHub
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Honesty Modal */}
      {showHonesty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="max-w-3xl w-full max-h-[80vh] overflow-y-auto rounded-2xl border border-white/10 bg-space-950 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Engineering Honesty — Deep Dive</h2>
              <button onClick={() => setShowHonesty(false)} className="text-slate-400 hover:text-white">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              {HONESTY_NOTES.map((note, i) => (
                <div key={i} className="flex gap-3 rounded-lg border border-white/10 bg-white/5 p-4">
                  <Shield className="h-5 w-5 shrink-0 text-space-emerald mt-0.5" />
                  <p className="text-sm text-slate-300">{note}</p>
                </div>
              ))}
              <div className="rounded-lg border border-amber/30 bg-amber/5 p-4">
                <p className="text-sm text-amber-300">
                  <strong>Verify yourself:</strong> Run <code className="bg-white/5 px-1 rounded font-mono">npm test</code> (272 tests),
                  <code className="bg-white/5 px-1 rounded font-mono">npm run validate:data</code> (all datasets),
                  <code className="bg-white/5 px-1 rounded font-mono">npm run build</code> (production build).
                  Zero secrets, zero external deps at runtime.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .btn-primary {
          @apply inline-flex items-center gap-2 rounded-lg bg-space-cyan px-5 py-3 font-semibold text-space-950 transition hover:bg-space-cyan/80;
        }
        .btn-secondary {
          @apply inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-5 py-3 font-semibold text-white transition hover:bg-white/10;
        }
      `}</style>
    </div>
  );
}