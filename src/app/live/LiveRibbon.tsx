"use client";

import { useCallback, useEffect, useState } from "react";
import {
  RefreshCw,
  Satellite,
  Send,
  Star,
  Triangle,
  Zap,
  ExternalLink,
  LocateFixed,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";

interface Feed {
  source: "live" | "snapshot";
  fetchedAt: string;
}

interface IssResponse extends Feed {
  tle: { name: string };
  subpoint: { latDeg: number; lonDeg: number; altitudeKm: number } | null;
  passes: { startUtc: string; peakUtc: string; maxElevationDeg: number; durationMin: number }[];
}
interface VoyagerResponse extends Feed {
  bodies: { name: string; distanceAu: number; oneWayLabel: string; roundTripLabel: string }[];
}
interface ApodResponse extends Feed {
  apod: { date: string; title: string; url: string; copyright?: string };
}
interface NeoResponse extends Feed {
  neo: { date: string; count: number; objects: { name: string; hazardous: boolean; diameterKm: number; missKm: number; velocityKps: number }[] };
}
interface SwResponse extends Feed {
  spaceWeather: { kp: number; observedAt: string; level: string };
}

function SourceBadge({ source }: { source: "live" | "snapshot" }) {
  return source === "live" ? <Badge tone="emerald">live</Badge> : <Badge tone="amber">snapshot</Badge>;
}

function fmtUtc(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
}

function useFeeds(lat: number, lon: number) {
  const [iss, setIss] = useState<IssResponse | null>(null);
  const [voyager, setVoyager] = useState<VoyagerResponse | null>(null);
  const [apod, setApod] = useState<ApodResponse | null>(null);
  const [neo, setNeo] = useState<NeoResponse | null>(null);
  const [sw, setSw] = useState<SwResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [at, setAt] = useState<string>("");

  const load = useCallback(async () => {
    setLoading(true);
    const j = async <T,>(url: string): Promise<T | null> => {
      try {
        const res = await fetch(url);
        return res.ok ? ((await res.json()) as T) : null;
      } catch {
        return null;
      }
    };
    const [i, v, a, n, s] = await Promise.all([
      j<IssResponse>(`/api/live/iss?lat=${lat}&lon=${lon}`),
      j<VoyagerResponse>("/api/live/voyager"),
      j<ApodResponse>("/api/live/apod"),
      j<NeoResponse>("/api/live/neo"),
      j<SwResponse>("/api/live/space-weather"),
    ]);
    setIss(i);
    setVoyager(v);
    setApod(a);
    setNeo(n);
    setSw(s);
    setAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    setLoading(false);
  }, [lat, lon]);

  useEffect(() => {
    void load();
  }, [load]);

  return { iss, voyager, apod, neo, sw, loading, at, reload: load };
}

function Skeleton() {
  return <div className="h-40 animate-pulse rounded-xl bg-white/5" />;
}

export function LiveRibbon() {
  const [lat, setLat] = useState(29.56);
  const [lon, setLon] = useState(-95.09);
  const { iss, voyager, apod, neo, sw, loading, at, reload } = useFeeds(lat, lon);

  function locate() {
    navigator.geolocation?.getCurrentPosition(
      (p) => {
        setLat(Number(p.coords.latitude.toFixed(3)));
        setLon(Number(p.coords.longitude.toFixed(3)));
      },
      () => undefined,
      { timeout: 8000 },
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <SectionHeading kicker="Live frontier ribbon" title="What's happening in space, right now." />
          <p className="mt-3 max-w-2xl text-slate-400">
            Every card tries the live NASA / NOAA / CelesTrak feed and falls back to a real, dated snapshot. The badge
            always tells you which one you are looking at.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs text-slate-400">
            Lat
            <input
              type="number"
              value={lat}
              step={0.01}
              onChange={(e) => setLat(Number(e.target.value))}
              className="ml-2 w-24 rounded-lg border border-white/10 bg-space-950/60 px-2 py-1 font-mono text-sm text-white outline-none focus:border-space-cyan/60"
            />
          </label>
          <label className="text-xs text-slate-400">
            Lon
            <input
              type="number"
              value={lon}
              step={0.01}
              onChange={(e) => setLon(Number(e.target.value))}
              className="ml-2 w-24 rounded-lg border border-white/10 bg-space-950/60 px-2 py-1 font-mono text-sm text-white outline-none focus:border-space-cyan/60"
            />
          </label>
          <button
            type="button"
            onClick={locate}
            className="inline-flex items-center gap-1.5 rounded-lg border border-space-cyan/40 bg-space-cyan/10 px-3 py-1.5 text-xs font-medium text-space-cyan transition hover:bg-space-cyan/20"
          >
            <LocateFixed className="h-3.5 w-3.5" /> Locate
          </button>
          <button
            type="button"
            onClick={() => void reload()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/10"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {iss ? (
          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Satellite className="h-4 w-4 text-space-cyan" /> International Space Station
                </CardTitle>
                <SourceBadge source={iss.source} />
              </div>
              {iss.subpoint && (
                <p className="mt-3 font-mono text-sm text-slate-300">
                  {iss.subpoint.latDeg.toFixed(2)}°, {iss.subpoint.lonDeg.toFixed(2)}° · {iss.subpoint.altitudeKm.toFixed(0)} km up
                </p>
              )}
              <p className="mt-3 text-xs uppercase tracking-wider text-slate-500">Passes over you (≥10°)</p>
              {iss.passes.length === 0 ? (
                <p className="mt-1 text-sm text-slate-400">No visible passes in the next 24 h.</p>
              ) : (
                <ul className="mt-1 space-y-1 text-sm text-slate-300">
                  {iss.passes.slice(0, 4).map((p) => (
                    <li key={p.startUtc} className="font-mono">
                      {fmtUtc(p.peakUtc)} UTC · max {p.maxElevationDeg.toFixed(0)}° · {p.durationMin.toFixed(0)} min
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        ) : (
          <Skeleton />
        )}

        {voyager ? (
          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-4 w-4 text-space-cyan" /> Voyager
                </CardTitle>
                <SourceBadge source={voyager.source} />
              </div>
              <div className="mt-3 space-y-3">
                {voyager.bodies.map((b) => (
                  <div key={b.name}>
                    <div className="flex justify-between font-mono text-sm text-white">
                      <span>{b.name}</span>
                      <span>{b.distanceAu.toFixed(1)} AU</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      a message takes {b.oneWayLabel} each way · {b.roundTripLabel} round trip
                    </p>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        ) : (
          <Skeleton />
        )}

        {sw ? (
          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-space-cyan" /> Space weather
                </CardTitle>
                <SourceBadge source={sw.source} />
              </div>
              <p className="mt-3 font-mono text-3xl text-space-cyan">Kp {sw.spaceWeather.kp.toFixed(1)}</p>
              <p className="mt-1 text-sm capitalize text-slate-300">{sw.spaceWeather.level}</p>
              <p className="mt-1 text-xs text-slate-500">
                observed {new Date(sw.spaceWeather.observedAt).toLocaleString([], { timeZone: "UTC" })} UTC
              </p>
              <p className="mt-3 text-xs text-slate-400">
                Drives the GNSS &amp; HF signals used on the Commons cards.
              </p>
            </CardBody>
          </Card>
        ) : (
          <Skeleton />
        )}

        {neo ? (
          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Triangle className="h-4 w-4 text-space-cyan" /> Near-Earth objects
                </CardTitle>
                <SourceBadge source={neo.source} />
              </div>
              <p className="mt-3 text-sm text-slate-300">
                {neo.neo.count} close approaches on {neo.neo.date}
              </p>
              <ul className="mt-2 space-y-1 text-xs text-slate-400">
                {neo.neo.objects.slice(0, 4).map((o) => (
                  <li key={o.name} className="flex justify-between font-mono">
                    <span>
                      {o.name}
                      {o.hazardous && <span className="ml-1 text-red-400">PHA</span>}
                    </span>
                    <span>{(o.diameterKm * 1000).toFixed(0)} m · {(o.missKm / 1e6).toFixed(1)} Mkm</span>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        ) : (
          <Skeleton />
        )}

        {apod ? (
          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-space-cyan" /> Astronomy Picture of the Day
                </CardTitle>
                <SourceBadge source={apod.source} />
              </div>
              <a href={apod.apod.url} target="_blank" rel="noreferrer" className="mt-3 block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={apod.apod.url}
                  alt={apod.apod.title}
                  className="h-36 w-full rounded-lg border border-white/10 object-cover"
                  loading="lazy"
                />
                <p className="mt-2 text-sm font-medium text-white">{apod.apod.title}</p>
              </a>
              <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                {apod.apod.date} · {apod.apod.copyright ?? "NASA"}
                <ExternalLink className="h-3 w-3" />
              </p>
            </CardBody>
          </Card>
        ) : (
          <Skeleton />
        )}
      </div>

      {at && (
        <p className="mt-4 text-xs text-slate-600">
          Last checked {at} · feeds refresh on demand; snapshots are committed to the repository so the page never
          breaks offline.
        </p>
      )}
    </section>
  );
}