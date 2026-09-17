import { SectionHeading } from "@/components/ui/section-heading";
import { FlyStage, type FlyMode } from "@/components/fly-stage";
import { FlyModeTabs } from "@/components/fly-mode-tabs";
import { Rocket, RotateCcw, Info, Clock, Sun } from "lucide-react";

export const metadata = { title: "Fly — Apollo 11 Replay & Trajectory Theater" };

interface FlyPageProps {
  searchParams: Promise<{ mode?: string }>;
}

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

export default async function FlyPage({ searchParams }: FlyPageProps) {
  const { mode: modeParam } = await searchParams;
  const initialMode: FlyMode = modeParam === "hohmann" ? "hohmann" : modeParam === "mars" ? "mars" : "apollo11";
  const isMars = initialMode === "mars";

  return (
    <div className="pt-28">
      <div className="mx-auto max-w-7xl px-4 pb-6 sm:px-6 lg:px-8">
        <SectionHeading
          kicker="Fly — trajectory theater"
          title={
            isMars
              ? "Coast from Earth to Mars along the minimum-energy Hohmann ellipse."
              : "Relive Apollo 11 or simulate a Hohmann transfer to the Moon."
          }
          description="Scrub the timeline, follow the spacecraft, or free-cam. Every position is computed from real mission data (Apollo) or physics — patched-conic for the Moon, a Sun-centred Kepler solve for Mars. Works offline, no external ephemeris needed."
        />

        <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-slate-400">
          <FlyModeTabs active={initialMode} />
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/40 border border-white/10">
            <Clock className="h-4 w-4" /> Total {isMars ? "transfer" : "MET"}: {isMars ? "258 days 23 h" : "102:45:40"}
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/40 border border-white/10">
            <Info className="h-4 w-4" /> Camera: Follow Craft / Track Earth / {isMars ? "Track Mars / Track Sun" : "Track Moon"} / Free
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
        <div className="h-[600px] rounded-2xl border border-white/10 bg-black/30 overflow-hidden">
          <FlyStage mode={initialMode} />
        </div>
      </div>

      {isMars ? (
        <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Sun className="h-5 w-5 text-space-amber" /> The transfer at a glance
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-black/30 p-6">
              <h3 className="font-semibold text-white mb-3">Why this window</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>• Earth orbits at 1.000 au, Mars at 1.524 au → transfer ellipse a = 1.262 au</li>
                <li>• Eccentricity 0.208; the craft departs perihelion and arrives aphelion</li>
                <li>• Half-period = 259 days 23 h one way — the classic minimum-energy route</li>
                <li>• Mars must lead Earth by ~44° at departure</li>
                <li>• The same geometry repeats every synodic period, ~780 days</li>
              </ul>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 p-6">
              <h3 className="font-semibold text-white mb-3">Reading the view</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>• Sun-centred ecliptic-plane projection at true au scale (12 scene units = 1 au)</li>
                <li>• Blue ring = Earth orbit, rust ring = Mars orbit; the dashed arc is the transfer path</li>
                <li>• Mars advances from its 44° phase lead to the 180° arrival point during the coast</li>
                <li>• HUD reports heliocentric distance in au plus range to Earth and Mars</li>
                <li>• Positions from a Newton–Raphson Kepler solve; all math runs in the browser</li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
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
                <RotateCcw className="h-5 w-5 text-space-cyan" /> Also in the theater
              </h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>• Generic Hohmann Earth→Moon transfer (patched-conic) via ?mode=hohmann</li>
                <li>• Earth→Mars Hohmann with a Sun-centred Kepler solve via ?mode=mars</li>
                <li>• Delta-V budget on the Mission page's design engine</li>
                <li>• Export trajectory as CSV / KML for analysis (roadmap)</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
