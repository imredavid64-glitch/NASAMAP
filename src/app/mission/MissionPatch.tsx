"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Printer } from "lucide-react";
import { type MissionDesign } from "@/lib/mission";
import { missionPatchSvg } from "@/lib/patch";
import { passportIssued, passportMissionId } from "@/lib/passport";
import { Card, CardBody, CardTitle } from "@/components/ui/card";

export function MissionPatch({ design }: { design: MissionDesign }) {
  const [issuedUTC, setIssuedUTC] = useState("");
  useEffect(() => setIssuedUTC(passportIssued()), []);
  const missionId = useMemo(() => passportMissionId(design, issuedUTC), [design, issuedUTC]);
  const missionName = useMemo(() => {
    if (design.destination === "mars") return "Mars Surface Mission";
    return "Artemis Lunar Mission";
  }, [design.destination]);
  const svg = useMemo(() => missionPatchSvg({ 
    design, 
    missionId, 
    missionName,
    vehicleName: design.vehicle.name 
  }), [design, missionId, missionName]);

  function download() {
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${missionId}-patch.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function print() {
    const w = window.open("", "_blank", "width=520,height=560");
    if (!w) return;
    w.document.write(
      `<!doctype html><html><head><title>${missionId} patch</title></head><body style="margin:0;display:grid;place-items:center;height:100vh;background:#fff">${svg}</body></html>`,
    );
    w.document.close();
    w.focus();
    w.print();
  }

  if (!issuedUTC) {
    return (
      <Card>
        <CardBody>
          <CardTitle>Mission Patch</CardTitle>
          <p className="mt-2 text-xs text-slate-500">Sewing the insignia…</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>Mission Patch</CardTitle>
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
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Embroidered-style insignia generated from the same design — orbit radii to scale, body sizes not.
        </p>
        <div
          className="mx-auto mt-5 w-full max-w-[360px] overflow-hidden rounded-full border border-white/10 [&>svg]:h-auto [&>svg]:w-full"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </CardBody>
    </Card>
  );
}
