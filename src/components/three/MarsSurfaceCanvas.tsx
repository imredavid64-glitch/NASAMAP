"use client";

import { useRef, useState, useEffect, useMemo, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars, Html } from "@react-three/drei";
import * as THREE from "three";
import { Play, Pause, RotateCcw } from "lucide-react";
import {
  MARS_SOL_HOURS,
  solarElevationDeg,
  solarAzimuthDeg,
  marsDeclinationDeg,
  generationKw,
  surfaceSolProfile,
  summariseSol,
  arrayKwForLoad,
  formatSolClock,
} from "@/lib/surface";
import { opsBudget } from "@/lib/life";

const DEG = Math.PI / 180;
const LATITUDE_DEG = 18; // Jezero-class landing latitude

/* --- deterministic terrain -------------------------------------------------- */

function hash2(x: number, z: number): number {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function valueNoise(x: number, z: number): number {
  const xi = Math.floor(x);
  const zi = Math.floor(z);
  const xf = x - xi;
  const zf = z - zi;
  const u = xf * xf * (3 - 2 * xf);
  const v = zf * zf * (3 - 2 * zf);
  const a = hash2(xi, zi);
  const b = hash2(xi + 1, zi);
  const c = hash2(xi, zi + 1);
  const d = hash2(xi + 1, zi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

function terrainHeight(x: number, z: number): number {
  let h = 0;
  let amp = 1;
  let freq = 0.06;
  for (let o = 0; o < 5; o += 1) {
    h += amp * (valueNoise(x * freq, z * freq) - 0.5);
    amp *= 0.5;
    freq *= 2.1;
  }
  return h * 6 - 0.4;
}

function buildTerrain(): THREE.BufferGeometry {
  const size = 90;
  const seg = 150;
  const geo = new THREE.PlaneGeometry(size, size, seg, seg);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const low = new THREE.Color("#6e2f1a");
  const mid = new THREE.Color("#a9492a");
  const high = new THREE.Color("#c97a4e");
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const y = terrainHeight(x, z);
    pos.setY(i, y);
    const t = THREE.MathUtils.clamp((y + 3) / 6, 0, 1);
    const c = t < 0.5 ? low.clone().lerp(mid, t * 2) : mid.clone().lerp(high, (t - 0.5) * 2);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}

function sunDirection(elevationDeg: number, azimuthDeg: number): THREE.Vector3 {
  const e = elevationDeg * DEG;
  const a = azimuthDeg * DEG;
  return new THREE.Vector3(Math.cos(e) * Math.sin(a), Math.sin(e), -Math.cos(e) * Math.cos(a)).normalize();
}

/* --- scene ------------------------------------------------------------------ */

function Habitat() {
  return (
    <group position={[0, 0, 0]}>
      <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 1.6, 0]} castShadow>
        <cylinderGeometry args={[1.6, 1.6, 7, 24]} />
        <meshStandardMaterial color="#d8d2c6" roughness={0.7} metalness={0.2} />
      </mesh>
      <mesh position={[3.5, 1.6, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <sphereGeometry args={[1.6, 24, 16, 0, Math.PI]} />
        <meshStandardMaterial color="#bfd4e6" roughness={0.3} metalness={0.4} transparent opacity={0.85} />
      </mesh>
      {[-2.6, 2.6].map((x) => (
        <mesh key={x} position={[x, 0.5, 0]}>
          <boxGeometry args={[0.5, 1, 0.5]} />
          <meshStandardMaterial color="#8a8378" roughness={0.8} />
        </mesh>
      ))}
      <mesh position={[0, 0.25, 3.2]}>
        <boxGeometry args={[1.4, 0.5, 1.4]} />
        <meshStandardMaterial color="#6b6f76" roughness={0.9} />
      </mesh>
    </group>
  );
}

function SolarArray({ elevationDeg, azimuthDeg, generating }: { elevationDeg: number; azimuthDeg: number; generating: number }) {
  const yawRef = useRef<THREE.Group>(null);
  const tiltRef = useRef<THREE.Group>(null);
  useFrame(() => {
    if (yawRef.current) yawRef.current.rotation.y = -azimuthDeg * DEG;
    if (tiltRef.current) tiltRef.current.rotation.x = -Math.max(0, 90 - elevationDeg) * DEG;
  });
  const glow = Math.min(1, generating / 8);
  return (
    <group ref={yawRef} position={[11, 0, -6]}>
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.14, 0.14, 3, 8]} />
        <meshStandardMaterial color="#cfd6df" metalness={0.6} roughness={0.4} />
      </mesh>
      <group ref={tiltRef} position={[0, 3, 0]}>
        {[-1.35, 1.35].map((x) => (
          <mesh key={x} position={[x, 0, 0]}>
            <boxGeometry args={[2.5, 0.08, 1.8]} />
            <meshStandardMaterial
              color="#16233f"
              metalness={0.6}
              roughness={0.25}
              emissive="#1e6fff"
              emissiveIntensity={0.15 + glow * 0.75}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function Dust() {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(700 * 3);
    for (let i = 0; i < 700; i += 1) {
      arr[i * 3] = (Math.random() - 0.5) * 70;
      arr[i * 3 + 1] = Math.random() * 12;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 70;
    }
    return arr;
  }, []);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.01;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={700} itemSize={3} args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#e0a878" size={0.07} transparent opacity={0.35} sizeAttenuation />
    </points>
  );
}

function Scene({
  hour,
  arrayKw,
  loadKw,
  declinationDeg,
  batteryPct,
}: {
  hour: number;
  arrayKw: number;
  loadKw: number;
  declinationDeg: number;
  batteryPct: number;
}) {
  const { scene } = useThree();
  const sunRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.DirectionalLight>(null);
  const terrain = useMemo(() => buildTerrain(), []);
  const elevationDeg = solarElevationDeg(hour, LATITUDE_DEG, declinationDeg);
  const azimuthDeg = solarAzimuthDeg(hour, LATITUDE_DEG, declinationDeg);
  const dir = sunDirection(elevationDeg, azimuthDeg);
  const gen = generationKw(elevationDeg, arrayKw);

  const dayColor = useMemo(() => new THREE.Color("#c56a3f"), []);
  const nightColor = useMemo(() => new THREE.Color("#120806"), []);
  const duskColor = useMemo(() => new THREE.Color("#7a3a24"), []);

  useFrame(() => {
    const target = new THREE.Color();
    const e = elevationDeg;
    if (e > 12) target.copy(dayColor);
    else if (e > -4) target.copy(duskColor);
    else target.copy(nightColor);
    if (!(scene.background instanceof THREE.Color)) scene.background = new THREE.Color();
    (scene.background as THREE.Color).lerp(target, 0.05);
    scene.fog = scene.fog ?? new THREE.Fog("#c56a3f", 40, 130);
    if (scene.fog instanceof THREE.Fog) (scene.fog.color as THREE.Color).lerp(target, 0.05);

    if (sunRef.current) sunRef.current.position.copy(dir.clone().multiplyScalar(70));
    if (lightRef.current) {
      lightRef.current.position.copy(dir.clone().multiplyScalar(60));
      lightRef.current.intensity = Math.max(0, Math.sin(Math.max(0, elevationDeg) * DEG)) * 2.2;
    }
  });

  return (
    <>
      <ambientLight intensity={0.25} color="#b06a4a" />
      <directionalLight ref={lightRef} intensity={2} color="#ffd9b0" />
      <Stars radius={220} depth={40} count={2500} factor={4} saturation={0} fade speed={0.2} />

      <group ref={sunRef}>
        <mesh>
          <sphereGeometry args={[2.4, 20, 20]} />
          <meshBasicMaterial color="#ffd27a" />
        </mesh>
        <mesh>
          <sphereGeometry args={[3.4, 20, 20]} />
          <meshBasicMaterial color="#ffb347" transparent opacity={0.2} />
        </mesh>
      </group>

      <mesh geometry={terrain} receiveShadow>
        <meshStandardMaterial vertexColors roughness={0.95} metalness={0} />
      </mesh>

      <Habitat />
      <SolarArray elevationDeg={elevationDeg} azimuthDeg={azimuthDeg} generating={gen} />
      <Dust />
      <OrbitControls target={[2, 1.5, 0]} minDistance={6} maxDistance={90} maxPolarAngle={Math.PI / 2.05} enablePan />

      <Html
        position={[0, 9, 0]}
        center
        distanceFactor={40}
        style={{ pointerEvents: "none", whiteSpace: "nowrap" }}
      >
        <div className="rounded-lg border border-space-cyan/30 bg-black/70 px-3 py-1.5 font-mono text-[11px] text-space-cyan">
          {formatSolClock(hour)} · sol {((hour / MARS_SOL_HOURS) * 100).toFixed(0)}% · sun {elevationDeg.toFixed(0)}°
        </div>
      </Html>

      <Html position={[11, 4.6, -6]} center distanceFactor={40} style={{ pointerEvents: "none", whiteSpace: "nowrap" }}>
        <div
          className={`rounded-lg border px-3 py-1.5 font-mono text-[11px] ${
            gen >= loadKw
              ? "border-space-emerald/40 bg-black/70 text-space-emerald"
              : "border-space-amber/40 bg-black/70 text-space-amber"
          }`}
        >
          {gen.toFixed(1)} kW / {loadKw.toFixed(1)} kW · batt {batteryPct.toFixed(0)}%
        </div>
      </Html>
    </>
  );
}

export function MarsSurfaceCanvas({
  arrayKw: arrayKwProp,
  loadKw: loadKwProp,
}: {
  arrayKw?: number;
  loadKw?: number;
}) {
  const ops = useMemo(() => opsBudget({ destination: "mars", crew: 4, days: 90 }), []);
  const loadKw = loadKwProp ?? ops.powerKw;
  const arrayKw = arrayKwProp ?? arrayKwForLoad(loadKw, LATITUDE_DEG);
  const batteryKwh = loadKw * 18;

  const profile = useMemo(
    () => surfaceSolProfile({ arrayKw, loadKw, batteryKwh, latitudeDeg: LATITUDE_DEG, declinationDeg: 0, steps: 144 }),
    [arrayKw, loadKw, batteryKwh],
  );
  const summary = useMemo(() => summariseSol(profile), [profile]);
  const declinationDeg = useMemo(() => marsDeclinationDeg(0), []);

  const [hour, setHour] = useState(8);
  const [speed, setSpeed] = useState(1.5);
  const [paused, setPaused] = useState(false);
  const hourRef = useRef(hour);

  useEffect(() => {
    hourRef.current = hour;
  }, [hour]);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      if (!paused) {
        const dt = ((now - last) / 1000) * speed;
        const next = (hourRef.current + dt) % MARS_SOL_HOURS;
        hourRef.current = next;
        setHour(next);
      }
      last = now;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [paused, speed]);

  const index = Math.min(profile.length - 1, Math.round((hour / MARS_SOL_HOURS) * (profile.length - 1)));
  const batteryPct = profile[index].batteryPct;
  const elevationDeg = solarElevationDeg(hour, LATITUDE_DEG, declinationDeg);

  return (
    <div className="relative h-full w-full">
      <Canvas dpr={[1, 1.75]} camera={{ position: [18, 11, 20], fov: 50 }} shadows>
        <Suspense fallback={null}>
          <Scene hour={hour} arrayKw={arrayKw} loadKw={loadKw} declinationDeg={declinationDeg} batteryPct={batteryPct} />
        </Suspense>
      </Canvas>

      <div className="pointer-events-auto absolute left-4 top-4 max-w-xs rounded-xl border border-white/10 bg-black/60 p-4 font-mono text-[11px] text-slate-300 backdrop-blur">
        <p className="text-space-cyan">SURFACE OPS · JEZERO-CLASS SITE</p>
        <dl className="mt-2 space-y-1">
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Array rated</dt>
            <dd>{arrayKw.toFixed(1)} kW</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Habitat load</dt>
            <dd>{loadKw.toFixed(1)} kW</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Peak generation</dt>
            <dd>{summary.peakGenerationKw.toFixed(1)} kW</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Daylight / sol</dt>
            <dd>
              {summary.daylightHours.toFixed(1)} h of {MARS_SOL_HOURS.toFixed(1)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Battery reserve</dt>
            <dd>{batteryKwh.toFixed(0)} kWh</dd>
          </div>
        </dl>
        <p className={`mt-2 ${elevationDeg > 0 ? "text-space-emerald" : "text-space-amber"}`}>
          {elevationDeg > 0 ? "sunlit — array charging" : "night — running on battery"}
        </p>
      </div>

      <div className="pointer-events-auto absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-center gap-3 rounded-xl border border-white/10 bg-black/40 p-2 backdrop-blur">
        <button
          onClick={() => setPaused(!paused)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-space-cyan/40 bg-space-cyan/20 px-4 py-2 text-sm font-medium text-space-cyan hover:bg-space-cyan/30"
        >
          {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          {paused ? "Play" : "Pause"}
        </button>
        <button
          onClick={() => {
            hourRef.current = 8;
            setHour(8);
            setPaused(false);
          }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/20"
        >
          <RotateCcw className="h-4 w-4" /> Reset
        </button>
        <label className="flex items-center gap-2 text-xs text-slate-300">
          Sol speed
          <input
            type="range"
            min={0.2}
            max={5}
            step={0.1}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="w-32 accent-space-cyan"
          />
          <span className="w-12 text-right font-mono">{speed.toFixed(1)} h/s</span>
        </label>
        <span className="font-mono text-xs text-slate-400">
          Sol clock {formatSolClock(hour)} · battery {batteryPct.toFixed(0)}%
        </span>
      </div>
    </div>
  );
}
