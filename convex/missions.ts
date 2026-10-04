import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { Doc } from "./_generated/dataModel";

export const submitMission = mutation({
  args: {
    design: v.any(),
    scorecard: v.any(),
    missionId: v.string(),
    missionName: v.string(),
    destination: v.union(v.literal("moon"), v.literal("mars")),
    vehicleName: v.string(),
    crew: v.number(),
    surfaceDays: v.number(),
    grade: v.string(),
    score: v.number(),
    authorId: v.string(),
    authorName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const missionId = await ctx.db.insert("missions", {
      ...args,
      createdAt: Date.now(),
      upvotes: 0,
      commentCount: 0,
    });
    return missionId;
  },
});

export const getMissions = query({
  args: {
    destination: v.optional(v.union(v.literal("moon"), v.literal("mars"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("missions").order("desc");
    
    if (args.destination) {
      q = ctx.db.query("missions")
        .withIndex("by_destination_createdAt", (q) => 
          q.eq("destination", args.destination!)
        );
    }
    
    const limit = args.limit || 20;
    return await q.take(limit);
  },
});

export const getMission = query({
  args: { missionId: v.string() },
  handler: async (ctx, args) => {
    const mission = await ctx.db.get(args.missionId as any) as Doc<"missions"> | null;
    return mission;
  },
});

// Presence management for collaborative editing
export const upsertPresence = mutation({
  args: {
    missionId: v.string(),
    userId: v.string(),
    userName: v.optional(v.string()),
    cursorPosition: v.optional(v.object({
      section: v.string(),
      field: v.optional(v.string()),
      value: v.optional(v.string()),
    })),
    color: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Check if presence already exists
    const existing = await ctx.db
      .query("missionPresence")
      .withIndex("by_missionId_userId", (q) => 
        q.eq("missionId", args.missionId).eq("userId", args.userId)
      )
      .first();
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        userName: args.userName,
        cursorPosition: args.cursorPosition,
        lastActive: Date.now(),
        color: args.color,
      });
      return { updated: true };
    } else {
      await ctx.db.insert("missionPresence", {
        missionId: args.missionId,
        userId: args.userId,
        userName: args.userName,
        cursorPosition: args.cursorPosition,
        lastActive: Date.now(),
        color: args.color,
      });
      return { created: true };
    }
  },
});

export const removePresence = mutation({
  args: { missionId: v.string(), userId: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("missionPresence")
      .withIndex("by_missionId_userId", (q) => 
        q.eq("missionId", args.missionId).eq("userId", args.userId)
      )
      .first();
    
    if (existing) {
      await ctx.db.delete(existing._id);
      return { deleted: true };
    }
    return { deleted: false };
  },
});

export const getPresence = query({
  args: { missionId: v.string() },
  handler: async (ctx, args) => {
    const now = Date.now();
    const fiveMinutesAgo = now - 5 * 60 * 1000;
    
    const presence = await ctx.db
      .query("missionPresence")
      .withIndex("by_missionId", (q) => q.eq("missionId", args.missionId))
      .filter((q) => q.gte(q.field("lastActive"), fiveMinutesAgo))
      .collect();
    
    return presence;
  },
});

// Cleanup stale presence entries (older than 5 minutes)
export const cleanupStalePresence = mutation({
  handler: async (ctx) => {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    
    const stale = await ctx.db
      .query("missionPresence")
      .withIndex("by_lastActive", (q) => q.lte("lastActive", fiveMinutesAgo))
      .collect();
    
    for (const entry of stale) {
      await ctx.db.delete(entry._id);
    }
    
    return { cleaned: stale.length };
  },
});

export const upvoteMission = mutation({
  args: { missionId: v.string() },
  handler: async (ctx, args) => {
    const mission = await ctx.db.get(args.missionId as any) as Doc<"missions"> | null;
    if (!mission) throw new ConvexError("Mission not found");
    
    await ctx.db.patch(args.missionId as any, {
      upvotes: mission.upvotes + 1,
    });
    
    return { upvotes: mission.upvotes + 1 };
  },
});

export const submitComment = mutation({
  args: {
    missionId: v.string(),
    text: v.string(),
    authorId: v.string(),
    authorName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const commentId = await ctx.db.insert("comments", {
      ...args,
      createdAt: Date.now(),
    });
    
    // Increment comment count on mission
    const mission = await ctx.db.get(args.missionId as any) as Doc<"missions"> | null;
    if (mission) {
      await ctx.db.patch(args.missionId as any, {
        commentCount: mission.commentCount + 1,
      });
    }
    
    return commentId;
  },
});

export const getComments = query({
  args: { missionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("comments")
      .withIndex("by_missionId_createdAt", (q) => 
        q.eq("missionId", args.missionId)
      )
      .collect();
  },
});