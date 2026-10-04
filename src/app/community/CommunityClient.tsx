"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Rocket, Star, Filter, ChevronLeft, ChevronRight, Globe, Users, Loader2 } from "lucide-react";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { useCommunityMissions } from "@/lib/convex-community";
import { format } from "date-fns";

const DESTINATION_OPTIONS = ["all", "moon", "mars"] as const;
const GRADE_OPTIONS = ["all", "S", "A", "B", "C", "D"] as const;
const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "highest-score", label: "Highest Score" },
  { value: "most-upvotes", label: "Most Upvotes" },
  { value: "oldest", label: "Oldest" },
] as const;

export function CommunityClient() {
  const [destinationFilter, setDestinationFilter] = useState<"all" | "moon" | "mars">("all");
  const [gradeFilter, setGradeFilter] = useState<"all" | "S" | "A" | "B" | "C" | "D">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "highest-score" | "most-upvotes">("newest");
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const { data: missions, isLoading, error } = useCommunityMissions(
    destinationFilter === "all" ? undefined : destinationFilter,
    pageSize * 3 // Fetch more for client-side filtering
  );

  const filteredMissions = useMemo(() => {
    if (!missions) return [];
    
    let result = missions.filter((m: any) => {
      if (gradeFilter !== "all" && m.grade !== gradeFilter) return false;
      return true;
    });

    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case "newest": return b.createdAt - a.createdAt;
        case "oldest": return a.createdAt - b.createdAt;
        case "highest-score": return b.score - a.score;
        case "most-upvotes": return b.upvotes - a.upvotes;
      }
    });

    return result;
  }, [missions, gradeFilter, sortBy]);

  const totalPages = Math.ceil(filteredMissions.length / pageSize);
  const paginatedMissions = filteredMissions.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [destinationFilter, gradeFilter, sortBy]);

  if (error) {
    return (
      <div className="pt-28 mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <SectionHeading kicker="Community" title="Mission Gallery" />
        <div className="mt-8 rounded-xl border border-red-500/30 bg-red-500/5 p-6 text-center">
          <p className="text-red-300">Failed to load missions. Please try again later.</p>
          <p className="mt-2 text-sm text-slate-400">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-28">
      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <SectionHeading kicker="Community" title="Shared Missions" description="Browse missions designed by the community. Filter by destination, grade, and sort order." />

        {/* Filters */}
        <Card className="mt-6">
          <CardBody className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-space-cyan" />
                <span className="text-sm font-medium text-slate-300">Filters:</span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Destination</span>
                <select
                  value={destinationFilter}
                  onChange={(e) => setDestinationFilter(e.target.value as "all" | "moon" | "mars")}
                  className="rounded-lg border border-white/10 bg-space-950/60 px-3 py-2 text-sm text-white outline-none focus:border-space-cyan/60"
                >
                  {DESTINATION_OPTIONS.map((d) => (
                    <option key={d} value={d}>{d === "all" ? "All" : d === "moon" ? "Moon" : "Mars"}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Grade</span>
                <select
                  value={gradeFilter}
                  onChange={(e) => setGradeFilter(e.target.value as "all" | "S" | "A" | "B" | "C" | "D")}
                  className="rounded-lg border border-white/10 bg-space-950/60 px-3 py-2 text-sm text-white outline-none focus:border-space-cyan/60"
                >
                  {GRADE_OPTIONS.map((g) => (
                    <option key={g} value={g}>{g === "all" ? "All" : g}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Sort</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "newest" | "oldest" | "highest-score" | "most-upvotes")}
                  className="rounded-lg border border-white/10 bg-space-950/60 px-3 py-2 text-sm text-white outline-none focus:border-space-cyan/60"
                >
                  {SORT_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-sm text-slate-400">
              <span>{filteredMissions.length} mission{filteredMissions.length !== 1 ? "s" : ""} found</span>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1 || isLoading}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <span className="font-mono text-white px-2">Page {page} / {totalPages}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages || isLoading}
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Mission Grid */}
        {isLoading ? (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <MissionCardSkeleton key={i} />
            ))}
          </div>
        ) : paginatedMissions.length === 0 ? (
          <div className="mt-12 text-center text-slate-500">
            <Rocket className="h-12 w-12 mx-auto mb-4 text-slate-700" />
            <p className="text-lg">No missions shared yet</p>
            <p className="mt-2">Be the first to design and share a mission from the <a href="/mission" className="text-space-cyan hover:underline">Mission Lab</a>!</p>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {paginatedMissions.map((mission: any) => (
              <MissionCard key={mission._id} mission={mission} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MissionCard({ mission }: { mission: any }) {
  const destIcon = mission.destination === "mars" ? <Globe className="h-4 w-4" /> : <Rocket className="h-4 w-4" />;
  const gradeTone: Record<string, "emerald" | "amber" | "cyan" | "crimson" | "slate"> = {
    S: "emerald", A: "cyan", B: "amber", C: "amber", D: "crimson"
  };

  return (
    <Link href={`/community/${mission._id}`} className="group">
      <Card className="h-full transition hover:border-space-cyan/40 hover:bg-white/[0.03]">
        <CardBody className="p-4">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-space-cyan/20 text-space-cyan">
                {destIcon}
              </span>
              <div>
                <p className="font-medium text-white group-hover:text-space-cyan transition">{mission.missionName}</p>
                <p className="text-xs text-slate-500">{mission.vehicleName}</p>
              </div>
            </div>
            <Badge tone={gradeTone[mission.grade] || "slate"} className="text-xs">
              Grade {mission.grade}
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-3 text-xs mb-3">
            <div className="rounded-lg bg-white/5 p-2">
              <p className="text-slate-500">Score</p>
              <p className="font-mono text-space-cyan">{mission.score}</p>
            </div>
            <div className="rounded-lg bg-white/5 p-2">
              <p className="text-slate-500">Crew</p>
              <p className="font-mono text-white">{mission.crew}</p>
            </div>
            <div className="rounded-lg bg-white/5 p-2">
              <p className="text-slate-500">Surface</p>
              <p className="font-mono text-white">{mission.surfaceDays}d</p>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-white/10">
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              <span>{mission.authorName || "Anonymous"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 fill-current text-space-amber" />
              <span>{mission.upvotes}</span>
            </div>
          </div>
        </CardBody>
      </Card>
    </Link>
  );
}

function MissionCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardBody className="p-4 space-y-3">
        <div className="h-8 bg-white/10 rounded w-3/4" />
        <div className="grid grid-cols-3 gap-3">
          <div className="h-16 bg-white/10 rounded" />
          <div className="h-16 bg-white/10 rounded" />
          <div className="h-16 bg-white/10 rounded" />
        </div>
        <div className="h-4 bg-white/10 rounded w-1/2" />
      </CardBody>
    </Card>
  );
}