import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  OPERATIONS_ROLES,
  requireActiveMembership,
  requireAuthenticatedUser,
} from "./lib/authorization";
import { estimateValidator } from "./lib/returnValidators";
import { appendAuditEvent } from "./lib/audit";

export const estimateStatusValidator = v.union(
  v.literal("draft"),
  v.literal("sent"),
  v.literal("accepted"),
  v.literal("declined"),
  v.literal("expired"),
);

export const pricingValidator = v.union(
  v.number(),
  v.record(v.string(), v.any()),
);

const MAX_SCOPE_LENGTH = 20_000;
const MAX_PRICING_BYTES = 100_000;

function normalizeScope(scope: string) {
  const normalized = scope.trim();
  if (!normalized || normalized.length > MAX_SCOPE_LENGTH) {
    throw new Error("INVALID_ESTIMATE_SCOPE");
  }
  return normalized;
}

function validatePricing(
  pricing: number | Record<string, unknown>,
): number | Record<string, unknown> {
  if (typeof pricing === "number") {
    if (!Number.isFinite(pricing) || pricing < 0) {
      throw new Error("INVALID_ESTIMATE_PRICING");
    }
    return pricing;
  }

  let serialized: string;
  try {
    serialized = JSON.stringify(pricing);
  } catch {
    throw new Error("INVALID_ESTIMATE_PRICING");
  }
  if (new TextEncoder().encode(serialized).byteLength > MAX_PRICING_BYTES) {
    throw new Error("ESTIMATE_PRICING_LIMIT_EXCEEDED");
  }
  const total = computeTotalFromPricing(pricing);
  if (!Number.isFinite(total) || total < 0) {
    throw new Error("INVALID_ESTIMATE_PRICING");
  }
  return pricing;
}

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
    const actor = await requireAuthenticatedUser(ctx);
    await requireActiveMembership(ctx, actor._id, args.orgId, OPERATIONS_ROLES);
    const lead = await ctx.db.get(args.leadId);
    if (!lead || lead.orgId !== args.orgId) {
      throw new Error("LEAD_NOT_FOUND");
    }
    const now = Date.now();
    const estimateId = await ctx.db.insert("estimates", {
      leadId: lead._id,
      orgId: args.orgId,
      customerId: lead.customerId,
      propertyId: lead.propertyId,
      scope: normalizeScope(args.scope),
      pricing: validatePricing(args.pricing),
      status: args.status ?? "draft",
      createdAt: now,
      updatedAt: now,
    });
    await appendAuditEvent(ctx, {
      orgId: args.orgId,
      actorId: actor._id,
      action: "estimate.created",
      targetResource: estimateId,
      metadata: { leadId: lead._id, customerId: lead.customerId },
      timestamp: now,
    });
    return estimateId;
  },
});

export const get = query({
  args: { estimateId: v.id("estimates") },
  returns: v.union(v.null(), estimateValidator),
  handler: async (ctx, args) => {
    const actor = await requireAuthenticatedUser(ctx);
    const estimate = await ctx.db.get(args.estimateId);
    if (!estimate) return null;
    await requireActiveMembership(
      ctx,
      actor._id,
      estimate.orgId,
      OPERATIONS_ROLES,
    );
    return estimate;
  },
});

export const listByLead = query({
  args: { leadId: v.id("leads") },
  returns: v.array(estimateValidator),
  handler: async (ctx, args) => {
    const actor = await requireAuthenticatedUser(ctx);
    const lead = await ctx.db.get(args.leadId);
    if (!lead?.orgId) throw new Error("LEAD_NOT_FOUND");
    await requireActiveMembership(ctx, actor._id, lead.orgId, OPERATIONS_ROLES);
    const estimates = await ctx.db
      .query("estimates")
      .withIndex("by_lead", (index) => index.eq("leadId", lead._id))
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
    const actor = await requireAuthenticatedUser(ctx);
    await requireActiveMembership(ctx, actor._id, args.orgId, OPERATIONS_ROLES);
    return args.status === undefined
      ? await ctx.db
          .query("estimates")
          .withIndex("by_org", (index) => index.eq("orgId", args.orgId))
          .order("desc")
          .take(100)
      : await ctx.db
          .query("estimates")
          .withIndex("by_org_and_status", (index) =>
            index.eq("orgId", args.orgId).eq("status", args.status!),
          )
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
    const actor = await requireAuthenticatedUser(ctx);
    const estimate = await ctx.db.get(args.estimateId);
    if (!estimate) throw new Error("ESTIMATE_NOT_FOUND");
    await requireActiveMembership(
      ctx,
      actor._id,
      estimate.orgId,
      OPERATIONS_ROLES,
    );

    const updates: {
      scope?: string;
      pricing?: number | Record<string, unknown>;
      status?: "draft" | "sent" | "accepted" | "declined" | "expired";
      updatedAt?: number;
    } = {};
    if (args.scope !== undefined) updates.scope = normalizeScope(args.scope);
    if (args.pricing !== undefined) updates.pricing = validatePricing(args.pricing);
    if (args.status !== undefined) updates.status = args.status;
    updates.updatedAt = Date.now();
    await ctx.db.patch(estimate._id, updates);
    await appendAuditEvent(ctx, {
      orgId: estimate.orgId,
      actorId: actor._id,
      action: "estimate.updated",
      targetResource: estimate._id,
      metadata: { status: args.status },
      timestamp: updates.updatedAt,
    });
    const updated = await ctx.db.get(estimate._id);
    if (!updated) throw new Error("ESTIMATE_NOT_FOUND");
    return updated;
  },
});

export function computeTotalFromPricing(
  pricing: number | Record<string, unknown>,
): number {
  if (typeof pricing === "number") return pricing;
  if (typeof pricing !== "object" || pricing === null) return 0;
  if (typeof pricing.total === "number") return pricing.total;
  if (Array.isArray(pricing.items)) {
    return pricing.items.reduce((sum: number, item: unknown) => {
      if (typeof item === "number") return sum + item;
      if (typeof item !== "object" || item === null) return sum;
      const record = item as Record<string, unknown>;
      const value = record.total ?? record.amount ?? record.price ?? record.cost;
      return sum + (typeof value === "number" ? value : 0);
    }, 0);
  }
  return Object.values(pricing).reduce<number>(
    (sum, value) => sum + (typeof value === "number" ? value : 0),
    0,
  );
}

/** Public pure helper. It cannot load stored estimates or pricing. */
export const calculateTotal = query({
  args: { pricing: v.optional(pricingValidator) },
  returns: v.number(),
  handler: async (_ctx, args) =>
    args.pricing === undefined
      ? 0
      : computeTotalFromPricing(validatePricing(args.pricing)),
});
