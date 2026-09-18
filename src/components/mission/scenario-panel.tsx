"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Star, CheckCircle2, XCircle, Gamepad2, ArrowRight, Target } from "lucide-react";
import { evaluateScenario, nextScenarioId, scenarioById, type Scenario } from "@/lib/scenarios";
import { type MissionDesign } from "@/lib/mission";
import { type Scorecard } from "@/lib/score";
import { readProgress, recordScenarioResult, starsFor, type ProgressMap } from "@/lib/progress";
import { encodeDesignQuery } from "@/lib/design-link";
import { passportIssued, passportMissionId } from "@/lib/passport";
import { ReportCard } from "@/components/mission/report-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardTitle } from "@/components/ui/card";

const DIFF_TONE: Record<Scenario["difficulty"], "emerald" | "amber" | "crimson"> = {
  "Beginner/Youth": "emerald",
  Intermediate: "amber",
  Advanced: "crimson",
};

function Stars({ n }: { n: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${n} of 3 stars`}>
      {[1, 2, 3].map((i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i <= n ? "text-space-amber" : "text-slate-700"}`}
          fill="currentColor"
        />
      ))}
    </span>
  );
}

export function ScenarioPanel({
  scenario,
  design,
  scorecard,
  basePath,
}: {
  scenario: Scenario;
  design: MissionDesign;
  scorecard: Scorecard;
  basePath: string;
}) {
  const [progress, setProgress] = useState<ProgressMap | null>(null);
  const result = evaluateScenario(scenario, design, scorecard);
  const issuedUTC = passportIssued();
  const missionId = passportMissionId(design, issuedUTC);
  const permalink = `${basePath}?d=${encodeDesignQuery({
    destination: design.destination,
    vehicleId: design.vehicle.id,
    crew: design.crew,
    surfaceDays: design.surfaceDays,
  })}`;

  useEffect(() => {
    recordScenarioResult(window.localStorage, scenario.id, {
      stars: result.stars,
      score: scorecard.score,
    });
    setProgress(readProgress(window.localStorage));
  }, [scenario.id, result.stars, scorecard.score]);

  const best = progress ? starsFor(progress, scenario.id) : null;
  const constraintGoals = result.goals.filter((g) => g.id.startsWith("constraint-"));
  const objectiveGoals = result.goals.filter((g) => !g.id.startsWith("constraint-"));
  const nextId = nextScenarioId(scenario.id);
  const nextScenario = nextId ? scenarioById(nextId) : undefined;

  return (
    <Card id="objectives" className="scroll-mt-20 border-space-cyan/25">
      <CardBody>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-space-cyan" />
            <CardTitle>Mission objectives</CardTitle>
            <Badge tone={DIFF_TONE[scenario.difficulty]}>{scenario.difficulty}</Badge>
          </div>
          <div className="flex items-center gap-3">
            <Stars n={result.stars} />
            {best != null && (
              <span className="text-xs text-slate-500">best: {best}★</span>
            )}
          </div>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-slate-300">{scenario.brief}</p>

        {result.completed && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-space-emerald/40 bg-space-emerald/10 px-4 py-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-space-emerald">
              <CheckCircle2 className="h-4 w-4" /> Mission complete — {result.stars}★ · {scorecard.score}/100
            </p>
            <div className="flex flex-wrap gap-2">
              {nextScenario && (
                <Link
                  href={`/play/${nextScenario.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-space-cyan px-3 py-1.5 text-xs font-semibold text-space-950 transition hover:bg-space-cyan/80"
                >
                  <Gamepad2 className="h-3.5 w-3.5" /> Next: {nextScenario.title}
                </Link>
              )}
              <Link
                href="/play"
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-white/10"
              >
                All missions <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}

        {result.completed && (
          <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <ReportCard
              design={design}
              scorecard={scorecard}
              scenario={scenario}
              stars={result.stars}
              missionId={missionId}
              issuedUTC={issuedUTC}
              permalink={permalink}
            />
          </div>
        )}

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-slate-500">Hard requirements</p>
            <ul className="mt-2 space-y-1.5">
              {constraintGoals.map((g) => (
                <li key={g.id} className="flex items-start gap-2 text-sm">
                  {g.met ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-space-emerald" />
                  ) : (
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-space-crimson" />
                  )}
                  <span className={g.met ? "text-slate-300" : "text-slate-400"}>
                    {g.label}
                    <span className="ml-1 font-mono text-xs text-slate-500">{g.detail}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-slate-500">Objectives</p>
            <ul className="mt-2 space-y-1.5">
              {objectiveGoals.map((g) => (
                <li key={g.id} className="flex items-start gap-2 text-sm">
                  {g.met ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-space-emerald" />
                  ) : (
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-space-crimson" />
                  )}
                  <span className={g.met ? "text-slate-300" : "text-slate-400"}>
                    {g.label}
                    <span className="ml-1 font-mono text-xs text-slate-500">{g.detail}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="mt-4 text-xs text-slate-500">
          {basePath}?d=&lt;mission&gt; is your proof-of-design link · star progress lives in this browser.
        </p>
      </CardBody>
    </Card>
  );
}