"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Star, MessageSquare, User, Edit2, Flag, Globe, Rocket, Users } from "lucide-react";
import { useCommunityMissions, useSubmitMission, useUpvoteMission, useSubmitComment, useMission, useComments, useAuthor } from "@/lib/convex-community";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionHeading } from "@/components/ui/section-heading";
import { formatDistanceToNow } from "date-fns";

function MissionCard({ mission, onUpvote, onView, hasUpvoted, upvoting }: {
  mission: any;
  onUpvote: () => void;
  onView: () => void;
  hasUpvoted: boolean;
  upvoting: boolean;
}) {
  const gradeColors: Record<string, string> = {
    S: "emerald",
    A: "cyan",
    B: "cyan",
    C: "amber",
    D: "crimson",
  };

  return (
    <Card className="glass-panel transition hover:border-space-cyan/40 group">
      <CardBody>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className={`font-mono text-xs px-2 py-0.5 rounded ${mission.destination === "mars" ? "bg-amber-500/20 text-amber-400" : "bg-cyan-500/20 text-cyan-400"}`}>
              {mission.destination.toUpperCase()}
            </span>
            <Badge tone={gradeColors[mission.grade] as "cyan" | "amber" | "crimson" | "emerald" | "slate" || "slate"} className="text-xs">
              {mission.grade}
            </Badge>
          </div>
          <span className="text-xs text-slate-500">{formatDistanceToNow(new Date(mission.createdAt), { addSuffix: true })}</span>
        </div>

        <CardTitle className="text-base mb-2">{mission.missionName}</CardTitle>
        
        <div className="flex flex-wrap gap-2 text-xs text-slate-400 mb-3">
          <span className="flex items-center gap-1"><Rocket className="h-3 w-3" /> {mission.vehicleName}</span>
          <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {mission.crew} crew</span>
          <span className="flex items-center gap-1"><Globe className="h-3 w-3" /> {mission.surfaceDays} days</span>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <button
              onClick={onUpvote}
              disabled={upvoting || hasUpvoted}
              className={`flex items-center gap-1 transition ${hasUpvoted ? "text-space-emerald" : "hover:text-space-cyan"}`}
            >
              <Star className={`h-4 w-4 ${hasUpvoted ? "fill-current" : ""}`} />
              <span>{mission.upvotes}</span>
            </button>
            <button
              onClick={onView}
              className="flex items-center gap-1 hover:text-space-cyan transition"
            >
              <MessageSquare className="h-4 w-4" />
              <span>{mission.commentCount}</span>
            </button>
          </div>
          {mission.authorName && (
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <User className="h-3 w-3" /> {mission.authorName}
            </span>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

function CommentThread({ missionId }: { missionId: string }) {
  const comments = useComments(missionId);
  const submitComment = useSubmitComment();
  const { authorId, authorName } = useAuthor();
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;
    setSubmitting(true);
    try {
      await submitComment({ missionId, text: newComment, authorId, authorName });
      setNewComment("");
    } catch (e) {
      console.error("Failed to submit comment", e);
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-white flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-space-cyan" />
        Comments ({comments?.length || 0})
      </h4>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 rounded-xl border border-white/10 bg-space-950/60 px-4 py-2.5 text-sm text-white outline-none focus:border-space-cyan/60"
          disabled={submitting}
        />
        <button
          type="submit"
          disabled={!newComment.trim() || submitting}
          className="inline-flex items-center gap-2 rounded-xl bg-space-cyan px-4 py-2.5 text-sm font-semibold text-space-950 transition hover:bg-space-cyan/90 disabled:opacity-50"
        >
          Post
        </button>
      </form>

      {comments && comments.length > 0 && (
        <div className="space-y-3">
          {comments.map((comment: any) => (
            <div key={comment._id} className="glass-panel p-4 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs text-space-cyan">{comment.authorName || "Anonymous"}</span>
                <span className="text-xs text-slate-500">{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>
              </div>
              <p className="text-sm text-slate-300">{comment.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MissionDetail({ missionId }: { missionId: string }) {
  const mission = useMission(missionId);
  const upvoteMission = useUpvoteMission();
  const { authorId } = useAuthor();
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [upvoting, setUpvoting] = useState(false);
  const [showComments, setShowComments] = useState(true);

  const handleUpvote = async () => {
    if (upvoting || hasUpvoted) return;
    setUpvoting(true);
    try {
      await upvoteMission({ missionId });
      setHasUpvoted(true);
    } catch (e) {
      console.error("Failed to upvote", e);
    }
    setUpvoting(false);
  };

  if (!mission) return <div className="text-center py-8 text-slate-400">Loading mission...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <span className={`font-mono text-xs px-2 py-0.5 rounded ${mission.destination === "mars" ? "bg-amber-500/20 text-amber-400" : "bg-cyan-500/20 text-cyan-400"}`}>
            {mission.destination.toUpperCase()}
          </span>
          <h2 className="mt-2 text-2xl font-bold text-white">{mission.missionName}</h2>
          <p className="text-slate-400">{mission.vehicleName} · {mission.crew} crew · {mission.surfaceDays} surface days</p>
        </div>
        <Badge tone={mission.grade === "S" ? "emerald" : mission.grade === "A" ? "cyan" : mission.grade === "B" ? "cyan" : mission.grade === "C" ? "amber" : "crimson"} className="text-lg px-4 py-2">
          Grade: {mission.grade} ({mission.score})
        </Badge>
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-slate-400">
        <span className="flex items-center gap-1"><Rocket className="h-4 w-4" /> {mission.vehicleName}</span>
        <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {mission.crew} crew</span>
        <span className="flex items-center gap-1"><Globe className="h-4 w-4" /> {mission.surfaceDays} days surface</span>
        <span className="flex items-center gap-1"><Star className="h-4 w-4" /> {mission.upvotes} upvotes</span>
        <span className="flex items-center gap-1"><MessageSquare className="h-4 w-4" /> {mission.commentCount} comments</span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="glass-panel">
          <CardBody>
            <CardTitle>Mission Design</CardTitle>
            <pre className="mt-3 text-xs text-slate-300 overflow-auto max-h-64">{JSON.stringify(mission.design, null, 2)}</pre>
          </CardBody>
        </Card>
        <Card className="glass-panel">
          <CardBody>
            <CardTitle>Scorecard</CardTitle>
            <pre className="mt-3 text-xs text-slate-300 overflow-auto max-h-64">{JSON.stringify(mission.scorecard, null, 2)}</pre>
          </CardBody>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => setShowComments(!showComments)}
          className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/10"
        >
          <MessageSquare className="h-4 w-4" />
          {showComments ? "Hide" : "Show"} Comments
        </button>
        <button
          onClick={handleUpvote}
          disabled={upvoting || hasUpvoted}
          className="inline-flex items-center gap-2 rounded-xl bg-space-cyan px-4 py-2.5 text-sm font-semibold text-space-950 transition hover:bg-space-cyan/90 disabled:opacity-50"
        >
          <Star className={`h-4 w-4 ${hasUpvoted ? "fill-current" : ""}`} />
          {hasUpvoted ? "Upvoted" : "Upvote"}
        </button>
      </div>

      {showComments && <CommentThread missionId={missionId} />}
    </div>
  );
}

export default function CommunityPage() {
  const [destination, setDestination] = useState<"moon" | "mars" | "all">("all");
  const [selectedMission, setSelectedMission] = useState<string | null>(null);
  const [authorName, setAuthorName] = useState("");
  const missions = useCommunityMissions(destination === "all" ? undefined : destination);
  const { authorId, authorName: currentAuthorName, updateName } = useAuthor();

  // Update author name from local state
  if (currentAuthorName && !authorName) {
    setAuthorName(currentAuthorName);
  }

  const handleSubmitMission = useSubmitMission();

  const handleSaveName = () => {
    if (authorName.trim()) {
      updateName(authorName.trim());
    }
  };

  if (selectedMission) {
    return (
      <div className="pt-28 pb-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setSelectedMission(null)}
              className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10"
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
          </div>
          <MissionDetail missionId={selectedMission} />
        </div>
      </div>
    );
  }

  return (
    <div className="pt-28 pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          kicker="COMMUNITY"
          title="Shared Missions"
          description="Browse missions designed by the community. Upvote your favorites, leave comments, and share your own designs."
        />

        {/* Author name input */}
        <Card className="glass-panel mb-8">
          <CardBody>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-space-cyan" />
                <span className="font-medium text-white">Your display name:</span>
              </div>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                placeholder={currentAuthorName || "Enter a display name (optional)"}
                className="flex-1 max-w-xs rounded-xl border border-white/10 bg-space-950/60 px-3 py-2 text-sm text-white outline-none focus:border-space-cyan/60"
              />
              <button
                onClick={handleSaveName}
                className="inline-flex items-center gap-2 rounded-xl bg-space-cyan px-4 py-2 text-sm font-semibold text-space-950 transition hover:bg-space-cyan/90"
              >
                Save
              </button>
              {currentAuthorName && (
                <span className="text-xs text-slate-500">Current: {currentAuthorName}</span>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Destination filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(["all", "moon", "mars"] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDestination(d)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
                destination === d
                  ? "bg-space-cyan text-space-950"
                  : "border border-white/15 bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              {d === "moon" && <Globe className="h-4 w-4" />}
              {d === "mars" && <Rocket className="h-4 w-4" />}
              {d === "all" && <Users className="h-4 w-4" />}
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>

        {/* Missions grid */}
        {missions && missions.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {missions.map((mission: any) => (
              <MissionCard
                key={mission._id}
                mission={mission}
                onUpvote={() => {}}
                onView={() => setSelectedMission(mission._id)}
                hasUpvoted={false}
                upvoting={false}
              />
            ))}
          </div>
        ) : (
          <Card className="glass-panel text-center py-12">
            <CardBody>
              <Rocket className="h-12 w-12 mx-auto text-slate-600 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No missions yet</h3>
              <p className="text-slate-400">Be the first to share a mission design!</p>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}