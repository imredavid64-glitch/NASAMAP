"use client";

import { useRef, useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars, Html, Line } from "@react-three/drei";
import { Download } from "lucide-react";
import * as THREE from "three";
import { Globe } from "./Globe";
import {
  marsAtTime,
  getMarsTransferSamples,
  marsTransferSeconds,
  marsTransferDiagram,
  formatMet,
  type MarsTransferState,
} from "@/lib/trajectory";
import { marsTrajectoryCsv, downloadCsv } from "@/lib/export";

/** Scene units per astronomical unit (Earth orbit = 12 units). */
const SCENE_AU = 12;
const TRAIL_POINTS = 500;

function toScene(au: { x: number; y: number }): [number, number, number] {
  return [au.x * SCENE_AU, 0, au.y * SCENE_AU];
}

const GEO = marsTransferDiagram(1);

function Craft({ state, samples, index }: { state: MarsTransferState; samples: MarsTransferState[]; index: number }) {
  const ref = useRef<THREE.Group>(null);
  const trailRef = useRef<THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>>(null);
  const p = toScene(state.craftAu);

  useFrame(() => {
    if (ref.current) {
      ref.current.position.set(p[0], p[1], p[2]);
      const v = new THREE.Vector3(state.velocityAuPerDay.x, 0, state.velocityAuPerDay.y);
      if (v.lengthSq() > 0) ref.current.lookAt(ref.current.position.clone().add(v.normalize()));
    }
    if (trailRef.current && index > 0) {
      const positions = trailRef.current.geometry.attributes.position.array as Float32Array;
      const start = Math.max(0, index - TRAIL_POINTS);
      for (let i = start; i < index; i++) {
        const s = toScene(samples[i].craftAu);
        const idx = (i - start) * 3;
        positions[idx] = s[0];
        positions[idx + 1] = s[1];
        positions[idx + 2] = s[2];
      }
      trailRef.current.geometry.attributes.position.needsUpdate = true;
      trailRef.current.geometry.setDrawRange(0, index - start);
    }
  });

  return (
    <group>
      <points ref={trailRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={TRAIL_POINTS} itemSize={3} array={new Float32Array(TRAIL_POINTS * 3)} />
        </bufferGeometry>
        <pointsMaterial color="#00f0ff" size={0.22} transparent opacity={0.85} sizeAttenuation />
      </points>
      <group ref={ref}>
        <mesh>
          <cylinderGeometry args={[0.09, 0.09, 0.4, 12]} />
          <meshStandardMaterial color="#d8dde6" roughness={0.3} metalness={0.7} />
        </mesh>
        <mesh position={[0, 0.26, 0]}>
          <coneGeometry args={[0.13, 0.24, 12]} />
          <meshStandardMaterial color="#f3f6ff" roughness={0.4} metalness={0.5} />
        </mesh>
        <mesh position={[0, -0.26, 0]}>
          <sphereGeometry args={[0.07, 8, 8]} />
          <meshBasicMaterial color="#ff7a1a" transparent opacity={0.85} />
        </mesh>
      </group>
    </group>
  );
}

function CameraRig({ state, follow }: { state: MarsTransferState; follow: "craft" | "earth" | "mars" | "sun" | "free" }) {
  const { camera } = useThree();
  useFrame(() => {
    if (follow === "craft") {
      const target = new THREE.Vector3(...toScene(state.craftAu));
      const offset = new THREE.Vector3(state.velocityAuPerDay.x, 0, state.velocityAuPerDay.y)
        .normalize()
        .multiplyScalar(-3.2)
        .add(new THREE.Vector3(0, 3, 0));
      camera.position.lerp(target.clone().add(offset), 0.06);
      camera.lookAt(target);
    } else if (follow === "earth") {
      camera.lookAt(...toScene(state.earthAu));
    } else if (follow === "mars") {
      camera.lookAt(...toScene(state.marsAu));
    } else if (follow === "sun") {
      camera.lookAt(0, 0, 0);
    }
  });
  return null;
}

function HUD({
  state,
  speed,
  follow,
  totalSec,
  onSpeedChange,
  onFollowChange,
  onScrub,
}: {
  state: MarsTransferState;
  speed: number;
  follow: string;
  totalSec: number;
  onSpeedChange: (s: number) => void;
  onFollowChange: (f: string) => void;
  onScrub: (t: number) => void;
}) {
  const days = state.met / 86_400;
  const distEarth = Math.hypot(state.craftAu.x - state.earthAu.x, state.craftAu.y - state.earthAu.y);
  const distMars = Math.hypot(state.craftAu.x - state.marsAu.x, state.craftAu.y - state.marsAu.y);

  return (
    <Html
      className="pointer-events-none"
      style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 10 }}
    >
      <div className="pointer-events-auto p-4 font-mono text-space-cyan" style={{ fontSize: "11px", lineHeight: "1.6" }}>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-black/60 border border-space-cyan/30 rounded p-3">
            <div className="text-xs text-slate-400">T+ ELAPSED</div>
            <div className="text-lg font-bold">{days.toFixed(1)} days</div>
            <div className="text-xs text-slate-500">{formatMet(state.met)}</div>
          </div>
          <div className="bg-black/60 border border-space-cyan/30 rounded p-3">
            <div className="text-xs text-slate-400">EVENT</div>
            <div className="text-sm font-medium truncate">{state.event}</div>
            <div className="text-xs text-slate-500">heliocentric</div>
          </div>
          <div className="bg-black/60 border border-space-cyan/30 rounded p-3">
            <div className="text-xs text-slate-400">RANGE</div>
            <div className="text-sm font-bold">Sun: {state.auFromSun.toFixed(3)} au</div>
            <div className="text-xs text-slate-400">
              Earth {distEarth.toFixed(2)} · Mars {distMars.toFixed(2)} au
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <label className="flex items-center gap-2 bg-black/60 border border-white/10 rounded px-2 py-1">
            Speed
            <input type="range" min="0" max="100" value={speed} onChange={(e) => onSpeedChange(Number(e.target.value))} className="w-32 accent-space-cyan" />
            <span className="w-10 text-right">{speed}x</span>
          </label>
          <label className="flex items-center gap-2 bg-black/60 border border-white/10 rounded px-2 py-1">
            Camera
            <select value={follow} onChange={(e) => onFollowChange(e.target.value)} className="bg-space-950 border-white/10 text-white text-xs rounded px-1">
              <option value="craft">Follow Craft</option>
              <option value="earth">Track Earth</option>
              <option value="mars">Track Mars</option>
              <option value="sun">Track Sun</option>
              <option value="free">Free</option>
            </select>
          </label>
          <div className="flex-1"></div>
          <div className="bg-black/60 border border-white/10 rounded px-3 py-1">
            <input type="range" min="0" max={totalSec} value={state.met} onChange={(e) => onScrub(Number(e.target.value))} className="w-56 accent-space-cyan" />
          </div>
        </div>
      </div>
    </Html>
  );
}

export function MarsFlyCanvas({ initialSpeed = 10 }: { initialSpeed?: number }) {
  const totalSec = useMemo(() => marsTransferSeconds(), []);
  const samples = useMemo(() => getMarsTransferSamples(500), []);
  const [time, setTime] = useState(0);
  const [speed, setSpeed] = useState(initialSpeed);
  const [paused, setPaused] = useState(false);
  const [follow, setFollow] = useState<"craft" | "earth" | "mars" | "sun" | "free">("craft");
  const [state, setState] = useState<MarsTransferState>(() => marsAtTime(0));
  const [index, setIndex] = useState(0);
  const timeRef = useRef(0);

  useEffect(() => {
    timeRef.current = time;
  }, [time]);

  const stateAt = useCallback(
    (t: number) => {
      const i = Math.min(samples.length - 1, Math.max(0, Math.round((t / totalSec) * (samples.length - 1))));
      return samples[i];
    },
    [samples, totalSec],
  );

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      if (!paused) {
        const dt = ((now - last) / 1000) * speed;
        const next = Math.min(totalSec, timeRef.current + dt);
        timeRef.current = next;
        setTime(next);
        setState(stateAt(next));
        setIndex(Math.min(samples.length - 1, Math.floor((next / totalSec) * (samples.length - 1))));
        if (next >= totalSec) setPaused(true);
      }
      last = now;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [paused, speed, totalSec, samples.length, stateAt]);

  const handleScrub = (t: number) => {
    timeRef.current = t;
    setTime(t);
    setState(stateAt(t));
    setIndex(Math.floor((t / totalSec) * (samples.length - 1)));
  };

  const pathPoints = useMemo(
    () => getMarsTransferSamples(160).map((s) => toScene(s.craftAu)),
    [],
  );

  return (
    <div className="relative w-full h-full">
      <Canvas dpr={[1, 1.75]} camera={{ position: [0, 22, 30], fov: 45 }} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.35} />
        <pointLight position={[0, 0, 0]} intensity={2.4} color="#fff3cf" />
        <Stars radius={300} depth={60} count={4000} factor={4} saturation={0} fade speed={0.3} />

        {/* Sun */}
        <mesh>
          <sphereGeometry args={[2.1, 32, 32]} />
          <meshBasicMaterial color="#ffd24a" />
        </mesh>
        <mesh>
          <sphereGeometry args={[2.7, 32, 32]} />
          <meshBasicMaterial color="#ffb300" transparent opacity={0.16} />
        </mesh>

        {/* Orbit rings */}
        {[1, GEO.marsOrbitAu].map((au) => (
          <mesh key={au} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[au * SCENE_AU - 0.05, au * SCENE_AU + 0.05, 180]} />
            <meshBasicMaterial color={au === 1 ? "#4f8ef7" : "#e2683f"} transparent opacity={0.4} side={THREE.DoubleSide} />
          </mesh>
        ))}

        {/* Transfer path */}
        <Line points={pathPoints} color="#f5d67b" lineWidth={1} dashed dashSize={0.5} gapSize={0.35} transparent opacity={0.55} />

        <Suspense fallback={null}>
          <group position={toScene({ x: 1, y: 0 })} scale={0.42}>
            <Globe bodyId="earth" radiusKm={6371} atmosphere spin={[0, 0.0006, 0]} />
          </group>
        </Suspense>
        <Suspense fallback={null}>
          <group position={toScene(state.marsAu)} scale={0.36}>
            <Globe bodyId="mars" radiusKm={3389} atmosphere={false} spin={[0, 0.0003, 0]} />
          </group>
        </Suspense>

        <Craft state={state} samples={samples} index={index} />
        <CameraRig state={state} follow={follow} />
        <OrbitControls enablePan minDistance={3} maxDistance={140} />
      </Canvas>

      <HUD
        state={state}
        speed={speed}
        follow={follow}
        totalSec={totalSec}
        onSpeedChange={setSpeed}
        onFollowChange={(v) => setFollow(v as "craft" | "earth" | "mars" | "sun" | "free")}
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
          onClick={() => downloadCsv("nasamap-mars-transfer.csv", marsTrajectoryCsv(samples))}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-slate-300 text-sm font-medium hover:bg-white/20"
        >
          <Download className="h-4 w-4" /> CSV
        </button>
        <span className="text-xs text-slate-400 px-2">
          {paused ? "Paused" : `T+${(time / 86_400).toFixed(1)} / ${(totalSec / 86_400).toFixed(0)} days`}
        </span>
      </div>
    </div>
  );
}
