import type { Metadata } from "next";
import { Compass } from "lucide-react";
import { PagePlaceholder } from "@/components/ui/page-placeholder";
import { SpaceCanvas } from "@/components/space-canvas";
import { CommonsExplorer } from "./CommonsExplorer";

export const metadata: Metadata = { title: "Data Commons" };

export default function CommonsPage() {
  return (
    <div>
      <PagePlaceholder
        icon={Compass}
        kicker="Pillar B — cosmic data for every human"
        title="Pick who you are. Get your sky card."
        phase="Phase 1 — signal engine + persona cards"
        description="The app tracks and calculates all kinds of cosmic data — day length, sun path, moon phase, tides, solar storms, GNSS disturbance, satellite passes, meteor showers — and turns it into one actionable card for your life."
        bullets={[
          "Farmer — photoperiod planting windows, frost season, GPS autosteer risk",
          "Fisher — tonight's tide rating + solunar windows from moon phase",
          "Solar / Ham radio / Pilot — sun potential, HF propagation, GNSS/HF status",
          "Astrophotographer / Family / Student — dark skies, ISS passes, weekly sky digest",
        ]}
      />
      <CommonsExplorer />
      <div className="mx-auto h-[340px] max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="h-full overflow-hidden rounded-2xl border border-white/10 bg-black/30">
          <SpaceCanvas bodyId="mars" cameraDistance={2} />
        </div>
      </div>
    </div>
  );
}