"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

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
    <Suspense fallback={null}>
      <MarsSurfaceCanvasInner arrayKw={arrayKw} loadKw={loadKw} />
    </Suspense>
  );
}
