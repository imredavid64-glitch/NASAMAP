"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Star, Rocket, ArrowRight, Trophy, Plus, Settings, Sparkles } from "lucide-react";
import { loadScenarios, type Scenario } from "@/lib/scenarios";
import { readProgress, totalStars, completedCount, starsFor, type ProgressMap } from "@/lib/progress";
import { Badge } from "@/components/ui/badge";
import launchVehicles from "@/data/launch-vehicles.json";
import { SCORE_OBJECTIVE_IDS } from "@/lib/score";
import { LeaderboardPanel } from "@/components/mission/leaderboard";

const DIFF_ORDER: Record<Scenario["difficulty"], number> = { "Beginner/Youth": 0, Intermediate: 1, Advanced: 2 };
const DIFF_TONE: Record<Scenario["difficulty"], "emerald" | "amber" | "crimson"> = {
  "Beginner/Youth": "emerald",
  Intermediate: "amber",
  Advanced: "crimson",
};

const DIFFICULTIES: Scenario["difficulty"][] = ["Beginner/Youth", "Intermediate", "Advanced"];
const DESTINATIONS = ["moon", "mars"] as const;

const VEHICLES = launchVehicles as unknown as {
  id: string;
  name: string;
  operator: string;
  payloadLEOKg: number;
  ispSeaLevel: number;
  ispVacuum: number;
  stages: number;
  firstFlight: string;
  costPerLaunchUsd: number;
  costConfidence: string;
  costNote: string;
}[];

function Stars({ n }: { n: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${n} of 3 stars earned`}>
      {[1, 2, 3].map((i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i <= n ? "text-space-amber" : "text-slate-700"}`}
          fill={i <= n ? "currentColor" : "none"}
        />
      ))}
    </span>
  );
}

function CustomMissionBuilder() {
  const [title, setTitle] = useState("");
  const [brief, setBrief] = useState("");
  const [destination, setDestination] = useState<"moon" | "mars">("moon");
  const [difficulty, setDifficulty] = useState<Scenario["difficulty"]>("Beginner/Youth");
  const [vehicleIds, setVehicleIds] = useState<string[]>(["starship"]);
  const [crewMin, setCrewMin] = useState(1);
  const [crewMax, setCrewMax] = useState(4);
  const [surfaceMin, setSurfaceMin] = useState(0);
  const [surfaceMax, setSurfaceMax] = useState(30);
  const [maxRadiation, setMaxRadiation] = useState(600);
  const [maxTotalDays, setMaxTotalDays] = useState(900);
  const [objectives, setObjectives] = useState<string[]>(["lift-stack", "radiation", "surface"]);
  const [parScore, setParScore] = useState(75);
  const [generatedUrl, setGeneratedUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const allVehicles = VEHICLES;

  const generateUrl = () => {
    const customScenario = {
      title: title || "Custom Mission",
      brief: brief || "A custom mission brief built with the scenario builder.",
      destination,
      difficulty,
      constraints: {
        allowedVehicleIds: vehicleIds,
        crew: { min: crewMin, max: crewMax },
        surfaceDays: { min: surfaceMin, max: surfaceMax },
        maxRadiationMsv: maxRadiation || undefined,
        maxTotalDays: maxTotalDays || undefined,
      },
      objectives: objectives.map((id) => ({ id, label: "" })),
      parScore,
    };
    const encoded = btoa(JSON.stringify(customScenario));
    const url = `${window.location.origin}/play/custom?s=${encoded}`;
    setGeneratedUrl(url);
    return url;
  };

  const handleCopy = async () => {
    const url = generateUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="glass-panel flex flex-col p-5 transition hover:border-space-cyan/40 hover:bg-white/[0.06] border-2 border-space-cyan/30 bg-space-cyan/5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-space-cyan/20 text-space-cyan">
            <Plus className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Create Custom Mission</p>
            <p className="text-xs text-slate-400">Build your own brief with custom constraints</p>
          </div>
        </div>
        <Sparkles className="h-5 w-5 text-space-cyan" />
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Mission Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My Custom Mission"
              className="w-full rounded-lg border border-white/10 bg-space-950/60 px-3 py-2 text-sm text-white outline-none focus:border-space-cyan/60"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Destination</label>
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value as "moon" | "mars")}
              className="w-full rounded-lg border border-white/10 bg-space-950/60 px-3 py-2 text-sm text-white outline-none focus:border-space-cyan/60"
            >
              <option value="moon">Moon</option>
              <option value="mars">Mars</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Scenario["difficulty"])}
              className="w-full rounded-lg border border-white/10 bg-space-950/60 px-3 py-2 text-sm text-white outline-none focus:border-space-cyan/60"
            >
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Par Score</label>
            <input
              type="number"
              value={parScore}
              onChange={(e) => setParScore(Math.min(100, Math.max(0, Number(e.target.value))))}
              min="0"
              max="100"
              className="w-full rounded-lg border border-white/10 bg-space-950/60 px-3 py-2 text-sm text-white outline-none focus:border-space-cyan/60"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Brief</label>
          <textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            rows={2}
            placeholder="Describe the mission..."
            className="w-full rounded-lg border border-white/10 bg-space-950/60 px-3 py-2 text-sm text-white outline-none focus:border-space-cyan/60 resize-none"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1 flex items-center gap-1">
            Allowed Vehicles
            <span className="text-xs text-slate-500">(hold Ctrl/Cmd to multi-select)</span>
          </label>
          <select
            multiple
            value={vehicleIds}
            onChange={(e) => setVehicleIds(Array.from(e.target.selectedOptions, (o) => o.value))}
            size={4}
            className="w-full rounded-lg border border-white/10 bg-space-950/60 px-3 py-2 text-sm text-white outline-none focus:border-space-cyan/60"
          >
            {allVehicles.map((v) => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Crew Range</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={crewMin}
                onChange={(e) => setCrewMin(Math.max(0, Math.min(crewMax, Number(e.target.value))))}
                min="0"
                max={crewMax}
                className="w-20 rounded-lg border border-white/10 bg-space-950/60 px-2 py-1.5 text-sm text-white outline-none focus:border-space-cyan/60"
              />
              <span className="text-slate-500">to</span>
              <input
                type="number"
                value={crewMax}
                onChange={(e) => setCrewMax(Math.max(crewMin, Math.min(10, Number(e.target.value))))}
                min={crewMin}
                max="10"
                className="w-20 rounded-lg border border-white/10 bg-space-950/60 px-2 py-1.5 text-sm text-white outline-none focus:border-space-cyan/60"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Surface Days Range</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={surfaceMin}
                onChange={(e) => setSurfaceMin(Math.max(0, Math.min(surfaceMax, Number(e.target.value))))}
                min="0"
                max={surfaceMax}
                className="w-20 rounded-lg border border-white/10 bg-space-950/60 px-2 py-1.5 text-sm text-white outline-none focus:border-space-cyan/60"
              />
              <span className="text-slate-500">to</span>
              <input
                type="number"
                value={surfaceMax}
                onChange={(e) => setSurfaceMax(Math.max(surfaceMin, Math.min(500, Number(e.target.value))))}
                min={surfaceMin}
                max="500"
                className="w-20 rounded-lg border border-white/10 bg-space-950/60 px-2 py-1.5 text-sm text-white outline-none focus:border-space-cyan/60"
              />
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Max Radiation (mSv)</label>
            <input
              type="number"
              value={maxRadiation}
              onChange={(e) => setMaxRadiation(Math.max(0, Number(e.target.value)))}
              min="0"
              className="w-full rounded-lg border border-white/10 bg-space-950/60 px-3 py-2 text-sm text-white outline-none focus:border-space-cyan/60"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Max Total Days</label>
            <input
              type="number"
              value={maxTotalDays}
              onChange={(e) => setMaxTotalDays(Math.max(0, Number(e.target.value)))}
              min="0"
              className="w-full rounded-lg border border-white/10 bg-space-950/60 px-3 py-2 text-sm text-white outline-none focus:border-space-cyan/60"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Objectives (select 3-6)</label>
          <div className="flex flex-wrap gap-2">
            {SCORE_OBJECTIVE_IDS.map((obj) => (
              <label key={obj} className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={objectives.includes(obj)}
                  onChange={(e) => setObjectives(e.target.checked ? [...objectives, obj] : objectives.filter((o) => o !== obj))}
                  className="rounded border-white/20 text-space-cyan focus:ring-space-cyan"
                />
                <span className="text-xs text-slate-300">{obj}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-space-cyan/40 bg-space-cyan/10 px-3 py-2 text-xs font-medium text-space-cyan transition hover:bg-space-cyan/20 focus-visible:ring-2 focus-visible:ring-space-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-space-950"
        >
          {copied ? "Copied!" : "Generate & Copy Link"}
        </button>
        {generatedUrl && (
          <span className="text-xs text-slate-400 font-mono truncate max-w-xs">
            {generatedUrl}
          </span>
        )}
        <Link
          href={`/play/custom?s=${btoa(JSON.stringify({title, brief, destination, difficulty, constraints: {allowedVehicleIds: vehicleIds, crew: {min: crewMin, max: crewMax}, surfaceDays: {min: surfaceMin, max: surfaceMax}, maxRadiationMsv: maxRadiation, maxTotalDays}, objectives: objectives.map(id => ({id})), parScore}))}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/10"
        >
          <Settings className="h-3.5 w-3.5" /> Try it
        </Link>
      </div>
    </div>
  );
}

export function ScenarioBoard() {
  const scenarios = loadScenarios();
  const [progress, setProgress] = useState<ProgressMap | null>(null);

  useEffect(() => {
    setProgress(readProgress(window.localStorage));
  }, []);

  const ordered = [...scenarios].sort((a, b) => DIFF_ORDER[a.difficulty] - DIFF_ORDER[b.difficulty]);
  const stars = progress ? totalStars(progress) : 0;
  const done = progress ? completedCount(progress) : 0;

  return (
    <div>
      <div className="mt-8 flex flex-wrap items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4">
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <Trophy className="h-4 w-4 text-space-amber" />
          <span>
            {done} of {scenarios.length} missions completed
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <Star className="h-4 w-4 text-space-amber" fill="currentColor" />
          <span className="font-mono text-space-cyan">{stars}</span> stars earned
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <CustomMissionBuilder />
        {ordered.map((s) => (
          <Link
            key={s.id}
            href={`/play/${s.id}`}
            className="glass-panel flex flex-col p-5 transition hover:border-space-cyan/40 hover:bg-white/[0.06]"
          >
            <div className="flex items-center justify-between">
              <Badge tone={DIFF_TONE[s.difficulty]}>{s.difficulty}</Badge>
              <Stars n={progress ? starsFor(progress, s.id) : 0} />
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-slate-500">
              {s.destination === "mars" ? (
                <>
                  <Rocket className="h-3 w-3" /> Mars mission
                </>
              ) : (
                <>
                  <Rocket className="h-3 w-3" /> Lunar mission
                </>
              )}
            </p>
            <p className="mt-1 text-sm font-semibold text-white">{s.title}</p>
            <p className="mt-2 flex-1 text-xs leading-relaxed text-slate-400">{s.brief}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-space-cyan">
              Play this mission <ArrowRight className="h-3 w-3" />
            </span>
          </Link>
        ))}
      </div>

      <LeaderboardPanel />
    </div>
  );
}