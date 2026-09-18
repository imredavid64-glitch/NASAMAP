"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Download, Printer, Orbit } from "lucide-react";
import { type MissionDesign } from "@/lib/mission";
import { passportSvg, passportMissionId, passportIssued } from "@/lib/passport";
import { Card, CardBody, CardTitle } from "@/components/ui/card";

export function MissionPassport({ design, flyHref }: { design: MissionDesign; flyHref?: string }) {
  const [issuedUTC, setIssuedUTC] = useState("");
  useEffect(() => setIssuedUTC(passportIssued()), []);
  const missionId = useMemo(() => passportMissionId(design, issuedUTC), [design, issuedUTC]);
  const svg = useMemo(() => passportSvg({ design, missionId, issuedUTC }), [design, missionId, issuedUTC]);

  function download() {
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${missionId}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function print() {
    const w = window.open("", "_blank", "width=680,height=940");
    if (!w) return;
    w.document.write(`<!doctype html><html><head><title>${missionId}</title></head><body style="margin:0">${svg}</body></html>`);
    w.document.close();
    w.focus();
    w.print();
  }

  if (!issuedUTC) {
    return (
      <Card>
        <CardBody>
          <CardTitle>Mission Passport</CardTitle>
          <p className="mt-2 text-xs text-slate-500">Issuing document…</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>Mission Passport</CardTitle>
          <div className="flex flex-wrap gap-2">
            {flyHref && (
              <Link
                href={flyHref}
                className="inline-flex items-center gap-1.5 rounded-lg bg-space-cyan px-3 py-1.5 text-xs font-semibold text-space-950 transition hover:bg-space-cyan/80"
              >
                <Orbit className="h-3.5 w-3.5" /> Fly this trajectory
              </Link>
            )}
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
        <p className="mt-2 text-xs text-slate-500">
          Reissues automatically as you change the mission. Share it, print it, or take it to the judges.
        </p>
        <div
          className="mx-auto mt-5 w-full max-w-[600px] overflow-hidden rounded-xl border border-white/10 bg-white [&>svg]:h-auto [&>svg]:w-full"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </CardBody>
    </Card>
  );
}