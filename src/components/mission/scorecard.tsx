import { Trophy, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { type MissionDesign } from "@/lib/mission";
import { scoreMission, type ObjectiveStatus, type Scorecard as ScorecardResult } from "@/lib/score";
import { Card, CardBody } from "@/components/ui/card";

const STATUS: Record<ObjectiveStatus, { tone: string; Icon: typeof CheckCircle2; label: string }> = {
  pass: { tone: "text-space-emerald", Icon: CheckCircle2, label: "met" },
  warn: { tone: "text-space-amber", Icon: AlertTriangle, label: "marginal" },
  fail: { tone: "text-space-crimson", Icon: XCircle, label: "failed" },
};

const GRADE_TONE: Record<string, string> = {
  S: "text-space-emerald",
  A: "text-space-cyan",
  B: "text-space-amber",
  C: "text-space-crimson",
  D: "text-space-crimson",
};

export function Scorecard({ design, card: cardProp }: { design: MissionDesign; card?: ScorecardResult }) {
  const card = cardProp ?? scoreMission(design);

  return (
    <Card className="border-space-cyan/25">
      <CardBody>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-slate-500">
              <Trophy className="h-3.5 w-3.5 text-space-cyan" /> Mission rating
            </p>
            <div className="mt-2 flex items-end gap-3">
              <span className={`font-mono text-5xl font-extrabold leading-none ${GRADE_TONE[card.grade]}`}>
                {card.grade}
              </span>
              <span className="pb-1 font-mono text-lg text-slate-300">{card.score}/100</span>
            </div>
            <p className="mt-2 text-xs text-slate-400">{card.verdict}</p>
            {card.capped && card.capReason && (
              <p className="mt-1 text-[11px] text-space-amber">{card.capReason}</p>
            )}
          </div>
          <span className="shrink-0 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-center">
            <span className="block font-mono text-xl text-white">
              {card.met}/{card.total}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-slate-500">objectives</span>
          </span>
        </div>

        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-space-cyan to-space-emerald"
            style={{ width: `${card.score}%` }}
          />
        </div>

        <ul className="mt-5 space-y-3">
          {card.objectives.map((o) => {
            const s = STATUS[o.status];
            return (
              <li key={o.id} className="flex items-start gap-3">
                <s.Icon className={`mt-0.5 h-4 w-4 shrink-0 ${s.tone}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <span className="text-sm font-medium text-white">{o.label}</span>
                    <span className="font-mono text-xs text-slate-400">
                      {o.actual} <span className="text-slate-600">·</span> {o.target}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    w{o.weight} · {s.label} · {o.reference}
                  </p>
                  {card.mode === "beginner" && o.coach && (
                    <p className="mt-1 text-[11px] leading-snug text-space-cyan/80">{o.coach}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </CardBody>
    </Card>
  );
}
