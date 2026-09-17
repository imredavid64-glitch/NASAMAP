"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import type { Marker } from "./three/Globe";

interface SpaceCanvasProps {
  bodyId?: string;
  radiusKm?: number;
  markers?: Marker[];
  cameraDistance?: number;
}

const JourneyCanvas = dynamic(
  () => import("@/components/three/JourneyCanvas").then((m) => m.JourneyCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">
        rendering the frontier…
      </div>
    ),
  },
);

export function SpaceCanvas({ ...props }: SpaceCanvasProps) {
  return (
    <Suspense fallback={null}>
      <JourneyCanvas {...props} />
    </Suspense>
  );
}