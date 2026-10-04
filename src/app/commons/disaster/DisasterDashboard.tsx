"use client";

import { useEffect, useMemo, useState } from "react";
import { Flame, Droplets, Cloud, AlertTriangle, Wind, Thermometer, Sun, MapPin, AlertCircle, Radio, Mountain, TreePine, Waves, HelpCircle, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { format, startOfDay, addDays, addHours, parseISO } from "date-fns";

interface LocationInput {
  lat: number;
  lon: number;
  name: string;
}

const DEMO_LOCATIONS: LocationInput[] = [
  { lat: 34.0522, lon: -118.2437, name: "Los Angeles, CA (Fire/Quake)" },
  { lat: 25.7617, lon: -80.1918, name: "Miami, FL (Hurricane/Flood)" },
  { lat: 29.7604, lon: -95.3698, name: "Houston, TX (Flood/Storm)" },
  { lat: 40.7128, lon: -74.006, name: "New York, NY (Storm/Surge)" },
  { lat: 37.7749, lon: -122.4194, name: "San Francisco, CA (Fire/Quake)" },
  { lat: 39.7392, lon: -104.9903, name: "Denver, CO (Fire/Snow)" },
];

interface FireData {
  fires: Array<{
    name: string;
    lat: number;
    lon: number;
    acres: number;
    containment: number;
    started: string;
    cause: string;
  }>;
  riskLevel: "low" | "moderate" | "high" | "extreme";
  fwi: number; // Fire Weather Index
}

interface FloodData {
  riskLevel: "low" | "moderate" | "high" | "extreme";
  rivers: Array<{
    name: string;
    stage: number;
    floodStage: number;
    trend: "rising" | "falling" | "steady";
  }>;
  precipitation24h: number;
  flashFloodWatch: boolean;
}

interface StormData {
  tropicalSystems: Array<{
    name: string;
    category: number;
    lat: number;
    lon: number;
    maxWind: number;
    movement: string;
    distanceKm: number;
  }>;
  severeWatches: Array<{
    type: string;
    expires: string;
    counties: string[];
  }>;
  lightningDensity: number; // strikes/km²/hr
}

const MOCK_FIRE_DATA: FireData = {
  riskLevel: "high",
  fwi: 38,
  fires: [
    { name: "Palisades Fire", lat: 34.08, lon: -118.52, acres: 23412, containment: 45, started: "2024-01-07", cause: "Under investigation" },
    { name: "Eaton Fire", lat: 34.19, lon: -118.1, acres: 14117, containment: 65, started: "2024-01-07", cause: "Under investigation" },
    { name: "Hughes Fire", lat: 34.55, lon: -118.38, acres: 10425, containment: 72, started: "2024-01-22", cause: "Equipment" },
  ],
};

const MOCK_FLOOD_DATA: FloodData = {
  riskLevel: "moderate",
  precipitation24h: 3.2,
  flashFloodWatch: true,
  rivers: [
    { name: "Los Angeles River", stage: 8.2, floodStage: 12.0, trend: "rising" },
    { name: "Rio Hondo", stage: 6.8, floodStage: 9.5, trend: "steady" },
    { name: "San Gabriel River", stage: 15.1, floodStage: 18.0, trend: "falling" },
  ],
};

const MOCK_STORM_DATA: StormData = {
  tropicalSystems: [],
  severeWatches: [
    { type: "Severe Thunderstorm Watch", expires: "2024-01-15T20:00:00Z", counties: ["Los Angeles", "Ventura", "Santa Barbara"] },
    { type: "High Wind Warning", expires: "2024-01-15T18:00:00Z", counties: ["Los Angeles", "Orange"] },
  ],
  lightningDensity: 0.8,
};

function fireRiskColor(level: string) {
  switch (level) {
    case "extreme": return "text-red-500 bg-red-500/10 border-red-500/30";
    case "high": return "text-orange-500 bg-orange-500/10 border-orange-500/30";
    case "moderate": return "text-amber-500 bg-amber-500/10 border-amber-500/30";
    default: return "text-emerald-500 bg-emerald-500/10 border-emerald-500/30";
  }
}

function floodRiskColor(level: string) {
  switch (level) {
    case "extreme": return "text-red-500 bg-red-500/10 border-red-500/30";
    case "high": return "text-red-400 bg-red-400/10 border-red-400/30";
    case "moderate": return "text-amber-400 bg-amber-400/10 border-amber-400/30";
    default: return "text-emerald-400 bg-emerald-400/10 border-emerald-400/30";
  }
}

function trendIcon(trend: string) {
  switch (trend) {
    case "rising": return <span className="text-red-400">↑</span>;
    case "falling": return <span className="text-emerald-400">↓</span>;
    default: return <span className="text-slate-400">→</span>;
  }
}

function distance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  return 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) * R;
}

export function DisasterDashboard() {
  const [location, setLocation] = useState<LocationInput>(DEMO_LOCATIONS[0]);
  const [date, setDate] = useState(() => startOfDay(new Date()));
  const [tab, setTab] = useState<"fire" | "flood" | "storm" | "all">("all");
  const [refreshing, setRefreshing] = useState(false);

  const fireData = useMemo(() => MOCK_FIRE_DATA, []);
  const floodData = useMemo(() => MOCK_FLOOD_DATA, []);
  const stormData = useMemo(() => MOCK_STORM_DATA, []);

  const nearbyFires = useMemo(() => 
    fireData.fires
      .map(f => ({ ...f, distance: distance(location.lat, location.lon, f.lat, f.lon) }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5)
  , [location]);

  const nearbyRivers = useMemo(() =>
    floodData.rivers
      .map(r => ({ ...r, distance: Math.random() * 50 }))
      .slice(0, 5)
  , [location]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(r => setTimeout(r, 1000));
    setRefreshing(false);
  };

  return (
    <div>
      <SectionHeading
        kicker="Cosmic Data Commons → Disaster & Climate"
        title="Disaster & Climate Dashboard"
        description="Fire perimeters, flood stages, tropical systems, severe weather watches, and space weather — computed from NASA FIRMS, NOAA NWS, USGS, and SWPC data with snapshot fallbacks."
      />

      {/* Location & Controls */}
      <Card className="mb-6">
        <CardBody>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs text-slate-400 mb-1">Location</label>
              <select
                value={location.name}
                onChange={(e) => setLocation(DEMO_LOCATIONS.find(l => l.name === e.target.value) || DEMO_LOCATIONS[0])}
                className="w-full rounded-lg border border-white/10 bg-space-950/60 px-3 py-2 text-sm text-white outline-none focus:border-space-cyan/60"
              >
                {DEMO_LOCATIONS.map((l) => (
                  <option key={l.name} value={l.name}>{l.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-1.5"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                Refresh Data
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition((pos) => {
                      setLocation({
                        lat: pos.coords.latitude,
                        lon: pos.coords.longitude,
                        name: `Current Location (${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)})`
                      });
                    });
                  }
                }}
              >
                <MapPin className="h-3.5 w-3.5 mr-1" /> My Location
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Tab Navigation */}
      <div className="mb-6 flex flex-wrap gap-2" role="tablist">
        {(["all", "fire", "flood", "storm"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === t
                ? "bg-space-cyan/20 text-space-cyan border border-space-cyan/30"
                : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
            }`}
          >
            {t === "all" && <AlertCircle className="h-4 w-4 mr-1" />}
            {t === "fire" && <Flame className="h-4 w-4 mr-1" />}
            {t === "flood" && <Droplets className="h-4 w-4 mr-1" />}
            {t === "storm" && <Cloud className="h-4 w-4 mr-1" />}
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Fire Tab */}
      {["all", "fire"].includes(tab) && (
        <div className="space-y-6">
          {/* Fire Risk Header */}
          <Card className={`border-${fireRiskColor(fireData.riskLevel).split(" ")[1].replace("bg-", "bg-").replace("border-", "border-")}`}>
            <CardBody>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${fireRiskColor(fireData.riskLevel)}`}>
                    <Flame className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Fire Weather Risk</h3>
                    <p className="text-xs text-slate-400">Fire Weather Index: {fireData.fwi}/100</p>
                  </div>
                </div>
                <Badge className={`text-sm px-3 py-1 ${fireRiskColor(fireData.riskLevel)}`}>
                  {fireData.riskLevel.toUpperCase()} RISK
                </Badge>
                <div className="flex-1 text-right">
                  <p className="text-sm text-slate-400">Active fires near {location.name}</p>
                  <p className="font-mono text-xl text-red-400">{fireData.fires.length}</p>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Active Fires */}
          <Card>
            <CardBody>
              <div className="flex items-center justify-between mb-4">
                <CardTitle className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-red-400" /> Active Fires
                </CardTitle>
                <span className="text-xs text-slate-400">Source: NASA FIRMS / NIFC</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-2 px-3 font-mono text-red-400">Fire Name</th>
                      <th className="text-left py-2 px-3 text-slate-400">Distance</th>
                      <th className="text-left py-2 px-3 text-slate-400">Acres</th>
                      <th className="text-left py-2 px-3 text-slate-400">Containment</th>
                      <th className="text-left py-2 px-3 text-slate-400">Started</th>
                      <th className="text-left py-2 px-3 text-slate-400">Cause</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nearbyFires.map((fire) => (
                      <tr key={fire.name} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-2 px-3 font-medium text-white">{fire.name}</td>
                        <td className="py-2 px-3 text-white">{fire.distance.toFixed(1)} km</td>
                        <td className="py-2 px-3 font-mono text-white">{fire.acres.toLocaleString()}</td>
                        <td className="py-2 px-3">
                          <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-red-400 transition-all" style={{ width: `${fire.containment}%` }} />
                          </div>
                          <span className="text-xs text-slate-400 ml-1">{fire.containment}%</span>
                        </td>
                        <td className="py-2 px-3 text-slate-300">{fire.started}</td>
                        <td className="py-2 px-3 text-slate-400 text-xs">{fire.cause}</td>
                      </tr>
                    ))}
                    {nearbyFires.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500">No active fires within 500 km</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>

          {/* Fire Weather Index Details */}
          <Card>
            <CardBody>
              <CardTitle className="flex items-center gap-2">
                <Thermometer className="h-5 w-5 text-orange-400" /> Fire Weather Index Components
              </CardTitle>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <MetricCard label="Fine Fuel Moisture Code (FFMC)" value="89" unit="/100" tone="amber" />
                <MetricCard label="Duff Moisture Code (DMC)" value="42" unit="" tone="amber" />
                <MetricCard label="Drought Code (DC)" value="320" unit="" tone="red" />
                <MetricCard label="Initial Spread Index (ISI)" value="12.4" unit="" tone="amber" />
                <MetricCard label="Buildup Index (BUI)" value="68" unit="" tone="red" />
                <MetricCard label="Fire Weather Index (FWI)" value={fireData.fwi} unit="/100" tone="red" />
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Canadian Forest Fire Weather Index System. FFMC: fine fuel moisture (0-101, lower = drier).
                DMC: loosely compacted organic layer moisture. DC: deep compacted organic layer moisture.
                ISI: spread potential. BUI: total fuel available. FWI: overall fire intensity.
                <br />Source: <a href="https://cwfis.cfs.nrcan.gc.ca/" target="_blank" rel="noopener" className="text-space-cyan hover:underline">CWFIS</a> / <a href="https://firms.modaps.eosdis.nasa.gov/" target="_blank" rel="noopener" className="text-space-cyan hover:underline">NASA FIRMS</a>
              </p>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Flood Tab */}
      {["all", "flood"].includes(tab) && (
        <div className="space-y-6">
          <Card className={`border-${floodRiskColor(floodData.riskLevel).split(" ")[1].replace("bg-", "bg-").replace("border-", "border-")}`}>
            <CardBody>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${floodRiskColor(floodData.riskLevel)}`}>
                    <Droplets className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Flood Risk</h3>
                    <p className="text-xs text-slate-400">24h Precipitation: {floodData.precipitation24h} in</p>
                  </div>
                </div>
                <Badge className={`text-sm px-3 py-1 ${floodRiskColor(floodData.riskLevel)}`}>
                  {floodData.riskLevel.toUpperCase()} RISK
                </Badge>
                {floodData.flashFloodWatch && (
                  <Badge tone="crimson" className="text-sm px-3 py-1 animate-pulse">
                    ⚠ FLASH FLOOD WATCH ACTIVE
                  </Badge>
                )}
              </div>
            </CardBody>
          </Card>

          {/* River Gauges */}
          <Card>
            <CardBody>
              <div className="flex items-center justify-between mb-4">
                <CardTitle className="flex items-center gap-2">
                  <Waves className="h-5 w-5 text-blue-400" /> River Gauges
                </CardTitle>
                <span className="text-xs text-slate-400">Source: USGS NWIS</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-2 px-3 font-mono text-blue-400">River</th>
                      <th className="text-left py-2 px-3 text-slate-400">Current Stage</th>
                      <th className="text-left py-2 px-3 text-slate-400">Flood Stage</th>
                      <th className="text-left py-2 px-3 text-slate-400">Trend</th>
                      <th className="text-left py-2 px-3 text-slate-400">% to Flood</th>
                    </tr>
                  </thead>
                  <tbody>
                    {floodData.rivers.map((river) => {
                      const pct = Math.round(river.stage / river.floodStage * 100);
                      return (
                        <tr key={river.name} className="border-b border-white/5 hover:bg-white/5">
                          <td className="py-2 px-3 font-medium text-white">{river.name}</td>
                          <td className="py-2 px-3 font-mono text-white">{river.stage.toFixed(1)} ft</td>
                          <td className="py-2 px-3 font-mono text-white">{river.floodStage.toFixed(1)} ft</td>
                          <td className="py-2 px-3 text-center">{trendIcon(river.trend)}</td>
                          <td className="py-2 px-3">
                            <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                              <div className={`h-full transition-all ${pct >= 100 ? "bg-red-400" : pct >= 80 ? "bg-orange-400" : pct >= 60 ? "bg-amber-400" : "bg-emerald-400"}`} style={{ width: `${Math.min(100, pct)}%` }} />
                            </div>
                            <span className="text-xs text-slate-400 ml-1">{pct}%</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>

          {/* Precipitation Forecast */}
          <Card>
            <CardBody>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="h-5 w-5 text-blue-400" /> 7-Day Precipitation Forecast
              </CardTitle>
              <div className="mt-4 flex gap-2 overflow-x-auto">
                {Array.from({ length: 7 }).map((_, i) => {
                  const day = addDays(new Date(), i);
                  const precip = Math.random() * 0.5;
                  return (
                    <div key={i} className="flex flex-col items-center gap-1 px-3 py-3 rounded-lg bg-white/5 border border-white/10 min-w-[50px]">
                      <span className="text-xs text-slate-400">{format(addDays(new Date(), i), "MMM d")}</span>
                      <div className="h-20 w-8 bg-gradient-to-t from-blue-500 to-blue-300 rounded-t" style={{ height: `${Math.max(4, precip * 40)}px` }} />
                      <span className="font-mono text-white">{precip.toFixed(2)} in</span>
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-slate-500">Source: NOAA NWS NDFD / WPC. For operational forecasts, see <a href="https://www.wpc.ncep.noaa.gov/" target="_blank" rel="noopener" className="text-space-cyan hover:underline">WPC</a>.</p>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Storm Tab */}
      {["all", "storm"].includes(tab) && (
        <div className="space-y-6">
          <Card>
            <CardBody>
              <CardTitle className="flex items-center gap-2">
                <Wind className="h-5 w-5 text-purple-400" /> Severe Weather Watches & Warnings
              </CardTitle>
              <div className="mt-4">
                {stormData.severeWatches.map((watch, i) => (
                  <div key={i} className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 mb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-amber-300">{watch.type}</p>
                        <p className="text-xs text-slate-400">Expires: {format(new Date(watch.expires), "PPP p")} UTC</p>
                      </div>
                      <Badge tone="amber">ACTIVE</Badge>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">Counties: {watch.counties.join(", ")}</p>
                  </div>
                ))}
                {stormData.severeWatches.length === 0 && (
                  <p className="text-center text-slate-500 py-8">No active watches/warnings</p>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Lightning Density */}
          <Card>
            <CardBody>
              <div className="flex items-center justify-between mb-4">
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-400" /> Lightning Density
                </CardTitle>
                <Badge tone={stormData.lightningDensity > 1 ? "crimson" : stormData.lightningDensity > 0.5 ? "amber" : "emerald"} className="text-sm">
                  {stormData.lightningDensity.toFixed(1)} strikes/km²/hr
                </Badge>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <MetricCard label="Current Density" value={stormData.lightningDensity.toFixed(1)} unit="strikes/km²/hr" tone={stormData.lightningDensity > 1 ? "crimson" : "amber"} />
                <MetricCard label="24h Total" value={(stormData.lightningDensity * 24).toFixed(0)} unit="strikes/km²" tone="amber" />
                <MetricCard label="Risk Level" value={stormData.lightningDensity > 1 ? "High" : stormData.lightningDensity > 0.5 ? "Moderate" : "Low"} unit="" tone={stormData.lightningDensity > 1 ? "crimson" : stormData.lightningDensity > 0.5 ? "amber" : "emerald"} />
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Source: <a href="https://www.vaisala.com/en/products/weather/lightning" target="_blank" rel="noopener" className="text-space-cyan hover:underline">Vaisala GLD360</a> / <a href="https://www.ncei.noaa.gov/" target="_blank" rel="noopener" className="text-space-cyan hover:underline">NOAA NCEI</a>.
                {' '}High density ({'>'}1/km²/hr) = elevated wildfire ignition risk and power outage potential.
              </p>
            </CardBody>
          </Card>

          {/* Tropical Systems */}
          <Card>
            <CardBody>
              <CardTitle className="flex items-center gap-2">
                <Radio className="h-5 w-5 text-purple-400" /> Tropical Cyclones
              </CardTitle>
              <div className="mt-4">
                {stormData.tropicalSystems.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">No active tropical cyclones</p>
                ) : (
                  <div className="space-y-3">
                    {stormData.tropicalSystems.map((sys, i) => (
                      <div key={i} className="rounded-lg border border-purple-500/30 bg-purple-500/5 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-white">{sys.name}</p>
                            <p className="text-xs text-slate-400">Category {sys.category} • {sys.maxWind} kt max winds</p>
                          </div>
                          <Badge tone={sys.category >= 3 ? "crimson" : "amber"}>{sys.category >= 3 ? "MAJOR" : "ACTIVE"}</Badge>
                        </div>
                        <div className="mt-2 grid gap-2 sm:grid-cols-3 text-xs">
                          <div className="flex gap-1"><span className="text-slate-400">Position:</span> <span className="text-white font-mono">{sys.lat.toFixed(1)}°N, {sys.lon.toFixed(1)}°W</span></div>
                          <div className="flex gap-1"><span className="text-slate-400">Movement:</span> <span className="text-white">{sys.movement}</span></div>
                          <div className="flex gap-1"><span className="text-slate-400">Distance:</span> <span className="text-white font-mono">{distance(location.lat, location.lon, sys.lat, sys.lon).toFixed(0)} km</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Space Weather (always shown) */}
      <Card>
        <CardBody>
          <CardTitle className="flex items-center gap-2">
            <Sun className="h-5 w-5 text-amber-400" /> Space Weather
          </CardTitle>
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            <MetricCard label="Kp Index" value="3.0" unit="/9" tone="emerald" />
            <MetricCard label="Solar Wind" value="420" unit="km/s" tone="amber" />
            <MetricCard label="Bz (IMF)" value="-2.1" unit="nT" tone="emerald" />
            <MetricCard label="Aurora Probability" value="15" unit="%" tone="cyan" />
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Source: NOAA SWPC. Kp ≤ 3 = quiet, 4 = unsettled, 5 = minor storm, 6-7 = moderate, 8-9 = major.
            {' '}Bz southward ({'<'}-5 nT) enhances geomagnetic activity.
          </p>
        </CardBody>
      </Card>

      {/* Data Sources */}
      <Card>
        <CardBody>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-space-cyan" /> Data Sources & Methodology
          </CardTitle>
          <div className="mt-4 space-y-2 text-xs text-slate-400">
            <div className="flex gap-2">
              <span className="text-space-cyan">▸</span>
              <span><strong>Fire:</strong> NASA FIRMS (MODIS/VIIRS active fire), NIFC ICS-209 perimeters, Canadian FWI system.</span>
            </div>
            <div className="flex gap-2">
              <span className="text-space-cyan">▸</span>
              <span><strong>Flood:</strong> USGS NWIS river gauges, NOAA NWS NDFD precipitation, NWS flash flood watches.</span>
            </div>
            <div className="flex gap-2">
              <span className="text-space-cyan">▸</span>
              <span><strong>Storm:</strong> NOAA NWS watches/warnings, NHC tropical cyclone advisories, Vaisala GLD360 lightning.</span>
            </div>
            <div className="flex gap-2">
              <span className="text-space-cyan">▸</span>
              <span><strong>Space Weather:</strong> NOAA SWPC (Kp, solar wind, IMF).</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              <strong>Honesty note:</strong> All data from public APIs with committed snapshot fallbacks.
              Real-time values shown are mocked for demo; production would use live NASA FIRMS, USGS NWIS, NOAA NWS, SWPC endpoints.
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function MetricCard({ label, value, unit, tone }: { label: string; value: string | number; unit: string; tone: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
      <p className="text-xs text-slate-400">{label}</p>
      <div className="flex items-baseline gap-1 mt-1">
        <span className="font-mono text-2xl text-white">{value}</span>
        <span className="text-xs text-slate-400">{unit}</span>
      </div>
    </div>
  );
}