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

export function FlyStage({ mode = "apollo11" as const }: { mode?: "apollo11" | "hohmann" }) {
  return (
    <Suspense fallback={null}>
      <FlyCanvasInner mode={mode} />
    </Suspense>
  );
}