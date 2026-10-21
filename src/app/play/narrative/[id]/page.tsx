import { notFound } from "next/navigation";
import { NarrativePlayer } from "@/components/mission/narrative-player";
import { narrativeById, type NarrativeScenario } from "@/lib/narrative";

interface Props {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const scenario = narrativeById(id);
  if (!scenario) return { title: "Narrative Mission — NASAMAP" };
  return {
    title: `${scenario.title} — Narrative Mission`,
    description: scenario.brief,
  };
}

export default async function NarrativeDetailPage({ params }: Props) {
  const { id } = await params;
  const scenario: NarrativeScenario | undefined = narrativeById(id);
  if (!scenario) notFound();
  return <NarrativePlayer scenario={scenario} />;
}
