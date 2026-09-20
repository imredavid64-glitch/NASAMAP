import { Metadata } from "next";
import { SectionHeading } from "@/components/ui/section-heading";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { decodeDesignQuery, type DesignInput } from "@/lib/design-link";
import { designMission } from "@/lib/mission";
import { scoreMission, type Scorecard } from "@/lib/score";
import { MissionCompare } from "@/components/mission/mission-compare";

interface ComparePageProps {
  searchParams: Promise<{ a?: string; b?: string }>;
}

export const metadata: Metadata = {
  title: "Mission Compare — Side-by-side design diff",
  description: "Compare two mission designs side by side. See the differences in Δv, mass, radiation, life support, and score.",
};

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const { a, b } = await searchParams;

  const designA = a ? decodeDesignQuery(a) : null;
  const designB = b ? decodeDesignQuery(b) : null;

  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
      <SectionHeading kicker="Mission Lab" title="Design Compare" />
      <p className="mt-3 max-w-2xl text-slate-400">
        Compare two mission designs side by side. Paste design URLs or use the share links from the Mission Lab.
        The diff highlights what changed and how it affects the score.
      </p>

      <MissionCompare designA={designA} designB={designB} />
    </section>
  );
}