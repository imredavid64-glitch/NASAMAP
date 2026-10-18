import { Suspense } from "react";
import { HistoricalMissionsList } from "@/components/mission/historical-missions-list";

export const metadata = { title: "Historical Mission Replays — Apollo, Voyager, Mars, Cassini & More" };

// Force static generation
export const dynamic = 'force-static';

export default function HistoricalMissionsPage() {
  return (
    <div className="pt-28">
      <Suspense fallback={<div className="text-center py-12 text-slate-400">Loading historical missions...</div>}>
        <HistoricalMissionsList />
      </Suspense>
    </div>
  );
}