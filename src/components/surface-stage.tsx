"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { CanvasErrorBoundary } from "@/components/ui/error-boundary";
import { MobileCanvasFallback } from "@/components/mobile-canvas";

const MarsSurfaceCanvasInner = dynamic(
  () => import("@/components/three/MarsSurfaceCanvas").then((m) => m.MarsSurfaceCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">
        raising the habitat…
      </div>
    ),
  },
);

export function SurfaceStage({ arrayKw, loadKw }: { arrayKw?: number; loadKw?: number }) {
  return (
    <MobileCanvasFallback
      fallback={
        <div className="flex h-full w-full items-center justify-center">
          <div className="text-center text-slate-500">
            <p>Mars Surface Ops — Interactive 3D View</p>
            <p className="text-xs mt-1">View on desktop for full simulation</p>
          </div>
        </div>
      }
    >
      <Suspense fallback={null}>
        <CanvasErrorBoundary canvasName="Mars Surface Ops">
          <MarsSurfaceCanvasInner arrayKw={arrayKw} loadKw={loadKw} />
        </CanvasErrorBoundary>
      </Suspense>
    </MobileCanvasFallback>
  );
}
