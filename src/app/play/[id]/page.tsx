import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { scenarioById, clampDesignToScenario } from "@/lib/scenarios";
import { decodeDesign } from "@/lib/design-link";
import { MissionPlanner } from "@/app/mission/MissionPlanner";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const scenario = scenarioById(id);
  return { title: scenario ? `${scenario.title} — Space Mission Design Game` : "Mission not found" };
}

export default async function PlayScenarioPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const scenario = scenarioById(id);
  if (!scenario) notFound();

  const raw = await searchParams;
  const initial = clampDesignToScenario(scenario, decodeDesign(raw));

  return (
    <div className="pt-28">
      <div className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <Link
          href="/play"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 transition hover:text-space-cyan"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Space Mission Design Game
        </Link>
        <p className="kicker mb-3 mt-4">{scenario.difficulty} mission brief</p>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-5xl">{scenario.title}</h1>
        <p className="mt-4 max-w-2xl text-slate-400">{scenario.brief}</p>
      </div>

      <div id="design" className="scroll-mt-20">
        <MissionPlanner initial={initial} scenario={scenario} basePath={`/play/${id}`} />
      </div>
    </div>
  );
}