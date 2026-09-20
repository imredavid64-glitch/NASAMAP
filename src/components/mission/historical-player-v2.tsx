"use client";

import { useEffect, useMemo, useState } from "react";
import { Play, Pause, SkipBack, SkipForward, ChevronLeft, Download, RotateCcw, Info, Globe, Rocket, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { HistoricalMission, generateMissionTrajectory, exportTrajectoryCSV, type MissionTrajectory, type TrajectoryPosition } from "@/lib/historical-missions";
import { ChevronRight } from "lucide-react";

interface HistoricalPlayerProps {
  mission: HistoricalMission;
  onBack?: () => void;
}

function TimelineScrubber({ 
  progress, 
  onSeek, 
  durationSec, 
  currentEvent,
  totalDurationSec 
}: { 
  progress: number; 
  onSeek: (value: number) => void; 
  durationSec: number;
  currentEvent?: { name: string; timeSec: number };
  totalDurationSec: number;
}) {
  const formatTime = (sec: number) => {
    const days = Math.floor(sec / 86400);
    const hours = Math.floor((sec % 86400) / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>{formatTime(durationSec)}</span>
        <span>{formatTime(totalDurationSec)}</span>
      </div>
      <input
        type="range"
        min="0"
        max="1"
        step="0.001"
        value={progress}
        onChange={(e) => onSeek(parseFloat(e.target.value))}
        className="w-full accent-space-cyan h-2"
        aria-label="Mission timeline"
      />
      {currentEvent && (
        <p className="text-xs text-space-cyan font-mono">
          {currentEvent.name} at {formatTime(currentEvent.timeSec)}
        </p>
      )}
    </div>
  );
}

function OrbitView({ trajectory, progress, currentEvent }: { 
  trajectory: MissionTrajectory; 
  progress: number;
  currentEvent?: TrajectoryPosition;
}) {
  const positions = trajectory.positions;
  const pos = positions[Math.floor(progress * (positions.length - 1))] || positions[0];
  
  // Earth and destination positions
  const earth = { x: 0, y: 0, r: 8 };
  const isMoon = trajectory.mission.destination === "moon";
  const isMars = trajectory.mission.destination === "mars";
  const isInterstellar = trajectory.mission.destination === "interstellar";
  
  let destination = { x: 200, y: 0, r: 4, label: "Moon", color: "#b9c8e6" };
  if (isMars) destination = { x: 300, y: 0, r: 6, label: "Mars", color: "#e2683f" };
  if (isInterstellar) destination = { x: 350, y: 0, r: 4, label: "Target", color: "#f5d67b" };
  
  return (
    <div className="relative aspect-square bg-space-950/50 rounded-xl border border-white/10 overflow-hidden">
      {/* Trajectory path */}
      <svg className="absolute inset-0" viewBox="0 0 400 400">
        {/* Draw trajectory path */}
        <path
          d={trajectory.positions.slice(0, Math.floor(progress * (trajectory.positions.length - 1))).map((p, i) => 
            `${i === 0 ? "M" : "L"} ${200 + p.x * 0.5} ${200 - p.y * 0.5}`
          ).join(" ")}
          stroke="#06b6d4"
          strokeWidth="1.5"
          fill="none"
          opacity="0.6"
        />
        {/* Full path faint */}
        <path
          d={trajectory.positions.map((p, i) => 
            `${i === 0 ? "M" : "L"} ${200 + p.x * 0.5} ${200 - p.y * 0.5}`
          ).join(" ")}
          stroke="#06b6d4"
          strokeWidth="0.5"
          fill="none"
          opacity="0.15"
          strokeDasharray="4 4"
        />
        {/* Earth */}
        <circle 
          cx={200 + earth.x} 
          cy={200 - earth.y} 
          r={earth.r} 
          fill="#4f8ef7" 
          opacity="0.9"
        />
        <text x={200 + earth.x} y={200 - earth.y - 15} textAnchor="middle" fontSize="10" fill="#9fb2da" fontFamily="monospace">Earth</text>
        
        {/* Destination */}
        <circle 
          cx={200 + destination.x} 
          cy={200 - destination.y} 
          r={destination.r} 
          fill={destination.color} 
          opacity="0.9"
        />
        <text x={200 + destination.x} y={200 - destination.y + destination.r + 15} textAnchor="middle" fontSize="10" fill="#9fb2da" fontFamily="monospace">{destination.label}</text>
        
        {/* Current position */}
        <circle 
          cx={200 + pos.x * 0.5} 
          cy={200 - pos.y * 0.5} 
          r={5} 
          fill="#06b6d4" 
          opacity="1"
        />
        <circle 
          cx={200 + pos.x * 0.5} 
          cy={200 - pos.y * 0.5} 
          r={8} 
          fill="#06b6d4" 
          opacity="0.2"
        />
        
        {/* Event marker */}
        {currentEvent?.eventName && (
          <g>
            <line 
              x1={200 + pos.x * 0.5} 
              y1={200 - pos.y * 0.5 - 10}
              x2={200 + pos.x * 0.5} 
              y2={200 - pos.y * 0.5 - 30}
              stroke="#f59e0b" 
              strokeWidth="1.5"
            />
            <text x={200 + pos.x * 0.5} y={200 - pos.y * 0.5 - 35} textAnchor="middle" fontSize="8" fill="#f59e0b" fontFamily="monospace">{currentEvent.eventName}</text>
          </g>
        )}
      </svg>
      
      {/* Legend */}
      <div className="absolute bottom-2 left-2 right-2 flex flex-wrap justify-center gap-2 text-[10px] text-slate-500">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Earth</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{backgroundColor: "#e2683f"}} /> Mars</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-space-cyan" /> Craft</span>
      </div>
    </div>
  );
}

function MissionInfoPanel({ mission }: { mission: HistoricalMission }) {
  return (
    <Card className="glass-panel">
      <CardBody className="p-4">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-space-cyan/20">
              <Rocket className="h-5 w-5 text-space-cyan" />
            </div>
            <div>
              <CardTitle className="text-sm">{mission.name}</CardTitle>
              <p className="mt-1 text-xs text-slate-400">{mission.description}</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Globe className="h-3.5 w-3.5" />
            <span>{mission.destination}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <Rocket className="h-3.5 w-3.5" />
            <span>{mission.vehicle}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <Clock className="h-3.5 w-3.5" />
            <span>{mission.durationDays.toFixed(1)} days</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <Users className="h-3.5 w-3.5" />
            <span>{mission.crew.length > 0 ? mission.crew.join(", ") : "Uncrewed"}</span>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="font-mono text-xs text-space-cyan mb-2">Key Events</p>
          <ul className="space-y-1 text-xs text-slate-400">
            {mission.keyEvents.slice(0, 5).map((event, i) => (
              <li key={i} className="flex gap-2">
                <span className="font-mono text-space-cyan">▸</span>
                <span>{event.name}: {event.description}</span>
              </li>
            ))}
            {mission.keyEvents.length > 5 && (
              <li className="text-space-cyan">+ {mission.keyEvents.length - 5} more events...</li>
            )}
          </ul>
        </div>
      </CardBody>
    </Card>
  );
}

export function HistoricalPlayer({ mission, onBack }: { mission: any; onBack?: () => void }) {
  const [trajectory, setTrajectory] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [showExport, setShowExport] = useState(false);
  
  const positions = trajectory?.positions || [];
  const totalDurationSec = trajectory?.totalDurationSec || 0;
  const currentIndex = Math.floor(progress * (positions.length - 1));
  const currentPos = positions[currentIndex] || positions[0];
  const currentEvent = currentPos?.eventName ? { name: currentPos.eventName!, timeSec: progress * (totalDurationSec || 0) } : undefined;
  
  useEffect(() => {
    setTrajectory(generateMissionTrajectory(mission, 800));
  }, [mission]);
  
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setProgress(p => {
        const next = p + (speed * 0.001);
        if (next >= 1) {
          setIsPlaying(false);
          return 1;
        }
        return next;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [isPlaying, speed]);
  
  const handleSeek = (value: number) => {
    setProgress(Math.max(0, Math.min(1, value)));
  };
  
  const handleDownload = () => {
    if (!trajectory) return;
    const csv = exportTrajectoryCSV(trajectory);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${mission.id}-trajectory.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const formatTime = (sec: number) => {
    const days = Math.floor(sec / 86400);
    const hours = Math.floor((sec % 86400) / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  if (!trajectory) return <div className="text-center py-12 text-slate-400">Loading trajectory...</div>;

  return (
    <div className="pt-28 pb-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {onBack && (
          <Button variant="ghost" size="sm" className="mb-6" onClick={onBack}>
            <ChevronLeft className="h-4 w-4 mr-2" /> Back to Missions
          </Button>
        )}

        <div className="mb-6">
          <p className="font-mono text-xs text-space-cyan mb-2">HISTORICAL REPLAY</p>
          <h1 className="text-3xl font-bold tracking-tight text-white">{mission.name}</h1>
          <p className="mt-2 text-slate-400">{mission.description}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <Card className="glass-panel">
              <CardBody className="p-0">
                <div className="aspect-square bg-space-950/50 rounded-xl border border-white/10 overflow-hidden">
                  {/* Trajectory path */}
                  <svg className="absolute inset-0" viewBox="0 0 400 400">
                    {/* Draw trajectory path */}
                    <path
                      d={trajectory.positions.slice(0, Math.floor(progress * (trajectory.positions.length - 1))).map((p: any, i: number) => 
                        `${i === 0 ? "M" : "L"} ${200 + p.x * 0.5} ${200 - p.y * 0.5}`
                      ).join(" ")}
                      stroke="#06b6d4"
                      strokeWidth="1.5"
                      fill="none"
                      opacity="0.6"
                    />
                    {/* Full path faint */}
                    <path
                      d={trajectory.positions.map((p: any, i: number) => 
                        `${i === 0 ? "M" : "L"} ${200 + p.x * 0.5} ${200 - p.y * 0.5}`
                      ).join(" ")}
                      stroke="#06b6d4"
                      strokeWidth="0.5"
                      fill="none"
                      opacity="0.15"
                      strokeDasharray="4 4"
                    />
                    {/* Earth */}
                    <circle 
                      cx={200} 
                      cy={200} 
                      r={8} 
                      fill="#4f8ef7" 
                      opacity="0.9"
                    />
                    <text x={200} y={185} textAnchor="middle" fontSize="10" fill="#9fb2da" fontFamily="monospace">Earth</text>
                    
                    {/* Destination */}
                    <circle 
                      cx={200 + 200} 
                      cy={200} 
                      r={4} 
                      fill="#b9c8e6" 
                      opacity="0.9"
                    />
                    <text x={400} y={200 + 4 + 15} textAnchor="middle" fontSize="10" fill="#9fb2da" fontFamily="monospace">Moon</text>
                    
                    {/* Current position */}
                    <circle 
                      cx={200 + 0 * 0.5} 
                      cy={200 - 0 * 0.5} 
                      r={5} 
                      fill="#06b6d4" 
                      opacity="1"
                    />
                    <circle 
                      cx={200 + 0 * 0.5} 
                      cy={200 - 0 * 0.5} 
                      r={8} 
                      fill="#06b6d4" 
                      opacity="0.2"
                    />
                  </svg>
                </div>
              </CardBody>
            </Card>

            <div className="flex items-center justify-between gap-3">
              <input
                type="range"
                min="0"
                max="1"
                step="0.001"
                value={progress}
                onChange={(e) => handleSeek(parseFloat(e.target.value))}
                className="flex-1 accent-space-cyan h-2"
                aria-label="Mission timeline"
              />
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Speed:</span>
                  <select
                    value={speed}
                    onChange={(e) => setSpeed(parseFloat(e.target.value))}
                    className="rounded-lg border border-white/10 bg-space-950/60 px-2 py-1 text-xs text-white outline-none focus:border-space-cyan/60"
                  >
                    <option value={0.5}>0.5x</option>
                    <option value={1}>1x</option>
                    <option value={2}>2x</option>
                    <option value={5}>5x</option>
                    <option value={10}>10x</option>
                  </select>
                </div>
              </div>
            </div>

          {showExport && (
            <Card className="glass-panel">
              <div className="p-4">
                <p className="text-xs text-slate-400 mb-2">Trajectory data exported as CSV. Includes time, position, velocity, altitude, and events.</p>
                <Button 
                  onClick={() => {
                    if (trajectory) {
                      const csv = exportTrajectoryCSV(trajectory);
                      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `${mission.id}-trajectory.csv`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }
                    setShowExport(false);
                  }} 
                  size="sm"
                >
                  <Download className="h-3.5 w-3.5 mr-1" /> Download
                </Button>
              </div>
            </Card>
          )}
        </div>

        <div>
          <div className="glass-panel rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-6 mb-6">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-space-cyan/20">
                  <Rocket className="h-5 w-5 text-space-cyan" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">{mission.name}</h3>
                  <p className="mt-1 text-xs text-slate-400">{mission.description}</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Globe className="h-3.5 w-3.5" />
                <span>{mission.destination}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <Rocket className="h-3.5 w-3.5" />
                <span>{mission.vehicle}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <Clock className="h-3.5 w-3.5" />
                <span>{mission.durationDays.toFixed(1)} days</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <Users className="h-3.5 w-3.5" />
                <span>{mission.crew.length > 0 ? mission.crew.join(", ") : "Uncrewed"}</span>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="font-mono text-xs text-space-cyan mb-2">Key Events</p>
              <ul className="space-y-1 text-xs text-slate-400">
                {mission.keyEvents.slice(0, 5).map((event: any, i: number) => (
                  <li key={i} className="flex gap-2">
                    <span className="font-mono text-space-cyan">▸</span>
                    <span>{event.name}: {event.description}</span>
                  </li>
                ))}
                {mission.keyEvents.length > 5 && (
                  <li className="text-space-cyan">+ {mission.keyEvents.length - 5} more events...</li>
                )}
              </ul>
            </div>
          </div>

          <div className="glass-panel rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-6 mt-6">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
              <Info className="h-4 w-4 text-space-cyan" />
              References
            </h3>
            <ul className="space-y-1 text-xs text-slate-400">
              {mission.references.map((ref: string, i: number) => (
                <li key={i} className="flex gap-2">
                  <span className="font-mono text-space-cyan">▸</span>
                  <span>{ref}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}