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

  users: defineTable({
    tokenIdentifier: v.string(),
    name: v.string(),
    email: v.optional(v.string()),
    picture: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_tokenIdentifier", ["tokenIdentifier"]),

  // Collaborative editing presence
  missionPresence: defineTable({
    missionId: v.string(),
    userId: v.string(),
    userName: v.optional(v.string()),
    cursorPosition: v.optional(v.object({
      section: v.string(),
      field: v.optional(v.string()),
      value: v.optional(v.string()),
    })),
    lastActive: v.number(),
    color: v.string(),
  }).index("by_missionId", ["missionId"])
    .index("by_missionId_userId", ["missionId", "userId"])
    .index("by_lastActive", ["lastActive"]),
});