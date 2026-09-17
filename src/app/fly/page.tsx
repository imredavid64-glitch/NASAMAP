import { SectionHeading } from "@/components/ui/section-heading";
import { FlyStage } from "@/components/fly-stage";
import { Rocket, RotateCcw, Info, Clock } from "lucide-react";

export const metadata = { title: "Fly — Apollo 11 Replay & Trajectory Simulator" };

const milestones = [
  { met: "00:00:00", label: "Launch (KSC LC-39A)", body: "earth" },
  { met: "02:44:16", label: "TLI Ignition", body: "earth" },
  { met: "02:50:03", label: "TLI Cutoff", body: "earth" },
  { met: "03:17:04", label: "CSM/LM Separation", body: "earth" },
  { met: "26:44:58", label: "MCC-1", body: "earth" },
  { met: "61:40:00", label: "MCC-2", body: "earth" },
  { met: "72:00:00", label: "Lunar SOI Entry", body: "moon" },
  { met: "75:49:50", label: "LOI-1 Ignition", body: "moon" },
  { met: "76:00:00", label: "Lunar Orbit Insertion", body: "moon" },
  { met: "80:11:36", label: "LOI-2 Circularization", body: "moon" },
  { met: "100:12:00", label: "LM Undocking", body: "moon" },
  { met: "102:33:05", label: "Powered Descent", body: "moon" },
  { met: "102:45:40", label: "Touchdown — Tranquility Base", body: "moon" },
];

export default function FlyPage() {
  return (
    <div className="pt-28">
      <div className="mx-auto max-w-7xl px-4 pb-6 sm:px-6 lg:px-8">
        <SectionHeading
          kicker="Fly — trajectory theater"
          title="Relive Apollo 11 or simulate a Hohmann transfer to the Moon."
          description="Scrub the timeline, follow the spacecraft, or free-cam. Every position is computed from real mission data (Apollo) or physics (patched-conic Hohmann). Works offline — no external ephemeris needed."
        />

        <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-slate-400">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/40 border border-white/10">
            <Rocket className="h-4 w-4 text-space-cyan" /> Mode: Apollo 11 Replay
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/40 border border-white/10">
            <Clock className="h-4 w-4" /> Total MET: 102:45:40
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/40 border border-white/10">
            <Info className="h-4 w-4" /> Camera: Follow Craft / Track Earth / Track Moon / Free
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
        <div className="h-[600px] rounded-2xl border border-white/10 bg-black/30 overflow-hidden">
          <FlyStage mode="apollo11" />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Info className="h-5 w-5 text-space-cyan" /> Mission Timeline
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-slate-300">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-2 px-3 font-mono text-space-cyan">MET</th>
                <th className="text-left py-2 px-3">Event</th>
                <th className="text-left py-2 px-3 text-center">Body</th>
              </tr>
            </thead>
            <tbody>
              {milestones.map((m, i) => (
                <tr key={m.met} className={`${i % 2 === 0 ? "bg-white/5" : ""} border-b border-white/5 hover:bg-white/10`}>
                  <td className="py-2 px-3 font-mono text-space-cyan">{m.met}</td>
                  <td className="py-2 px-3">{m.label}</td>
                  <td className="py-2 px-3 text-center capitalize">{m.body}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-black/30 p-6">
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Rocket className="h-5 w-5 text-space-cyan" /> How it works
            </h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>• Apollo 11 positions interpolated from the official mission timeline (15 key events)</li>
              <li>• Earth & Moon rendered at correct scale (Earth radius = 1 scene unit, Moon at ~60 R⊕)</li>
              <li>• Camera modes: follow craft (smooth chase), track Earth/Moon, or free orbit</li>
              <li>• Speed slider: 0–100× real time — watch 4 days in seconds</li>
              <li>• All math runs in the browser; zero server calls after load</li>
            </ul>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/30 p-6">
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-space-cyan" /> Coming next
            </h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>• Generic Hohmann Earth→Moon transfer (patched-conic)</li>
              <li>• Earth→Mars Hohmann with launch window visualization</li>
              <li>• Delta-V budget display along trajectory</li>
              <li>• Crewed mission profile selector (Apollo / Artemis / Starship)</li>
              <li>• Export trajectory as CSV / KML for analysis</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}