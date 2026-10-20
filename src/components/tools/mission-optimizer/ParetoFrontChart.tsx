"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import type { ParetoPoint } from "@/data/pareto-fronts";

interface ParetoFrontChartProps {
  data: ParetoPoint[];
  selectedArchitecture?: string;
  onSelect: (architecture: string) => void;
}

function getCostColor(costB: number): string {
  if (costB > 2) return "#f87171";
  if (costB > 1) return "#fb923c";
  return "#4ade80";
}

function getRadiationSize(radiationMSv: number): number {
  return Math.max(8, Math.min(24, (radiationMSv / 800) * 24));
}

function GridLines({ count, isHorizontal, width, height }: { count: number; isHorizontal: boolean; width: number; height: number }) {
  const lines = [];
  for (let i = 1; i < count; i++) {
    const t = i / count;
    if (isHorizontal) {
      const y = height - 50 - t * (height - 100);
      lines.push(
        <line key={`h-${i}`} x1={50} y1={y} x2={width - 50} y2={y} stroke="#ffffff05" strokeWidth={1} strokeDasharray="3 3" />
      );
    } else {
      const x = 50 + t * (width - 100);
      lines.push(
        <line key={`v-${i}`} x1={x} y1={50} x2={x} y2={height - 50} stroke="#ffffff05" strokeWidth={1} strokeDasharray="3 3" />
      );
    }
  }
  return lines;
}

export function ParetoFrontChart({ data, selectedArchitecture, onSelect }: ParetoFrontChartProps) {
  const [chartSize, setChartSize] = useState({ width: 800, height: 400 });
  // Measure the plot box itself (not the outer card) so the SVG axes and the
  // absolutely-positioned bubbles share one coordinate space.
  const plotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = plotRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) setChartSize({ width, height });
      }
    });
    observer.observe(el);
    setChartSize({ width: el.clientWidth, height: el.clientHeight });
    return () => observer.disconnect();
  }, []);

  if (!data.length) {
    return (
      <Card>
        <CardBody className="flex items-center justify-center h-96">
          <p className="text-slate-500">No Pareto front data available</p>
        </CardBody>
      </Card>
    );
  }

  const imleos = data.map((d) => d.imleoT);
  const payloads = data.map((d) => d.payloadT);
  // Pad the domain by 8% so bubbles at the extremes are not clipped by the plot box.
  const padRange = (min: number, max: number) => {
    const span = max - min || Math.max(1, Math.abs(max) * 0.1);
    return { min: Math.max(0, min - span * 0.08), max: max + span * 0.08 };
  };
  const xDomain = padRange(Math.min(...imleos), Math.max(...imleos));
  const yDomain = padRange(Math.min(...payloads), Math.max(...payloads));
  const width = chartSize.width;
  const height = chartSize.height;

  const xScale = (imleo: number) =>
    50 + ((imleo - xDomain.min) / (xDomain.max - xDomain.min)) * (width - 100);
  const yScale = (payload: number) =>
    height - 50 - ((payload - yDomain.min) / (yDomain.max - yDomain.min)) * (height - 100);

  return (
    <div className="h-full">
      <Card className="h-full">
        <CardBody>
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-space-cyan/20 text-space-cyan">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </span>
              Pareto Front — IMLEO vs Payload
            </CardTitle>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Each point is a non-dominated architecture. Click to select. Color = Cost ($B), Size = Radiation (mSv)
          </p>
          <div ref={plotRef} className="relative h-96 bg-space-950/50 rounded-lg border border-white/10 overflow-hidden">
            {/* SVG Chart */}
            <svg className="absolute inset-0" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
              {/* Axes */}
              <line x1={50} y1={height - 50} x2={width - 50} y2={height - 50} stroke="#ffffff20" strokeWidth={1} />
              <line x1={50} y1={50} x2={50} y2={height - 50} stroke="#ffffff20" strokeWidth={1} />
              {/* Grid lines */}
              <GridLines count={5} isHorizontal={true} width={width} height={height} />
              <GridLines count={5} isHorizontal={false} width={width} height={height} />
              {/* Axis labels */}
              <text x={width / 2} y={height - 10} fill="#94a3b8" fontSize="11" textAnchor="middle">IMLEO (tonnes)</text>
              <text x={15} y={height / 2} fill="#94a3b8" fontSize="11" textAnchor="middle" transform={`rotate(-90, 15, ${height / 2})`}>Payload to Mars Surface (tonnes)</text>
            </svg>

            {/* Data Points */}
            <div className="absolute inset-0 pointer-events-none">
              {data.map((point) => {
                const size = getRadiationSize(point.radiationMSv);
                // Keep the whole circle inside the plot box even at the domain edges.
                const cx = Math.min(Math.max(xScale(point.imleoT), size + 2), width - size - 2);
                const cy = Math.min(Math.max(yScale(point.payloadT), size + 2), height - size - 2);
                const color = getCostColor(point.costB);
                const isSelected = point.vehicle === selectedArchitecture;

                return (
                  <div
                    key={point.vehicle}
                    style={{
                      position: "absolute",
                      left: cx - size,
                      top: cy - size,
                      width: size * 2,
                      height: size * 2,
                      pointerEvents: "auto",
                    }}
                  >
                    <svg width={size * 2} height={size * 2}>
                      <circle
                        cx={size}
                        cy={size}
                        r={size}
                        fill={color}
                        stroke={isSelected ? "#22d3ee" : "transparent"}
                        strokeWidth={isSelected ? 3 : 0}
                        style={{
                          cursor: "pointer",
                          transition: "all 0.2s",
                          filter: isSelected ? "drop-shadow(0 0 8px #22d3ee)" : "none",
                        }}
                        onClick={() => onSelect(point.vehicle)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.filter = "drop-shadow(0 0 8px #22d3ee)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.filter = isSelected ? "drop-shadow(0 0 8px #22d3ee)" : "none";
                        }}
                      />
                    </svg>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>{"Cost < $1B"}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span>Cost $1-2B</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span>{"Cost > $2B"}</span>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <div className="w-3 h-3 rounded-full bg-slate-400" style={{ width: 8, height: 8 }} />
              <span>Low radiation</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-slate-400" style={{ width: 16, height: 16 }} />
              <span>High radiation</span>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}