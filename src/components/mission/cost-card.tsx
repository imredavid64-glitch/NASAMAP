import { estimateMissionCost, formatUsd, costClass } from "@/lib/cost";
import { type MissionDesign } from "@/lib/mission";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const CLASS_LABEL: Record<ReturnType<typeof costClass>, string> = {
  flagship: "Flagship program",
  commercial: "Commercial-class",
  research: "Research-class",
};

const CONF_TONE: Record<string, "amber" | "emerald"> = {
  estimate: "amber",
  documented: "emerald",
};

export function CostCard({ design }: { design: MissionDesign }) {
  const cost = estimateMissionCost(design);
  const cls = costClass(cost.totalUsd);

  return (
    <Card className="scroll-mt-20">
      <CardBody>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">Mission budget</CardTitle>
          <Badge tone="cyan">{CLASS_LABEL[cls]}</Badge>
        </div>
        <p className="mt-3 text-3xl font-bold text-space-cyan">{formatUsd(cost.totalUsd)}</p>
        <ul className="mt-4 space-y-2">
          {cost.lines.map((line) => (
            <li key={line.label} className="flex items-start justify-between gap-3 text-sm">
              <span className="text-slate-400">
                {line.label}
                <span className="block font-mono text-[11px] text-slate-600">{line.note}</span>
              </span>
              <span className="flex shrink-0 items-center gap-2 font-mono">
                <Badge tone={CONF_TONE[line.confidence]}>{line.confidence}</Badge>
                {formatUsd(line.valueUsd)}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-slate-500">
          Modeled on published per-launch prices where available; other line items are transparent estimates
          tagged as such. No hidden assumptions — line-by-line above.
        </p>
      </CardBody>
    </Card>
  );
}