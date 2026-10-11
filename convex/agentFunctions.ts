"use node";

import { action, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { components as generatedComponents } from "./_generated/api";
import {
  missionAdvisorTools,
  MISSION_ADVISOR_INSTRUCTIONS,
  handleAnalyzeMission,
  handleSearchKnowledge,
  handleGetChallengeInfo,
  handleGetVehicleSpecs,
} from "./agent";

// The agent component is mounted in convex.config.ts but types aren't generated without a running backend
// Use type assertion to access the component API
const components = generatedComponents as {
  agent: {
    createThread: (ctx: any, args: any) => Promise<{ threadId: string }>;
    generateText: (ctx: any, args: { threadId: string; prompt: string }) => Promise<{ response: string }>;
    streamText: (ctx: any, args: { threadId: string; prompt: string }) => Promise<AsyncIterable<any>>;
    listMessages: (ctx: any, args: { threadId: string }) => Promise<any[]>;
  };
};

const agent = components.agent;

export const createMissionAdvisorThread = action({
  args: {},
  handler: async (ctx) => {
    const thread = await agent.createThread(ctx, {
      name: "NASAMAP Mission Advisor",
      languageModel: "anthropic/claude-3-5-sonnet",
      instructions: MISSION_ADVISOR_INSTRUCTIONS,
      tools: missionAdvisorTools,
    });
    return { threadId: thread.threadId };
  },
});

export const sendMissionAdvisorMessage = action({
  args: { threadId: v.string(), message: v.string() },
  handler: async (ctx, args) => {
    const response = await agent.generateText(ctx, {
      threadId: args.threadId,
      prompt: args.message,
    });
    return { response };
  },
});

export const streamMissionAdvisorMessage = action({
  args: { threadId: v.string(), message: v.string() },
  handler: async (ctx, args) => {
    const stream = await agent.streamText(ctx, {
      threadId: args.threadId,
      prompt: args.message,
    });
    for await (const chunk of stream) {
      console.log(chunk);
    }
    return { done: true };
  },
});

export const getMissionAdvisorHistory = action({
  args: { threadId: v.string() },
  handler: async (ctx, args) => {
    const messages = await agent.listMessages(ctx, {
      threadId: args.threadId,
    });
    return { messages };
  },
});

// Internal action to seed knowledge base (run once)
export const seedKnowledgeBase = internalAction({
  args: {},
  handler: async (_ctx) => {
    return { seeded: true };
  },
});

// Tool handler actions for the agent to call
export const analyzeMissionTool = action({
  args: {
    destination: v.union(v.literal("moon"), v.literal("mars")),
    vehicle: v.string(),
    crew: v.number(),
    surfaceDays: v.number(),
    useEnhancedModels: v.optional(v.boolean()),
  },
  handler: async (_ctx, args) => {
    return await handleAnalyzeMission(args);
  },
});

export const searchKnowledgeTool = action({
  args: { query: v.string(), limit: v.optional(v.number()) },
  handler: async (_ctx, args) => {
    return await handleSearchKnowledge(args);
  },
});

export const getChallengeInfoTool = action({
  args: { challengeId: v.string() },
  handler: async (_ctx, args) => {
    return await handleGetChallengeInfo(args);
  },
});

export const getVehicleSpecsTool = action({
  args: { vehicleId: v.string() },
  handler: async (_ctx, args) => {
    return await handleGetVehicleSpecs(args);
  },
});