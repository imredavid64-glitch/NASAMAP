"use client";

import { useMemo, useState } from "react";
import { Rocket, Radio, ShieldAlert, Package, AlertTriangle, CheckCircle2, MinusCircle } from "lucide-react";
import { designMission, MARS_SYNODIC_DAYS } from "@/lib/mission";
import launchVehicles from "@/data/launch-vehicles.json";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { MissionPassport } from "./MissionPassport";

type Destination = "moon" | "mars";

const VEHICLES = launchVehicles as unknown as {
  id: string;
  name: string;
  operator: string;
  payloadLEOKg: number;
}[];
const MARS_WINDOW_YEARS = (MARS_SYNODIC_DAYS / 365.25).toFixed(1);

function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-space-950/60 p-4">
      <p className="text-[11px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 font-mono text-2xl text-space-cyan">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

function GateBadge({ gate }: { gate: "pass" | "fail" | "unknown" }) {
  if (gate === "pass")
    return (
      <Badge tone="emerald">
        <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> GO — mass fits
      </Badge>
    );
  if (gate === "fail")
    return (
      <Badge tone="crimson">
        <AlertTriangle className="mr-1 h-3.5 w-3.5" /> NO-GO — too heavy
      </Badge>
    );
  return (
    <Badge tone="amber">
      <MinusCircle className="mr-1 h-3.5 w-3.5" /> unverified
    </Badge>
  );
}

export function MissionPlanner() {
  const [destination, setDestination] = useState<Destination>("mars");
  const [vehicleId, setVehicleId] = useState<string>("starship");
  const [crew, setCrew] = useState(4);
  const [surfaceDays, setSurfaceDays] = useState(90);

  const design = useMemo(
    () => designMission({ destination, vehicleId, crew, surfaceDays }),
    [destination, vehicleId, crew, surfaceDays],
  );

  const careerLimitNote = design.radiationMsvTotal > 100 ? "exceeds NASA career reference (~100 mSv)" : "within NASA career reference (~100 mSv)";

  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
      <SectionHeading kicker="Act 1 · PLAN" title="Design your mission" />
      <p className="mt-3 max-w-2xl text-slate-400">
        Every number below is computed live from the platform physics engine and cited NASA datasets — nothing is
        hard-coded for effect.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <Card>
          <CardBody>
            <CardTitle>Mission parameters</CardTitle>
            <div className="mt-5 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Destination</label>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { id: "moon", label: "Earth's Moon", note: "≈3-day trip · 1.3 s of light-lag" },
                      { id: "mars", label: "Mars", note: "≈259-day Hohmann · up to 25 min round-trip" },
                    ] as const
                  ).map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setDestination(d.id)}
                      className={`rounded-xl border p-3 text-left transition ${
                        destination === d.id
                          ? "border-space-cyan/60 bg-space-cyan/10"
                          : "border-white/10 bg-white/[0.02] hover:border-white/25"
                      }`}
                    >
                      <span className="block text-sm font-semibold text-white">{d.label}</span>
                      <span className="mt-1 block text-xs text-slate-500">{d.note}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Launch vehicle</label>
                <select
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-space-950/60 px-3 py-2.5 text-sm text-white outline-none focus:border-space-cyan/60"
                >
                  {VEHICLES.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} · {v.operator}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 flex items-center justify-between text-sm font-medium text-slate-300">
                  Crew size
                  <span className="font-mono text-space-cyan">{crew}</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={6}
                  step={1}
                  value={crew}
                  onChange={(e) => setCrew(Number(e.target.value))}
                  className="w-full accent-cyan-400"
                />
              </div>

              <div>
                <label className="mb-2 flex items-center justify-between text-sm font-medium text-slate-300">
                  Days on the surface
                  <span className="font-mono text-space-cyan">{surfaceDays}</span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={365}
                  step={1}
                  value={surfaceDays}
                  onChange={(e) => setSurfaceDays(Number(e.target.value))}
                  className="w-full accent-cyan-400"
                />
              </div>

              <div className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs text-slate-400">
                <Rocket className="mt-0.5 h-4 w-4 shrink-0 text-space-cyan" />
                {destination === "mars" ? (
                  <span>
                    Mars launch windows recur every ~{MARS_WINDOW_YEARS} years (synodic period {MARS_SYNODIC_DAYS.toFixed(0)} d).
                  </span>
                ) : (
                  <span>Lunar launch windows are near-daily; the Moon lags ~{design.arrivalLt.roundTripLabel} round-trip at mean distance.</span>
                )}
              </div>
            </div>
          </CardBody>
        </Card>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500">
                {design.vehicle.operator} · {design.vehicle.name}
              </p>
              <h3 className="text-xl font-semibold text-white">
                {destination === "mars" ? "Earth → Mars" : "Earth → Moon"} · crew of {crew}
              </h3>
            </div>
            <GateBadge gate={design.launchGate} />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatTile
              label="Transit time"
              value={`${design.transferDays.toFixed(1)} days`}
              sub={destination === "mars" ? "Hohmann coast" : "Apollo-class"}
            />
            <StatTile
              label="Δv budget"
              value={`${design.totalDeltaVKmS.toFixed(2)} km/s`}
              sub={destination === "mars" ? "heliocentric transfer" : "TLI from LEO"}
            />
            <StatTile
              label="Light-lag one-way"
              value={design.arrivalLt.oneWayLabel}
              sub={`round-trip ${design.arrivalLt.roundTripLabel}`}
            />
            <StatTile
              label="Radiation dose"
              value={`${design.radiationMsvTotal.toFixed(0)} mSv`}
              sub={`${careerLimitNote} · total incl. surface`}
            />
            <StatTile
              label="Consumables"
              value={`${(design.consumablesTotalKg / 1000).toFixed(1)} t`}
              sub={`O₂ ${design.consumables.oxygenKg.toFixed(0)} · H₂O ${design.consumables.waterKg.toFixed(0)} · food ${design.consumables.foodKg.toFixed(0)} kg`}
            />
            <StatTile
              label="Stack mass budget"
              value={`${(design.requiredMassKg / 1000).toFixed(1)} t`}
              sub={`payload capacity ${design.payloadCapacityKg ? `${(design.payloadCapacityKg / 1000).toFixed(0)} t` : "undocumented"}`}
            />
          </div>

          <Card>
            <CardBody>
              <CardTitle className="flex items-center gap-2">
                {design.radiationMsvTotal > 100 ? (
                  <ShieldAlert className="h-4 w-4 text-red-400" />
                ) : (
                  <Radio className="h-4 w-4 text-space-cyan" />
                )}
                Mission brief
              </CardTitle>
              <ul className="mt-4 space-y-2 text-sm text-slate-300">
                {design.notes.map((n, i) => {
                  const isMass = /exceeds|fits|TLI payload/.test(n);
                  return (
                    <li key={i} className="flex gap-2">
                      <span className={isMass ? "mt-0.5 text-amber-400" : "mt-0.5 text-space-cyan"}>
                        {isMass ? (
                          <Package className="h-3.5 w-3.5" />
                        ) : (
                          <span className="text-space-cyan">▸</span>
                        )}
                      </span>
                      {n}
                    </li>
                  );
                })}
                <li className="flex gap-2 text-slate-500">
                  <span className="text-space-cyan">▸</span>
                  <span className="italic">{design.radiationNote}</span>
                </li>
              </ul>
            </CardBody>
          </Card>

          <MissionPassport design={design} />
        </div>
      </div>
    </section>
  );
}