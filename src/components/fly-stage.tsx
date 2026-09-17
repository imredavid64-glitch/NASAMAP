"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

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

export type FlyMode = "apollo11" | "hohmann" | "mars";

export function FlyStage({ mode = "apollo11" }: { mode?: FlyMode }) {
  return (
    <Suspense fallback={null}>
      {mode === "mars" ? <MarsFlyCanvasInner /> : <FlyCanvasInner mode={mode} />}
    </Suspense>
  );
}
