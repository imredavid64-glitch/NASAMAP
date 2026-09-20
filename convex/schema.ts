import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  missions: defineTable({
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
    createdAt: v.number(),
    upvotes: v.number(),
    authorId: v.string(),
    authorName: v.optional(v.string()),
    commentCount: v.number(),
  }).index("by_destination", ["destination"])
    .index("by_createdAt", ["createdAt"])
    .index("by_destination_createdAt", ["destination", "createdAt"]),

  comments: defineTable({
    missionId: v.string(),
    text: v.string(),
    authorId: v.string(),
    authorName: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_missionId", ["missionId"])
    .index("by_missionId_createdAt", ["missionId", "createdAt"]),
});