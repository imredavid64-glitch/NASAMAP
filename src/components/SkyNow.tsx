"use client";

import { useEffect, useMemo, useState } from "react";
import {
  dayLengthHours,
  gmstHours,
  moonPhase,
  sunriseSunset,
  type SunriseSunset,
} from "@/lib/astro";
import { lightTime } from "@/lib/comm";
import { Stat } from "@/components/ui/stat";

const DEFAULT_LAT = 29.7604; // Houston — NASA Johnson Space Center
const DEFAULT_LON = -95.3698;
const DEFAULT_LABEL = "Houston (default)";

function fmtClock(d: Date): string {
  return d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  });
}

export function SkyNow() {
  const [lat, setLat] = useState(DEFAULT_LAT);
  const [lon, setLon] = useState(DEFAULT_LON);
  const [label, setLabel] = useState(DEFAULT_LABEL);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude);
          setLon(pos.coords.longitude);
          setLabel("you");
        },
        () => {},
        { timeout: 2500 },
      );
    }
  }, []);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const data = useMemo(() => {
    if (!now) return null;
    const ss: SunriseSunset = sunriseSunset(now, lat, lon);
    const moon = moonPhase(now);
    const moonLight = lightTime(384400);
    return { ss, moon, moonLight, gmst: gmstHours(now) };
  }, [now, lat, lon]);

  if (!now || !data) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {[0, 1, 2, 3, 4].map((i) => (
          <Stat key={i} label="…" value="—" />
        ))}
      </div>
    );
  }

  const moonPct = Math.round(data.moon.illumination * 100);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <Stat label="Location" value={label} sub={`${lat.toFixed(2)}°, ${lon.toFixed(2)}°`} />
      <Stat
        label="Sunrise / Sunset"
        value={<span className="text-lg">{fmtClock(data.ss.sunriseUTC)}</span>}
        sub={`↑ / ↓ ${fmtClock(data.ss.sunsetUTC)}`}
      />
      <Stat
        label="Day length"
        value={`${data.ss.dayLengthHours.toFixed(1)}h`}
        sub={`${Math.round(data.ss.dayLengthMin)} min`}
      />
      <Stat
        label="Moon"
        value={data.moon.name.replace(" Moon", "")}
        sub={`${moonPct}% lit · age ${data.moon.ageDays.toFixed(1)}d`}
      />
      <Stat
        label="Moon round-trip"
        value={data.moonLight.roundTripLabel}
        sub="light · 384,400 km"
      />
    </div>
  );
}