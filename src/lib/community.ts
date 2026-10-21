"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { customVehicleFromVehicle, encodeDesignSlug } from "@/lib/design-link";

/**
 * Community layer for shared mission designs.
 *
 * NASAMAP is deliberately no-database: shared missions, comments and upvotes
 * live in the browser's localStorage under a single key. There is no server,
 * no account and no API key — the app works offline and on a static host.
 * The hook interface mirrors what the gallery and planner views expect.
 */

const STORAGE_KEY = "nasamap-community-missions";

/** Characters that are safe to carry in a URL path segment unencoded. */
const URL_SAFE_ID = /^[A-Za-z0-9._~-]+$/;

export interface CommunityMission {
  _id: string;
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
  comments?: MissionComment[];
}

export interface MissionComment {
  _id: string;
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

/**
 * Derive the canonical, URL-safe id for a stored mission.
 *
 * Older builds keyed missions by their raw design query ("d=mars&v=starship…"),
 * which the router percent-encodes and therefore could never match again. Any
 * record that still carries such an id is rewritten from its stored design, so
 * links minted before the change keep working.
 *
 * The slug is produced by {@link encodeDesignSlug} so a community link and a
 * Mission Lab link agree exactly — including for Rocket Builder vehicles, whose
 * payload figures are part of the slug.
 */
function canonicalSlug(mission: CommunityMission): string {
  if (mission.missionId && URL_SAFE_ID.test(mission.missionId)) {
    return mission.missionId;
  }
  const design = mission.design;
  const vehicleId = design?.vehicle?.id;
  if (!vehicleId || !design.destination) return mission.missionId;
  const customVehicle = design.vehicle ? customVehicleFromVehicle(design.vehicle) : undefined;
  const slug = encodeDesignSlug({
    destination: design.destination,
    vehicleId,
    crew: design.crew,
    surfaceDays: design.surfaceDays,
    ...(customVehicle ? { customVehicle } : {}),
  });
  return slug;
}

function normalizeMission(mission: CommunityMission): CommunityMission {
  const slug = canonicalSlug(mission);
  if (slug === mission.missionId && slug === mission._id) return mission;
  return { ...mission, _id: slug, missionId: slug };
}

function readMissions(): CommunityMission[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeMission);
  } catch {
    return [];
  }
}

function writeMissions(missions: CommunityMission[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(missions));
  notify();
}

/* ------------------------------------------------------------------ *
 * Reactive store
 *
 * localStorage has no change events of its own, so mutations broadcast
 * through a tiny listener set. Reads subscribe to it, which is what keeps
 * the gallery, the upvote counter and the comment thread in step with a
 * write that just happened (and with a write from another tab).
 * ------------------------------------------------------------------ */

type Listener = () => void;
const listeners = new Set<Listener>();

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notify(): void {
  for (const listener of Array.from(listeners)) listener();
}

interface CommunityState {
  /** undefined until the first read completes. */
  missions: CommunityMission[] | undefined;
  error: Error | null;
}

function useCommunityState(): CommunityState {
  const [state, setState] = useState<CommunityState>({ missions: undefined, error: null });

  useEffect(() => {
    const read = () => {
      try {
        setState({ missions: readMissions(), error: null });
      } catch (e) {
        setState({ missions: [], error: e instanceof Error ? e : new Error(String(e)) });
      }
    };

    read();
    const unsubscribe = subscribe(read);
    // Keep other tabs of the same browser in step.
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) read();
    };
    window.addEventListener("storage", onStorage);

    return () => {
      unsubscribe();
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return state;
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

export function useUserColor(): string {
  const { authorId } = useAuthor();
  return getUserColor(authorId);
}

export function useCommunityMissions(destination?: "moon" | "mars", limit = 20) {
  const { missions, error } = useCommunityState();
  const isLoading = missions === undefined;

  const data = useMemo(() => {
    if (!missions) return undefined;
    let list = destination ? missions.filter((m) => m.destination === destination) : [...missions];
    list.sort((a, b) => b.createdAt - a.createdAt);
    return list.slice(0, limit);
  }, [missions, destination, limit]);

  return { data, isLoading, error };
}

export function useMission(missionId: string) {
  const { missions, error } = useCommunityState();
  const isLoading = missions === undefined;

  const data = useMemo(
    () => missions?.find((m) => m._id === missionId || m.missionId === missionId),
    [missions, missionId],
  );

  return { data, isLoading, error };
}

export function useComments(missionId: string) {
  const { missions, error } = useCommunityState();
  const isLoading = missions === undefined;

  const data = useMemo(() => {
    if (!missions) return undefined;
    const mission = missions.find((m) => m._id === missionId || m.missionId === missionId);
    return mission?.comments ?? [];
  }, [missions, missionId]);

  return { data, isLoading, error };
}

export function useSubmitMission() {
  const [isLoading, setIsLoading] = useState(false);
  const { authorId, authorName } = useAuthor();

  return useCallback(async (args: {
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
    authorId: string;
    authorName?: string;
  }) => {
    setIsLoading(true);
    try {
      const missions = readMissions();
      const existingIndex = missions.findIndex((m) => m.missionId === args.missionId);
      const previous = existingIndex >= 0 ? missions[existingIndex] : undefined;

      const mission: CommunityMission = {
        _id: args.missionId,
        _creationTime: previous?._creationTime ?? Date.now(),
        design: args.design,
        scorecard: args.scorecard,
        missionId: args.missionId,
        missionName: args.missionName,
        destination: args.destination,
        vehicleName: args.vehicleName,
        crew: args.crew,
        surfaceDays: args.surfaceDays,
        grade: args.grade,
        score: args.score,
        createdAt: previous?.createdAt ?? Date.now(),
        // Re-sharing an existing design refreshes the scorecard but must not
        // throw away the community's votes or its comment thread.
        upvotes: previous?.upvotes ?? 0,
        authorId: args.authorId || authorId,
        authorName: args.authorName || authorName,
        commentCount: previous?.commentCount ?? 0,
        comments: previous?.comments ?? [],
      };

      if (existingIndex >= 0) {
        missions[existingIndex] = mission;
      } else {
        missions.unshift(mission);
      }
      writeMissions(missions);
    } finally {
      setIsLoading(false);
    }
  }, [authorId, authorName]);
}

export function useUpvoteMission() {
  return useCallback(async ({ missionId }: { missionId: string }) => {
    const missions = readMissions();
    const mission = missions.find((m) => m._id === missionId || m.missionId === missionId);
    if (mission) {
      mission.upvotes = (mission.upvotes || 0) + 1;
      writeMissions(missions);
    }
  }, []);
}

export function useSubmitComment() {
  const { authorId, authorName } = useAuthor();

  return useCallback(async (args: {
    missionId: string;
    text: string;
    authorId: string;
    authorName?: string;
  }) => {
    const missions = readMissions();
    const mission = missions.find((m) => m._id === args.missionId || m.missionId === args.missionId);
    if (mission) {
      const comment: MissionComment = {
        _id: "c-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8),
        _creationTime: Date.now(),
        missionId: args.missionId,
        text: args.text,
        authorId: args.authorId || authorId,
        authorName: args.authorName || authorName,
        createdAt: Date.now(),
      };
      if (!mission.comments) mission.comments = [];
      mission.comments.unshift(comment);
      mission.commentCount = mission.comments.length;
      writeMissions(missions);
    }
  }, [authorId, authorName]);
}

// Presence / collaboration hooks.
// There is no realtime transport in the no-database build, so these resolve to
// empty results and are intentionally inert.
export function useMissionPresence(_missionId?: string) {
  return [];
}
export function useUpsertPresence() {
  return async () => {};
}
export function useRemovePresence() {
  return async () => {};
}
export function useAutoPresence(_missionId?: string, _cursorPosition?: { section: string; field?: string; value?: string }) {
  // Intentionally inert — no realtime presence channel.
}
export function useActiveCollaborators(_missionId?: string) {
  return [];
}
