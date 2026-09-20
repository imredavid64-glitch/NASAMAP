"use client";

import { useMemo } from "react";
import { Download, Printer, Share2, Twitter, Linkedin, Copy, Check } from "lucide-react";
import { useState } from "react";
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

  const [copied, setCopied] = useState(false);

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

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(permalink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = permalink;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function shareTwitter() {
    const text = `Just designed a ${design.destination.toUpperCase()} mission on NASAMAP — Grade: ${scorecard.grade} (${scorecard.score}/100) 🚀`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(permalink)}`;
    window.open(url, "_blank", "width=550,height=420");
  }

  function shareLinkedIn() {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(permalink)}`;
    window.open(url, "_blank", "width=550,height=420");
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-white">Mission report card</p>
        <div className="flex flex-wrap gap-2">
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
          <button
            type="button"
            onClick={copyLink}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/10"
            title="Copy mission link"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-space-emerald" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied!" : "Copy Link"}
          </button>
          <button
            type="button"
            onClick={shareTwitter}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/10"
            title="Share on X"
          >
            <Twitter className="h-3.5 w-3.5" /> X
          </button>
          <button
            type="button"
            onClick={shareLinkedIn}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/10"
            title="Share on LinkedIn"
          >
            <Linkedin className="h-3.5 w-3.5" /> in
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