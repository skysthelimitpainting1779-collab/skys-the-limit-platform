import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const log = mutation({
  args: {
    actorId: v.string(),
    action: v.string(),
    targetResource: v.string(),
    metadata: v.optional(v.record(v.string(), v.any())),
    timestamp: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const auditId = await ctx.db.insert("auditEvents", {
      actorId: args.actorId,
      action: args.action,
      targetResource: args.targetResource,
      metadata: args.metadata,
      timestamp: args.timestamp ?? Date.now(),
    });
    return auditId;
  },
});

export const listByEntity = query({
  args: {
    targetResource: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("auditEvents")
      .withIndex("by_target", (q) => q.eq("targetResource", args.targetResource))
      .order("desc")
      .collect();
  },
});

export const listRecent = query({
  args: {
    limit: v.optional(v.number()),
    actorId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    if (args.actorId !== undefined) {
      return await ctx.db
        .query("auditEvents")
        .withIndex("by_actor", (q) => q.eq("actorId", args.actorId!))
        .order("desc")
        .take(limit);
    }
    return await ctx.db
      .query("auditEvents")
      .order("desc")
      .take(limit);
  },
});
