"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Wheat,
  Fish,
  Heart,
  Sun,
  Radio,
  Plane,
  Telescope,
  Sparkles,
  GraduationCap,
  Mountain,
  LocateFixed,
  type LucideIcon,
} from "lucide-react";
import { buildSkyCard, PERSONAS, type SkyCard } from "@/lib/commons";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";

const ICONS: Record<string, LucideIcon> = {
  Wheat,
  Fish,
  Heart,
  Sun,
  Radio,
  Plane,
  Telescope,
  Sparkles,
  GraduationCap,
  Mountain,
};

const STATUS_TONE = {
  computed: "emerald",
  seasonal: "amber",
  live: "slate",
} as const;

function LocationControls({
  lat,
  lon,
  onLat,
  onLon,
}: {
  lat: number;
  lon: number;
  onLat: (v: number) => void;
  onLon: (v: number) => void;
}) {
  function locate() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onLat(Number(pos.coords.latitude.toFixed(3)));
        onLon(Number(pos.coords.longitude.toFixed(3)));
      },
      () => undefined,
      { timeout: 8000 },
    );
  }
  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="text-xs text-slate-400">
        Latitude
        <input
          type="number"
          value={lat}
          step={0.01}
          onChange={(e) => onLat(Number(e.target.value))}
          className="mt-1 block w-28 rounded-lg border border-white/10 bg-space-950/60 px-2 py-1.5 font-mono text-sm text-white outline-none focus:border-space-cyan/60"
        />
      </label>
      <label className="text-xs text-slate-400">
        Longitude
        <input
          type="number"
          value={lon}
          step={0.01}
          onChange={(e) => onLon(Number(e.target.value))}
          className="mt-1 block w-28 rounded-lg border border-white/10 bg-space-950/60 px-2 py-1.5 font-mono text-sm text-white outline-none focus:border-space-cyan/60"
        />
      </label>
      <button
        type="button"
        onClick={locate}
        className="inline-flex items-center gap-1.5 rounded-lg border border-space-cyan/40 bg-space-cyan/10 px-3 py-1.5 text-xs font-medium text-space-cyan transition hover:bg-space-cyan/20"
      >
        <LocateFixed className="h-3.5 w-3.5" /> Use my location
      </button>
    </div>
  );
}

export function CommonsExplorer() {
  const [personaId, setPersonaId] = useState(PERSONAS[0].id);
  const [lat, setLat] = useState(29.56);
  const [lon, setLon] = useState(-95.09);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
  }, []);

  const card: SkyCard | null = useMemo(
    () => (now ? buildSkyCard({ personaId, date: now, latDeg: lat, lonDeg: lon }) : null),
    [personaId, lat, lon, now],
  );

  const ActiveIcon = ICONS[PERSONAS.find((p) => p.id === personaId)?.icon ?? "Sparkles"] ?? Sparkles;

  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
      <SectionHeading kicker="Pillar B · cosmic data commons" title="Who are you? Here's your sky card." />
      <p className="mt-3 max-w-2xl text-slate-400">
        One science engine, many lives. Pick a persona and a place — the card is computed from the same NASA/NOAA
        formulas the whole platform runs on.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        <div>
          <div className="grid grid-cols-3 gap-2">
            {PERSONAS.map((p) => {
              const Icon = ICONS[p.icon] ?? Sparkles;
              const active = p.id === personaId;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPersonaId(p.id)}
                  title={p.name}
                  className={`flex flex-col items-center gap-2 rounded-xl border p-3 transition ${
                    active
                      ? "border-space-cyan/60 bg-space-cyan/10"
                      : "border-white/10 bg-white/[0.02] hover:border-white/25"
                  }`}
                >
                  <Icon className={`h-5 w-5 ${active ? "text-space-cyan" : "text-slate-400"}`} />
                  <span className="text-center text-[10px] leading-tight text-slate-400">
                    {p.name.split(" / ")[0]}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-5">
            <LocationControls lat={lat} lon={lon} onLat={setLat} onLon={setLon} />
          </div>
        </div>

        {card ? (
          <Card>
            <CardBody>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-space-cyan/30 bg-space-cyan/10 text-space-cyan">
                    <ActiveIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle>{card.persona.name}</CardTitle>
                    <p className="mt-1 max-w-md text-sm text-slate-400">{card.persona.tagline}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-3xl text-space-cyan">
                    {card.rating === null ? "—" : card.rating}
                  </p>
                  <p className="text-[11px] uppercase tracking-wider text-slate-500">{card.ratingLabel}</p>
                </div>
              </div>

              {card.rating !== null && (
                <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-space-cyan to-space-emerald"
                    style={{ width: `${card.rating}%` }}
                  />
                </div>
              )}

              <div className="mt-5 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <span className="text-xs uppercase tracking-wider text-slate-500">Action</span>
                <span className="text-sm text-white">{card.action}</span>
              </div>

              {card.cropHint && (
                <p className="mt-3 text-sm text-slate-300">
                  <span className="text-space-amber">Planting hint · </span>
                  {card.cropHint.name} — {card.cropHint.status}
                </p>
              )}

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {card.signals.map((s) => (
                  <div key={s.id} className="rounded-xl border border-white/10 bg-space-950/50 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] uppercase tracking-wider text-slate-500">{s.label}</span>
                      <Badge tone={STATUS_TONE[s.status]}>{s.status}</Badge>
                    </div>
                    <p className="mt-1 font-mono text-lg text-white">{s.value}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{s.detail}</p>
                    <p className="mt-1 text-[10px] text-slate-600">{s.source}</p>
                  </div>
                ))}
              </div>

              <p className="mt-4 text-xs text-slate-500">{card.honesty}</p>
              <p className="mt-1 text-[10px] text-slate-600">
                {card.dateISO} · {card.latDeg}°, {card.lonDeg}°
              </p>
            </CardBody>
          </Card>
        ) : (
          <Card>
            <CardBody>
              <div className="h-64 animate-pulse rounded-xl bg-white/5" />
            </CardBody>
          </Card>
        )}
      </div>
    </section>
  );
}