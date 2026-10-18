import { Suspense } from "react";
import { DisasterDashboard } from "./DisasterDashboard";

export const metadata = { title: "Disaster & Climate Dashboard — NASAMAP" };

// Force static generation
export const dynamic = 'force-static';

export default function DisasterPage() {
  return (
    <div className="pt-28">
      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <Suspense fallback={<div className="text-center py-12 text-slate-400">Loading disaster dashboard...</div>}>
          <DisasterDashboard />
        </Suspense>
      </div>
    </div>
  );
}