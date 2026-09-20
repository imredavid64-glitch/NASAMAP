"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { CanvasErrorBoundary } from "@/components/ui/error-boundary";

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

export function FlyStage({ mode = "apollo11" }: { mode?: FlyMode }) {
  return (
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
  );
}
