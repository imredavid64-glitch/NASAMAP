"use client";

import { useMemo } from "react";
import { Download, Printer } from "lucide-react";
import { type MissionDesign } from "@/lib/mission";
import { type Scorecard } from "@/lib/score";
import { type Scenario } from "@/lib/scenarios";
import { reportCardSvg } from "@/lib/report-card";

export function ReportCard({
  design,
  scorecard,
  scenario,
  stars,
  missionId,
  issuedUTC,
  permalink,
}: {
  design: MissionDesign;
  scorecard: Scorecard;
  scenario?: Scenario;
  stars: number;
  missionId: string;
  issuedUTC: string;
  permalink: string;
}) {
  const svg = useMemo(
    () => reportCardSvg({ design, scorecard, scenario, stars, missionId, issuedUTC, permalink }),
    [design, scorecard, scenario, stars, missionId, issuedUTC, permalink],
  );

  function download() {
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${missionId}-report.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function print() {
    const w = window.open("", "_blank", "width=860,height=520");
    if (!w) return;
    w.document.write(
      `<!doctype html><html><head><title>${missionId} · Mission report</title></head><body style="margin:0">${svg}</body></html>`,
    );
    w.document.close();
    w.focus();
    w.print();
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-white">Mission report card</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={download}
            className="inline-flex items-center gap-1.5 rounded-lg border border-space-cyan/40 bg-space-cyan/10 px-3 py-1.5 text-xs font-medium text-space-cyan transition hover:bg-space-cyan/20"
          >
            <Download className="h-3.5 w-3.5" /> Download SVG
          </button>
          <button
            type="button"
            onClick={print}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/10"
          >
            <Printer className="h-3.5 w-3.5" /> Print
          </button>
        </div>
      </div>
      <div
        className="mx-auto w-full overflow-hidden rounded-xl border border-white/10 bg-[#0b1120] [&>svg]:h-auto [&>svg]:w-full"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </div>
  );
}