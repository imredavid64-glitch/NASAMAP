"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { useTexture } from "@react-three/drei";
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
  segments = 128,
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

  // Real NASA Blue Marble for Earth (public domain, 2048x1024) + cloud layer.
  const textures = useTexture({
    earth: "/earth-texture.jpg",
    clouds: "/cloud_combined_2048.jpg",
    lights: "/earth-lights.jpg",
    moon: "/moon-texture.jpg",
  });

  const texture = useMemo(() => {
    if (bodyId === "earth") {
      textures.earth.colorSpace = THREE.SRGBColorSpace;
      textures.earth.anisotropy = 8;
      return textures.earth;
    }
    if (bodyId === "moon") {
      textures.moon.colorSpace = THREE.SRGBColorSpace;
      textures.moon.anisotropy = 8;
      return textures.moon;
    }
    const canvas = paintGlobeTexture(bodyId);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }, [bodyId, textures]);

  const markerElements = useMemo(
    () =>
      markers.map((m) => {
        const pos = latLonToPosition(m.latDeg, m.lonDeg, radius);
        return { m, pos };
      }),
    [markers, radius],
  );

  const airless = bodyId === "moon" || bodyId === "mercury";
  const isEarth = bodyId === "earth";

  return (
    <group>
      {/* Main globe */}
      <mesh rotation={spin}>
        <sphereGeometry args={[radius, segments, segments]} />
        <meshStandardMaterial
          map={texture}
          roughness={isEarth ? 0.65 : 0.9}
          metalness={0.0}
          envMapIntensity={isEarth ? 0.3 : 0.05}
           emissive={isEarth ? "#ffcc66" : "#000000"}
           emissiveMap={isEarth ? textures.lights : null}
           emissiveIntensity={isEarth ? 1.2 : 0.0}
        />
      </mesh>

      {/* Atmosphere glow (skips airless bodies) */}
      {atmosphere && !airless && (
        <mesh scale={isEarth ? 1.04 : 1.05} rotation={spin}>
          <sphereGeometry args={[radius, Math.round(segments * 0.75), Math.round(segments * 0.75)]} />
          <meshBasicMaterial
            color={bodyId === "sun" ? "#ffd166" : bodyId === "venus" ? "#e6bb62" : isEarth ? "#6bb8ff" : "#4a90d9"}
            transparent
            opacity={isEarth ? 0.18 : 0.16}
            side={THREE.BackSide}
          />
        </mesh>
      )}

      {/* Cloud shell for earth (real NASA cloud layer, slow independent rotation) */}
      {isEarth && atmosphere && (
        <mesh scale={1.015} rotation={[0, spin[1] * 0.3, 0]}>
          <sphereGeometry args={[radius, segments, segments]} />
          <meshStandardMaterial
            map={textures.clouds}
            alphaMap={textures.clouds}
            transparent
            opacity={0.5}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}

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
