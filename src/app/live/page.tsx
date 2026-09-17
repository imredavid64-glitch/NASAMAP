import type { Metadata } from "next";
import { Radio } from "lucide-react";
import { PagePlaceholder } from "@/components/ui/page-placeholder";
import { SpaceCanvas } from "@/components/space-canvas";

export const metadata: Metadata = { title: "Live Frontier" };

const markers = [
  { id: "jsc", latDeg: 29.5603, lonDeg: -95.0858, label: "NASA Johnson" },
  { id: "ksc", latDeg: 28.5729, lonDeg: -80.649, label: "Kennedy" },
  { id: "goddard", latDeg: 38.9929, lonDeg: -76.8393, label: "Goddard" },
];

export default function LivePage() {
  return (
    <div>
      <PagePlaceholder
        icon={Radio}
        kicker="Live frontier ribbon"
        title="What is happening in space, right now."
        phase="Phase 2 — live data layer"
        description="A transient live-data strip refreshed client-side: ISS overhead passes, Voyager's current distance and its real light-lag, today's Astronomy Picture of the Day, near-Earth objects and the current solar-storm level. Works fully offline with GitHub-stored snapshots when the network is gone."
        bullets={[
          "ISS & constellation tracks (CelesTrak TLE + satellite.js propagation)",
          "Voyager 1/2 — live distance, speed and message round-trip delay",
          "APOD + NEO feeds (NASA open APIs, cached transiently)",
          "Solar activity & GNSS/HF risk brief (NOAA SWPC)",
        ]}
      />
      <div className="mx-auto h-[340px] max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="h-full overflow-hidden rounded-2xl border border-white/10 bg-black/30">
          <SpaceCanvas bodyId="earth" markers={markers} cameraDistance={2.4} />
        </div>
      </div>
    </div>
  );
}