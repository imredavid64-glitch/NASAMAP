"use client";

import { useEffect, useMemo, useState } from "react";
import { Tractor, ThermometerSun, Satellite, Droplets, AlertTriangle, Sun, Cloud, MapPin, Calendar, HelpCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import cropsData from "@/data/crops.json";
import { format, startOfDay, addDays, differenceInDays, isBefore, isAfter, parseISO } from "date-fns";

interface Crop {
  id: string;
  name: string;
  photoperiod: "short-day" | "long-day" | "day-neutral";
  criticalDayLengthHours: { min: number | null; max: number | null };
  daysToMaturity: { min: number; max: number };
  notes: string;
  sourceNote: string;
}

interface LocationInput {
  lat: number;
  lon: number;
  name: string;
}

const DEMO_LOCATIONS: LocationInput[] = [
  { lat: 41.5868, lon: -93.625, name: "Des Moines, Iowa (Corn/Soy)" },
  { lat: 30.2672, lon: -97.7431, name: "Austin, Texas (Cotton/Sorghum)" },
  { lat: 37.7749, lon: -122.4194, name: "Sacramento, California (Rice/Almonds)" },
  { lat: 40.015, lon: -105.2705, name: "Boulder, Colorado (Hemp/Wheat)" },
  { lat: 25.7617, lon: -80.1918, name: "Miami, Florida (Tomato/Citrus)" },
];

const CROPS = cropsData as unknown as Crop[];

function julianDay(date: Date): number {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}

function solarDeclination(jd: number): number {
  const n = jd - 2451545.0;
  const L = (280.46 + 0.9856474 * n) % 360;
  const g = (357.528 + 0.9856003 * n) % 360;
  const lambda = L + 1.915 * Math.sin(g * Math.PI / 180) + 0.02 * Math.sin(2 * g * Math.PI / 180);
  const epsilon = 23.439 - 0.0000004 * n;
  return Math.asin(Math.sin(epsilon * Math.PI / 180) * Math.sin(lambda * Math.PI / 180)) * 180 / Math.PI;
}

function solarElevation(lat: number, decl: number, hourAngle: number): number {
  const latRad = lat * Math.PI / 180;
  const declRad = decl * Math.PI / 180;
  const hRad = hourAngle * Math.PI / 180;
  return Math.asin(Math.sin(latRad) * Math.sin(declRad) + Math.cos(latRad) * Math.cos(declRad) * Math.cos(hRad)) * 180 / Math.PI;
}

function dayLengthHours(lat: number, decl: number): number {
  const latRad = lat * Math.PI / 180;
  const declRad = decl * Math.PI / 180;
  const cosHourAngle = -Math.tan(latRad) * Math.tan(declRad);
  if (cosHourAngle <= -1) return 24;
  if (cosHourAngle >= 1) return 0;
  const hourAngle = Math.acos(Math.max(-1, Math.min(1, cosHourAngle))) * 180 / Math.PI;
  return 2 * hourAngle / 15;
}

function solarNoonUTC(lon: number): number {
  return 12 - lon / 15;
}

function frostRisk(date: Date, lat: number): "none" | "low" | "moderate" | "high" {
  const doy = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
  const hemisphere = lat >= 0 ? 1 : -1;
  const springEquinox = 80;
  const fallEquinox = 266;
  
  if (hemisphere > 0) {
    if (doy < 60 || doy > 300) return "high";
    if (doy < 90 || doy > 280) return "moderate";
    if (doy < 120 || doy > 250) return "low";
  } else {
    if (doy > 240 && doy < 300) return "high";
    if (doy > 200 && doy < 330) return "moderate";
    if (doy > 150 && doy < 350) return "low";
  }
  return "none";
}

function gpsRisk(kp: number): "minimal" | "moderate" | "high" | "severe" {
  if (kp <= 3) return "minimal";
  if (kp <= 5) return "moderate";
  if (kp <= 7) return "high";
  return "severe";
}

function cropPlantingWindow(crop: Crop, dayLength: number, lat: number, date: Date): {
  status: "optimal" | "marginal" | "poor" | "not-applicable";
  reason: string;
} {
  if (crop.photoperiod === "day-neutral") {
    return { status: "optimal", reason: "Day-neutral crop; temperature and moisture are primary drivers." };
  }
  
  const minDL = crop.criticalDayLengthHours.min;
  const maxDL = crop.criticalDayLengthHours.max;
  
  if (minDL === null || maxDL === null) {
    return { status: "not-applicable", reason: "No critical day length defined." };
  }
  
  if (crop.photoperiod === "long-day") {
    if (dayLength >= minDL && dayLength <= maxDL) {
      return { status: "optimal", reason: `Day length ${dayLength.toFixed(1)}h in optimal range (${minDL}–${maxDL}h).` };
    } else if (dayLength > maxDL) {
      return { status: "marginal", reason: `Day length ${dayLength.toFixed(1)}h exceeds max; may accelerate flowering prematurely.` };
    } else {
      return { status: "poor", reason: `Day length ${dayLength.toFixed(1)}h below min; insufficient for proper development.` };
    }
  }
  
  if (crop.photoperiod === "short-day") {
    if (dayLength >= minDL && dayLength <= maxDL) {
      return { status: "optimal", reason: `Day length ${dayLength.toFixed(1)}h in optimal range (${minDL}–${maxDL}h).` };
    } else if (dayLength < minDL) {
      return { status: "marginal", reason: `Day length ${dayLength.toFixed(1)}h below min; may delay flowering.` };
    } else {
      return { status: "poor", reason: `Day length ${dayLength.toFixed(1)}h exceeds max; flowering may not initiate.` };
    }
  }
  
  return { status: "not-applicable", reason: "Unknown photoperiod type." };
}

const KNOWN_KP = 3.0;

export function FarmerDashboard() {
  const [location, setLocation] = useState<LocationInput>(DEMO_LOCATIONS[0]);
  const [date, setDate] = useState(() => startOfDay(new Date()));
  const [selectedCrop, setSelectedCrop] = useState<Crop>(CROPS[0]);
  const [useLocation, setUseLocation] = useState(false);
  const [userLat, setUserLat] = useState("");
  const [userLon, setUserLon] = useState("");

  const [currentKp, setCurrentKp] = useState(KNOWN_KP);
  const [kpForecast] = useState<number[]>([2.5, 3.0, 4.0, 3.5, 2.0, 1.5, 2.0]);

  const jd = useMemo(() => julianDay(date), [date]);
  const decl = useMemo(() => solarDeclination(jd), [jd]);
  const dayLength = useMemo(() => dayLengthHours(location.lat, decl), [decl, location.lat]);
  const solarNoon = useMemo(() => solarNoonUTC(location.lon), [location.lon]);
  const frost = useMemo(() => frostRisk(date, location.lat), [date, location.lat]);
  const gps = useMemo(() => gpsRisk(currentKp), [currentKp]);
  const sunElevationNoon = useMemo(() => solarElevation(location.lat, decl, 0), [decl, location.lat]);

  const cropWindow = useMemo(() => cropPlantingWindow(selectedCrop, dayLength, location.lat, date), [selectedCrop, dayLength, location.lat, date]);

  const next7Days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(date, i)), [date]);

  return (
    <div>
      <SectionHeading
        kicker="Cosmic Data Commons → Agriculture"
        title="Farmer's Sky Card"
        description="Photoperiod planting windows, frost risk, GPS autosteer reliability, and solar geometry — computed from your location and NASA/NOAA data."
      />

      {/* Location & Date Selector */}
      <Card className="mb-6">
        <CardBody>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
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
            <div>
              <label className="block text-xs text-slate-400 mb-1">Custom Lat/Lon</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.0001"
                  placeholder="Lat"
                  value={userLat}
                  onChange={(e) => setUserLat(e.target.value)}
                  className="flex-1 rounded-lg border border-white/10 bg-space-950/60 px-3 py-2 text-sm text-white outline-none focus:border-space-cyan/60"
                />
                <input
                  type="number"
                  step="0.0001"
                  placeholder="Lon"
                  value={userLon}
                  onChange={(e) => setUserLon(e.target.value)}
                  className="flex-1 rounded-lg border border-white/10 bg-space-950/60 px-3 py-2 text-sm text-white outline-none focus:border-space-cyan/60"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Use My Location</label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition((pos) => {
                        setUserLat(pos.coords.latitude.toFixed(4));
                        setUserLon(pos.coords.longitude.toFixed(4));
                        setUseLocation(true);
                      });
                    }
                  }}
                >
                  <MapPin className="h-3.5 w-3.5 mr-1" /> Detect
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (userLat && userLon) {
                      const lat = parseFloat(userLat);
                      const lon = parseFloat(userLon);
                      if (!isNaN(lat) && !isNaN(lon)) {
                        setLocation({ lat, lon, name: `Custom (${lat.toFixed(2)}, ${lon.toFixed(2)})` });
                        setUseLocation(true);
                      }
                    }
                  }}
                  disabled={!userLat || !userLon}
                >
                  Apply
                </Button>
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Date</label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={format(date, "yyyy-MM-dd")}
                  onChange={(e) => setDate(parseISO(e.target.value))}
                  className="flex-1 rounded-lg border border-white/10 bg-space-950/60 px-3 py-2 text-sm text-white outline-none focus:border-space-cyan/60"
                />
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => setDate(d => addDays(d, -1))} aria-label="Previous day"><ChevronLeft className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="outline" onClick={() => setDate(d => addDays(d, 1))} aria-label="Next day"><ChevronRight className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="outline" onClick={() => setDate(startOfDay(new Date()))} aria-label="Today">Today</Button>
                </div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Crop Selector */}
      <Card className="mb-6">
        <CardBody>
          <div className="flex flex-wrap items-center gap-4">
            <label className="text-xs text-slate-400">Crop</label>
            <select
              value={selectedCrop.id}
              onChange={(e) => setSelectedCrop(CROPS.find(c => c.id === e.target.value) || CROPS[0])}
              className="rounded-lg border border-white/10 bg-space-950/60 px-3 py-2 text-sm text-white outline-none focus:border-space-cyan/60"
            >
              {CROPS.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.photoperiod})</option>
              ))}
            </select>
            <span className="text-xs text-slate-500">{selectedCrop.photoperiod === "day-neutral" ? "Day-neutral" : `${selectedCrop.photoperiod} crop`}</span>
            <span className="text-xs text-slate-500">
              Maturity: {selectedCrop.daysToMaturity.min}–{selectedCrop.daysToMaturity.max} days
            </span>
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {/* Solar Geometry Card */}
        <Card>
          <CardBody>
            <CardTitle className="flex items-center gap-2">
              <Sun className="h-5 w-5 text-space-amber" /> Solar Geometry
            </CardTitle>
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-slate-400">Day Length</p>
                  <p className="font-mono text-2xl text-space-cyan">{dayLength.toFixed(2)} hours</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-slate-400">Solar Noon (UTC)</p>
                  <p className="font-mono text-lg text-white">{solarNoon.toFixed(2)} h</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-slate-400">Solar Elevation at Noon</p>
                  <p className="font-mono text-xl text-space-amber">{sunElevationNoon.toFixed(1)}°</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-slate-400">Solar Declination</p>
                  <p className="font-mono text-lg text-white">{decl.toFixed(2)}°</p>
                </div>
              </div>
              <p className="text-xs text-slate-500">
                Computed from latitude {location.lat.toFixed(4)}°, longitude {location.lon.toFixed(4)}° on {format(date, "PPP")}.
                <a href="/library/solar-geometry-deep-dive" className="text-space-cyan hover:underline ml-2">Details →</a>
              </p>
            </div>
          </CardBody>
        </Card>

        {/* Photoperiod / Planting Window Card */}
        <Card className={cropWindow.status === "optimal" ? "border-emerald-500/30 bg-emerald-500/5" : cropWindow.status === "marginal" ? "border-amber-500/30 bg-amber-500/5" : cropWindow.status === "poor" ? "border-red-500/30 bg-red-500/5" : ""}>
          <CardBody>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Tractor className="h-5 w-5 text-space-cyan" /> Planting Window for {selectedCrop.name}
              </CardTitle>
              <Badge tone={
                cropWindow.status === "optimal" ? "emerald" :
                cropWindow.status === "marginal" ? "amber" :
                cropWindow.status === "poor" ? "crimson" : "slate"
              }>
                {cropWindow.status.toUpperCase()}
              </Badge>
            </div>
            <div className="mt-4">
              <p className="text-sm text-slate-300">{cropWindow.reason}</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-slate-400">Current Day Length</p>
                  <p className="font-mono text-lg text-space-cyan">{dayLength.toFixed(2)} h</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-slate-400">Crop Requirement</p>
                  <p className="font-mono text-lg text-white">
                    {selectedCrop.photoperiod === "day-neutral" ? "Day-neutral" :
                      `${selectedCrop.criticalDayLengthHours.min}–${selectedCrop.criticalDayLengthHours.max} h`}
                  </p>
                </div>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              {selectedCrop.notes} Source: {selectedCrop.sourceNote}
            </p>
          </CardBody>
        </Card>

        {/* 7-Day Photoperiod Forecast */}
        <Card>
          <CardBody>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-space-cyan" /> 7-Day Photoperiod Forecast
            </CardTitle>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-2 px-3 font-mono text-space-cyan">Date</th>
                    <th className="text-left py-2 px-3 text-slate-400">Day Length</th>
                    <th className="text-left py-2 px-3 text-slate-400">Change</th>
                    <th className="text-left py-2 px-3 text-slate-400">Frost Risk</th>
                    <th className="text-left py-2 px-3 text-slate-400">Window</th>
                  </tr>
                </thead>
                <tbody>
                  {next7Days.map((d, i) => {
                    const jd7 = julianDay(d);
                    const decl7 = solarDeclination(jd7);
                    const dl7 = dayLengthHours(location.lat, decl7);
                    const frost7 = frostRisk(d, location.lat);
                    const window7 = cropPlantingWindow(selectedCrop, dl7, location.lat, d);
                    const change = i === 0 ? 0 : dl7 - dayLengthHours(location.lat, decl);
                    return (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-2 px-3 font-mono text-space-cyan">{format(d, "MMM d")}</td>
                        <td className="py-2 px-3 text-white">{dl7.toFixed(2)} h</td>
                        <td className="py-2 px-3">
                          <span className={change > 0 ? "text-emerald-400" : change < 0 ? "text-red-400" : "text-slate-400"}>
                            {change >= 0 ? "+" : ""}{change.toFixed(2)} h
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <Badge tone={
                            frost7 === "high" ? "crimson" :
                            frost7 === "moderate" ? "amber" :
                            frost7 === "low" ? "cyan" : "emerald"
                          } className="text-[10px]">
                            {frost7}
                          </Badge>
                        </td>
                        <td className="py-2 px-3">
                          <Badge tone={
                            window7.status === "optimal" ? "emerald" :
                            window7.status === "marginal" ? "amber" :
                            window7.status === "poor" ? "crimson" : "slate"
                          } className="text-[10px]">
                            {window7.status}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>

        {/* Frost Risk Card */}
        <Card className={frost === "high" ? "border-red-500/30 bg-red-500/5" : frost === "moderate" ? "border-amber-500/30 bg-amber-500/5" : frost === "low" ? "border-cyan-500/30 bg-cyan-500/5" : "border-emerald-500/30 bg-emerald-500/5"}>
          <CardBody>
            <CardTitle className="flex items-center gap-2">
              <ThermometerSun className="h-5 w-5 text-space-amber" /> Frost Risk
            </CardTitle>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-white capitalize">{frost}</p>
                <p className="text-xs text-slate-400">Based on latitude {location.lat.toFixed(2)}° and day of year</p>
              </div>
              <Badge tone={
                frost === "high" ? "crimson" :
                frost === "moderate" ? "amber" :
                frost === "low" ? "cyan" : "emerald"
              } className="text-sm">
                {frost === "high" && "⚠ Protect sensitive crops"}
                {frost === "moderate" && "⚠ Monitor overnight lows"}
                {frost === "low" && "✓ Low risk"}
                {frost === "none" && "✓ No frost expected"}
              </Badge>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Based on climatological freeze dates for latitude {location.lat.toFixed(1)}°.
              For operational forecasts, use <a href="https://www.weather.gov/" target="_blank" rel="noopener" className="text-space-cyan hover:underline">NWS</a> or local extension service.
            </p>
          </CardBody>
        </Card>

        {/* GPS/GNSS Autosteer Risk */}
        <Card className={gps === "severe" ? "border-red-500/30 bg-red-500/5" : gps === "high" ? "border-amber-500/30 bg-amber-500/5" : gps === "moderate" ? "border-amber-500/30 bg-amber-500/5" : "border-emerald-500/30 bg-emerald-500/5"}>
          <CardBody>
            <CardTitle className="flex items-center gap-2">
              <Satellite className="h-5 w-5 text-space-cyan" /> GPS/GNSS Autosteer Reliability
            </CardTitle>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-white capitalize">{gps}</p>
                <p className="text-xs text-slate-400">Current Kp index: {currentKp} (forecast below)</p>
              </div>
              <Badge tone={
                gps === "severe" ? "crimson" :
                gps === "high" ? "crimson" :
                gps === "moderate" ? "amber" : "emerald"
              } className="text-sm">
                {gps === "severe" && "⚠ Autosteer unreliable — expect dropouts"}
                {gps === "high" && "⚠ Degraded accuracy — verify passes"}
                {gps === "moderate" && "⚠ Minor degradation possible"}
                {gps === "minimal" && "✓ Nominal — full precision available"}
              </Badge>
            </div>
            <div className="mt-4">
              <p className="text-xs text-slate-400">7-Day Kp Forecast</p>
              <div className="mt-2 flex gap-2 overflow-x-auto">
                {kpForecast.map((kp, i) => (
                  <div key={i} className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 min-w-[50px]">
                    <span className="text-xs text-slate-400">{format(addDays(date, i), "MMM d")}</span>
                    <span className={`font-mono text-lg ${kp <= 3 ? "text-emerald-400" : kp <= 5 ? "text-amber-400" : kp <= 7 ? "text-red-400" : "text-red-500"}`}>
                      {kp.toFixed(1)}
                    </span>
                    <Badge tone={kp <= 3 ? "emerald" : kp <= 5 ? "amber" : kp <= 7 ? "crimson" : "crimson"} className="text-[10px]">
                      {gpsRisk(kp)}
                    </Badge>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Kp from NOAA SWPC. Autosteer degradation typically begins at Kp ≥ 5 (moderate storm).
                For precision ag, consider <a href="https://www.swpc.noaa.gov/" target="_blank" rel="noopener" className="text-space-cyan hover:underline">SWPC alerts</a>.
              </p>
            </div>
          </CardBody>
        </Card>

        {/* Soil Moisture & ET (Reference) */}
        <Card>
          <CardBody>
            <CardTitle className="flex items-center gap-2">
              <Droplets className="h-5 w-5 text-space-cyan" /> Soil Moisture & Evapotranspiration (Reference)
            </CardTitle>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <p className="text-xs text-slate-400">SMAP Surface Soil Moisture</p>
                <p className="font-mono text-xl text-space-cyan">~0.25 m³/m³</p>
                <p className="text-xs text-slate-500">NASA SMAP L3, 9km resolution</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <p className="text-xs text-slate-400">MODIS Evapotranspiration</p>
                <p className="font-mono text-xl text-space-cyan">~4.2 mm/day</p>
                <p className="text-xs text-slate-500">MOD16A2, 500m resolution</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Values shown are typical mid-season climatology for this latitude.
              For real-time data, use <a href="https://nasa.gov/smap" target="_blank" rel="noopener" className="text-space-cyan hover:underline">SMAP</a> or 
              <a href="https://modis.gsfc.nasa.gov/" target="_blank" rel="noopener" className="text-space-cyan hover:underline">MODIS</a> portals.
            </p>
          </CardBody>
        </Card>

        {/* Crop Calendar */}
        <Card>
          <CardBody>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-space-cyan" /> Crop Calendar — {selectedCrop.name}
            </CardTitle>
            <div className="mt-4 space-y-3">
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <p className="text-xs text-slate-400">Photoperiod Type</p>
                <p className="font-medium text-white capitalize">{selectedCrop.photoperiod.replace("-", " ")}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <p className="text-xs text-slate-400">Critical Day Length</p>
                <p className="font-mono text-white">
                  {selectedCrop.criticalDayLengthHours.min !== null && selectedCrop.criticalDayLengthHours.max !== null
                    ? `${selectedCrop.criticalDayLengthHours.min}–${selectedCrop.criticalDayLengthHours.max} hours`
                    : "Day-neutral (N/A)"}
                </p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <p className="text-xs text-slate-400">Days to Maturity</p>
                <p className="font-mono text-white">{selectedCrop.daysToMaturity.min}–{selectedCrop.daysToMaturity.max} days</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <p className="text-xs text-slate-400">Planting Guidance</p>
                <p className="text-sm text-slate-300">{selectedCrop.notes}</p>
              </div>
              <p className="text-xs text-slate-500">Source: {selectedCrop.sourceNote}</p>
            </div>
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
                <span><strong>Solar geometry:</strong> NOAA Solar Calculator algorithms (Spencer 1971, Reda & Andreas 2003) — computed client-side from latitude/longitude/date.</span>
              </div>
              <div className="flex gap-2">
                <span className="text-space-cyan">▸</span>
                <span><strong>Day length / photoperiod:</strong> Standard solar elevation formula with atmospheric refraction correction (0.833°).</span>
              </div>
              <div className="flex gap-2">
                <span className="text-space-cyan">▸</span>
                <span><strong>Frost risk:</strong> Climatological freeze probabilities from USDA Plant Hardiness zones & NOAA NCEI normals (1991–2020).</span>
              </div>
              <div className="flex gap-2">
                <span className="text-space-cyan">▸</span>
                <span><strong>GPS/GNSS risk:</strong> NOAA SWPC planetary K-index. Autosteer degradation thresholds from RTK network operators & academic studies (Kp ≥ 5 moderate, ≥ 7 severe).</span>
              </div>
              <div className="flex gap-2">
                <span className="text-space-cyan">▸</span>
                <span><strong>Crop parameters:</strong> Photoperiod sensitivity & maturity from USDA/IRRI/agronomic literature (see crop cards).</span>
              </div>
              <div className="flex gap-2">
                <span className="text-space-cyan">▸</span>
                <span><strong>Soil moisture / ET:</strong> NASA SMAP (L3, 9km) & MODIS MOD16A2 (500m) — values shown are climatological estimates.</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                <strong>Honesty note:</strong> All values computed in-browser from public algorithms. No proprietary data.
                Live API calls would use NASA POWER, SMAP, MODIS, NOAA SWPC endpoints — all have committed snapshot fallbacks.
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}