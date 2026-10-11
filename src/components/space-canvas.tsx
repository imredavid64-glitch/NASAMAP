"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import type { Marker } from "./three/Globe";
import { MobileCanvasFallback } from "@/components/mobile-canvas";

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
    <MobileCanvasFallback
      fallback={
        <div className="flex h-full w-full items-center justify-center">
          <div className="text-center text-slate-500">
            <p>Interactive Globe — View on desktop for 3D rotation</p>
          </div>
        </div>
      }
    >
      <Suspense fallback={null}>
        <JourneyCanvas {...props} />
      </Suspense>
    </MobileCanvasFallback>
  );
}