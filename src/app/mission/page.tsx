import type { Metadata } from "next";
import { Rocket } from "lucide-react";
import { PagePlaceholder } from "@/components/ui/page-placeholder";
import { SpaceCanvas } from "@/components/space-canvas";

export const metadata: Metadata = { title: "Mission" };

export default function MissionPage() {
  return (
    <div>
      <PagePlaceholder
        icon={Rocket}
        kicker="Pillar A — the journey"
        title="Plan. Fly. Live. The Next Frontier."
        phase="Phase 1 — planning engine"
        description="Build a real mission to the Moon or Mars. Choose your rocket, watch the Hohmann transfer play out in 3D, check the crew's radiation dose and light-lag to home, then design an outpost that keeps them alive. Finish with a printable Mission Passport."
        bullets={[
          "Act 1 · PLAN — launch window, rocket class, staged Δv, travel days, radiation dose",
          "Act 2 · FLY — 3D trajectory, Apollo 11 replay, live satellite tracks, message-home light-lag",
          "Act 3 · LIVE — O₂/water/power/food/radiation budgets for Moon or Mars",
          "Artifact — shareable, printable Mission Passport (SVG)",
        ]}
      />
      <div className="mx-auto h-[340px] max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="h-full overflow-hidden rounded-2xl border border-white/10 bg-black/30">
          <SpaceCanvas bodyId="moon" cameraDistance={2.2} />
        </div>
      </div>
    </div>
  );
}