"use client";

import { useQuery, useMutation, ConvexReactClient } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState, useEffect } from "react";

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

export function useCommunityMissions(destination?: "moon" | "mars", limit = 20) {
  return useQuery(api.missions.getMissions as any, { destination, limit });
}

export function useMission(missionId: string) {
  return useQuery(api.missions.getMission as any, { missionId });
}

export function useComments(missionId: string) {
  return useQuery(api.comments.getComments as any, { missionId });
}

export function useSubmitMission() {
  return useMutation(api.missions.submitMission as any);
}

export function useUpvoteMission() {
  return useMutation(api.missions.upvoteMission as any);
}

export function useSubmitComment() {
  return useMutation(api.comments.submitComment as any);
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