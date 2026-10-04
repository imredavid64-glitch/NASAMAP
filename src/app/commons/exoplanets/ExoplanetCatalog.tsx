"use client";

import { useMemo, useState } from "react";
import { Star, Search, Filter, Globe, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Star as StarIcon, Home, Info, AlertCircle, Target, Globe as GlobeIcon } from "lucide-react";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { EXOPLANETS, getHabitablePlanets, getNearbyPlanets, getEarthSimilarPlanets, EXOPLANET_STATS } from "@/data/exoplanets";
import { format } from "date-fns";

const HABITABILITY_COLORS = {
  conservative: { bg: "bg-emerald-500/20", border: "border-emerald-500/30", text: "text-emerald-400", label: "Conservative HZ" },
  optimistic: { bg: "bg-amber-500/20", border: "border-amber-500/30", text: "text-amber-400", label: "Optimistic HZ" },
  none: { bg: "bg-slate-500/20", border: "border-slate-500/30", text: "text-slate-400", label: "Outside HZ" },
};

const habitableColor = (zone: "conservative" | "optimistic" | "none") => HABITABILITY_COLORS[zone];

interface Exoplanet {
  id: string;
  name: string;
  hostStar: string;
  distanceLy: number;
  discoveryMethod: string;
  discoveryYear: number;
  orbitalPeriodDays: number;
  semiMajorAxisAU: number;
  radiusEarth: number;
  massEarth: number | null;
  equilibriumTempK: number | null;
  habitabilityZone: "conservative" | "optimistic" | "none";
  stellarType: string;
  stellarTempK: number;
  stellarMassSun: number;
  notable: string;
}

export default function ExoplanetCatalogPage() {
  const [filter, setFilter] = useState<"all" | "habitable" | "nearby" | "earth-like">("all");
  const [search, setSearch] = useState("");
  const [selectedPlanet, setSelectedPlanet] = useState<Exoplanet | null>(null);
  const [sortBy, setSortBy] = useState<"distance" | "period" | "radius" | "temp" | "year">("distance");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const filteredPlanets = useMemo(() => {
    let planets = [...EXOPLANETS];

    switch (filter) {
      case "habitable":
        planets = planets.filter(p => p.habitabilityZone !== "none");
        break;
      case "nearby":
        planets = planets.filter(p => p.distanceLy <= 50);
        break;
      case "earth-like":
        planets = planets.filter(p => 
          p.radiusEarth >= 0.8 && p.radiusEarth <= 1.5 && 
          p.habitabilityZone !== "none"
        );
        break;
    }

    if (search) {
      const s = search.toLowerCase();
      planets = planets.filter(p => 
        p.name.toLowerCase().includes(s) ||
        p.hostStar.toLowerCase().includes(s) ||
        p.discoveryMethod.toLowerCase().includes(s)
      );
    }

    planets.sort((a, b) => {
      let aVal: number | string;
      let bVal: number | string;
      
      switch (sortBy) {
        case "distance":
          aVal = a.distanceLy;
          bVal = b.distanceLy;
          break;
        case "period":
          aVal = a.orbitalPeriodDays;
          bVal = b.orbitalPeriodDays;
          break;
        case "radius":
          aVal = a.radiusEarth;
          bVal = b.radiusEarth;
          break;
        case "temp":
          aVal = a.equilibriumTempK ?? 0;
          bVal = b.equilibriumTempK ?? 0;
          break;
        case "year":
          aVal = a.discoveryYear;
          bVal = b.discoveryYear;
          break;
        default:
          aVal = a.distanceLy;
          bVal = b.distanceLy;
      }

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      }
      return sortOrder === "asc" 
        ? String(aVal).localeCompare(String(bVal)) 
        : String(bVal).localeCompare(String(aVal));
    });

    return planets;
  }, [filter, search, sortBy, sortOrder]);

  const stats = EXOPLANET_STATS;

  const handleSort = (key: "distance" | "period" | "radius" | "temp" | "year") => {
    if (sortBy === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(key);
      setSortOrder("asc");
    }
  };

  return (
    <div className="pt-28">
      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <SectionHeading
          kicker="Flight — Orrery Extension"
          title="Exoplanet Catalog"
          description="Curated catalog of confirmed exoplanets with habitability assessments. Data from NASA Exoplanet Archive. Filter by habitability zone, distance, or Earth-similarity."
        />

        {/* Stats Overview */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <StatCard label="Total Confirmed" value={stats.total} icon={<Star className="h-5 w-5" />} tone="cyan" />
          <StatCard label="In Habitable Zone" value={stats.habitable} icon={<Target className="h-5 w-5" />} tone="emerald" />
          <StatCard label="Conservative HZ" value={stats.conservativeHZ} icon={<Target className="h-5 w-5" />} tone="emerald" />
          <StatCard label="Optimistic HZ" value={stats.optimisticHZ} icon={<Target className="h-5 w-5" />} tone="amber" />
          <StatCard label="Earth-Similar" value={stats.earthSimilar} icon={<Home className="h-5 w-5" />} tone="cyan" />
          <StatCard label="Within 50 ly" value={stats.nearby} icon={<Globe className="h-5 w-5" />} tone="purple" />
        </div>

        {/* Filters & Search */}
        <Card className="mt-6">
          <CardBody className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[250px]">
                <label className="block text-xs text-slate-400 mb-1">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search by name, star, or method..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 rounded-lg border border-white/10 bg-space-950/60 px-3 py-2 text-sm text-white outline-none focus:border-space-cyan/60"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Filter:</span>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as "all" | "habitable" | "nearby" | "earth-like")}
                  className="rounded-lg border border-white/10 bg-space-950/60 px-3 py-2 text-sm text-white outline-none focus:border-space-cyan/60"
                >
                  <option value="all">All Planets</option>
                  <option value="habitable">Habitable Zone Only</option>
                  <option value="nearby">Within 50 ly</option>
                  <option value="earth-like">Earth-Similar (0.8-1.5 R⊕)</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "distance" | "period" | "radius" | "temp" | "year")}
                  className="rounded-lg border border-white/10 bg-space-950/60 px-3 py-2 text-sm text-white outline-none focus:border-space-cyan/60"
                >
                  <option value="distance">Distance (ly)</option>
                  <option value="period">Orbital Period (days)</option>
                  <option value="radius">Radius (R⊕)</option>
                  <option value="temp">Equilibrium Temp (K)</option>
                  <option value="year">Discovery Year</option>
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  className="flex items-center gap-1"
                  aria-label="Toggle sort order"
                >
                  {sortOrder === "asc" ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </Button>
              </div>

              <div className="flex-1" />
              <span className="text-xs text-slate-400">{filteredPlanets.length} / {EXOPLANETS.length} planets</span>
            </div>
          </CardBody>
        </Card>

        {/* Planet Grid */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredPlanets.map((planet) => (
            <PlanetCard key={planet.id} planet={planet} onClick={() => setSelectedPlanet(planet)} />
          ))}
        </div>

        {filteredPlanets.length === 0 && (
          <div className="mt-12 text-center text-slate-500">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-slate-700" />
            <p className="text-lg">No planets match your filters</p>
            <p className="mt-2">Try adjusting your search or filters</p>
          </div>
        )}

        {/* Planet Detail Modal */}
        {selectedPlanet && (
          <PlanetDetailModal planet={selectedPlanet} onClose={() => setSelectedPlanet(null)} />
        )}

        {/* Data Sources */}
        <Card className="mt-12">
          <CardBody>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-space-cyan" /> Data Sources & Methodology
            </CardTitle>
            <div className="mt-4 space-y-2 text-xs text-slate-400">
              <div className="flex gap-2">
                <span className="text-space-cyan">▸</span>
                <span><strong>Primary Source:</strong> NASA Exoplanet Archive (exoplanetarchive.ipac.caltech.edu) — confirmed planets table.</span>
              </div>
              <div className="flex gap-2">
                <span className="text-space-cyan">▸</span>
                <span><strong>Habitable Zone:</strong> Conservative (Kopparapu et al. 2013, 2014) and Optimistic boundaries based on stellar flux limits for runaway greenhouse / maximum greenhouse.</span>
              </div>
              <div className="flex gap-2">
                <span className="text-space-cyan">▸</span>
                <span><strong>Equilibrium Temperature:</strong> Calculated assuming Bond albedo 0.3, full heat redistribution. T_eq = T_star * sqrt(R_star / 2a) * (1 - A)^0.25.</span>
              </div>
              <div className="flex gap-2">
                <span className="text-space-cyan">▸</span>
                <span><strong>Discovery Methods:</strong> Transit (Kepler, TESS, ground-based), Radial Velocity (HARPS, HIRES, ESPRESSO, etc.).</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                <strong>Honesty note:</strong> Catalog is a curated subset (~20 planets) for demo purposes. Full archive has 5,500+ confirmed planets. Data may be superseded by newer publications.
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, tone }: { label: string; value: number; icon: React.ReactNode; tone: string }) {
  return (
    <Card>
      <CardBody className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`flex h-8 w-8 items-center justify-center rounded-lg bg-${tone}-500/20 text-${tone}-400`}>{icon}</span>
            <span className="text-xs text-slate-400">{label}</span>
          </div>
          <span className="font-mono text-2xl text-white">{value}</span>
        </div>
      </CardBody>
    </Card>
  );
}

function PlanetCard({ planet, onClick }: { planet: Exoplanet; onClick: () => void }) {
  const hzColor = habitableColor(planet.habitabilityZone);
  return (
    <div className="h-full transition hover:border-space-cyan/40 hover:bg-white/[0.03] cursor-pointer" onClick={onClick}>
      <Card className="h-full">
        <CardBody className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-medium text-white truncate">{planet.name}</p>
            <p className="text-xs text-slate-400 truncate">{planet.hostStar}</p>
          </div>
          <Badge className={hzColor.bg + " " + hzColor.border + " " + hzColor.text + " text-[10px]"} tone={hzColor.text.replace("text-", "").replace("-400", "") as "cyan" | "amber" | "crimson" | "emerald" | "slate"}>
            {hzColor.label}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="rounded-lg bg-white/5 p-3">
            <p className="text-[10px] text-slate-400">Distance</p>
            <p className="font-mono text-lg text-space-cyan">{planet.distanceLy} ly</p>
          </div>
          <div className="rounded-lg bg-white/5 p-3">
            <p className="text-[10px] text-slate-400">Period</p>
            <p className="font-mono text-lg text-white">{planet.orbitalPeriodDays.toFixed(1)} d</p>
          </div>
          <div className="rounded-lg bg-white/5 p-3">
            <p className="text-[10px] text-slate-400">Radius</p>
            <p className="font-mono text-lg text-white">{planet.radiusEarth} R⊕</p>
          </div>
          <div className="rounded-lg bg-white/5 p-3">
            <p className="text-[10px] text-slate-400">Temp</p>
            <p className="font-mono text-lg text-white">{planet.equilibriumTempK ? planet.equilibriumTempK + " K" : "—"}</p>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">{planet.discoveryMethod} ({planet.discoveryYear})</span>
          <span className="text-slate-500">{planet.stellarType} • {planet.stellarTempK} K</span>
        </div>

        <p className="mt-2 text-[10px] text-slate-500 line-clamp-2">{planet.notable}</p>
      </CardBody>
    </Card>
  </div>
);
}

function PlanetDetailModal({ planet, onClose }: { planet: Exoplanet; onClose: () => void }) {
  const hzColor = habitableColor(planet.habitabilityZone);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-space-950 rounded-2xl border border-white/10" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-white/10 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">{planet.name}</h2>
            <p className="text-slate-400 mt-1">{planet.hostStar} • {planet.distanceLy} ly</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Header with HZ badge */}
          <div className="flex flex-wrap items-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${habitableColor(planet.habitabilityZone).bg} ${habitableColor(planet.habitabilityZone).border} ${habitableColor(planet.habitabilityZone).text}`}>
              <Target className="h-4 w-4" />
              <span className="font-medium">{habitableColor(planet.habitabilityZone).label}</span>
            </div>
            <span className="text-xs text-slate-400">{planet.discoveryMethod} • {planet.discoveryYear}</span>
            <span className="text-xs text-slate-400">{planet.stellarType} • {planet.stellarTempK} K</span>
          </div>

          {/* Key Metrics */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <DetailMetric label="Distance" value={`${planet.distanceLy} ly`} icon={<Globe className="h-4 w-4" />} />
            <DetailMetric label="Orbital Period" value={`${planet.orbitalPeriodDays.toFixed(1)} days`} icon={<Star className="h-4 w-4" />} />
            <DetailMetric label="Semi-major Axis" value={`${planet.semiMajorAxisAU} AU`} icon={<Target className="h-4 w-4" />} />
            <DetailMetric label="Radius" value={`${planet.radiusEarth} R⊕`} icon={<Home className="h-4 w-4" />} />
            <DetailMetric label="Mass" value={planet.massEarth ? `${planet.massEarth} M⊕` : "Unknown"} icon={<Info className="h-4 w-4" />} />
            <DetailMetric label="Equilibrium Temp" value={planet.equilibriumTempK ? `${planet.equilibriumTempK} K` : "Unknown"} icon={<Info className="h-4 w-4" />} />
            <DetailMetric label="Stellar Type" value={`${planet.stellarType} (${planet.stellarTempK} K)`} icon={<Star className="h-4 w-4" />} />
            <DetailMetric label="Stellar Mass" value={`${planet.stellarMassSun} M☉`} icon={<Info className="h-4 w-4" />} />
          </div>

          {/* Habitability Assessment */}
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Target className="h-5 w-5 text-space-cyan" /> Habitability Assessment
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs text-slate-400">HZ Classification</p>
                <p className="font-medium text-white capitalize">{planet.habitabilityZone} habitable zone</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Earth Similarity</p>
                <p className="font-medium text-white">
                  {planet.radiusEarth >= 0.8 && planet.radiusEarth <= 1.5 && planet.habitabilityZone !== "none"
                    ? "High (Earth-sized in HZ)"
                    : planet.habitabilityZone !== "none"
                    ? "Moderate"
                    : "Low"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Stellar Flux</p>
                <p className="font-mono text-white">{planet.equilibriumTempK ? `${((planet.equilibriumTempK / 255) ** 4).toFixed(2)} S⊕` : "Unknown"} S⊕</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Discovery</p>
                <p className="font-medium text-white">{planet.discoveryMethod} ({planet.discoveryYear})</p>
              </div>
            </div>
          </div>

          {/* Notable Notes */}
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
              <Info className="h-5 w-5 text-space-cyan" /> Notable
            </h3>
            <p className="text-sm text-slate-300">{planet.notable}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailMetric({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-space-cyan">{icon}</span>
        <span className="text-xs text-slate-400">{label}</span>
      </div>
      <p className="font-mono text-lg text-white">{value}</p>
    </div>
  );
}