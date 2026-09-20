"use client";

import { useMemo, useState, useEffect } from "react";
import { Trophy, Star, ArrowUpDown, Download, RefreshCw, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { getLeaderboard, getTopScore, getAllTimeStats, exportLeaderboardCSV, generateLeaderboardBadge, type LeaderboardEntry } from "@/lib/leaderboard";
import { loadScenarios } from "@/lib/scenarios";
import { cn } from "@/lib/cn";

function gradeColor(grade: string): "emerald" | "amber" | "crimson" | "slate" {
  if (grade === "S") return "emerald";
  if (grade === "A") return "amber";
  if (grade === "B") return "slate";
  return "crimson";
}

function gradeStars(grade: string): number {
  if (grade === "S") return 3;
  if (grade === "A") return 2;
  if (grade === "B") return 1;
  return 0;
}

export function LeaderboardPanel() {
  const scenarios = useMemo(() => loadScenarios(), []);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [sortBy, setSortBy] = useState<"score" | "grade" | "date">("score");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [filterScenario, setFilterScenario] = useState<string | "all">("all");

  useEffect(() => {
    setEntries(getLeaderboard());
  }, []);

  const stats = useMemo(() => getAllTimeStats(), [entries]);

  const filteredEntries = useMemo(() => {
    let result = entries;
    if (filterScenario !== "all") {
      result = result.filter((e) => e.scenarioId === filterScenario);
    }
    result = [...result].sort((a, b) => {
      let aVal: any, bVal: any;
      if (sortBy === "score") {
        aVal = a.score;
        bVal = b.score;
      } else if (sortBy === "grade") {
        const order = { S: 5, A: 4, B: 3, C: 2, D: 1 };
        aVal = order[a.grade];
        bVal = order[b.grade];
      } else {
        aVal = new Date(a.achievedAt).getTime();
        bVal = new Date(b.achievedAt).getTime();
      }
      return sortDir === "desc" ? bVal - aVal : aVal - bVal;
    });
    return result;
  }, [entries, sortBy, sortDir, filterScenario]);

  const handleExport = () => {
    const csv = exportLeaderboardCSV();
    if (!csv) return;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nasamap-leaderboard-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section id="leaderboard" className="scroll-mt-20">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <SectionHeading kicker="Mission Control" title="Leaderboard" />
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterScenario}
            onChange={(e) => setFilterScenario(e.target.value)}
            className="rounded-lg border border-white/10 bg-space-950/60 px-3 py-2 text-sm text-white outline-none focus:border-space-cyan/60"
            aria-label="Filter by scenario"
          >
            <option value="all">All Scenarios</option>
            {scenarios.map((s) => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "score" | "grade" | "date")}
            className="rounded-lg border border-white/10 bg-space-950/60 px-3 py-2 text-sm text-white outline-none focus:border-space-cyan/60"
            aria-label="Sort by"
          >
            <option value="score">Score</option>
            <option value="grade">Grade</option>
            <option value="date">Date</option>
          </select>
          <button
            onClick={() => setSortDir(sortDir === "asc" ? "desc" : "asc")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-slate-300 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-space-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-space-950"
            aria-label={sortDir === "asc" ? "Sort descending" : "Sort ascending"}
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 rounded-lg border border-space-cyan/40 bg-space-cyan/10 px-3 py-2 text-xs font-medium text-space-cyan hover:bg-space-cyan/20 focus-visible:ring-2 focus-visible:ring-space-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-space-950"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card className="bg-space-emerald/10 border-space-emerald/20">
          <CardBody className="pt-4">
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8 text-space-emerald" />
              <div>
                <p className="text-3xl font-bold text-space-emerald">{stats.totalRuns}</p>
                <p className="text-xs text-slate-400">Total Mission Runs</p>
              </div>
            </div>
          </CardBody>
        </Card>
        <Card className="bg-space-amber/10 border-space-amber/20">
          <CardBody className="pt-4">
            <div className="flex items-center gap-3">
              <Star className="h-8 w-8 text-space-amber" fill="currentColor" />
              <div>
                <p className="text-3xl font-bold text-space-amber">{stats.totalStars}</p>
                <p className="text-xs text-slate-400">Total Stars Earned</p>
              </div>
            </div>
          </CardBody>
        </Card>
        <Card className="bg-space-cyan/10 border-space-cyan/20">
          <CardBody className="pt-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-space-cyan" />
              <div>
                <p className="text-3xl font-bold text-space-cyan">{stats.bestGrade ?? "—"}</p>
                <p className="text-xs text-slate-400">Best Grade Achieved</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  <th className="text-left py-3 px-4 font-mono text-space-cyan">Rank</th>
                  <th className="text-left py-3 px-4 font-mono text-space-cyan">
                    <button
                      onClick={() => { setSortBy("score"); setSortDir(sortBy === "score" && sortDir === "desc" ? "asc" : "desc"); }}
                      className="flex items-center gap-1 hover:text-white"
                    >
                      Score <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="text-left py-3 px-4 font-mono text-space-cyan">Grade</th>
                  <th className="text-left py-3 px-4 font-mono text-space-cyan">Scenario</th>
                  <th className="text-left py-3 px-4 font-mono text-space-cyan">Vehicle</th>
                  <th className="text-left py-3 px-4 font-mono text-space-cyan">Crew</th>
                  <th className="text-left py-3 px-4 font-mono text-space-cyan">Surface</th>
                  <th className="text-left py-3 px-4 font-mono text-space-cyan">Radiation</th>
                  <th className="text-left py-3 px-4 font-mono text-space-cyan">Date</th>
                  <th className="text-center py-3 px-4 font-mono text-space-cyan">Badge</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-500">
                      No scores yet. Complete a mission to see your rank!
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((entry, index) => (
                    <tr
                      key={`${entry.scenarioId}-${entry.achievedAt}`}
                      className={`border-b border-white/5 hover:bg-white/5 transition ${index === 0 && filterScenario !== "all" ? "bg-space-emerald/5" : ""}`}
                    >
                      <td className="py-3 px-4 font-mono text-space-cyan">
                        {filterScenario === "all" ? (
                          <span className="text-slate-400">#{index + 1}</span>
                        ) : (
                          <Badge tone={gradeColor(entry.grade)} className="text-[10px]">
                            #{index + 1}
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-white">{entry.score}</td>
                      <td className="py-3 px-4">
                        <Badge tone={gradeColor(entry.grade)} className="text-[10px]">
                          {entry.grade}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {scenarios.find((s) => s.id === entry.scenarioId)?.title ?? entry.scenarioId}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400">{entry.vehicleId}</td>
                      <td className="py-3 px-4 font-mono text-center text-slate-400">{entry.crew}</td>
                      <td className="py-3 px-4 font-mono text-center text-slate-400">{entry.surfaceDays}d</td>
                      <td className="py-3 px-4 font-mono text-center text-slate-400">{entry.radiationMsv}mSv</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{new Date(entry.achievedAt).toLocaleDateString()}</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => {
                            const scenarioTitle = scenarios.find((s) => s.id === entry.scenarioId)?.title ?? entry.scenarioId;
                            const svg = generateLeaderboardBadge(entry, scenarioTitle);
                            const blob = new Blob([svg], { type: "image/svg+xml" });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `nasamap-badge-${entry.scenarioId}-${entry.grade}.svg`;
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-space-cyan transition"
                          aria-label={`Download ${entry.grade} badge as SVG`}
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {filterScenario !== "all" && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-space-amber" /> Scenario Top Score
          </h3>
          {(() => {
            const top = getTopScore(filterScenario);
            if (!top) return null;
            const scenario = scenarios.find((s) => s.id === filterScenario);
            return (
              <Card className="border-space-emerald/30 bg-space-emerald/5">
                <CardBody>
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-white">{scenario?.title}</p>
                      <p className="text-xs text-slate-400">{top.vehicleId} · Crew {top.crew} · {top.surfaceDays}d surface</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge tone={gradeColor(top.grade)} className="text-lg">
                        {top.grade}
                      </Badge>
                      <div className="text-3xl font-bold font-mono text-space-emerald">{top.score}</div>
                      <div className="text-xs text-slate-400">
                        {top.radiationMsv}mSv · {top.totalDays}d total
                      </div>
                      <button
                        onClick={() => {
                          const scenarioTitle = scenario?.title ?? filterScenario;
                          const svg = generateLeaderboardBadge(top, scenarioTitle);
                          const blob = new Blob([svg], { type: "image/svg+xml" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `nasamap-badge-${filterScenario}-${top.grade}.svg`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-space-cyan transition"
                        aria-label={`Download ${top.grade} badge as SVG`}
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      </button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })()}
        </div>
      )}
    </section>
  );
}