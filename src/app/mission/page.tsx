import type { Metadata } from "next";
import Link from "next/link";
import { Rocket, Orbit, FileBadge, ArrowRight, Sun } from "lucide-react";
import { SpaceCanvas } from "@/components/space-canvas";
import { SurfaceStage } from "@/components/surface-stage";
import { decodeDesign } from "@/lib/design-link";
import { MissionPlanner } from "./MissionPlanner";

export const metadata: Metadata = { title: "Mission — Plan the frontier" };

const acts = [
  {
    n: "01",
    label: "Plan",
    title: "Design the stack",
    body: "Choose a rocket, crew and surface stay. The engine sums Δv, mass, radiation and consumables, then rates the design S–D against cited NASA limits.",
    href: "#design",
    icon: Rocket,
  },
  {
    n: "02",
    label: "Fly",
    title: "Watch the trajectory",
    body: "Replay Apollo 11 event-by-event, or fly a Hohmann transfer to the Moon or Mars from the design you just built.",
    href: "/fly",
    icon: Orbit,
  },
  {
    n: "03",
    label: "Prove",
    title: "Close the loop",
    body: "See how ISS-class recycling cuts the launch stack, then take a printable Mission Passport and patch.",
    href: "#ops",
    icon: FileBadge,
  },
] as const;

export default async function MissionPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const initialDesign = decodeDesign(await searchParams);
  return (
    <div className="pt-28">
      <div className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <p className="kicker mb-3">Act I · Plan</p>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Design a mission that actually closes.
        </h1>
        <p className="mt-4 max-w-2xl text-slate-400">
          Build a real mission to the Moon or Mars. Choose your rocket, watch the transfer play out, check the crew&apos;s
          radiation dose and light-lag to home, close the life-support loop, then take home a printable Mission Passport
          and patch.
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
        <MissionPlanner initial={initialDesign} />
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <h2 className="flex items-center gap-2 text-2xl font-semibold text-white">
          <Sun className="h-5 w-5 text-space-amber" /> A sol on Mars
        </h2>
        <p className="mt-2 max-w-2xl text-slate-400">
          The surface stay, closed in 3D. A Jezero-class site spins through one Martian day — 24 h 39 m — while the
          solar array tracks the Sun and the habitat runs off the battery after dark. Generation and load come
          straight from the closed-loop ops budget above, so you can watch the array and battery earn their place in
          the stack.
        </p>
        <div className="mt-6 h-[560px] overflow-hidden rounded-2xl border border-white/10 bg-black/30">
          <SurfaceStage />
        </div>
        <ul className="mt-4 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
          <li>• Solar elevation from the standard sin(elev) formula; declination over the Martian year (obliquity 25.19°)</li>
          <li>• Array output is the clear-sky projection of rated power — no airmass or dust term, stated honestly</li>
          <li>• Battery begins the sol at 50% state of charge; capacity is 18 h of habitat load</li>
          <li>• Terrain, habitat and array are procedural — no downloaded assets, fully offline</li>
        </ul>
      </div>
    </div>
  );
}