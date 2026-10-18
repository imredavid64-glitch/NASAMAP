import { Suspense } from "react";
import { FarmerDashboard } from "./FarmerDashboard";

export const metadata = { title: "Farmer's Sky Card — NASAMAP" };

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function FarmerPage() {
  return (
    <div className="pt-28">
      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <Suspense fallback={<div className="text-center py-12 text-slate-400">Loading farmer dashboard...</div>}>
          <FarmerDashboard />
        </Suspense>
      </div>
    </div>
  );
}