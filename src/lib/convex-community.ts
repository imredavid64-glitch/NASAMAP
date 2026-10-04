"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

export interface CommunityMission {
  _id: Id<"missions">;
  _creationTime: number;
  design: any;
  scorecard: any;
  missionId: string;
  missionName: string;
  destination: "moon" | "mars";
  vehicleName: string;
  crew: number;
  surfaceDays: number;
  grade: string;
  score: number;
  createdAt: number;
  upvotes: number;
  authorId: string;
  authorName?: string;
  commentCount: number;
}

export interface MissionComment {
  _id: Id<"comments">;
  _creationTime: number;
  missionId: string;
  text: string;
  authorId: string;
  authorName?: string;
  createdAt: number;
}

export interface PresenceEntry {
  _id: Id<"missionPresence">;
  _creationTime: number;
  missionId: string;
  userId: string;
  userName?: string;
  cursorPosition?: {
    section: string;
    field?: string;
    value?: string;
  };
  lastActive: number;
  color: string;
}

function getAuthorId(): string {
  if (typeof window === "undefined") return "anonymous";
  let id = localStorage.getItem("nasamap-author-id");
  if (!id) {
    id = "anon-" + Math.random().toString(36).slice(2, 10);
    localStorage.setItem("nasamap-author-id", id);
  }
  return id;
}

function getAuthorName(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return localStorage.getItem("nasamap-author-name") || undefined;
}

// Generate a consistent color for a user based on their ID
function getUserColor(userId: string): string {
  const colors = [
    "#22d3ee", // cyan
    "#a78bfa", // violet
    "#f472b6", // pink
    "#4ade80", // green
    "#fbbf24", // amber
    "#fb923c", // orange
    "#f87171", // red
    "#60a5fa", // blue
  ];
  
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash) + userId.charCodeAt(i);
    hash |= 0;
  }
  return colors[Math.abs(hash) % colors.length];
}

export function useCommunityMissions(destination?: "moon" | "mars", limit = 20) {
  return useQuery(api.missions.getMissions as any, { destination, limit });
}

export function useMission(missionId: string) {
  return useQuery(api.missions.getMission as any, { missionId });
}

export function useComments(missionId: string) {
  return useQuery(api.missions.getComments as any, { missionId });
}

export function useSubmitMission() {
  return useMutation(api.missions.submitMission as any);
}

export function useUpvoteMission() {
  return useMutation(api.missions.upvoteMission as any);
}

export function useSubmitComment() {
  return useMutation(api.missions.submitComment as any);
}

export function useAuthor() {
  const [authorId] = useState(() => getAuthorId());
  const [authorName, setAuthorName] = useState<string | undefined>(() => getAuthorName());

  const updateName = (name: string) => {
    setAuthorName(name);
    if (typeof window !== "undefined") {
      localStorage.setItem("nasamap-author-name", name);
    }
  };

  return { authorId, authorName, updateName };
}

// Collaborative presence hooks
export function useMissionPresence(missionId: string) {
  return useQuery(api.missions.getPresence as any, { missionId });
}

export function useUpsertPresence() {
  return useMutation(api.missions.upsertPresence as any);
}

export function useRemovePresence() {
  return useMutation(api.missions.removePresence as any);
}

export function useUserColor(): string {
  const { authorId } = useAuthor();
  return getUserColor(authorId);
}

// Auto-update presence every 30 seconds to keep it alive
export function useAutoPresence(missionId: string, cursorPosition?: { section: string; field?: string; value?: string }) {
  const { authorId, authorName } = useAuthor();
  const color = getUserColor(authorId);
  const upsertPresence = useUpsertPresence();
  const removePresence = useRemovePresence();

  useEffect(() => {
    if (!missionId) return;

    const updatePresence = () => {
      upsertPresence({
        missionId,
        userId: authorId,
        userName: authorName,
        cursorPosition,
        color,
      });
    };

    // Initial update
    updatePresence();

    // Update every 30 seconds to keep presence alive
    const interval = setInterval(updatePresence, 30000);

    // Cleanup on unmount
    return () => {
      clearInterval(interval);
      removePresence({ missionId, userId: authorId });
    };
  }, [missionId, authorId, authorName, cursorPosition, upsertPresence]);
}

// Get all active users in a mission (excluding self)
export function useActiveCollaborators(missionId: string) {
  const presence = useMissionPresence(missionId);
  const { authorId } = useAuthor();

  return presence?.filter((p: { userId: string }) => p.userId !== authorId) ?? [];
}