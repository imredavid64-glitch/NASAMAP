"use client";

import { Globe, Rocket, Clock, Users, ChevronRight, Star, Zap, Flag, Award, Search, Filter } from "lucide-react";
import { useState } from "react";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionHeading } from "@/components/ui/section-heading";
import Link from "next/link";
import { loadHistoricalMissions, getMissionsByDestination, getMissionsByTrajectoryType, type HistoricalMission, type HistoricalMissionDestination, type TrajectoryType } from "@/lib/historical-missions";

const DESTINATION_COLORS: Record<HistoricalMissionDestination, "cyan" | "amber" | "emerald"> = {
  moon: "cyan",
  mars: "amber",
  saturn: "amber",
  interstellar: "emerald",
};

const TRAJECTORY_LABELS: Record<TrajectoryType, string> = {
  "free-return": "Free Return",
  "hohmann": "Hohmann Transfer",
  "distant-retrograde": "Distant Retrograde",
  "gravity-assist": "Gravity Assist",
};

function MissionCard({ mission }: { mission: HistoricalMission }) {
  const destColor = DESTINATION_COLORS[mission.destination] || "slate";
  const trajectoryLabel = TRAJECTORY_LABELS[mission.trajectoryType];

  return (
    <Link href={`/fly/historical/${mission.id}`} className="block">
      <Card className="glass-panel transition hover:border-space-cyan/40 h-full group">
        <CardBody className="flex flex-col h-full p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-space-cyan/20">
                <Rocket className="h-5 w-5 text-space-cyan" />
              </div>
              <div>
                <CardTitle className="text-sm">{mission.name}</CardTitle>
                <p className="mt-1 text-xs text-slate-400 capitalize">{mission.destination} · {mission.vehicle}</p>
              </div>
            </div>
            <Badge tone={destColor} className="text-[10px]">
              {mission.destination.toUpperCase()}
            </Badge>
          </div>

          <p className="text-xs text-slate-400 mb-4 flex-1">{mission.description}</p>

          <div className="flex flex-wrap gap-2 mb-4">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 text-[10px] font-mono text-space-cyan">
              <Clock className="h-2.5 w-2.5" /> {mission.durationDays.toFixed(1)} days
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 text-[10px] font-mono text-space-cyan">
              <Users className="h-2.5 w-2.5" /> {mission.crew.length > 0 ? mission.crew.length : "Uncrewed"}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 text-[10px] font-mono text-space-cyan">
              <Zap className="h-2.5 w-2.5" /> {trajectoryLabel}
            </span>
          </div>

          <div className="mt-auto pt-4 border-t border-white/10">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400">Launch: {mission.launchDate}</p>
              <span className="inline-flex items-center gap-1 text-space-cyan text-xs font-medium">
                Replay Mission <ChevronRight className="h-3 w-3" />
              </span>
            </div>
          </div>
        </CardBody>
      </Card>
    </Link>
  );
}

const ALL_DESTINATIONS: (HistoricalMissionDestination | "all")[] = ["all", "moon", "mars", "saturn", "interstellar"];
const ALL_TRAJECTORIES: (TrajectoryType | "all")[] = ["all", "free-return", "hohmann", "distant-retrograde", "gravity-assist"];

export default function HistoricalMissionsPage() {
  const missions = loadHistoricalMissions();
  
  const [destinationFilter, setDestinationFilter] = useState<HistoricalMissionDestination | "all">("all");
  const [trajectoryFilter, setTrajectoryFilter] = useState<TrajectoryType | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMissions = missions.filter(mission => {
    const destMatch = destinationFilter === "all" || mission.destination === destinationFilter;
    const trajMatch = trajectoryFilter === "all" || mission.trajectoryType === trajectoryFilter;
    const searchMatch = searchQuery === "" || 
      mission.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mission.vehicle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mission.crew.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()));
    return destMatch && trajMatch && searchMatch;
  });

  return (
    <div className="pt-28 pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          kicker="FLY · HISTORICAL"
          title="Historical Mission Replays"
          description="Replay real mission trajectories with interpolated positions, events, and CSV export. Apollo, Mars rovers, Voyager, Cassini, and more."
        />

        {/* Filters */}
        <Card className="glass-panel mb-8">
          <CardBody className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs text-slate-500 mb-1">Search</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Mission name, vehicle, crew..."
                  className="w-full rounded-xl border border-white/10 bg-space-950/60 px-3 py-2 text-sm text-white outline-none focus:border-space-cyan/60"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Destination</label>
                <select
                  value={destinationFilter}
                  onChange={(e) => setDestinationFilter(e.target.value as any)}
                  className="rounded-xl border border-white/10 bg-space-950/60 px-3 py-2 text-sm text-white outline-none focus:border-space-cyan/60"
                >
                  {ALL_DESTINATIONS.map(d => (
                    <option key={d} value={d}>{d === "all" ? "All Destinations" : d.charAt(0).toUpperCase() + d.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Trajectory Type</label>
                <select
                  value={trajectoryFilter}
                  onChange={(e) => setTrajectoryFilter(e.target.value as any)}
                  className="rounded-xl border border-white/10 bg-space-950/60 px-3 py-2 text-sm text-white outline-none focus:border-space-cyan/60"
                >
                  {ALL_TRAJECTORIES.map(t => (
                    <option key={t} value={t}>{t === "all" ? "All Types" : TRAJECTORY_LABELS[t]}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardBody>
        </Card>

        <p className="text-sm text-slate-500 mb-6">
          Showing <span className="font-mono text-space-cyan">{filteredMissions.length}</span> of {missions.length} missions
        </p>

        {/* Missions Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredMissions.map((mission) => (
            <MissionCard key={mission.id} mission={mission} />
          ))}
        </div>

        {filteredMissions.length === 0 && (
          <Card className="glass-panel text-center py-12">
            <CardBody>
              <Rocket className="h-12 w-12 mx-auto text-slate-600 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No missions found</h3>
              <p className="text-slate-400">Try adjusting your filters or search query</p>
            </CardBody>
          </Card>
        )}

        {/* Stats Summary */}
        <div className="mt-12 rounded-2xl border border-space-cyan/30 bg-space-cyan/5 p-6">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-white mb-4">
            <Award className="h-5 w-5 text-space-cyan" />
            Mission Catalog Summary
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-center">
            <StatCard label="Total Missions" value={missions.length} icon={<Award className="h-5 w-5" />} />
            <StatCard label="Crewed" value={missions.filter(m => m.crew.length > 0).length} icon={<Users className="h-5 w-5" />} />
            <StatCard label="Uncrewed" value={missions.filter(m => m.crew.length === 0).length} icon={<Rocket className="h-5 w-5" />} />
            <StatCard label="Destinations" value={new Set(missions.map(m => m.destination)).size} icon={<Globe className="h-5 w-5" />} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1 p-4 rounded-xl border border-white/10 bg-white/5">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-space-cyan/20">
        {icon}
      </div>
      <p className="text-2xl font-bold text-space-cyan font-mono">{value}</p>
      <p className="text-xs text-slate-400">{label}</p>
    </div>
  );
}