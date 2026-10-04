"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Rocket, Globe, Star, Users, MessageSquare, ArrowLeft, ExternalLink, ShieldAlert, Radio, Package, Calendar, Clock, Send } from "lucide-react";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { useMission, useComments, useUpvoteMission, useSubmitComment, useAuthor } from "@/lib/convex-community";
import { format, formatDistanceToNow } from "date-fns";
import { useToast, successToast } from "@/components/ui/toast";

interface CommunityMissionPageProps {
  params: Promise<{ missionId: string }>;
}

export default async function CommunityMissionPage({ params }: CommunityMissionPageProps) {
  const { missionId } = await params;
  return <MissionDetail missionId={missionId} />;
}

function MissionDetail({ missionId }: { missionId: string }) {
  const { data: mission, isLoading: missionLoading, error: missionError } = useMission(missionId);
  const { data: comments, isLoading: commentsLoading } = useComments(missionId);
  const upvoteMission = useUpvoteMission();
  const submitComment = useSubmitComment();
  const { authorId, authorName } = useAuthor();
  const { toast } = useToast();
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [upvoting, setUpvoting] = useState(false);

  if (missionLoading) {
    return (
      <div className="pt-28 mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <SectionHeading kicker="Community" title="Loading mission..." />
        <div className="mt-8 flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-space-cyan/30 border-t-space-cyan" />
        </div>
      </div>
    );
  }

  if (missionError || !mission) {
    notFound();
  }

  const destIcon = mission.destination === "mars" ? <Globe className="h-5 w-5" /> : <Rocket className="h-5 w-5" />;
  const gradeTone: Record<string, "emerald" | "amber" | "cyan" | "crimson" | "slate"> = {
    S: "emerald", A: "cyan", B: "amber", C: "amber", D: "crimson"
  };
  const launchGateTone = mission.design?.launchGate === "pass" ? "emerald" : mission.design?.launchGate === "fail" ? "crimson" : "amber";

  const handleUpvote = async () => {
    setUpvoting(true);
    try {
      await upvoteMission({ missionId });
      toast({ type: "success", title: "Upvoted!" });
    } catch (e) {
      toast({ type: "error", title: "Failed to upvote" });
    } finally {
      setUpvoting(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || submittingComment) return;
    setSubmittingComment(true);
    try {
      await submitComment({
        missionId,
        text: newComment.trim(),
        authorId,
        authorName,
      });
      setNewComment("");
      toast({ type: "success", title: "Comment posted" });
    } catch (e) {
      toast({ type: "error", title: "Failed to post comment" });
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleFlyThisMission = () => {
    const params = new URLSearchParams();
    params.set("d", mission.destination);
    params.set("v", `custom-${mission.missionId}`);
    params.set("c", String(mission.crew));
    params.set("s", String(mission.surfaceDays));
    window.open(`/fly?${params.toString()}`, "_blank");
  };

  return (
    <div className="pt-28">
      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link href="/community" className="inline-flex items-center gap-1.5 text-sm text-space-cyan hover:text-white mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to gallery
        </Link>

        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-space-cyan/20 text-space-cyan">
                {destIcon}
              </span>
              <div>
                <h1 className="text-3xl font-bold text-white">{mission.missionName}</h1>
                <p className="text-slate-400">{mission.vehicleName} · {mission.destination === "mars" ? "Mars" : "Moon"} Mission</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge tone={gradeTone[mission.grade] || "slate"} className="text-sm px-3 py-1">
                Grade {mission.grade}
              </Badge>
              <Badge tone={launchGateTone} className="text-sm px-3 py-1">
                {mission.design?.launchGate === "pass" ? "GO" : mission.design?.launchGate === "fail" ? "NO-GO" : "Unverified"}
              </Badge>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              <span>By {mission.authorName || "Anonymous"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <span>{formatDistanceToNow(new Date(mission.createdAt), { addSuffix: true })}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-current text-space-amber" />
              <span>{mission.upvotes} upvotes</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4" />
              <span>{mission.commentCount} comments</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span>Crew: {mission.crew} · {mission.surfaceDays}d surface</span>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
          {/* Left: Scorecard & Details */}
          <div className="space-y-6">
            <Card>
              <CardBody>
                <CardTitle className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-space-cyan" /> Mission Scorecard
                </CardTitle>
                {mission.scorecard && mission.scorecard.objectives ? (
                  <div className="mt-4 space-y-3">
                    {mission.scorecard.objectives.map((obj: any, i: number) => (
                      <div key={i} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-white/10 bg-white/5">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white truncate">{obj.label}</p>
                          <p className="text-xs text-slate-500 truncate">{obj.detail}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge
                            tone={
                              obj.status === "pass" ? "emerald" :
                              obj.status === "warn" ? "amber" : "crimson"
                            }
                            className="text-[10px]"
                          >
                            {obj.status.toUpperCase()}
                          </Badge>
                          <div className="text-right text-xs">
                            <p className="font-mono text-white">{obj.actual}</p>
                            <p className="text-slate-500">Target: {obj.target}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                      <span className="text-sm text-slate-400">Total Score</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-2xl text-space-cyan">{mission.scorecard.score} / {mission.scorecard.maxScore}</span>
                        <Badge tone={gradeTone[mission.scorecard.grade] || "slate"}>
                          {mission.scorecard.grade}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 text-slate-500">Scorecard data not available</p>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-space-cyan" /> Design Parameters
                </CardTitle>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {mission.design && (
                    <>
                      <DesignStat label="Destination" value={mission.destination === "mars" ? "Mars" : "Moon"} icon={destIcon} />
                      <DesignStat label="Vehicle" value={mission.vehicleName} icon={<Rocket className="h-4 w-4" />} />
                      <DesignStat label="Crew" value={String(mission.crew)} icon={<Users className="h-4 w-4" />} />
                      <DesignStat label="Surface Stay" value={`${mission.surfaceDays} days`} icon={<Calendar className="h-4 w-4" />} />
                      <DesignStat label="Total Δv" value={`${mission.design.totalDeltaVKmS?.toFixed(2) ?? "—"} km/s`} icon={<Radio className="h-4 w-4" />} />
                      <DesignStat label="Radiation Dose" value={`${mission.design.radiationMsvTotal?.toFixed(0) ?? "—"} mSv`} icon={<ShieldAlert className="h-4 w-4" />} />
                      <DesignStat label="Consumables" value={`${((mission.design.consumablesTotalKg ?? 0) / 1000).toFixed(1)} t`} icon={<Package className="h-4 w-4" />} />
                      <DesignStat label="Stack Mass" value={`${((mission.design.requiredMassKg ?? 0) / 1000).toFixed(1)} t`} icon={<Package className="h-4 w-4" />} />
                    </>
                  )}
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <CardTitle className="flex items-center gap-2">
                  <ExternalLink className="h-5 w-5 text-space-cyan" /> Actions
                </CardTitle>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button onClick={handleFlyThisMission} variant="outline" size="sm">
                    <ExternalLink className="h-3.5 w-3.5" /> Fly This Mission
                  </Button>
                  <Button onClick={handleUpvote} disabled={upvoting} variant="outline" size="sm">
                    <Star className="h-3.5 w-3.5 fill-current text-space-amber" />
                    {upvoting ? "Upvoting..." : `Upvote (${mission.upvotes})`}
                  </Button>
                  <Button
                    onClick={() => navigator.clipboard.writeText(`${window.location.origin}/community/${mission._id}`)}
                    variant="outline" size="sm"
                  >
                    <Send className="h-3.5 w-3.5" /> Copy Link
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Right: Comments */}
          <Card className="h-full flex flex-col">
            <CardBody className="flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-space-cyan" /> Comments
                </CardTitle>
                <span className="text-sm text-slate-400">{comments?.length ?? 0}</span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {commentsLoading ? (
                  [...Array(3)].map((_, i) => (
                    <CommentSkeleton key={i} />
                  ))
                ) : comments && comments.length > 0 ? (
                  comments.map((comment: any) => (
                    <Comment key={comment._id} comment={comment} />
                  ))
                ) : (
                  <p className="text-center text-slate-500 py-8">No comments yet. Be the first to comment!</p>
                )}
              </div>

              <div className="border-t border-white/10 pt-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-space-cyan/20 text-space-cyan shrink-0">
                    <Users className="h-4 w-4" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Write a comment..."
                      rows={3}
                      className="w-full rounded-lg border border-white/10 bg-space-950/60 px-3 py-2 text-sm text-white outline-none focus:border-space-cyan/60 resize-none"
                    />
                    <Button onClick={handleSubmitComment} disabled={submittingComment || !newComment.trim()} size="sm">
                      {submittingComment ? "Posting..." : "Post Comment"}
                    </Button>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

function DesignStat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-space-cyan/20 text-space-cyan">{icon}</span>
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="font-mono text-white">{value}</p>
      </div>
    </div>
  );
}

function Comment({ comment }: { comment: any }) {
  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-space-cyan/20 text-space-cyan shrink-0">
        <Users className="h-4 w-4" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-medium text-white">{comment.authorName || "Anonymous"}</p>
          <span className="text-xs text-slate-500">{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>
        </div>
        <p className="text-sm text-slate-300">{comment.text}</p>
      </div>
    </div>
  );
}

function CommentSkeleton() {
  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-white/10 rounded w-1/4" />
        <div className="h-4 bg-white/10 rounded w-3/4" />
      </div>
    </div>
  );
}