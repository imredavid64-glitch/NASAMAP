import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";

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
    const mission = await ctx.db.get(args.missionId as any);
    return mission;
  },
});

export const upvoteMission = mutation({
  args: { missionId: v.string() },
  handler: async (ctx, args) => {
    const mission = await ctx.db.get(args.missionId as any);
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
    const mission = await ctx.db.get(args.missionId as any);
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