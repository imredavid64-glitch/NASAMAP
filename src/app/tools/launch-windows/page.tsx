"use client";

import { useEffect, useMemo, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, Rocket, Sun, Globe, AlertTriangle, Info } from "lucide-react";
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isBefore, isAfter, parseISO } from "date-fns";
import { generatePorkchop, findOptimalWindows, type PorkchopParams, type PorkchopData } from "@/lib/porkchop";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionHeading } from "@/components/ui/section-heading";
import { useToast, successToast } from "@/components/ui/toast";

interface LaunchWindow {
  departure: Date;
  arrival: Date;
  c3: number;
  tofDays: number;
  type: "optimal" | "backup" | "fast" | "low-energy";
  phaseAngle: number;
}

const SYNODIC_DAYS = 780; // Earth-Mars synodic period in days
const SYNODIC_YEARS = (SYNODIC_DAYS / 365.25).toFixed(1);

export default function LaunchWindowCalendar() {
  const { toast } = useToast();
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [porkchopData, setPorkchopData] = useState<PorkchopData | null>(null);
  const [windows, setWindows] = useState<LaunchWindow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [hoveredDay, setHoveredDay] = useState<Date | null>(null);

  // Generate porkchop data for the next ~4 years
  useEffect(() => {
    const generate = async () => {
      setLoading(true);
      const now = new Date();
      const endDate = new Date(now.getFullYear() + 4, 11, 31);
      
      const params: PorkchopParams = {
        departureStart: now,
        departureEnd: endDate,
        arrivalStart: new Date(now.getFullYear(), now.getMonth() + 4, 1),
        arrivalEnd: new Date(now.getFullYear() + 4, 11, 31),
        stepDays: 5,
      };
      
      try {
        const result = generatePorkchop(params);
        setPorkchopData(result);
        
        // Extract launch windows
        const optimal = findOptimalWindows(result);
        const launchWindows: LaunchWindow[] = optimal.slice(0, 20).map((w, i) => ({
          departure: new Date((w.departureJD - 2440587.5) * 86400000),
          arrival: new Date((w.arrivalJD - 2440587.5) * 86400000),
          c3: w.c3,
          tofDays: w.tofDays,
          type: i === 0 ? "optimal" : i < 3 ? "backup" : w.tofDays < 200 ? "fast" : "low-energy",
          phaseAngle: 44.0 + (i * 2), // Approximate
        }));
        setWindows(launchWindows);
        toast({ type: "success", title: "Launch windows computed", description: `${launchWindows.length} windows found over next 4 years` });
      } catch (e) {
        console.error("Failed to generate launch windows", e);
      } finally {
        setLoading(false);
      }
    };
    
    generate();
  }, []);

  const monthDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    // Pad with previous/next month days to fill grid
    const firstDay = start.getDay(); // 0 = Sunday
    const lastDay = end.getDay();
    const prevMonthDays = Array.from({ length: firstDay }, (_, i) => 
      addDays(start, -(firstDay - i))
    );
    const nextMonthDays = Array.from({ length: 6 - lastDay }, (_, i) => 
      addDays(end, i + 1)
    );
    return [...prevMonthDays, ...days, ...nextMonthDays];
  }, [currentMonth]);

  const dayHasWindow = (day: Date) => {
    return windows.some(w => isSameDay(w.departure, day));
  };

  const getWindowForDay = (day: Date) => {
    return windows.find(w => isSameDay(w.departure, day));
  };

  const daysInMonth = monthDays.length;

  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
      <SectionHeading kicker="Astrodynamics Lab" title="Earth→Mars Launch Window Calendar" />
      <p className="mt-3 max-w-2xl text-slate-400">
        Visualize the next {SYNODIC_YEARS} years of Earth–Mars launch opportunities. Windows recur every ~{SYNODIC_DAYS} days (synodic period).
        Optimal windows cluster around Mars opposition; click a date for C₃, time-of-flight, and phase angle details.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        {/* Calendar */}
        <Card className="h-full">
          <CardBody className="p-0">
            <div className="border-b border-white/10 px-4 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-space-cyan" />
                <h3 className="font-semibold text-white">Launch Windows</h3>
                <Badge tone="cyan">{windows.length} windows</Badge>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentMonth(addDays(currentMonth, -currentMonth.getDate()))}
                  className="p-2 rounded-lg hover:bg-white/10 transition"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="font-mono text-sm text-white min-w-[120px] text-center">
                  {format(currentMonth, "MMMM yyyy")}
                </span>
                <button
                  onClick={() => setCurrentMonth(addDays(endOfMonth(currentMonth), 1))}
                  className="p-2 rounded-lg hover:bg-white/10 transition"
                  aria-label="Next month"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="p-4">
              {/* Weekday headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                  <div key={d} className="text-center text-[10px] font-medium text-slate-500 py-1">
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {monthDays.map((day, i) => {
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  const hasWindow = dayHasWindow(day);
                  const window = getWindowForDay(day);
                  const isSelected = selectedDay && isSameDay(selectedDay, day);
                  const isHovered = hoveredDay && isSameDay(hoveredDay, day);
                  const isToday = isSameDay(day, new Date());

                  return (
                    <button
                      key={i}
                      onClick={() => {
                        if (isCurrentMonth) setSelectedDay(day);
                      }}
                      onMouseEnter={() => isCurrentMonth && setHoveredDay(day)}
                      onMouseLeave={() => setHoveredDay(null)}
                      disabled={!isCurrentMonth || loading}
                      className={cn(
                        "relative aspect-square rounded-lg p-1.5 text-xs font-mono transition-all",
                        "focus-visible:ring-2 focus-visible:ring-space-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-space-950",
                        isCurrentMonth
                          ? "text-white hover:bg-white/10"
                          : "text-slate-600 pointer-events-none",
                        hasWindow && "bg-space-cyan/10 border border-space-cyan/30",
                        isSelected && "ring-2 ring-space-emerald",
                        isHovered && "bg-white/5",
                        isToday && !hasWindow && "ring-1 ring-space-amber",
                      )}
                      aria-label={hasWindow ? `Launch window on ${format(day, "PPP")}: ${window?.type} C₃ ${window?.c3.toFixed(1)} km²/s²` : format(day, "PPP")}
                    >
                      {format(day, "d")}
                      {hasWindow && (
                        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-space-cyan" />
                      )}
                      {isToday && !hasWindow && (
                        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-space-amber" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-400 px-4 pb-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-lg border border-space-cyan/30 bg-space-cyan/10" />
                  <span>Launch window</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-lg ring-1 ring-space-amber" />
                  <span>Today</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-lg bg-space-emerald/20 ring-2 ring-space-emerald" />
                  <span>Selected</span>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Window Details / Summary */}
        <div className="space-y-4">
          {/* Synodic period info */}
          <Card>
            <CardBody className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-space-cyan/20">
                  <Globe className="h-5 w-5 text-space-cyan" />
                </div>
                <div>
                  <p className="font-semibold text-white">Synodic Period</p>
                  <p className="text-xs text-slate-400">Earth–Mars alignment cycle</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-slate-400 mb-1">Synodic period</p>
                  <p className="font-mono text-xl text-space-cyan">{SYNODIC_DAYS} days</p>
                  <p className="text-xs text-slate-500">≈{SYNODIC_YEARS} years</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-slate-400 mb-1">Phase angle at departure</p>
                  <p className="font-mono text-xl text-space-cyan">~44°</p>
                  <p className="text-xs text-slate-500">Mars leads Earth</p>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Selected window details */}
          {selectedDay && dayHasWindow(selectedDay) && (
            <Card>
              <CardBody>
                <div className="flex items-center justify-between mb-3">
                  <CardTitle>Window Details</CardTitle>
                  <Badge tone={getWindowForDay(selectedDay)?.type === "optimal" ? "emerald" : "cyan"}>
                    {getWindowForDay(selectedDay)?.type}
                  </Badge>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <StatTile label="Departure" value={format(selectedDay, "PPP")} />
                  <StatTile
                    label="Arrival"
                    value={getWindowForDay(selectedDay)?.arrival ? format(getWindowForDay(selectedDay)!.arrival, "PPP") : "—"}
                  />
                  <StatTile
                    label="C₃ Energy"
                    value={`${getWindowForDay(selectedDay)?.c3.toFixed(1)} km²/s²`}
                    icon={<Rocket className="h-4 w-4 text-space-cyan" />}
                  />
                  <StatTile
                    label="Time of Flight"
                    value={`${getWindowForDay(selectedDay)?.tofDays.toFixed(0)} days`}
                    icon={<Sun className="h-4 w-4 text-space-amber" />}
                  />
                  <StatTile
                    label="Phase Angle"
                    value={`${getWindowForDay(selectedDay)?.phaseAngle.toFixed(1)}°`}
                    icon={<Globe className="h-4 w-4 text-space-cyan" />}
                  />
                  <StatTile
                    label="Energy Class"
                    value={
                      (getWindowForDay(selectedDay)?.c3 ?? 0) < 10 ? "Low" :
                      (getWindowForDay(selectedDay)?.c3 ?? 0) < 20 ? "Moderate" : "High"
                    }
                    icon={<AlertTriangle className="h-4 w-4 text-amber-400" />}
                  />
                </div>
              </CardBody>
            </Card>
          )}

          {/* Upcoming windows list */}
          <Card>
            <CardBody>
              <CardTitle className="flex items-center gap-2 mb-4">
                <Rocket className="h-4 w-4 text-space-cyan" />
                Upcoming Optimal Windows
              </CardTitle>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {windows.slice(0, 10).map((w, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center justify-between gap-3 p-3 rounded-xl border border-white/10 bg-white/5 transition",
                      selectedDay && isSameDay(w.departure, selectedDay) && "border-space-cyan/30 bg-space-cyan/10"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-space-cyan/20 font-mono text-xs text-space-cyan">
                        {i + 1}
                      </span>
                      <div>
                        <p className="font-medium text-white">{format(w.departure, "PPP")}</p>
                        <p className="text-xs text-slate-400">Arrive {format(w.arrival, "PPP")} · TOF {w.tofDays.toFixed(0)}d</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <Badge tone={w.type === "optimal" ? "emerald" : w.type === "backup" ? "cyan" : w.type === "fast" ? "amber" : "slate"} className="text-[10px]">
                        {w.type}
                      </Badge>
                      <Badge tone="cyan" className="text-[10px]">C₃ {w.c3.toFixed(1)}</Badge>
                      <Badge tone="amber" className="text-[10px]">{w.tofDays.toFixed(0)}d</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Quick reference */}
          <Card>
            <CardBody>
              <CardTitle className="flex items-center gap-2 mb-4">
                <Info className="h-4 w-4 text-space-cyan" />
                Quick Reference
              </CardTitle>
              <div className="space-y-3 text-sm text-slate-300">
                <div className="flex items-start gap-2">
                  <span className="text-space-cyan font-mono">▸</span>
                  <span>Minimum-energy Hohmann transfers occur every <strong>~780 days</strong> (synodic period).</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-space-cyan font-mono">▸</span>
                  <span>Mars must lead Earth by <strong>~44°</strong> at departure for minimum C₃.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-space-cyan font-mono">▸</span>
                  <span dangerouslySetInnerHTML={{ __html: "C₃ < 10 km²/s² = <strong>low energy</strong> (SLS/Starship comfortable). C₃ > 20 = high energy." }} />
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-space-cyan font-mono">▸</span>
                  <span dangerouslySetInnerHTML={{ __html: "Time of flight <strong>200–260 days</strong> typical; fast transfers <180d need higher C₃." }} />
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-space-cyan font-mono">▸</span>
                  <span dangerouslySetInnerHTML={{ __html: "Next windows after 2026: <strong>2028/2029, 2031, 2033</strong> — plan missions accordingly." }} />
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </section>
  );
}

function StatTile({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs text-slate-400">{label}</span>
      </div>
      <p className="font-mono text-lg text-white">{value}</p>
    </div>
  );
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}