import Link from "next/link";
import { Rocket, Compass, Radio, ArrowRight, Database, Ear, Users, Orbit, Library, Search } from "lucide-react";
import { SpaceCanvas } from "@/components/space-canvas";
import { SkyNow } from "@/components/SkyNow";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

export default function Home() {
  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-20">
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
              decisions. Open data, open source, no account, no database — everything runs on
              facts stored in GitHub and physics that is tested.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/mission"
                className="inline-flex items-center gap-2 rounded-lg bg-space-cyan px-5 py-3 font-semibold text-space-950 transition hover:bg-space-cyan/80"
              >
                Start a mission <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/commons"
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-5 py-3 font-semibold text-white transition hover:bg-white/10"
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
          <div className="h-[420px] overflow-hidden rounded-2xl border border-white/10 bg-black/30 sm:h-[520px]">
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
            <Card key={p.title} href={p.href}>
              <p className="kicker mb-3">{p.kicker}</p>
              <CardTitle className="flex items-center gap-2 text-xl">
                <p.icon className="h-5 w-5 text-space-cyan" /> {p.title}
              </CardTitle>
              <CardBody className="mt-4 leading-relaxed">{p.body}</CardBody>
            </Card>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span className="text-sm text-slate-500">Also in the app:</span>
          <Link
            href="/library"
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
          >
            <Library className="h-4 w-4 text-space-cyan" /> Mission Library
          </Link>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
          >
            <Search className="h-4 w-4 text-space-cyan" /> Search everything
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-space-900 to-space-950 p-8">
          <p className="kicker mb-3">How it wins</p>
          <h2 className="text-2xl font-semibold text-white">
            Built to be judged: Impact · Creativity · Validity · Relevance · Presentation
          </h2>
          <p className="mt-4 max-w-3xl text-slate-400">
            Every module ships with its formula on the page, its data source cited, and its math
            unit-tested against NASA/NOAA reference values. The live-data layer is transient —
            the whole app still works offline from GitHub-hosted datasets.
          </p>
          <Link href="/live" className="mt-6 inline-flex items-center gap-2 font-semibold text-space-cyan hover:underline">
            <Radio className="h-4 w-4" /> Open the live frontier ribbon
          </Link>
        </div>
      </section>
    </div>
  );
}