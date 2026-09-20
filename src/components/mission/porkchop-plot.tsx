"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/cn";
import { Download, RotateCcw, Info, Minimize2, Maximize2 } from "lucide-react";
import { generatePorkchop, getC3Contours, getTOFContours, findOptimalWindows, type PorkchopParams, type PorkchopData } from "@/lib/porkchop";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { useToast, successToast } from "@/components/ui/toast";

const C3_LEVELS = [5, 10, 15, 20, 30, 40, 60, 80, 100, 150];
const TOF_LEVELS = [100, 150, 200, 250, 300, 350, 400];

export function PorkchopPlot() {
  const { toast } = useToast();
  const [params, setParams] = useState<PorkchopParams>({
    departureStart: new Date("2026-01-01"),
    departureEnd: new Date("2028-12-31"),
    arrivalStart: new Date("2026-06-01"),
    arrivalEnd: new Date("2029-06-30"),
    stepDays: 5,
  });
  const [data, setData] = useState<ReturnType<typeof generatePorkchop> | null>(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"c3" | "tof" | "both">("c3");
  const [showContours, setShowContours] = useState(true);
  const [showWindows, setShowWindows] = useState(true);
  const [colorScheme, setColorScheme] = useState<"viridis" | "plasma" | "hot" | "cool">("viridis");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoverPoint, setHoverPoint] = useState<{ x: number; y: number; value: number; dep: string; arr: string } | null>(null);

  const generate = async () => {
    setLoading(true);
    try {
      const result = generatePorkchop(params);
      setData(result);
      toast(successToast("Porkchop generated!", `${result.points.length} transfer solutions computed`));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generate();
  }, [params.departureStart, params.departureEnd, params.arrivalStart, params.arrivalEnd, params.stepDays]);

  const windows = useMemo(() => data ? findOptimalWindows(data) : [], [data]);
  const c3Contours = useMemo(() => data && showContours ? getC3Contours(data, C3_LEVELS) : [], [data, showContours]);
  const tofContours = useMemo(() => data && showContours ? getTOFContours(data, TOF_LEVELS) : [], [data, showContours]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    
    const width = rect.width;
    const height = rect.height;
    const padding = 60;
    
    // Clear
    ctx.fillStyle = "#0b1120";
    ctx.fillRect(0, 0, width, height);
    
    if (!data || data.points.length === 0) return;
    
    // Coordinate mapping
    const depMin = data.departureRange[0];
    const depMax = data.departureRange[1];
    const arrMin = data.arrivalRange[0];
    const arrMax = data.arrivalRange[1];
    
    const mapX = (jd: number) => padding + ((jd - depMin) / (depMax - depMin)) * (width - 2 * padding);
    const mapY = (jd: number) => height - padding - ((jd - arrMin) / (arrMax - arrMin)) * (height - 2 * padding);
    
    // Draw grid
    ctx.strokeStyle = "#1a1f3a";
    ctx.lineWidth = 0.5;
    
    // Vertical grid lines (departure dates)
    const depStep = (depMax - depMin) / 10;
    for (let i = 0; i <= 10; i++) {
      const jd = depMin + i * depStep;
      const x = mapX(jd);
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
      
      // Label
      const date = new Date((jd - 2440587.5) * 86400000);
      ctx.fillStyle = "#475569";
      ctx.font = "10px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(date.toISOString().split("T")[0].slice(0, 7), x, height - padding + 20);
    }
    
    // Horizontal grid lines (arrival dates)
    const arrStep = (arrMax - arrMin) / 10;
    for (let i = 0; i <= 10; i++) {
      const jd = arrMin + i * arrStep;
      const y = mapY(jd);
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
      
      // Label
      const date = new Date((jd - 2440587.5) * 86400000);
      ctx.fillStyle = "#475569";
      ctx.font = "10px Inter, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(date.toISOString().split("T")[0].slice(0, 7), padding - 10, y + 4);
    }
    
    // Axes labels
    ctx.fillStyle = "#94a3b8";
    ctx.font = "12px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Departure Date", width / 2, height - 10);
    ctx.save();
    ctx.translate(20, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("Arrival Date", 0, 0);
    ctx.restore();
    
    // Color scale
    const getColor = (value: number, min: number, max: number) => {
      const t = Math.max(0, Math.min(1, (value - min) / (max - min)));
      if (colorScheme === "viridis") {
        // Viridis approximation
        const r = Math.round(68 + 190 * t);
        const g = Math.round(1 + 160 * t * (1 - t * 0.5));
        const b = Math.round(84 + 100 * t * t);
        return `rgb(${r},${g},${b})`;
      } else if (colorScheme === "plasma") {
        const r = Math.round(13 + 230 * t);
        const g = Math.round(8 + 120 * t * (1 - t));
        const b = Math.round(135 + 100 * t * t);
        return `rgb(${r},${g},${b})`;
      } else if (colorScheme === "hot") {
        const r = Math.min(255, Math.round(255 * t * 2));
        const g = Math.min(255, Math.round(255 * (t - 0.5) * 2));
        const b = Math.min(255, Math.round(255 * (t - 0.75) * 4));
        return `rgb(${r},${g},${b})`;
      } else {
        // cool
        const r = Math.round(255 * (1 - t));
        const g = Math.round(255 * t);
        const b = 255;
        return `rgb(${r},${g},${b})`;
      }
    };
    
    // Draw data points as colored pixels
    const pointRadius = 1;
    for (const p of data.points) {
      const x = mapX(p.departureJD);
      const y = mapY(p.arrivalJD);
      
      if (x < padding || x > width - padding || y < padding || y > height - padding) continue;
      
      const value = view === "c3" ? p.c3 : p.tofDays;
      const minVal = view === "c3" ? data.minC3 : data.minTOF;
      const maxVal = view === "c3" ? data.maxC3 : data.maxTOF;
      const color = getColor(value, minVal, maxVal);
      
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, pointRadius, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Draw contours
    if (showContours) {
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 3]);
      
      if (view === "c3" || view === "both") {
        for (const contour of c3Contours) {
          ctx.strokeStyle = "#22d3ee";
          ctx.globalAlpha = 0.6;
          ctx.beginPath();
          for (let i = 0; i < contour.points.length; i++) {
            const pt = contour.points[i];
            const x = mapX(pt.x);
            const y = mapY(pt.y);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
          
          // Label
          if (contour.points.length > 0) {
            const pt = contour.points[contour.points.length - 1];
            ctx.fillStyle = "#22d3ee";
            ctx.font = "9px JetBrains Mono, monospace";
            ctx.textAlign = "left";
            ctx.fillText(`${contour.level} km²/s²`, mapX(pt.x) + 5, mapY(pt.y) - 5);
          }
        }
      }
      
      if (view === "tof" || view === "both") {
        for (const contour of tofContours) {
          ctx.strokeStyle = "#fbbf24";
          ctx.globalAlpha = 0.6;
          ctx.beginPath();
          for (let i = 0; i < contour.points.length; i++) {
            const pt = contour.points[i];
            const x = mapX(pt.x);
            const y = mapY(pt.y);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
          
          if (contour.points.length > 0) {
            const pt = contour.points[contour.points.length - 1];
            ctx.fillStyle = "#fbbf24";
            ctx.font = "9px JetBrains Mono, monospace";
            ctx.textAlign = "left";
            ctx.fillText(`${contour.level} days`, mapX(pt.x) + 5, mapY(pt.y) - 5);
          }
        }
      }
      
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }
    
    // Draw optimal windows
    if (showWindows) {
      const windows = findOptimalWindows(data);
      for (const w of windows.slice(0, 10)) {
        const x = mapX(w.departureJD);
        const y = mapY(w.arrivalJD);
        
        // Pulsing circle
        const time = Date.now() / 1000;
        const pulse = 6 + Math.sin(time * 3) * 2;
        
        ctx.strokeStyle = "#00f59c";
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.arc(x, y, pulse, 0, Math.PI * 2);
        ctx.stroke();
        
        // Center dot
        ctx.fillStyle = "#00f59c";
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.globalAlpha = 1;
      }
    }
    
    // Colorbar
    const barWidth = 20;
    const barHeight = height - 2 * padding;
    const barX = width - padding - barWidth - 10;
    const barY = padding;
    
    const gradient = ctx.createLinearGradient(0, barY + barHeight, 0, barY);
    const stops = view === "c3" ? 10 : 7;
    for (let i = 0; i <= stops; i++) {
      const t = i / stops;
      const val = view === "c3" ? data.minC3 + t * (data.maxC3 - data.minC3) : data.minTOF + t * (data.maxTOF - data.minTOF);
      gradient.addColorStop(1 - t, getColor(val, view === "c3" ? data.minC3 : data.minTOF, view === "c3" ? data.maxC3 : data.maxTOF));
    }
    
    ctx.fillStyle = gradient;
    ctx.fillRect(barX, barY, barWidth, barHeight);
    ctx.strokeStyle = "#475569";
    ctx.strokeRect(barX, barY, barWidth, barHeight);
    
    // Colorbar labels
    ctx.fillStyle = "#94a3b8";
    ctx.font = "9px JetBrains Mono, monospace";
    ctx.textAlign = "left";
    for (let i = 0; i <= stops; i++) {
      const t = i / stops;
      const val = view === "c3" ? data.minC3 + t * (data.maxC3 - data.minC3) : data.minTOF + t * (data.maxTOF - data.minTOF);
      const y = barY + barHeight - t * barHeight + 4;
      ctx.fillText(`${view === "c3" ? val.toFixed(0) : val.toFixed(0)} ${view === "c3" ? "km²/s²" : "days"}`, barX + barWidth + 5, y);
    }
    
    // Title
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 14px Inter, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`${view === "c3" ? "C3 (km²/s²)" : view === "tof" ? "Time of Flight (days)" : "C3 / TOF"} — Earth→Mars Porkchop Plot`, padding, padding - 20);
    
    // Hover info
    if (hoverPoint) {
      ctx.fillStyle = "rgba(11, 17, 32, 0.95)";
      ctx.strokeStyle = "#22d3ee";
      ctx.lineWidth = 1;
      const text = [
        `Departure: ${hoverPoint.dep}`,
        `Arrival: ${hoverPoint.arr}`,
        `TOF: ${hoverPoint.value.toFixed(1)} ${view === "c3" ? "km²/s²" : "days"}`,
        `C3: ${hoverPoint.value.toFixed(1)} km²/s²`,
      ];
      const boxWidth = 200;
      const boxHeight = text.length * 18 + 16;
      const boxX = Math.min(hoverPoint.x + 15, width - boxWidth - 15);
      const boxY = Math.max(hoverPoint.y - boxHeight - 10, 15);
      
      ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
      ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
      
      ctx.fillStyle = "#ffffff";
      ctx.font = "11px JetBrains Mono, monospace";
      ctx.textAlign = "left";
      text.forEach((line, i) => {
        ctx.fillText(line, boxX + 8, boxY + 14 + i * 18);
      });
    }
  }, [data, view, showContours, showWindows, colorScheme]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const drawLoop = () => {
      draw();
      requestAnimationFrame(drawLoop);
    };
    requestAnimationFrame(drawLoop);
  }, [draw]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!data || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const padding = 60;
    const depMin = data.departureRange[0];
    const depMax = data.departureRange[1];
    const arrMin = data.arrivalRange[0];
    const arrMax = data.arrivalRange[1];
    const width = rect.width;
    const height = rect.height;
    
    const mapX = (jd: number) => padding + ((jd - data.departureRange[0]) / (data.departureRange[1] - data.departureRange[0])) * (width - 2 * padding);
    const mapY = (jd: number) => height - padding - ((jd - data.arrivalRange[0]) / (data.arrivalRange[1] - data.arrivalRange[0])) * (height - 2 * padding);
    
    // Find nearest point
    let nearest: { x: number; y: number; value: number; dep: string; arr: string } | null = null;
    let minDist = Infinity;
    
    for (const p of data.points) {
      const px = padding + ((p.departureJD - depMin) / (depMax - depMin)) * (rect.width - 2 * padding);
      const py = height - padding - ((p.arrivalJD - arrMin) / (arrMax - arrMin)) * (height - 2 * padding);
      
      const dist = Math.hypot(px - x, py - y);
      if (dist < minDist && dist < 20) {
        minDist = dist;
        const val = view === "c3" ? p.c3 : p.tofDays;
        nearest = {
          x: px,
          y: py,
          value: val,
          dep: new Date((p.departureJD - 2440587.5) * 86400000).toISOString().split("T")[0],
          arr: new Date((p.arrivalJD - 2440587.5) * 86400000).toISOString().split("T")[0],
        };
      }
    }
    
    setHoverPoint(nearest);
  };

  const handleMouseLeave = () => setHoverPoint(null);

  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const link = document.createElement("a");
    link.download = `nasamap-porkchop-${new Date().toISOString().split("T")[0]}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <section id="porkchop" className="scroll-mt-20">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <SectionHeading kicker="Astrodynamics Lab" title="Porkchop Plot Generator" />
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 rounded-lg border border-space-cyan/40 bg-space-cyan/10 px-3 py-2 text-xs font-medium text-space-cyan hover:bg-space-cyan/20 focus-visible:ring-2 focus-visible:ring-space-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-space-950"
          >
            <Download className="h-3.5 w-3.5" /> Export PNG
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <div className="glass-panel p-4 rounded-xl">
          <label className="block text-xs text-slate-400 mb-1">Departure Window</label>
          <div className="flex items-center gap-2 text-sm">
            <input
              type="date"
              value={params.departureStart.toISOString().split("T")[0]}
              onChange={(e) => setParams({ ...params, departureStart: new Date(e.target.value) })}
              className="flex-1 rounded-lg border border-white/10 bg-space-950/60 px-2 py-1.5 text-sm text-white outline-none focus:border-space-cyan/60"
            />
            <span className="text-slate-500">to</span>
            <input
              type="date"
              value={params.departureEnd.toISOString().split("T")[0]}
              onChange={(e) => setParams({ ...params, departureEnd: new Date(e.target.value) })}
              className="flex-1 rounded-lg border border-white/10 bg-space-950/60 px-2 py-1.5 text-sm text-white outline-none focus:border-space-cyan/60"
            />
          </div>
        </div>
        
        <div className="glass-panel p-4 rounded-xl">
          <label className="block text-xs text-slate-400 mb-1">Arrival Window</label>
          <div className="flex items-center gap-2 text-sm">
            <input
              type="date"
              value={params.arrivalStart.toISOString().split("T")[0]}
              onChange={(e) => setParams({ ...params, arrivalStart: new Date(e.target.value) })}
              className="flex-1 rounded-lg border border-white/10 bg-space-950/60 px-2 py-1.5 text-sm text-white outline-none focus:border-space-cyan/60"
            />
            <span className="text-slate-500">to</span>
            <input
              type="date"
              value={params.arrivalEnd.toISOString().split("T")[0]}
              onChange={(e) => setParams({ ...params, arrivalEnd: new Date(e.target.value) })}
              className="flex-1 rounded-lg border border-white/10 bg-space-950/60 px-2 py-1.5 text-sm text-white outline-none focus:border-space-cyan/60"
            />
          </div>
        </div>
        
        <div className="glass-panel p-4 rounded-xl">
          <label className="block text-xs text-slate-400 mb-1">Step (days)</label>
          <select
            value={params.stepDays}
            onChange={(e) => setParams({ ...params, stepDays: Number(e.target.value) })}
            className="w-full rounded-lg border border-white/10 bg-space-950/60 px-3 py-2 text-sm text-white outline-none focus:border-space-cyan/60"
          >
            <option value={2}>2 days (fine)</option>
            <option value={5}>5 days</option>
            <option value={10}>10 days (coarse)</option>
            <option value={20}>20 days (very coarse)</option>
          </select>
        </div>
        
        <div className="glass-panel p-4 rounded-xl flex items-end">
          <button
            onClick={generate}
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-space-cyan/40 bg-space-cyan/10 px-3 py-2 text-xs font-medium text-space-cyan transition hover:bg-space-cyan/20 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-space-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-space-950"
          >
            {loading ? "Computing…" : "Generate"}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">View:</span>
          <select
            value={view}
            onChange={(e) => setView(e.target.value as "c3" | "tof" | "both")}
            className="rounded-lg border border-white/10 bg-space-950/60 px-3 py-1.5 text-sm text-white outline-none focus:border-space-cyan/60"
          >
            <option value="c3">C3 (km²/s²)</option>
            <option value="tof">Time of Flight (days)</option>
            <option value="both">Both (overlay)</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Colormap:</span>
          <select
            value={colorScheme}
            onChange={(e) => setColorScheme(e.target.value as "viridis" | "plasma" | "hot" | "cool")}
            className="rounded-lg border border-white/10 bg-space-950/60 px-3 py-1.5 text-sm text-white outline-none focus:border-space-cyan/60"
          >
            <option value="viridis">Viridis</option>
            <option value="plasma">Plasma</option>
            <option value="hot">Hot</option>
            <option value="cool">Cool</option>
          </select>
        </div>
        
        <label className="inline-flex items-center gap-2 text-xs text-slate-300">
          <input
            type="checkbox"
            checked={showContours}
            onChange={(e) => setShowContours(e.target.checked)}
            className="rounded border-white/20 text-space-cyan focus:ring-space-cyan"
          />
          Contours
        </label>
        
        <label className="inline-flex items-center gap-2 text-xs text-slate-300">
          <input
            type="checkbox"
            checked={showWindows}
            onChange={(e) => setShowWindows(e.target.checked)}
            className="rounded border-white/20 text-space-emerald focus:ring-space-emerald"
          />
          Optimal Windows
        </label>
      </div>

      <div className="relative h-[600px] rounded-2xl border border-white/10 bg-black/30 overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ cursor: "crosshair" }}
        />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="text-center space-y-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-space-cyan/30 border-t-space-cyan animate-spin" />
              <p className="text-sm text-slate-300">Solving Lambert's problem for {Math.round((params.departureEnd.getTime() - params.departureStart.getTime()) / (params.stepDays * 86400000) * (params.arrivalEnd.getTime() - params.arrivalStart.getTime()) / (params.stepDays * 86400000))} transfer combinations…</p>
            </div>
          </div>
        )}
      </div>

      {data && (
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Card>
            <CardBody>
              <CardTitle className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-full bg-space-cyan" />
                C3 Range
              </CardTitle>
              <p className="mt-2 font-mono text-2xl text-space-cyan">
                {data.minC3.toFixed(1)} – {data.maxC3.toFixed(1)} km²/s²
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <CardTitle className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-full bg-space-amber" />
                Time of Flight
              </CardTitle>
              <p className="mt-2 font-mono text-2xl text-space-amber">
                {data.minTOF.toFixed(0)} – {data.maxTOF.toFixed(0)} days
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <CardTitle className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-full bg-space-emerald" />
                Optimal Windows
              </CardTitle>
              <p className="mt-2 font-mono text-2xl text-space-emerald">
                {findOptimalWindows(data).length} found
              </p>
            </CardBody>
          </Card>
        </div>
      )}
    </section>
  );
}