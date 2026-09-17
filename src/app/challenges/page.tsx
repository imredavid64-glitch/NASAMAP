import type { Metadata } from "next";
import Link from "next/link";
import { Rocket, Recycle, Orbit, Radio, Library, Database, ArrowRight, BadgeCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  dataset,
  annotateChallenges,
  laneStats,
  servedCount,
  coveragePct,
  PLAYBOOK,
  type ChallengeMatch,
} from "@/lib/challenges";

export const metadata: Metadata = { title: "Challenge aligner — 2026" };

const LANE_ICON = {
  "mission-design": Rocket,
  "life-support": Recycle,
  "flight-3d": Orbit,
  "live-feeds": Radio,
  storytelling: Library,
  "open-data": Database,
} as const;

const LANE_TONE = {
  "mission-design": "cyan",
  "life-support": "emerald",
  "flight-3d": "cyan",
  "live-feeds": "amber",
  storytelling: "crimson",
  "open-data": "slate",
} as const;

export default function ChallengesPage() {
  const ds = dataset();
  const matches = annotateChallenges();
  const stats = laneStats(matches);
  const served = servedCount(matches);
  const pct = coveragePct(matches);

  return (
    <div className="pt-28">
      <div className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <p className="kicker mb-3">Challenge aligner · {ds.challengeYear}</p>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-5xl">
          {ds.count} official challenges. Here&apos;s exactly where NASAMAP plugs in.
        </h1>
        <p className="mt-4 max-w-2xl text-slate-400">
          Titles and difficulty categories are pulled live from the Space Apps public API — never typed in by hand.
          Each one is matched against the capabilities the platform actually ships, and every lane links straight to
          the feature that serves it.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <div className="glass-panel p-5">
            <p className="text-[11px] uppercase tracking-wider text-slate-500">Official challenges</p>
            <p className="mt-1 font-mono text-3xl text-white">{ds.count}</p>
            <p className="mt-0.5 text-xs text-slate-500">retrieved {ds.retrieved}</p>
          </div>
          <div className="glass-panel p-5">
            <p className="text-[11px] uppercase tracking-wider text-slate-500">Served by NASAMAP</p>
            <p className="mt-1 font-mono text-3xl text-space-cyan">{served}</p>
            <p className="mt-0.5 text-xs text-slate-500">{pct.toFixed(0)}% of the catalogue</p>
          </div>
          <div className="glass-panel p-5">
            <p className="text-[11px] uppercase tracking-wider text-slate-500">Relevance lanes</p>
            <p className="mt-1 font-mono text-3xl text-space-emerald">{stats.length}</p>
            <p className="mt-0.5 text-xs text-slate-500">mapped to four acts</p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map(({ lane, count }) => {
            const Icon = LANE_ICON[lane.id as keyof typeof LANE_ICON] ?? Rocket;
            return (
              <Link key={lane.id} href={lane.href} className="glass-panel p-5 transition hover:border-space-cyan/40 hover:bg-white/[0.06]">
                <div className="flex items-center justify-between">
                  <Icon className="h-4 w-4 text-space-cyan" />
                  <span className="font-mono text-sm text-slate-400">{count}</span>
                </div>
                <p className="mt-3 text-sm font-semibold text-white">{lane.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">{lane.blurb}</p>
              </Link>
            );
          })}
        </div>

        <div className="mt-12">
          <h2 className="text-lg font-semibold text-white">Recommended submission playbook</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            A worked path from &ldquo;we picked a challenge&rdquo; to &ldquo;we have a submission&rdquo;. Every step links to the
            shipped feature that produces the evidence — no placeholder screens.
          </p>
          <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PLAYBOOK.map((step) => (
              <li key={step.n} className="glass-panel p-5">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-space-cyan/40 bg-space-cyan/10 font-mono text-xs text-space-cyan">
                    {step.n}
                  </span>
                  <p className="text-sm font-semibold text-white">{step.title}</p>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">{step.body}</p>
                <Link
                  href={step.href}
                  className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-space-cyan hover:underline"
                >
                  {step.cta} <ArrowRight className="h-3 w-3" />
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">All challenges</h2>
          <p className="text-xs text-slate-500">
            Matched challenges first · source:{" "}
            <a
              href={ds.indexUrl}
              target="_blank"
              rel="noreferrer"
              className="text-space-cyan hover:underline"
            >
              spaceappschallenge.org/2026
            </a>
          </p>
        </div>

        <ul className="grid gap-3 sm:grid-cols-2">
          {matches.map((m: ChallengeMatch) => (
            <li
              key={m.id}
              className={`rounded-xl border p-4 transition ${
                m.score > 0
                  ? "border-space-cyan/30 bg-space-cyan/[0.04]"
                  : "border-white/10 bg-white/[0.02]"
              }`}
            >
              <div className="flex items-start gap-2">
                <BadgeCheck
                  className={`mt-0.5 h-4 w-4 shrink-0 ${m.score > 0 ? "text-space-cyan" : "text-slate-600"}`}
                />
                <div className="min-w-0">
                  <p className={`text-sm font-medium ${m.score > 0 ? "text-white" : "text-slate-400"}`}>{m.title}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-wider text-slate-500">
                    {m.categories.length > 0 ? m.categories.join(" · ") : "Open category"}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {m.lanes.map((laneId) => {
                      const lane = stats.find((s) => s.lane.id === laneId)?.lane;
                      if (!lane) return null;
                      return (
                        <Link key={laneId} href={lane.href}>
                          <Badge tone={LANE_TONE[laneId as keyof typeof LANE_TONE] ?? "slate"}>
                            {lane.label}
                          </Badge>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-slate-400">
          <span>Ready to see the platform that serves these lanes?</span>
          <Link href="/mission" className="inline-flex items-center gap-1 font-medium text-space-cyan hover:underline">
            Start planning <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
