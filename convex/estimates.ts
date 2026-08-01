import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

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
  handler: async (ctx, args) => {
    const lead = await ctx.db.get(args.leadId);
    if (!lead) {
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
  handler: async (ctx, args) => {
    return await ctx.db.get(args.estimateId);
  },
});

export const listByLead = query({
  args: {
    leadId: v.id("leads"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("estimates")
      .withIndex("by_lead", (q) => q.eq("leadId", args.leadId))
      .collect();
  },
});

export const list = query({
  args: {
    orgId: v.optional(v.id("organizations")),
    status: v.optional(estimateStatusValidator),
  },
  handler: async (ctx, args) => {
    let estimates;
    if (args.orgId !== undefined) {
      estimates = await ctx.db
        .query("estimates")
        .withIndex("by_org", (q) => q.eq("orgId", args.orgId!))
        .collect();
    } else {
      estimates = await ctx.db.query("estimates").collect();
    }
    if (args.status !== undefined) {
      estimates = estimates.filter((est) => est.status === args.status);
    }
    return estimates;
  },
});

export const update = mutation({
  args: {
    estimateId: v.id("estimates"),
    scope: v.optional(v.string()),
    pricing: v.optional(pricingValidator),
    status: v.optional(estimateStatusValidator),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.estimateId);
    if (!existing) {
      throw new Error("Estimate not found");
    }
    const updates: {
      scope?: string;
      pricing?: number | Record<string, any>;
      status?: "draft" | "sent" | "accepted" | "declined" | "expired";
    } = {};
    if (args.scope !== undefined) updates.scope = args.scope;
    if (args.pricing !== undefined) updates.pricing = args.pricing;
    if (args.status !== undefined) updates.status = args.status;

    await ctx.db.patch(args.estimateId, updates);
    return await ctx.db.get(args.estimateId);
  },
});

export function computeTotalFromPricing(
  pricing: number | Record<string, any>
): number {
  if (typeof pricing === "number") {
    return pricing;
  }
  if (typeof pricing === "object" && pricing !== null) {
    if (typeof pricing.total === "number") {
      return pricing.total;
    }
    if (Array.isArray(pricing.items)) {
      let sum = 0;
      for (const item of pricing.items) {
        if (typeof item === "number") {
          sum += item;
        } else if (typeof item === "object" && item !== null) {
          const val =
            item.total ?? item.amount ?? item.price ?? item.cost ?? 0;
          if (typeof val === "number") {
            sum += val;
          }
        }
      }
      return sum;
    }
    let totalSum = 0;
    for (const key of Object.keys(pricing)) {
      const val = pricing[key];
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
    estimateId: v.optional(v.id("estimates")),
    pricing: v.optional(pricingValidator),
  },
  handler: async (ctx, args) => {
    let rawPricing: number | Record<string, any> | undefined = args.pricing;
    if (args.estimateId) {
      const estimate = await ctx.db.get(args.estimateId);
      if (estimate) {
        rawPricing = estimate.pricing;
      }
    }
    if (rawPricing === undefined) {
      return 0;
    }
    return computeTotalFromPricing(rawPricing);
  },
});
