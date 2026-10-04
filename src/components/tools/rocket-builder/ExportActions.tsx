"use client";

import { Download, Copy, ExternalLink, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { RocketDesign } from "@/lib/rocket-builder";

interface ExportActionsProps {
  design: RocketDesign;
  performance: ReturnType<typeof import("@/lib/rocket-builder").calculateRocketPerformance> | null;
  canUseInMissionLab: boolean;
  onExportJson: () => void;
  onCopyMissionLink: () => void;
  onUseInMissionLab: () => void;
  copied: boolean;
}

export function ExportActions({ design, performance, canUseInMissionLab, onExportJson, onCopyMissionLink, onUseInMissionLab, copied }: ExportActionsProps) {
  const payloadLEO = performance?.payloadLEOKg ?? 0;
  const payloadTLI = performance?.payloadTLIKg ?? 0;

  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-white flex items-center gap-2">
        <Download className="h-4 w-4 text-space-cyan" />
        Export & Share
      </h4>

      <div className="flex flex-wrap gap-2">
        <Button onClick={onExportJson} variant="outline" size="sm">
          <Download className="h-3.5 w-3.5" />
          Export JSON
        </Button>

        <Button onClick={onCopyMissionLink} variant="outline" size="sm" disabled={!performance}>
          <Copy className="h-3.5 w-3.5" />
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : "Copy Mission Lab Link"}
        </Button>

        <Button
          onClick={onUseInMissionLab}
          variant="default"
          size="sm"
          disabled={!canUseInMissionLab}
          className={canUseInMissionLab ? "bg-space-emerald/20 border-space-emerald/40 text-space-emerald hover:bg-space-emerald/30" : ""}
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Use in Mission Lab
        </Button>
      </div>

      {!canUseInMissionLab && performance && (
        <p className="text-xs text-slate-500 flex items-center gap-1.5">
          <span className="text-amber-400">⚠</span>
          <span>{`Needs TWR > 1.2 and Δv > 9 km/s for payload estimates. Current: TWR ${performance.stages[0]?.twrSeaLevel.toFixed(2) ?? "—"}, Δv ${performance.stages.reduce((s, st) => s + st.deltaVVacKmS, 0).toFixed(2)} km/s`}</span>
        </p>
      )}

      {performance && (
        <div className="rounded-lg border border-white/10 bg-white/5 p-3 space-y-2">
          <p className="text-xs text-slate-400">Mission Lab Integration Preview</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Vehicle ID</span>
              <code className="font-mono text-white bg-space-950 px-2 py-0.5 rounded">{`custom-${design.id}`}</code>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">LEO Payload</span>
              <span className="font-mono text-white">{payloadLEO > 0 ? `${(payloadLEO / 1000).toFixed(1)} t` : "—"}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">TLI Payload</span>
              <span className="font-mono text-white">{payloadTLI > 0 ? `${(payloadTLI / 1000).toFixed(1)} t` : "—"}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Stages</span>
              <span className="font-mono text-white">{design.stages.length}</span>
            </div>
          </div>
        </div>
      )}

      <div className="pt-2 border-t border-white/10">
        <p className="text-xs text-slate-500">
          The Mission Lab link encodes this rocket as a custom vehicle. On the Mission page,
          select it from the vehicle dropdown (listed at the bottom) to design a mission with your rocket.
        </p>
      </div>
    </div>
  );
}