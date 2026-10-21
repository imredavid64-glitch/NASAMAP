import { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import { HistoricalPlayer } from "@/components/mission/historical-player-v2";
import { HistoricalMission, getHistoricalMission } from "@/lib/historical-missions";
import Link from "next/link";
import { Suspense } from "react";

interface HistoricalMissionPageProps {
  params: Promise<{ id: string }>;
}

interface StaticParams {
  id: string;
  mission: HistoricalMission;
}

export async function generateStaticParams(): Promise<StaticParams[]> {
  const missions = await import("@/data/historical-missions.json");
  return (missions as any).missions.map((m: any) => ({ 
    id: m.id,
    mission: m 
  }));
}

// Force static generation for this page
export const dynamic = 'force-static';

export async function generateMetadata({ params }: HistoricalMissionPageProps): Promise<Metadata> {
  const { id } = await params;
  const mission = getHistoricalMission(id);
  if (!mission) return { title: "Historical Mission Replay" };
  return {
    title: `${mission.name} — Historical Replay`,
    description: mission.description,
  };
}

function HistoricalMissionContent({ mission }: { mission: HistoricalMission | undefined }) {
  if (!mission) {
    return (
      <div className="pt-28 pb-16 text-center">
        <p className="text-slate-400">Mission not found</p>
        <Link href="/fly/historical" className="mt-4 inline-flex items-center gap-2 text-space-cyan hover:underline">
          <ChevronLeft className="h-4 w-4" /> Browse All Missions
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-28 pb-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <HistoricalPlayer mission={mission} />
      </div>
    </div>
  );
}

export default async function HistoricalMissionPage({ params }: HistoricalMissionPageProps) {
  const { id } = await params;
  const mission = getHistoricalMission(id);
  
  return (
    <Suspense fallback={<div className="pt-28 pb-16 text-center"><p className="text-slate-400">Loading mission...</p></div>}>
      <HistoricalMissionContent mission={mission} />
    </Suspense>
  );
}