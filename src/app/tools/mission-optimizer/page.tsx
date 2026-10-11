import { Suspense } from "react";
import { MissionOptimizerClient } from "./MissionOptimizerClient";

export const metadata = {
  title: "Mission Optimizer — Pareto-Optimal Mars Architectures",
  description: "Explore pre-computed Pareto-optimal Mars mission architectures for 2028 and 2031 launch windows. Multi-objective optimization across IMLEO, payload, radiation, and cost.",
};

export default function MissionOptimizerPage() {
  return (
    <div className="pt-28">
      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <Suspense fallback={<MissionOptimizerSkeleton />}>
          <MissionOptimizerClient />
        </Suspense>
      </div>
    </div>
  );
}

function MissionOptimizerSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 bg-white/10 rounded w-1/3" />
      <div className="h-4 bg-white/10 rounded w-1/2" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <div className="h-96 bg-white/10 rounded" />
        <div className="space-y-4">
          <div className="h-20 bg-white/10 rounded" />
          <div className="h-20 bg-white/10 rounded" />
        </div>
      </div>
      <div className="h-64 bg-white/10 rounded" />
    </div>
  );
}