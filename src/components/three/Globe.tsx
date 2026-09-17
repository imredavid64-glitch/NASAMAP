"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { paintGlobeTexture } from "./texture";

export interface Marker {
  id: string;
  latDeg: number;
  lonDeg: number;
  label: string;
}

/** Radius of body in "scene units" — planets normalized so Earth is 1. */
export function bodyScale(radiusKm: number): number {
  return THREE.MathUtils.clamp(radiusKm / 6371, 0.25, 1.6);
}

function latLonToPosition(latDeg: number, lonDeg: number, radius: number): THREE.Vector3 {
  const lat = THREE.MathUtils.degToRad(latDeg);
  const lon = THREE.MathUtils.degToRad(lonDeg);
  return new THREE.Vector3(
    radius * Math.cos(lat) * Math.cos(lon),
    radius * Math.sin(lat),
    -radius * Math.cos(lat) * Math.sin(lon),
  );
}

export function Globe({
  bodyId = "earth",
  radiusKm = 6371,
  segments = 96,
  markers = [],
  atmosphere = true,
  spin = [0, 0.0015, 0],
}: {
  bodyId?: string;
  radiusKm?: number;
  segments?: number;
  markers?: Marker[];
  atmosphere?: boolean;
  spin?: [number, number, number];
}) {
  const scale = bodyScale(radiusKm);
  const radius = scale;

  const texture = useMemo(() => {
    const canvas = paintGlobeTexture(bodyId);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }, [bodyId]);

  const markerElements = useMemo(
    () =>
      markers.map((m) => {
        const pos = latLonToPosition(m.latDeg, m.lonDeg, radius);
        return { m, pos };
      }),
    [markers, radius],
  );

  return (
    <group rotation={[THREE.MathUtils.degToRad(0), 0, 0]}>
      <mesh rotation={spin}>
        <sphereGeometry args={[radius, segments, segments]} />
        <meshStandardMaterial map={texture} roughness={0.9} metalness={0.05} />
      </mesh>
      {atmosphere ? (
        <mesh scale={1.015}>
          <sphereGeometry args={[radius, 48, 48]} />
          <meshBasicMaterial color="#58c8ff" transparent opacity={0.12} side={THREE.BackSide} />
        </mesh>
      ) : null}
      {markerElements.map(({ m, pos }) => (
        <group key={m.id} position={pos}>
          <mesh>
            <sphereGeometry args={[0.035, 12, 12]} />
            <meshBasicMaterial color="#00f0ff" />
          </mesh>
        </group>
      ))}
    </group>
  );
}