import { marsTransferDiagram } from "@/lib/trajectory";

const CX = 210;
const CY = 180;
const SCALE = 105; // px per AU

/** Heliocentric Earth→Mars Hohmann transfer schematic (orbits to scale, bodies not). */
export function TransferDiagram() {
  const d = marsTransferDiagram(128);

  const px = (au: number, angleRad: number) => ({
    x: CX + au * SCALE * Math.cos(angleRad),
    y: CY - au * SCALE * Math.sin(angleRad),
  });

  const earthR = d.earthOrbitAu * SCALE;
  const marsR = d.marsOrbitAu * SCALE;
  const phaseRad = (d.phaseAngleDeg * Math.PI) / 180;

  const earthNow = { x: CX + earthR, y: CY };
  const marsNow = px(d.marsOrbitAu, phaseRad);

  const transferPath = d.points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${(CX + p.x * SCALE).toFixed(1)} ${(CY - p.y * SCALE).toFixed(1)}`)
    .join(" ");

  const phaseArc = `M ${CX + earthR * Math.cos(0)} ${CY} A ${earthR} ${earthR} 0 0 0 ${CX + earthR * Math.cos(phaseRad)} ${CY - earthR * Math.sin(phaseRad)}`;

  return (
    <div className="w-full">
      <svg
        viewBox="0 0 420 360"
        role="img"
        aria-label="Schematic of the Hohmann transfer ellipse from Earth to Mars"
        className="mx-auto h-auto w-full max-w-[520px]"
      >
        <defs>
          <radialGradient id="sun-glow">
            <stop offset="0%" stopColor="#ffd166" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#ffb703" stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx={CX} cy={CY} r={26} fill="url(#sun-glow)" />
        <circle cx={CX} cy={CY} r={9} fill="#ffd166" />

        {/* Orbits */}
        <circle cx={CX} cy={CY} r={earthR} fill="none" stroke="#3b82f6" strokeOpacity="0.4" strokeDasharray="4 5" />
        <circle cx={CX} cy={CY} r={marsR} fill="none" stroke="#e07a4a" strokeOpacity="0.45" strokeDasharray="4 5" />

        {/* Transfer ellipse — upper (outbound) half highlighted */}
        <path d={transferPath} fill="none" stroke="#00f0ff" strokeWidth="2" />
        <path
          d={`M ${CX - d.marsOrbitAu * SCALE} ${CY} A ${(d.semiMajorAu * SCALE).toFixed(1)} ${(d.semiMajorAu * SCALE * Math.sqrt(1 - d.eccentricity ** 2)).toFixed(1)} 0 0 0 ${CX + d.earthOrbitAu * SCALE} ${CY}`}
          fill="none"
          stroke="#00f0ff"
          strokeOpacity="0.25"
          strokeDasharray="3 4"
        />

        {/* Phase-angle arc between Earth and Mars at departure */}
        <path d={phaseArc} fill="none" stroke="#facc15" strokeOpacity="0.7" strokeWidth="1.5" />
        <text x={CX + earthR + 6} y={CY - 10} fill="#facc15" fontSize="10" fontFamily="monospace">
          {d.phaseAngleDeg.toFixed(1)}°
        </text>

        {/* Earth (departure) */}
        <circle cx={earthNow.x} cy={earthNow.y} r={6} fill="#3b82f6" />
        <text x={earthNow.x - 14} y={earthNow.y + 20} fill="#93c5fd" fontSize="10" fontFamily="monospace">
          Earth · 1.00 AU
        </text>

        {/* Mars (arrival) */}
        <circle cx={marsNow.x} cy={marsNow.y} r={5} fill="#e07a4a" />
        <text x={marsNow.x + 10} y={marsNow.y - 8} fill="#f0a97a" fontSize="10" fontFamily="monospace">
          Mars · {d.marsOrbitAu.toFixed(2)} AU
        </text>

        {/* Sun */}
        <text x={CX - 14} y={CY + 26} fill="#ffd166" fontSize="10" fontFamily="monospace">
          Sun
        </text>

        <text x={12} y={20} fill="#94a3b8" fontSize="10" fontFamily="monospace">
          Hohmann transfer · ~{d.transferDays.toFixed(0)} days · e={d.eccentricity.toFixed(3)}
        </text>
        <text x={12} y={34} fill="#64748b" fontSize="10" fontFamily="monospace">
          launch window every ~{d.synodicDays.toFixed(0)} days (synodic)
        </text>
      </svg>
    </div>
  );
}