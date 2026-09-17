import type { Metadata } from "next";
import { SpaceCanvas } from "@/components/space-canvas";
import { LiveRibbon } from "./LiveRibbon";

export const metadata: Metadata = { title: "Live Frontier" };

const markers = [
  { id: "jsc", latDeg: 29.5603, lonDeg: -95.0858, label: "NASA Johnson" },
  { id: "ksc", latDeg: 28.5729, lonDeg: -80.649, label: "Kennedy" },
  { id: "goddard", latDeg: 38.9929, lonDeg: -76.8393, label: "Goddard" },
];

export default function LivePage() {
  return (
    <div className="pt-28">
      <div className="mx-auto max-w-7xl px-4 pb-6 sm:px-6 lg:px-8">
        <p className="kicker mb-3">Live frontier ribbon</p>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-5xl">
          What is happening in space, right now.
        </h1>
        <p className="mt-4 max-w-2xl text-slate-400">
          ISS overhead passes, Voyager&apos;s real light-lag, today&apos;s Astronomy Picture of the Day, near-Earth
          objects and the current solar-storm level — each card tries the live feed and falls back to a dated snapshot.
        </p>
      </div>

      <div className="mx-auto h-[320px] max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="h-full overflow-hidden rounded-2xl border border-white/10 bg-black/30">
          <SpaceCanvas bodyId="earth" markers={markers} cameraDistance={2.4} />
        </div>
      </div>

      <LiveRibbon />
    </div>
  );
}