import type { Metadata } from "next";
import Link from "next/link";
import { Rocket, Orbit, FileBadge, ArrowRight } from "lucide-react";
import { SpaceCanvas } from "@/components/space-canvas";
import { MissionPlanner } from "./MissionPlanner";

export const metadata: Metadata = { title: "Mission — Plan the frontier" };

const acts = [
  {
    n: "01",
    label: "Plan",
    title: "Design the stack",
    body: "Choose a rocket, crew and surface stay. The engine sums Δv, mass, radiation and consumables from cited NASA datasets.",
    href: "#design",
    icon: Rocket,
  },
  {
    n: "02",
    label: "Fly",
    title: "Watch the trajectory",
    body: "Replay Apollo 11 event-by-event, or fly a patched-conic Hohmann transfer over the Moon.",
    href: "/fly",
    icon: Orbit,
  },
  {
    n: "03",
    label: "Prove",
    title: "Take the passport",
    body: "Every design issues a printable Mission Passport with a GO / NO-GO stamp you can hand to the judges.",
    href: "#design",
    icon: FileBadge,
  },
] as const;

export default function MissionPage() {
  return (
    <div className="pt-28">
      <div className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <p className="kicker mb-3">Act I · Plan</p>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Design a mission that actually closes.
        </h1>
        <p className="mt-4 max-w-2xl text-slate-400">
          Build a real mission to the Moon or Mars. Choose your rocket, watch the transfer play out, check the crew&apos;s
          radiation dose and light-lag to home, then take home a printable Mission Passport.
        </p>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 pb-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)] lg:px-8">
        <div className="grid gap-4 sm:grid-cols-3">
          {acts.map((a) => {
            const inner = (
              <>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-space-cyan">{a.n}</span>
                  <a.icon className="h-4 w-4 text-space-cyan" />
                </div>
                <p className="mt-3 text-sm font-semibold text-white">{a.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">{a.body}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-space-cyan">
                  {a.label} {a.href === "/fly" ? <ArrowRight className="h-3 w-3" /> : null}
                </span>
              </>
            );
            const cls =
              "glass-panel p-5 transition hover:border-space-cyan/40 hover:bg-white/[0.06]";
            return a.href.startsWith("/") ? (
              <Link key={a.n} href={a.href} className={cls}>
                {inner}
              </Link>
            ) : (
              <a key={a.n} href={a.href} className={cls}>
                {inner}
              </a>
            );
          })}
        </div>
        <div className="h-[240px] overflow-hidden rounded-2xl border border-white/10 bg-black/30">
          <SpaceCanvas bodyId="moon" cameraDistance={2.2} />
        </div>
      </div>

      <div id="design" className="scroll-mt-20">
        <MissionPlanner />
      </div>
    </div>
  );
}