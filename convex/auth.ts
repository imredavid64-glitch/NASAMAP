import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return {
      subject: identity.subject,
      name: identity.name,
      email: identity.email,
      picture: identity.picture,
      tokenIdentifier: identity.tokenIdentifier,
    };
  },
});

export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    picture: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");
    
    // Store user profile in a users table
    const existingUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
      .first();
    
    if (existingUser) {
      await ctx.db.patch(existingUser._id, args);
    } else {
      await ctx.db.insert("users", {
        tokenIdentifier: identity.tokenIdentifier,
        name: (args.name ?? identity.name ?? "Anonymous") as string,
        email: (identity.email ?? undefined) as string | undefined,
        picture: ((args.picture ?? identity.picture) as string) ?? undefined,
        createdAt: Date.now(),
      });
    }
    
    return { success: true };
  },
});

export const getUserProfile = query({
  args: { tokenIdentifier: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const tokenIdentifier = args.tokenIdentifier ?? identity?.tokenIdentifier;
    if (!tokenIdentifier) return null;
    
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), tokenIdentifier))
      .first();
    
    return user;
  },
});