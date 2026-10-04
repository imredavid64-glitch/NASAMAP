import { MonteCarloClient } from "@/components/montecarlo/MonteCarloClient";
import { DEFAULT_DESIGN } from "@/lib/design-link";
import type { MissionDesignOptions } from "@/lib/mission";
import { Suspense } from "react";

export const metadata = { title: "Monte Carlo Uncertainty Analysis — Mission Optimizer" };

interface MonteCarloPageProps {
  searchParams: Promise<{ design?: string }>;
}

export default async function MonteCarloPage({ searchParams }: MonteCarloPageProps): Promise<React.ReactElement> {
  return (
    <Suspense fallback={<div className="pt-28 mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8 text-center">
      <div className="h-12 w-12 mx-auto mb-4 animate-spin rounded-full border-4 border-space-cyan/30 border-t-space-cyan" />
      <p className="text-slate-400">Loading Monte Carlo...</p>
    </div>}>
      <MonteCarloClient />
    </Suspense>
  );
}