import { Suspense } from "react";
import { PorkchopPlot } from "@/components/mission/porkchop-plot";

export const metadata = { title: "Porkchop Plot — Earth→Mars Transfer Analysis" };

// Force dynamic rendering to avoid static generation issues with useSearchParams in Nav
export const dynamic = 'force-dynamic';

export default function PorkchopPage() {
  return (
    <div className="pt-28">
      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <Suspense fallback={<div className="text-center py-12 text-slate-400">Loading porkchop plot...</div>}>
          <PorkchopPlot />
        </Suspense>
      </div>
    </div>
  );
}