"use client";

import { useMemo, useState, useEffect, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars, Html } from "@react-three/drei";
import * as THREE from "three";
import { Globe } from "./Globe";
import { Satellite } from "lucide-react";
import { usePrefersReducedMotion } from "@/lib/motion";

const PLANETS = [
  { name: "Mercury", semiMajorAxis: 0.387, period: 87.97, radius: 2439, color: "#b5b5b5", eccentricity: 0.206, inclination: 7.0, texture: "mercury" },
  { name: "Venus", semiMajorAxis: 0.723, period: 224.7, radius: 6052, color: "#e6c87a", eccentricity: 0.007, inclination: 3.4, texture: "venus" },
  { name: "Earth", semiMajorAxis: 1.0, period: 365.25, radius: 6371, color: "#4a90d9", eccentricity: 0.017, inclination: 0.0, texture: "earth", hasMoon: true },
  { name: "Mars", semiMajorAxis: 1.524, period: 687.0, radius: 3389, color: "#e27b58", eccentricity: 0.093, inclination: 1.9, texture: "mars" },
  { name: "Jupiter", semiMajorAxis: 5.204, period: 4331, radius: 69911, color: "#d4a574", eccentricity: 0.049, inclination: 1.3, texture: "jupiter" },
  { name: "Saturn", semiMajorAxis: 9.582, period: 10747, radius: 58232, color: "#f7e2a0", eccentricity: 0.056, inclination: 2.5, texture: "saturn" },
  { name: "Uranus", semiMajorAxis: 19.22, period: 30589, radius: 25362, color: "#7de3f4", eccentricity: 0.046, inclination: 0.8, texture: "uranus" },
  { name: "Neptune", semiMajorAxis: 30.05, period: 59800, radius: 24622, color: "#4b70dd", eccentricity: 0.011, inclination: 1.8, texture: "neptune" },
];

const SUN_RADIUS_KM = 696340;
const SCENE_AU = 30; // scene units per AU

function toScene(au: number): number {
  return au * SCENE_AU;
}

function PlanetOrbit({ semiMajorAxis, eccentricity, inclination, color }: {
  semiMajorAxis: number;
  eccentricity: number;
  inclination: number;
  color: string;
}) {
  const points = useMemo(() => {
    const pts: Array<[number, number, number]> = [];
    for (let i = 0; i <= 180; i++) {
      const nu = (i / 180) * Math.PI * 2;
      const r = semiMajorAxis * (1 - eccentricity * eccentricity) / (1 + eccentricity * Math.cos(nu));
      const x = r * Math.cos(nu);
      const y = r * Math.sin(nu);
      pts.push([toScene(x), 0, toScene(y)]);
    }
    return pts;
  }, [semiMajorAxis, eccentricity]);

  const lineRef = useRef<THREE.Line<THREE.BufferGeometry, THREE.LineDashedMaterial>>(null);

  useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(points.flat());
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const material = new THREE.LineDashedMaterial({
      color: new THREE.Color(color),
      dashSize: toScene(0.05),
      gapSize: toScene(0.025),
      transparent: true,
      opacity: 0.3,
    });

    const line = new THREE.Line(geometry, material);
    line.computeLineDistances();
    lineRef.current = line;
    return line;
  }, [points, color]);

  useFrame(() => {
    if (lineRef.current) {
      lineRef.current.computeLineDistances();
      (lineRef.current.material as THREE.LineDashedMaterial).needsUpdate = true;
    }
  });

  return lineRef.current ? <primitive object={lineRef.current} dispose={null} /> : null;
}

function Planet({
  planet,
  date,
  speed,
  scale,
  onClick,
}: {
  planet: (typeof PLANETS)[0];
  date: Date;
  speed: number;
  scale: number;
  onClick: (name: string) => void;
}) {
  const planetRef = useRef<THREE.Group>(null);
  const { scene } = useThree();
  const reduced = usePrefersReducedMotion();

  // Calculate mean anomaly
  const epoch = new Date("2000-01-01T12:00:00Z");
  const daysSinceEpoch = (date.getTime() - epoch.getTime()) / (1000 * 60 * 60 * 24);
  const meanMotion = 360 / planet.period;
  const meanAnomaly = (meanMotion * daysSinceEpoch) % 360;
  const meanAnomalyRad = meanAnomaly * Math.PI / 180;

  // Solve Kepler's equation
  const e = planet.eccentricity;
  let E = meanAnomalyRad;
  for (let i = 0; i < 10; i++) {
    E = E - (E - e * Math.sin(E) - meanAnomalyRad) / (1 - e * Math.cos(E));
  }
  const nu = 2 * Math.atan2(
    Math.sqrt(1 + e) * Math.sin(E / 2),
    Math.sqrt(1 - e) * Math.cos(E / 2)
  );
  const r = planet.semiMajorAxis * (1 - e * Math.cos(E));

  const x = r * Math.cos(nu);
  const y = r * Math.sin(nu);
  const inclinationRad = planet.inclination * Math.PI / 180;
  const z = r * Math.sin(nu) * Math.sin(inclinationRad);

  useFrame(() => {
    if (planetRef.current) {
      planetRef.current.position.set(toScene(x), toScene(z), toScene(y));
    }
  });

  const displayRadius = Math.max(0.2, Math.min(2.5, (planet.radius / 6371) * scale));

  return (
    <group
      ref={planetRef}
      position={[toScene(x), toScene(z), toScene(y)]}
      onClick={() => onClick(planet.name)}
      onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = "pointer"; }}
      onPointerOut={() => { document.body.style.cursor = "default"; }}
    >
      <mesh>
        <sphereGeometry args={[displayRadius, 32, 32]} />
        <meshStandardMaterial color={planet.color} roughness={0.7} metalness={0.1} />
      </mesh>
      {planet.name === "Earth" && (
        <group position={[toScene(-0.00257), 0, 0]} scale={0.3}>
          <Globe bodyId="moon" radiusKm={1737} atmosphere={false} />
        </group>
      )}
      <Html
        position={[0, displayRadius + 0.3, 0]}
        center
        distanceFactor={20}
        style={{ pointerEvents: "none", whiteSpace: "nowrap", userSelect: "none" }}
      >
        <div className="rounded bg-black/80 px-2 py-0.5 text-[10px] text-white font-mono border border-white/10">
          {planet.name}
        </div>
      </Html>
    </group>
  );
}

import { useRef } from "react";

export function OrreryCanvas({ initialDate, initialSpeed = 1 }:
  { initialDate?: Date; initialSpeed?: number }) {
  const reduced = usePrefersReducedMotion();
  const [date, setDate] = useState(initialDate ?? new Date());
  const [speed, setSpeed] = useState(initialSpeed);
  const [paused, setPaused] = useState(false);
  const [selectedPlanet, setSelectedPlanet] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [showOrbits, setShowOrbits] = useState(true);
  const dateRef = useRef(date);

  useEffect(() => {
    dateRef.current = date;
  }, [date]);

  useEffect(() => {
    if (reduced) setPaused(true);
  }, [reduced]);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      if (!paused) {
        const dt = ((now - last) / 1000) * speed * 86400 * 3600; // days per second * seconds per day
        dateRef.current = new Date(dateRef.current.getTime() + dt);
        setDate(new Date(dateRef.current));
      }
      last = now;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [paused, speed]);

  const today = new Date();
  const todayJD = Math.floor((today.getTime() - new Date("2000-01-01T12:00:00Z").getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="relative w-full h-full" role="application" aria-label="Solar system orrery">
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, 80, 120], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.2; }}
      >
        <ambientLight intensity={0.2} />
        <pointLight position={[0, 0, 0]} intensity={3} color="#fff3cf" decay={0} distance={0} />
        <Stars radius={500} depth={100} count={8000} factor={5} saturation={0} fade speed={reduced ? 0 : 0.2} />

        {/* Sun */}
        <group>
          <mesh>
            <sphereGeometry args={[toScene(0.00465), 48, 48]} />
            <meshBasicMaterial color="#ffd24a" />
          </mesh>
          <mesh>
            <sphereGeometry args={[toScene(0.006), 48, 48]} />
            <meshBasicMaterial color="#ffb300" transparent opacity={0.15} />
          </mesh>
          <pointLight position={[0, 0, 0]} intensity={2} color="#fff3cf" decay={2} distance={toScene(40)} />
        </group>

        {/* Orbits */}
        {showOrbits && PLANETS.map((p) => (
          <PlanetOrbit
            key={p.name}
            semiMajorAxis={p.semiMajorAxis}
            eccentricity={p.eccentricity}
            inclination={p.inclination}
            color={p.color}
          />
        ))}

        {/* Planets */}
        {PLANETS.map((p) => (
          <Planet
            key={p.name}
            planet={p}
            date={date}
            speed={speed}
            scale={scale}
            onClick={setSelectedPlanet}
          />
        ))}

        <OrbitControls
          enablePan
          enableDamping
          minDistance={20}
          maxDistance={1000}
          maxPolarAngle={Math.PI / 2.01}
        />
      </Canvas>

      {/* HUD */}
      <div className="pointer-events-none absolute inset-0 z-10">
        <div className="pointer-events-auto p-4 font-mono text-space-cyan" style={{ fontSize: "11px", lineHeight: "1.6" }}>
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="bg-black/60 border border-space-cyan/30 rounded p-3">
              <div className="text-xs text-slate-400">DATE (UT)</div>
              <div className="text-lg font-bold">{date.toISOString().split("T")[0]}</div>
              <div className="text-xs text-slate-500">{date.toISOString().split("T")[1]?.slice(0, 8)}</div>
            </div>
            <div className="bg-black/60 border border-space-cyan/30 rounded p-3">
              <div className="text-xs text-slate-400">SPEED</div>
              <div className="text-lg font-bold">{speed}x</div>
              <div className="text-xs text-slate-500">days per second</div>
            </div>
            <div className="bg-black/60 border border-space-cyan/30 rounded p-3">
              <div className="text-xs text-slate-400">SCALE</div>
              <div className="text-lg font-bold">{scale.toFixed(1)}x</div>
              <div className="text-xs text-slate-500">planet size multiplier</div>
            </div>
            <div className="bg-black/60 border border-space-cyan/30 rounded p-3">
              <div className="text-xs text-slate-400">SELECTED</div>
              <div className="text-sm font-bold">{selectedPlanet || "—"}</div>
              <div className="text-xs text-slate-500">Click a planet</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <button
              onClick={() => setPaused(!paused)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-space-cyan/40 bg-space-cyan/20 px-3 py-2 text-sm font-medium text-space-cyan hover:bg-space-cyan/30 focus-visible:ring-2 focus-visible:ring-space-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-space-950"
              aria-label={paused ? "Resume" : "Pause"}
            >
              {paused ? "▶" : "⏸"} {paused ? "Play" : "Pause"}
            </button>
            <button
              onClick={() => { dateRef.current = new Date(); setDate(new Date()); setPaused(false); }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-medium text-slate-300 hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-space-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-space-950"
              aria-label="Reset to today"
            >
              ⟲ Today
            </button>
            <button
              onClick={() => { dateRef.current = new Date("2026-09-18"); setDate(new Date("2026-09-18")); setPaused(false); }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-medium text-slate-300 hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-space-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-space-950"
              aria-label="Jump to launch window"
            >
              🚀 Window
            </button>

            <label className="flex items-center gap-2 bg-black/60 border border-white/10 rounded px-2 py-1">
              Speed
              <input
                type="range"
                min="0"
                max="100"
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="w-24 accent-space-cyan focus-visible:ring-2 focus-visible:ring-space-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-space-950"
                aria-label="Simulation speed"
              />
              <span className="w-10 text-right">{speed}x</span>
            </label>

            <label className="flex items-center gap-2 bg-black/60 border border-white/10 rounded px-2 py-1">
              Planet scale
              <input
                type="range"
                min="0.5"
                max="5"
                step="0.1"
                value={scale}
                onChange={(e) => setScale(Number(e.target.value))}
                className="w-24 accent-space-cyan focus-visible:ring-2 focus-visible:ring-space-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-space-950"
                aria-label="Planet size scale"
              />
              <span className="w-10 text-right">{scale.toFixed(1)}x</span>
            </label>

            <label className="inline-flex items-center gap-2 bg-black/60 border border-white/10 rounded px-2 py-1">
              <input
                type="checkbox"
                checked={showOrbits}
                onChange={(e) => setShowOrbits(e.target.checked)}
                className="accent-space-cyan focus-visible:ring-2 focus-visible:ring-space-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-space-950"
                aria-label="Show orbits"
              />
              Orbits
            </label>
          </div>
        </div>

        {selectedPlanet && (
          <div className="pointer-events-auto absolute bottom-4 left-4 right-4 max-w-sm mx-auto">
            <div className="rounded-xl border border-space-cyan/30 bg-black/80 p-3 backdrop-blur">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-white">{selectedPlanet}</span>
                <button
                  onClick={() => setSelectedPlanet(null)}
                  className="text-slate-400 hover:text-white"
                  aria-label="Close planet info"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs text-slate-300">
                {PLANETS.find(p => p.name === selectedPlanet)?.period.toFixed(1)} day orbital period · {PLANETS.find(p => p.name === selectedPlanet)?.semiMajorAxis} AU semi-major axis
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}