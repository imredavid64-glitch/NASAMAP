import { Wrench, BarChart2, Globe, Cpu, Compass, Download } from "lucide-react";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import Link from "next/link";

const tools = [
  {
    href: "/tools/porkchop",
    icon: Globe,
    title: "Porkchop Plot Generator",
    desc: "Interactive Earth→Mars transfer analysis. Sweep departure/arrival dates, visualize C3 and time-of-flight contours, find optimal launch windows. Lambert solver with Lambert's problem universal variable formulation.",
    tags: ["Lambert solver", "C3 contours", "TOF contours", "Launch windows", "Export PNG"],
    status: "live",
  },
  {
    href: "/tools/trajectory-analyzer",
    icon: BarChart2,
    title: "Trajectory Analyzer",
    desc: "Deep-dive into any mission trajectory. ΔV breakdown, gravity loss, steering loss, gravity assist sequencing, multi-body perturbation analysis. Export to CSV/KML/GMAT.",
    tags: ["ΔV breakdown", "Gravity assists", "Perturbations", "Multi-body", "GMAT export"],
    status: "beta",
  },
  {
    href: "/tools/launch-window",
    icon: Compass,
    title: "Launch Window Calculator",
    desc: "Synodic period calculator for any planet pair. Optimal phasing, stay times, abort windows. Supports Venus, Earth, Mars, Jupiter, Saturn gravity assist chains.",
    tags: ["Synodic periods", "Phasing", "Abort windows", "Gravity assists", "Multi-planet"],
    status: "planned",
  },
  {
    href: "/tools/radiation-model",
    icon: Cpu,
    title: "Radiation Risk Model",
    desc: "GCR + SPE dose calculator with organ-specific shielding. NASA Space Cancer Risk 2020 model, Badhwar-O'Neill 2010 GCR, SPE probability. Organ dose equivalents per ICRP 103.",
    tags: ["NSCR 2020", "Organ doses", "Shielding", "SPE probability", "Career limits"],
    status: "planned",
  },
  {
    href: "/tools/isru-sizer",
    icon: Wrench,
    title: "ISRU System Sizer",
    desc: "MOXIE-scale oxygen production, Sabatier methane, water extraction from regolith. Power, mass, thermal budgets. Scaling laws from lab to Mars surface.",
    tags: ["MOXIE", "Sabatier", "Water extraction", "Power budget", "Thermal"],
    status: "planned",
  },
  {
    href: "/tools/mission-optimizer",
    icon: Cpu,
    title: "Mission Optimizer (AI)",
    desc: "Genetic algorithm + gradient descent for mass-optimal trajectories. Multi-objective: minimize IMLEO, maximize payload, minimize radiation. Pareto front visualization.",
    tags: ["Genetic algorithm", "Multi-objective", "Pareto front", "Gradient descent", "IMLEO"],
    status: "planned",
  },
];

export default function ToolsPage() {
  return (
    <div className="pt-28">
      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <SectionHeading kicker="Astrodynamics Lab" title="Mission Design Tools" />
        <p className="mt-4 max-w-2xl text-slate-400">
          Specialized computational tools for mission designers, astrodynamicists, and systems engineers.
          Built on the same physics engine that powers the Mission Lab — all math runs in the browser, works offline.
        </p>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((t) => (
            <Card key={t.href} className="hover:border-space-cyan/40 transition">
              <CardBody>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-space-cyan/20 text-space-cyan">
                      <t.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{t.title}</CardTitle>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                        {t.status === "live" ? "Live" : t.status === "beta" ? "Beta" : "Planned"}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-400">{t.desc}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {t.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-mono text-slate-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <Link
                  href={t.href}
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-space-cyan hover:text-white"
                >
                  Open tool <span aria-hidden="true">→</span>
                </Link>
              </CardBody>
            </Card>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
            <Download className="h-5 w-5 text-space-cyan" /> All Tools Philosophy
          </h3>
          <ul className="mt-4 space-y-3 text-sm text-slate-400">
            <li className="flex gap-3">
              <span className="flex-shrink-0 text-space-cyan">▸</span>
              <span><strong>Zero server compute:</strong> All orbital mechanics, optimization, and visualization run client-side in Web Workers. Your designs never leave your browser.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 text-space-cyan">▸</span>
              <span><strong>Cited physics:</strong> Every constant, model, and equation traces to a NASA, ESA, or peer-reviewed source. No black boxes.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 text-space-cyan">▸</span>
              <span><strong>Export everything:</strong> CSV for spreadsheets, KML for Google Earth, GMAT scripts for high-fidelity propagation, SVG/PNG for reports.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 text-space-cyan">▸</span>
              <span><strong>Offline-first:</strong> Service Worker caches all assets and API snapshots. Works on the ISS, in a bunker, or on Mars (with 20 min lag).</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 text-space-cyan">▸</span>
              <span><strong>Open source:</strong> MIT licensed. Fork it, extend it, audit it. The engine is in <code className="font-mono text-xs bg-space-950 px-1 rounded">src/lib/</code>.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}