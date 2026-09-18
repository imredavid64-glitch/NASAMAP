"use client";

import { useRef, useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { Download } from "lucide-react";
import * as THREE from "three";
import { Globe, type Marker } from "./Globe";
import {
  interpolateApollo11,
  getApollo11Samples,
  getHohmannSamples,
  metToSeconds,
  formatMet,
  MOON_POSITION,
  EARTH_POSITION,
  type InterpolatedState,
} from "@/lib/trajectory";
import { earthMoonTrajectoryCsv, downloadCsv } from "@/lib/export";

type FlyMode = "apollo11" | "hohmann";

interface FlyCanvasProps {
  mode: FlyMode;
  initialSpeed?: number;
}

const TRAIL_POINTS = 400;

function Spacecraft({ state, samples, index }: { state: InterpolatedState; samples: InterpolatedState[]; index: number }) {
  const ref = useRef<THREE.Group>(null);
  const trailRef = useRef<THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>>(null);

  // Update spacecraft position/orientation
  useFrame(() => {
    if (ref.current) {
      ref.current.position.set(state.position.x, state.position.y, state.position.z);
      // Orient along velocity
      const speed = Math.sqrt(state.velocity.x ** 2 + state.velocity.y ** 2 + state.velocity.z ** 2);
      if (speed > 0.001) {
        const dir = new THREE.Vector3(state.velocity.x, state.velocity.y, state.velocity.z).normalize();
        ref.current.lookAt(ref.current.position.clone().add(dir));
      }
    }

    // Update trail
    if (trailRef.current && index > 0) {
      const positions = trailRef.current.geometry.attributes.position.array as Float32Array;
      const start = Math.max(0, index - TRAIL_POINTS);
      for (let i = start; i < index; i++) {
        const s = samples[i];
        const idx = (i - start) * 3;
        positions[idx] = s.position.x;
        positions[idx + 1] = s.position.y;
        positions[idx + 2] = s.position.z;
      }
      trailRef.current.geometry.attributes.position.needsUpdate = true;
      trailRef.current.geometry.setDrawRange(0, index - start);
    }
  });

  return (
    <group ref={ref}>
      {/* Trail */}
      <points ref={trailRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={TRAIL_POINTS} itemSize={3} args={[new Float32Array(TRAIL_POINTS * 3), 3]} />
        </bufferGeometry>
        <pointsMaterial color="#00f0ff" size={0.015} transparent opacity={0.6} sizeAttenuation />
      </points>

      {/* Spacecraft - simple CSM/LM stack */}
      <group>
        {/* Service Module */}
        <mesh>
          <cylinderGeometry args={[0.025, 0.025, 0.12, 12]} />
          <meshStandardMaterial color="#c0c0c0" roughness={0.3} metalness={0.7} />
        </mesh>
        {/* Command Module */}
        <mesh position={[0, 0, -0.07]}>
          <coneGeometry args={[0.035, 0.06, 12]} />
          <meshStandardMaterial color="#e8e8e8" roughness={0.4} metalness={0.6} />
        </mesh>
        {/* LM (when attached) - simple descent stage */}
        {state.met < metToSeconds("100:12:00") && (
          <mesh position={[0, 0, 0.08]}>
            <cylinderGeometry args={[0.04, 0.05, 0.08, 8]} />
            <meshStandardMaterial color="#b8a060" roughness={0.5} metalness={0.3} />
          </mesh>
        )}
        {/* Engine glow */}
        <mesh position={[0, 0, 0.14]}>
          <sphereGeometry args={[0.012, 8, 8]} />
          <meshBasicMaterial color="#ff6600" transparent opacity={0.8} />
        </mesh>
      </group>
    </group>
  );
}

function CameraRig({ state, mode, follow }: { state: InterpolatedState; mode: string; follow: "craft" | "earth" | "moon" | "free" }) {
  const { camera } = useThree();

  useFrame(() => {
    if (follow === "craft") {
      // Smooth follow behind spacecraft
      const target = new THREE.Vector3(state.position.x, state.position.y, state.position.z);
      const offset = new THREE.Vector3(state.velocity.x, state.velocity.y, state.velocity.z)
        .normalize()
        .multiplyScalar(-1.5)
        .add(new THREE.Vector3(0, 0.8, 0));
      const desired = target.clone().add(offset);
      camera.position.lerp(desired, 0.05);
      camera.lookAt(target);
    } else if (follow === "earth") {
      camera.lookAt(EARTH_POSITION.x, EARTH_POSITION.y, EARTH_POSITION.z);
    } else if (follow === "moon") {
      camera.lookAt(MOON_POSITION.x, MOON_POSITION.y, MOON_POSITION.z);
    }
  });

  return null;
}

function HUD({ state, speed, follow, totalSec, onSpeedChange, onFollowChange, onScrub }: {
  state: InterpolatedState;
  speed: number;
  follow: string;
  totalSec: number;
  onSpeedChange: (s: number) => void;
  onFollowChange: (f: string) => void;
  onScrub: (t: number) => void;
}) {
  const distEarth = Math.sqrt(
    state.position.x ** 2 + state.position.y ** 2 + state.position.z ** 2
  );
  const distMoon = Math.sqrt(
    (state.position.x - MOON_POSITION.x) ** 2 +
    (state.position.y - MOON_POSITION.y) ** 2 +
    (state.position.z - MOON_POSITION.z) ** 2
  );

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      <div className="pointer-events-auto p-4 font-mono text-space-cyan" style={{ fontSize: "11px", lineHeight: "1.6" }}>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-black/60 border border-space-cyan/30 rounded p-3">
            <div className="text-xs text-slate-400">MET</div>
            <div className="text-lg font-bold">{formatMet(state.met)}</div>
            <div className="text-xs text-slate-500">{state.utc.toISOString().slice(11, 19)} UTC</div>
          </div>
          <div className="bg-black/60 border border-space-cyan/30 rounded p-3">
            <div className="text-xs text-slate-400">EVENT</div>
            <div className="text-sm font-medium truncate">{state.event}</div>
            <div className="text-xs text-slate-500 capitalize">{state.body}-centered</div>
          </div>
          <div className="bg-black/60 border border-space-cyan/30 rounded p-3">
            <div className="text-xs text-slate-400">RANGE</div>
            <div className="text-sm font-bold">Earth: {distEarth.toFixed(2)} R⊕</div>
            <div className="text-sm font-bold">Moon: {distMoon.toFixed(2)} R⊕</div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <label className="flex items-center gap-2 bg-black/60 border border-white/10 rounded px-2 py-1">
            Speed
            <input
              type="range"
              min="0"
              max="100"
              value={speed}
              onChange={(e) => onSpeedChange(Number(e.target.value))}
              className="w-32 accent-space-cyan"
            />
            <span className="w-10 text-right">{speed}x</span>
          </label>

          <label className="flex items-center gap-2 bg-black/60 border border-white/10 rounded px-2 py-1">
            Camera
            <select
              value={follow}
              onChange={(e) => onFollowChange(e.target.value)}
              className="bg-space-950 border-white/10 text-white text-xs rounded px-1"
            >
              <option value="craft">Follow Craft</option>
              <option value="earth">Track Earth</option>
              <option value="moon">Track Moon</option>
              <option value="free">Free</option>
            </select>
          </label>

          <div className="flex-1"></div>

          <div className="bg-black/60 border border-white/10 rounded px-3 py-1">
            <input
              type="range"
              min="0"
              max={totalSec}
              value={state.met}
              onChange={(e) => onScrub(Number(e.target.value))}
              className="w-64 accent-space-cyan"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function FlyCanvas({ mode = "apollo11", initialSpeed = 10 }: FlyCanvasProps) {
  const samples = useMemo(
    () => (mode === "apollo11" ? getApollo11Samples(500) : getHohmannSamples(500)),
    [mode],
  );
  const totalSec = samples[samples.length - 1].met;
  const [time, setTime] = useState(0);
  const [speed, setSpeed] = useState(initialSpeed);
  const [paused, setPaused] = useState(false);
  const [follow, setFollow] = useState<"craft" | "earth" | "moon" | "free">("craft");
  const [state, setState] = useState(samples[0]);
  const [index, setIndex] = useState(0);
  const timeRef = useRef(0);

  useEffect(() => {
    timeRef.current = time;
  }, [time]);

  const stateAt = useCallback(
    (t: number): InterpolatedState => {
      if (mode === "apollo11") return interpolateApollo11(t);
      const i = Math.min(samples.length - 1, Math.max(0, Math.round((t / totalSec) * (samples.length - 1))));
      return samples[i];
    },
    [mode, samples, totalSec],
  );

  useEffect(() => {
    let raf: number;
    let last = performance.now();
    const loop = (now: number) => {
      if (!paused) {
        const dt = ((now - last) / 1000) * speed;
        const newTime = Math.min(totalSec, timeRef.current + dt);
        timeRef.current = newTime;
        setTime(newTime);
        setState(stateAt(newTime));
        setIndex(Math.min(samples.length - 1, Math.floor((newTime / totalSec) * (samples.length - 1))));
        if (newTime >= totalSec) setPaused(true);
      }
      last = now;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [paused, speed, totalSec, samples.length, stateAt]);

  useEffect(() => {
    timeRef.current = 0;
    setTime(0);
    setState(samples[0]);
    setIndex(0);
    setPaused(false);
  }, [samples]);

  const handleScrub = (t: number) => {
    timeRef.current = t;
    setTime(t);
    setState(stateAt(t));
    setIndex(Math.floor((t / totalSec) * (samples.length - 1)));
  };

  const markers: Marker[] = [
    { id: "kennedy", latDeg: 28.57, lonDeg: -80.65, label: "KSC" },
    { id: "tranquility", latDeg: 0.67, lonDeg: 23.47, label: "Tranquility Base" },
  ];

  return (
    <div className="relative w-full h-full">
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [3, 1, 3], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[8, 4, 6]} intensity={1.8} />
        <Stars radius={80} depth={50} count={4000} factor={3} saturation={0} fade speed={0.4} />
        <Suspense fallback={null}>
          <Globe bodyId="earth" radiusKm={6371} markers={markers.filter((m) => m.id === "kennedy")} atmosphere spin={[0, 0.0005, 0]} />
        </Suspense>
        <Suspense fallback={null}>
          <group position={[MOON_POSITION.x, MOON_POSITION.y, MOON_POSITION.z]}>
            <Globe
              bodyId="moon"
              radiusKm={1737}
              markers={markers.filter((m) => m.id === "tranquility")}
              atmosphere={false}
              spin={[0, 0.0001, 0]}
            />
          </group>
        </Suspense>
        <Spacecraft state={state} samples={samples} index={index} />
        <CameraRig state={state} mode={mode} follow={follow} />
        <OrbitControls enablePan={true} minDistance={0.5} maxDistance={80} />
      </Canvas>

      <HUD
        state={state}
        speed={speed}
        follow={follow}
        totalSec={totalSec}
        onSpeedChange={setSpeed}
        onFollowChange={(v) => setFollow(v as "craft" | "earth" | "moon" | "free")}
        onScrub={handleScrub}
      />

      <div className="pointer-events-auto absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-center gap-3 p-2 bg-black/40 backdrop-blur rounded-xl border border-white/10">
        <button
          onClick={() => setPaused(!paused)}
          className="px-4 py-2 rounded-lg bg-space-cyan/20 border border-space-cyan/40 text-space-cyan text-sm font-medium hover:bg-space-cyan/30"
        >
          {paused ? "▶ Play" : "⏸ Pause"}
        </button>
        <button
          onClick={() => { timeRef.current = 0; setTime(0); setState(samples[0]); setIndex(0); setPaused(false); }}
          className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-slate-300 text-sm font-medium hover:bg-white/20"
        >
          ⟲ Reset
        </button>

        <button
          onClick={() =>
            downloadCsv(
              mode === "apollo11" ? "nasamap-apollo11.csv" : "nasamap-moon-hohmann.csv",
              earthMoonTrajectoryCsv(samples),
            )
          }
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-slate-300 text-sm font-medium hover:bg-white/20"
        >
          <Download className="h-4 w-4" /> CSV
        </button>

        <span className="text-xs text-slate-400 px-2">
          {paused ? "Paused" : `T+${formatMet(time)} / T+${formatMet(totalSec)}`}
        </span>
      </div>
    </div>
  );
}