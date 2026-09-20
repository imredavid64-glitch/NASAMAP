"use client";

import { useEffect, useMemo, useState } from "react";
import { Rocket, Radio, ShieldAlert, Package, AlertTriangle, CheckCircle2, MinusCircle, Orbit, Link2, Check, RotateCcw, Medal, Users, Send } from "lucide-react";
import { designMission, MARS_SYNODIC_DAYS } from "@/lib/mission";
import { DEFAULT_DESIGN, encodeDesignQuery, isCustomDesign, type DesignInput } from "@/lib/design-link";
import { scoreMission, RADIATION_LIMIT_MSV, type PlayMode } from "@/lib/score";
import { isBetter, readBest, writeBest, type BestRecord } from "@/lib/best-score";
import { clampDesignToScenario, applyScenarioDefaults, type Scenario } from "@/lib/scenarios";
import { opsBudget } from "@/lib/life";
import launchVehicles from "@/data/launch-vehicles.json";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { TransferDiagram } from "@/components/mission/transfer-diagram";
import { OpsBudget } from "@/components/mission/ops-budget";
import { Scorecard } from "@/components/mission/scorecard";
import { ScenarioPanel } from "@/components/mission/scenario-panel";
import { CostCard } from "@/components/mission/cost-card";
import { GlossaryCard } from "@/components/mission/glossary-card";
import { MissionPassport } from "./MissionPassport";
import { MissionPatch } from "./MissionPatch";
import { ISRUWaste } from "@/components/mission/isru-waste";
import { ShareButton } from "@/components/ui/share-button";
import { useToast, successToast } from "@/components/ui/toast";
import { ShowYourWorkPanel } from "@/components/mission/show-your-work";
import { CrewHealthDashboard } from "@/components/mission/crew-health";
import { EarthImpact } from "@/components/mission/earth-impact";
import { useSubmitMission, useAuthor } from "@/lib/convex-community";

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

export function MissionPlanner({
  initial = DEFAULT_DESIGN,
  scenario,
  basePath,
}: {
  initial?: DesignInput;
  scenario?: Scenario;
  /** Base path the permalink rewrites to (e.g. `/play/artemis-crewed-landing`), default `/mission`. */
  basePath?: string;
}) {
  const seed = useMemo(() => (scenario ? clampDesignToScenario(scenario, initial) : initial), [scenario, initial]);
  const [destination, setDestination] = useState<Destination>(seed.destination);
  const [vehicleId, setVehicleId] = useState<string>(seed.vehicleId);
  const [crew, setCrew] = useState(seed.crew);
  const [surfaceDays, setSurfaceDays] = useState(seed.surfaceDays);
  const [mode, setMode] = useState<PlayMode | null>(null);
  const { toast } = useToast();

  const respMode: PlayMode = mode ?? "expert";

  useEffect(() => {
    const saved = window.localStorage.getItem("nasamap.mode");
    setMode(saved === "beginner" ? "beginner" : "expert");
  }, []);

  const switchMode = (next: PlayMode) => {
    setMode(next);
    setTimeout(() => window.localStorage.setItem("nasamap.mode", next), 0);
  };

  const vehicleOptions = scenario
    ? VEHICLES.filter((v) => scenario.constraints.allowedVehicleIds.includes(v.id))
    : VEHICLES;

  const crewMin = scenario ? scenario.constraints.crew.min : 1;
  const crewMax = scenario ? scenario.constraints.crew.max : 6;
  const surfMin = scenario ? scenario.constraints.surfaceDays.min : 0;
  const surfMax = scenario ? scenario.constraints.surfaceDays.max : 365;

  const design = useMemo(
    () => designMission({ destination, vehicleId, crew, surfaceDays }),
    [destination, vehicleId, crew, surfaceDays],
  );

  const scorecard = useMemo(() => scoreMission(design, { mode: respMode }), [design, respMode]);
  const [best, setBest] = useState<BestRecord | null>(null);
  const [newBest, setNewBest] = useState(false);

  // Community sharing
  const submitMission = useSubmitMission();
  const { authorId, authorName } = useAuthor();
  const [submittingCommunity, setSubmittingCommunity] = useState(false);
  const [communityToast, setCommunityToast] = useState<{ type: "success" | "error"; title: string } | null>(null);

  const handleShareToCommunity = async () => {
    if (submittingCommunity) return;
    setSubmittingCommunity(true);
    try {
      const missionName = destination === "mars" ? "Mars Surface Mission" : "Artemis Lunar Mission";
      await submitMission({
        design,
        scorecard,
        missionId: encodeDesignQuery({ destination, vehicleId, crew, surfaceDays }),
        missionName,
        destination,
        vehicleName: design.vehicle.name,
        crew,
        surfaceDays,
        grade: scorecard.grade,
        score: scorecard.score,
        authorId,
        authorName,
      });
      setCommunityToast({ type: "success", title: "Mission shared to community!" });
      toast({ type: "success", title: "Mission shared to community!" });
    } catch (e) {
      console.error("Failed to share mission", e);
      setCommunityToast({ type: "error", title: "Failed to share mission" });
      toast({ type: "error", title: "Failed to share mission" });
    }
    setSubmittingCommunity(false);
  };

  useEffect(() => {
    setBest(readBest(window.localStorage, destination));
  }, [destination]);

  useEffect(() => {
    const prev = readBest(window.localStorage, destination);
    const candidate = { grade: scorecard.grade, score: scorecard.score };
    if (isBetter(candidate, prev)) {
      const record: BestRecord = { ...candidate, at: new Date().toISOString() };
      writeBest(window.localStorage, destination, record);
      setBest(record);
      setNewBest(true);
    } else {
      setNewBest(false);
    }
  }, [destination, scorecard]);

  useEffect(() => {
    const next: DesignInput = { destination, vehicleId, crew, surfaceDays };
    const query = isCustomDesign(next) ? `?${encodeDesignQuery(next)}` : "";
    window.history.replaceState(null, "", `${basePath ?? "/mission"}${query}`);
  }, [destination, vehicleId, crew, surfaceDays, basePath]);

  const resetDesign = () => {
    if (scenario) {
      const d = applyScenarioDefaults(scenario);
      setDestination(d.destination);
      setVehicleId(d.vehicleId);
      setCrew(d.crew);
      setSurfaceDays(d.surfaceDays);
      return;
    }
    setDestination(DEFAULT_DESIGN.destination);
    setVehicleId(DEFAULT_DESIGN.vehicleId);
    setCrew(DEFAULT_DESIGN.crew);
    setSurfaceDays(DEFAULT_DESIGN.surfaceDays);
  };

  const careerLimitNote =
    design.radiationMsvTotal > RADIATION_LIMIT_MSV
      ? `exceeds NASA career limit (${RADIATION_LIMIT_MSV} mSv)`
      : `within NASA career limit (${RADIATION_LIMIT_MSV} mSv)`;

  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
      <SectionHeading kicker="Act 1 · PLAN" title="Design your mission" />
      <p className="mt-3 max-w-2xl text-slate-400">
        Every number below is computed live from the platform physics engine and cited NASA datasets — nothing is
        hard-coded for effect.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <ShareButton
          url={typeof window !== "undefined" ? window.location.href : ""}
          text="Check out my mission design on NASAMAP"
          size="sm"
          showLabel={true}
        />
        {!scenario && (
          <Button
            type="button"
            onClick={handleShareToCommunity}
            disabled={submittingCommunity}
            variant="outline"
            size="sm"
            className="bg-space-emerald/20 border-space-emerald/40 text-space-emerald hover:bg-space-emerald/30"
          >
            <Send className="h-3.5 w-3.5" /> Share to Community
          </Button>
        )}
        <button
          type="button"
          onClick={resetDesign}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-space-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-space-950"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Reset
        </button>
        <div className="inline-flex items-center rounded-lg border border-white/15 bg-white/[0.03] p-0.5 text-xs" role="group" aria-label="Display mode">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-pressed={respMode === "beginner"}
            onClick={() => switchMode("beginner")}
          >
            Guide
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-pressed={respMode === "expert"}
            onClick={() => switchMode("expert")}
          >
            Tech
          </Button>
        </div>
        <span className="text-xs text-slate-500">
          The URL encodes your design — bookmark it, or challenge someone to beat your grade.
        </span>
      </div>

      {!scenario && (
        <div className="mt-6 grid gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              { n: "1", t: "Design", d: "Pick a target, a real launch vehicle, crew size and surface stay." },
              { n: "2", t: "Score", d: "Eight weighted objectives judge Δv, radiation, life support, comms, budget and more." },
              { n: "3", t: "Fix the caps", d: "An unliftable stack or an over-limit dose caps your grade — close the gap for an S." },
              { n: "4", t: "Share", d: "Copy the mission link, fly the trajectory, print the passport and patch." },
            ] as const
          ).map((s) => (
            <div key={s.n} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-space-cyan/40 bg-space-cyan/10 font-mono text-xs text-space-cyan">
                {s.n}
              </span>
              <div>
                <p className="text-sm font-semibold text-white">{s.t}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-400">{s.d}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <Card>
          <CardBody>
            <CardTitle>Mission parameters</CardTitle>
            <div className="mt-5 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Destination</label>
                {scenario ? (
                  <div className="flex items-center gap-2 rounded-xl border border-space-cyan/30 bg-space-cyan/10 p-3">
                    <span className="text-sm font-semibold text-white">
                      {destination === "mars" ? "Mars" : "Earth's Moon"}
                    </span>
                    <span className="text-xs text-slate-400">fixed by this mission brief</span>
                  </div>
                ) : (
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
                        role="radio"
                        aria-checked={destination === d.id}
                        aria-label={d.label}
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
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Launch vehicle
                  {scenario && <span className="ml-1 text-xs text-slate-500">(brief allows only these)</span>}
                </label>
                <select
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-space-950/60 px-3 py-2.5 text-sm text-white outline-none focus:border-space-cyan/60"
                >
                  {vehicleOptions.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} · {v.operator}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label id="crew-label" className="mb-2 flex items-center justify-between text-sm font-medium text-slate-300">
                  Crew size
                  <span className="font-mono text-space-cyan">{crew}</span>
                </label>
                <input
                  type="range"
                  id="crew-slider"
                  min={crewMin}
                  max={crewMax}
                  step={1}
                  value={crew}
                  onChange={(e) => setCrew(Number(e.target.value))}
                  aria-labelledby="crew-label"
                  aria-valuemin={crewMin}
                  aria-valuemax={crewMax}
                  aria-valuenow={crew}
                  aria-orientation="horizontal"
                  className="w-full accent-cyan-400"
                />
              </div>

              <div>
                <label id="surface-label" className="mb-2 flex items-center justify-between text-sm font-medium text-slate-300">
                  Days on the surface
                  <span className="font-mono text-space-cyan">{surfaceDays}</span>
                </label>
                <input
                  type="range"
                  id="surface-slider"
                  min={surfMin}
                  max={surfMax}
                  step={1}
                  value={surfaceDays}
                  onChange={(e) => setSurfaceDays(Number(e.target.value))}
                  aria-labelledby="surface-label"
                  aria-valuemin={surfMin}
                  aria-valuemax={surfMax}
                  aria-valuenow={surfaceDays}
                  aria-orientation="horizontal"
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

          {scenario && (
            <ScenarioPanel
              scenario={scenario}
              design={design}
              scorecard={scorecard}
              basePath={basePath ?? `/play/${scenario.id}`}
            />
          )}

          <div id="scorecard" className="scroll-mt-20">
            <Scorecard design={design} card={scorecard} />
          </div>

          <ShowYourWorkPanel design={design} scorecard={scorecard} />

          <div id="budget" className="mt-4 scroll-mt-20">
            <CostCard design={design} />
          </div>

          <div className="mt-4">
            <GlossaryCard open={respMode === "beginner"} />
          </div>

          {best && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
              <Medal className={`h-3.5 w-3.5 ${newBest ? "text-space-amber" : "text-slate-500"}`} />
              {newBest ? "New personal best for " : "Personal best for "}
              {destination === "mars" ? "Mars" : "the Moon"}:{" "}
              <span className="font-mono text-space-cyan">
                {best.grade} · {best.score}
              </span>
              <span className="text-slate-600">· saved on this device</span>
            </p>
          )}

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
                {design.radiationMsvTotal > RADIATION_LIMIT_MSV ? (
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

          {destination === "mars" && (
            <Card>
              <CardBody>
                <CardTitle className="flex items-center gap-2">
                  <Orbit className="h-4 w-4 text-space-cyan" /> Heliocentric transfer geometry
                </CardTitle>
                <div id="mars-transfer" className="mt-4">
                  <TransferDiagram />
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  Transfer ellipse from the Hohmann solution in astronomical units; orbit radii are to scale,
                  body sizes are not. Mars must lead Earth by the marked phase angle at departure.
                </p>
              </CardBody>
            </Card>
          )}

          <div id="ops" className="scroll-mt-20">
            <OpsBudget design={design} />
          </div>

          <CrewHealthDashboard design={design} scorecard={scorecard} />

          <EarthImpact design={design} ops={opsBudget({ destination: design.destination, crew: design.crew, days: design.totalDays })} />

          <ISRUWaste design={{ destination: design.destination, crew: design.crew, totalDays: design.totalDays }} />

          <MissionPassport
            design={design}
            flyHref={destination === "moon" ? "/fly?mode=hohmann" : "/fly?mode=mars"}
          />

          <div id="patch" className="scroll-mt-20">
            <MissionPatch design={design} />
          </div>
        </div>
      </div>
    </section>
  );
}