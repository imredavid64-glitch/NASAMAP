"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { CanvasErrorBoundary } from "@/components/ui/error-boundary";
import { MobileCanvasFallback } from "@/components/mobile-canvas";

const FlyCanvasInner = dynamic(
  () => import("@/components/three/FlyCanvas").then((m) => m.FlyCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">
        computing trajectory…
      </div>
    ),
  },
);

const MarsFlyCanvasInner = dynamic(
  () => import("@/components/three/MarsFlyCanvas").then((m) => m.MarsFlyCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">
        solving Kepler's equation…
      </div>
    ),
  },
);

const OrreryCanvasInner = dynamic(
  () => import("@/components/three/OrreryCanvas").then((m) => m.OrreryCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">
        building the orrery…
      </div>
    ),
  },
);

export type FlyMode = "apollo11" | "hohmann" | "mars" | "orrery";

function FlyCanvasWithFallback({ mode }: { mode: FlyMode }) {
  const fallback = (
    <div className="flex h-full w-full items-center justify-center">
      <div className="text-center text-slate-500 p-4">
        <p className="font-medium">
          {mode === "apollo11" ? "Apollo 11 Replay" : mode === "hohmann" ? "Hohmann Transfer" : mode === "mars" ? "Mars Transfer" : "Solar System Orrery"}
        </p>
        <p className="text-xs mt-1">Interactive 3D — View on desktop for full simulation</p>
      </div>
    </div>
  );

  return (
    <MobileCanvasFallback fallback={fallback}>
      <Suspense fallback={null}>
        {mode === "mars" ? (
          <CanvasErrorBoundary canvasName="Mars Transfer">
            <MarsFlyCanvasInner />
          </CanvasErrorBoundary>
        ) : mode === "orrery" ? (
          <CanvasErrorBoundary canvasName="Solar System Orrery">
            <OrreryCanvasInner />
          </CanvasErrorBoundary>
        ) : (
          <CanvasErrorBoundary canvasName={`${mode === "hohmann" ? "Hohmann Transfer" : "Apollo 11"}`}>
            <FlyCanvasInner mode={mode} />
          </CanvasErrorBoundary>
        )}
      </Suspense>
    </MobileCanvasFallback>
  );
}

export function FlyStage({ mode = "apollo11" }: { mode?: FlyMode }) {
  return <FlyCanvasWithFallback mode={mode} />;
}
