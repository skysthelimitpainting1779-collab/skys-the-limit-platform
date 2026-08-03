import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
  OPERATIONS_ROLES,
  requireActiveMembership,
  requireActiveOrganization,
  requireAuthenticatedUser,
} from "./lib/authorization";
import { estimateValidator } from "./lib/returnValidators";

export const estimateStatusValidator = v.union(
  v.literal("draft"),
  v.literal("sent"),
  v.literal("accepted"),
  v.literal("declined"),
  v.literal("expired")
);

export const pricingValidator = v.union(
  v.number(),
  v.record(v.string(), v.any())
);

export const create = mutation({
  args: {
    leadId: v.id("leads"),
    orgId: v.id("organizations"),
    scope: v.string(),
    pricing: pricingValidator,
    status: v.optional(estimateStatusValidator),
  },
  returns: v.id("estimates"),
  handler: async (ctx, args) => {
    const currentUser = await requireAuthenticatedUser(ctx);
    await requireActiveMembership(
      ctx,
      currentUser._id,
      args.orgId,
      OPERATIONS_ROLES,
    );
    const lead = await ctx.db.get(args.leadId);
    if (!lead?.orgId || lead.orgId !== args.orgId) {
      throw new Error("Lead not found");
    }
    const org = await ctx.db.get(args.orgId);
    if (!org) {
      throw new Error("Organization not found");
    }
    const estimateId = await ctx.db.insert("estimates", {
      leadId: args.leadId,
      orgId: args.orgId,
      scope: args.scope,
      pricing: args.pricing,
      status: args.status ?? "draft",
      createdAt: Date.now(),
    });
    return estimateId;
  },
});

export const get = query({
  args: {
    estimateId: v.id("estimates"),
  },
  returns: v.union(v.null(), estimateValidator),
  handler: async (ctx, args) => {
    const currentUser = await requireAuthenticatedUser(ctx);
    const estimate = await ctx.db.get(args.estimateId);
    if (!estimate) return null;

    if (estimate.customerId) {
      const customer = await ctx.db.get(estimate.customerId);
      if (customer?.userId === currentUser._id) {
        if (customer.orgId !== estimate.orgId) throw new Error("FORBIDDEN");
        await requireActiveOrganization(ctx, estimate.orgId);
        return estimate;
      }
    }

    await requireActiveMembership(
      ctx,
      currentUser._id,
      estimate.orgId,
      OPERATIONS_ROLES,
    );
    return estimate;
  },
});

export const listByLead = query({
  args: {
    leadId: v.id("leads"),
  },
  returns: v.array(estimateValidator),
  handler: async (ctx, args) => {
    const currentUser = await requireAuthenticatedUser(ctx);
    const lead = await ctx.db.get(args.leadId);
    if (!lead?.orgId) throw new Error("LEAD_NOT_FOUND");
    await requireActiveMembership(
      ctx,
      currentUser._id,
      lead.orgId,
      OPERATIONS_ROLES,
    );
    const estimates = await ctx.db
      .query("estimates")
      .withIndex("by_lead", (q) => q.eq("leadId", args.leadId))
      .take(100);
    return estimates.filter((estimate) => estimate.orgId === lead.orgId);
  },
});

export const list = query({
  args: {
    orgId: v.id("organizations"),
    status: v.optional(estimateStatusValidator),
  },
  returns: v.array(estimateValidator),
  handler: async (ctx, args) => {
    const currentUser = await requireAuthenticatedUser(ctx);
    await requireActiveMembership(
      ctx,
      currentUser._id,
      args.orgId,
      OPERATIONS_ROLES,
    );

    if (args.status !== undefined) {
      return await ctx.db
        .query("estimates")
        .withIndex("by_org_and_status", (q) =>
          q.eq("orgId", args.orgId).eq("status", args.status!),
        )
        .order("desc")
        .take(100);
    }
    return await ctx.db
      .query("estimates")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .order("desc")
      .take(100);
  },
});

export const update = mutation({
  args: {
    estimateId: v.id("estimates"),
    scope: v.optional(v.string()),
    pricing: v.optional(pricingValidator),
    status: v.optional(estimateStatusValidator),
  },
  returns: estimateValidator,
  handler: async (ctx, args) => {
    const currentUser = await requireAuthenticatedUser(ctx);
    const existing = await ctx.db.get(args.estimateId);
    if (!existing) {
      throw new Error("Estimate not found");
    }
    await requireActiveMembership(
      ctx,
      currentUser._id,
      existing.orgId,
      OPERATIONS_ROLES,
    );
    const updates: {
      scope?: string;
      pricing?: number | Record<string, unknown>;
      status?: "draft" | "sent" | "accepted" | "declined" | "expired";
    } = {};
    if (args.scope !== undefined) updates.scope = args.scope;
    if (args.pricing !== undefined) updates.pricing = args.pricing;
    if (args.status !== undefined) updates.status = args.status;

    await ctx.db.patch(args.estimateId, updates);
    const updated = await ctx.db.get(args.estimateId);
    if (!updated) throw new Error("Estimate not found");
    return updated;
  },
});

export function computeTotalFromPricing(
  pricing: number | Record<string, unknown>
): number {
  if (typeof pricing === "number") {
    return pricing;
  }
  if (typeof pricing === "object" && pricing !== null) {
    if (typeof (pricing as Record<string, unknown>).total === "number") {
      return (pricing as Record<string, number>).total;
    }
    if (Array.isArray((pricing as Record<string, unknown>).items)) {
      let sum = 0;
      for (const item of (pricing as Record<string, unknown[]>).items) {
        if (typeof item === "number") {
          sum += item;
        } else if (typeof item === "object" && item !== null) {
          const val =
            (item as Record<string, unknown>).total ??
            (item as Record<string, unknown>).amount ??
            (item as Record<string, unknown>).price ??
            (item as Record<string, unknown>).cost ??
            0;
          if (typeof val === "number") {
            sum += val;
          }
        }
      }
      return sum;
    }
    let totalSum = 0;
    for (const key of Object.keys(pricing)) {
      const val = (pricing as Record<string, unknown>)[key];
      if (typeof val === "number") {
        totalSum += val;
      }
    }
    return totalSum;
  }
  return 0;
}

export const calculateTotal = query({
  args: {
    pricing: v.optional(pricingValidator),
  },
  returns: v.number(),
  handler: async (_ctx, args) => {
    const rawPricing = args.pricing as
      | number
      | Record<string, unknown>
      | undefined;
    if (rawPricing === undefined) {
      return 0;
    }
    return computeTotalFromPricing(rawPricing);
  },
});
