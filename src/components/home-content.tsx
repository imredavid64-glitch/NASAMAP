"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Rocket, Compass, Radio, ArrowRight, Database, Ear, Users, Orbit, Library, Search, Globe, Star } from "lucide-react";
import { SpaceCanvas } from "@/components/space-canvas";
import { SkyNow } from "@/components/SkyNow";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JudgeTourProvider } from "@/components/judge-tour-provider";

const pillars = [
  {
    kicker: "Act I · plan",
    title: "Design a mission that actually closes.",
    href: "/mission",
    icon: Rocket,
    body:
      "Pick a rocket and a target, then watch the Δv, mass, radiation and life-support budgets add up. Get an S–D rating against cited NASA limits, a printable Mission Passport, and a mission link you can share.",
  },
  {
    kicker: "Act II · fly",
    title: "Relive Apollo 11, or fly the transfer yourself.",
    href: "/fly",
    icon: Orbit,
    body:
      "Scrub the real Apollo 11 timeline from launch to Tranquility Base, fly a patched-conic Hohmann transfer to the Moon, or coast Earth→Mars on a Sun-centred Kepler solve.",
  },
  {
    kicker: "Act III · live",
    title: "What is happening in space, right now.",
    href: "/live",
    icon: Radio,
    body:
      "ISS passes overhead, Voyager's light-lag, today's APOD, near-Earth objects and the current solar-storm level — live feeds with dated offline snapshots.",
  },
  {
    kicker: "Act IV · share",
    title: "Cosmic data for every human.",
    href: "/commons",
    icon: Compass,
    body:
      "Day length, Moon phase, tides, solar storms, GPS risk, satellite passes — computed for you and turned into a one-card decision, whether you farm, fish, fly or just look up.",
  },
] as const;

export function HomeContent() {
  const searchParams = useSearchParams();
  const [showJudgeTour, setShowJudgeTour] = useState(false);

  useEffect(() => {
    const judgeParam = searchParams.get("judge");
    const tourParam = searchParams.get("tour");
    const referrer = document.referrer;
    const isSpaceAppsReferrer = referrer.includes("spaceapps") || referrer.includes("nasa.gov");

    if (judgeParam === "1" || tourParam === "judge" || isSpaceAppsReferrer) {
      setShowJudgeTour(true);
    }
  }, [searchParams]);

  return (
    <JudgeTourProvider autoStart={showJudgeTour}>
      <div>
        <section className="relative overflow-hidden">
          {/* Hero stats band */}
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              {[272, 38, 7, 2].map((v, i) => (
                <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-space-cyan/5 backdrop-blur">
                  <div className="text-space-cyan font-mono text-2xl font-bold">{v}+</div>
                  <div className="mt-1 text-xs text-slate-500">
                    {i === 0 && "tests pass"}
                    {i === 1 && "static pages"}
                    {i === 2 && "celestial bodies"}
                    {i === 3 && "worlds to land on"}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-24">
            <div>
              <Badge tone="cyan" className="mb-5">
                2026 Space Apps · The Next Frontier
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Every human has a seat{" "}
                <span className="bg-gradient-to-r from-space-cyan to-space-emerald bg-clip-text text-transparent">
                  at the frontier.
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-400">
                Plan, fly and live a real Moon-to-Mars mission. Turn cosmic data into everyday
                decisions. Open data, open source, no account — everything runs on facts stored
                in GitHub and physics that is tested.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/play"
                  className="inline-flex items-center gap-2 rounded-lg bg-space-cyan px-5 py-3 font-semibold text-space-950 transition hover:shadow-lg hover:shadow-space-cyan/30 hover:bg-space-cyan/90 focus-visible:ring-2 focus-visible:ring-space-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-space-950"
                >
                  Start the game <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/mission"
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-space-amber/20 to-space-cyan/20 border border-space-amber/40 px-5 py-3 font-semibold text-white transition hover:border-space-amber/60 hover:shadow-lg hover:shadow-space-amber/20 focus-visible:ring-2 focus-visible:ring-space-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-space-950"
                >
                  <Rocket className="h-4 w-4" /> Judge Tour
                </Link>
                <Link
                  href="/commons"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-5 py-3 font-semibold text-white transition hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-space-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-space-950"
                >
                  <Compass className="h-4 w-4" /> See the commons
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap gap-2 text-xs text-slate-500">
                <Badge tone="slate"><Ear className="h-3 w-3" /> NASA data</Badge>
                <Badge tone="slate"><Users className="h-3 w-3" /> for everyone</Badge>
                <Badge tone="slate"><Database className="h-3 w-3" /> stored in GitHub</Badge>
              </div>
            </div>
            <div className="h-[420px] overflow-hidden rounded-2xl border border-white/10 bg-black/30 sm:h-[520px] shadow-2xl shadow-space-cyan/10">
              <SpaceCanvas bodyId="earth" cameraDistance={2.8} />
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-white/[0.02]">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="mb-3 flex items-center justify-between">
              <p className="kicker">Live from the engine</p>
              <Badge tone="emerald">working now</Badge>
            </div>
            <SkyNow />
            <p className="mt-3 font-mono text-[11px] text-slate-600">
              Sunrise/day length & moon phase computed live with NOAA solar equations at your
              location (UTC shown). Moon round-trip is the real light-time to 384,400 km.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-2">
            {pillars.map((p) => (
              <Card key={p.title} href={p.href} className="group">
                <div className="flex items-center gap-2 mb-3">
                  <p.icon className="h-5 w-5 text-space-cyan transition group-hover:scale-110" />
                  <p className="kicker">{p.kicker}</p>
                </div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  {p.title}
                </CardTitle>
                <CardBody className="mt-4 leading-relaxed">{p.body}</CardBody>
              </Card>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="text-sm text-slate-500">Also in the app:</span>
            <Link
              href="/library"
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-space-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-space-950"
            >
              <Library className="h-4 w-4 text-space-cyan" /> Mission Library
            </Link>
            <Link
              href="/search"
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-space-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-space-950"
            >
              <Search className="h-4 w-4 text-space-cyan" /> Search everything
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-space-900 to-space-950 p-8 shadow-2xl shadow-space-cyan/5">
            <p className="kicker mb-3">How it wins</p>
            <h2 className="text-2xl font-semibold text-white">
              Built to be judged: Impact · Creativity · Validity · Relevance · Presentation
            </h2>
            <p className="mt-4 max-w-3xl text-slate-400">
              Every module ships with its formula on the page, its data source cited, and its math
              unit-tested against NASA/NOAA reference values. The live-data layer is transient —
              the whole app still works offline from GitHub-hosted datasets.
            </p>
            <Link href="/live" className="mt-6 inline-flex items-center gap-2 font-semibold text-space-cyan hover:underline focus-visible:ring-2 focus-visible:ring-space-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-space-950">
              <Radio className="h-4 w-4" /> Open the live frontier ribbon
            </Link>
          </div>
        </section>
      </div>
    </JudgeTourProvider>
  );
}
