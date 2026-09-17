"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { Suspense } from "react";
import { Globe, type Marker } from "./Globe";

export function JourneyCanvas({
  bodyId = "earth",
  radiusKm = 6371,
  markers = [],
  cameraDistance = 3,
}: {
  bodyId?: string;
  radiusKm?: number;
  markers?: Marker[];
  cameraDistance?: number;
}) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [cameraDistance, 0.6, cameraDistance], fov: 45 }}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.55} />
      <directionalLight position={[8, 4, 6]} intensity={1.6} />
      <Stars radius={70} depth={40} count={3500} factor={3} saturation={0} fade speed={0.6} />
      <Suspense fallback={null}>
        <Globe bodyId={bodyId} radiusKm={radiusKm} markers={markers} />
      </Suspense>
      <OrbitControls enablePan={false} minDistance={1.2} maxDistance={7} />
    </Canvas>
  );
}