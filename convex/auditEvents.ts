import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
import {
  AUDIT_READER_ROLES,
  requireActiveMembership,
  requireAuthenticatedUser,
} from "./lib/authorization";
import { auditEventValidator } from "./lib/returnValidators";

/** System-only append seam. Public callers cannot forge actor identity. */
export const log = internalMutation({
  args: {
    orgId: v.id("organizations"),
    actorId: v.id("users"),
    action: v.string(),
    targetResource: v.string(),
    metadata: v.optional(v.record(v.string(), v.any())),
    timestamp: v.optional(v.number()),
  },
  returns: v.id("auditEvents"),
  handler: async (ctx, args) =>
    await ctx.db.insert("auditEvents", {
      orgId: args.orgId,
      actorId: args.actorId,
      action: args.action,
      targetResource: args.targetResource,
      metadata: args.metadata,
      timestamp: args.timestamp ?? Date.now(),
    }),
});

export const listByEntity = query({
  args: {
    orgId: v.id("organizations"),
    targetResource: v.string(),
  },
  returns: v.array(auditEventValidator),
  handler: async (ctx, args) => {
    const actor = await requireAuthenticatedUser(ctx);
    await requireActiveMembership(
      ctx,
      actor._id,
      args.orgId,
      AUDIT_READER_ROLES,
    );
    return await ctx.db
      .query("auditEvents")
      .withIndex("by_org_and_target", (index) =>
        index.eq("orgId", args.orgId).eq("targetResource", args.targetResource),
      )
      .order("desc")
      .take(100);
  },
});

export const listRecent = query({
  args: {
    orgId: v.id("organizations"),
    limit: v.optional(v.number()),
    actorId: v.optional(v.id("users")),
  },
  returns: v.array(auditEventValidator),
  handler: async (ctx, args) => {
    const actor = await requireAuthenticatedUser(ctx);
    await requireActiveMembership(
      ctx,
      actor._id,
      args.orgId,
      AUDIT_READER_ROLES,
    );
    const limit = Math.min(Math.max(Math.floor(args.limit ?? 50), 1), 100);
    return args.actorId === undefined
      ? await ctx.db
          .query("auditEvents")
          .withIndex("by_org_and_timestamp", (index) =>
            index.eq("orgId", args.orgId),
          )
          .order("desc")
          .take(limit)
      : await ctx.db
          .query("auditEvents")
          .withIndex("by_org_and_actor_and_timestamp", (index) =>
            index.eq("orgId", args.orgId).eq("actorId", args.actorId!),
          )
          .order("desc")
          .take(limit);
  },
});
