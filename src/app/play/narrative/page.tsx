import { Star, BookOpen, Users, Zap, Droplets, Leaf, Flag, Award, ChevronRight } from "lucide-react";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionHeading } from "@/components/ui/section-heading";
import Link from "next/link";
import { NarrativePlayer } from "@/components/mission/narrative-player";
import { loadNarrativeScenarios, narrativeById, type NarrativeScenario } from "@/lib/narrative";

interface NarrativePageProps {
  params: Promise<{ id?: string }>;
}

export async function generateStaticParams() {
  const scenarios = loadNarrativeScenarios();
  return scenarios.map((s) => ({ id: s.id }));
}

export async function generateMetadata({ params }: NarrativePageProps) {
  const { id } = await params;
  if (!id) return { title: "Narrative Missions" };
  const scenario = narrativeById(id);
  if (!scenario) return { title: "Narrative Missions" };
  return {
    title: `${scenario.title} — Narrative Mission`,
    description: scenario.brief,
  };
}

const PERSONA_ICONS = {
  farmer: Leaf,
  geologist: Award,
  commander: Users,
} as const;

function ScenarioCard({ scenario }: { scenario: NarrativeScenario }) {
  const PersonaIcon = PERSONA_ICONS[scenario.persona] || BookOpen;
  const diffColors: Record<string, string> = {
    Beginner: "emerald",
    Intermediate: "amber",
    Advanced: "crimson",
  };

  return (
    <Link href={`/play/narrative/${scenario.id}`} className="block">
      <Card className="glass-panel transition hover:border-space-cyan/40 h-full">
        <CardBody className="flex flex-col h-full">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-space-cyan/20">
                <PersonaIcon className="h-5 w-5 text-space-cyan" />
              </div>
              <div>
                <CardTitle className="text-sm">{scenario.title}</CardTitle>
                <p className="mt-1 text-xs text-slate-400 capitalize">{scenario.persona} · {scenario.lane}</p>
              </div>
            </div>
            <Badge tone={diffColors[scenario.difficulty] as "cyan" | "amber" | "crimson" | "emerald" | "slate" || "slate"} className="text-[10px]">
              {scenario.difficulty}
            </Badge>
          </div>

          <p className="text-xs text-slate-400 mb-4 flex-1">{scenario.brief}</p>

          <div className="flex flex-wrap gap-2 mb-4">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 text-[10px] font-mono text-space-cyan">
              <Users className="h-2.5 w-2.5" /> {scenario.initialDesign.crew} crew
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 text-[10px] font-mono text-space-cyan">
              <Flag className="h-2.5 w-2.5" /> {scenario.initialDesign.surfaceDays} sols
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 text-[10px] font-mono text-space-cyan">
              <Award className="h-2.5 w-2.5" /> Par: {scenario.parScore}
            </span>
          </div>

          <div className="mt-auto pt-4 border-t border-white/10">
            <Button className="w-full justify-center gap-2">
              <Star className="h-4 w-4" /> Begin Narrative
            </Button>
          </div>
        </CardBody>
      </Card>
    </Link>
  );
}

function Button({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <button
      className={`
        inline-flex items-center justify-center rounded-xl bg-space-cyan px-4 py-2.5 text-sm font-semibold text-space-950
        transition hover:bg-space-cyan/90 focus-visible:ring-2 focus-visible:ring-space-cyan
        focus-visible:ring-offset-2 focus-visible:ring-offset-space-950 ${className}
      `}
    >
      {children}
    </button>
  );
}

async function getScenario(id: string): Promise<NarrativeScenario | undefined> {
  return narrativeById(id);
}

export default async function NarrativePage({ params }: NarrativePageProps) {
  const { id } = await params;
  const scenarios = loadNarrativeScenarios();

  if (!id) {
    // List all narrative scenarios
    return (
      <div className="pt-28 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            kicker="NARRATIVE MISSIONS"
            title="Character-Driven Stories"
            description="Step into the boots of a farmer, geologist, or station commander. Your choices shape the mission design — and the story."
          />

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {scenarios.map((scenario) => (
              <ScenarioCard key={scenario.id} scenario={scenario} />
            ))}
          </div>

          <div className="mt-12 rounded-2xl border border-space-cyan/30 bg-space-cyan/5 p-6">
            <SectionHeading
              kicker="HOW IT WORKS"
              title="Narrative Meets Engineering"
              description="Every choice you make modifies the mission design parameters — crew, surface days, vehicle. The physics engine recalculates Δv, radiation, ECLSS, and score in real time."
            />
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {[
                { Icon: Star, title: "Branching Choices", desc: "Each decision unlocks new narrative paths and sets flags that affect later options" },
                { Icon: Zap, title: "Live Physics", desc: "Design parameters feed the engine — score, radiation, ECLSS update instantly" },
                { Icon: Award, title: "Star Grading", desc: "Complete the narrative with 3 stars by hitting the par score and a successful ending" },
              ].map(({ Icon, title, desc }) => (
                <div key={title} className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-space-cyan/20">
                    <Icon className="h-5 w-5 text-space-cyan" />
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">{title}</p>
                    <p className="mt-1 text-xs text-slate-400">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const scenario = await getScenario(id);
  if (!scenario) {
    return (
      <div className="pt-28 pb-16 text-center">
        <p className="text-slate-400">Narrative mission not found</p>
        <Link href="/play/narrative" className="mt-4 inline-flex items-center gap-2 text-space-cyan hover:underline">
          <ChevronRight className="h-4 w-4" /> Browse All Narratives
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-28 pb-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <NarrativePlayer scenario={scenario} onBack={() => window.history.back()} />
      </div>
    </div>
  );
}