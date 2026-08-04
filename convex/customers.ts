import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  CUSTOMER_ROLES,
  OPERATIONS_ROLES,
  ROLE_ADMIN_ROLES,
  requireActiveMembership,
  requireAuthenticatedUser,
} from "./lib/authorization";
import { appendAuditEvent } from "./lib/audit";

export const customerStatusValidator = v.union(
  v.literal("prospect"),
  v.literal("active"),
  v.literal("archived"),
);

const customerValidator = v.object({
  _id: v.id("customers"),
  _creationTime: v.number(),
  orgId: v.id("organizations"),
  userId: v.optional(v.id("users")),
  leadId: v.optional(v.id("leads")),
  name: v.string(),
  email: v.string(),
  phone: v.optional(v.string()),
  status: customerStatusValidator,
  createdAt: v.number(),
  updatedAt: v.number(),
});

const portalCustomerValidator = v.object({
  _id: v.id("customers"),
  orgId: v.id("organizations"),
  name: v.string(),
  email: v.string(),
  phone: v.optional(v.string()),
  status: customerStatusValidator,
});

const propertyValidator = v.object({
  _id: v.id("properties"),
  label: v.optional(v.string()),
  address: v.string(),
  propertyType: v.optional(v.string()),
  accessNotes: v.optional(v.string()),
});

const portalEstimateValidator = v.object({
  _id: v.id("estimates"),
  propertyId: v.optional(v.id("properties")),
  scope: v.string(),
  pricing: v.union(v.number(), v.record(v.string(), v.any())),
  status: v.union(
    v.literal("draft"),
    v.literal("sent"),
    v.literal("accepted"),
    v.literal("declined"),
    v.literal("expired"),
  ),
  createdAt: v.number(),
});

const portalJobValidator = v.object({
  _id: v.id("jobs"),
  propertyId: v.optional(v.id("properties")),
  title: v.optional(v.string()),
  address: v.optional(v.string()),
  status: v.union(
    v.literal("scheduled"),
    v.literal("in_progress"),
    v.literal("completed"),
    v.literal("cancelled"),
  ),
  schedule: v.union(v.number(), v.record(v.string(), v.any()), v.string()),
});

const customerUpdateValidator = v.object({
  _id: v.id("projectUpdates"),
  _creationTime: v.number(),
  jobId: v.id("jobs"),
  message: v.string(),
  createdAt: v.number(),
});

function boundedLimit(value: number | undefined, fallback = 50) {
  return Math.min(Math.max(Math.floor(value ?? fallback), 1), 100);
}

export const list = query({
  args: {
    orgId: v.id("organizations"),
    status: v.optional(customerStatusValidator),
    limit: v.optional(v.number()),
  },
  returns: v.array(customerValidator),
  handler: async (ctx, args) => {
    const actor = await requireAuthenticatedUser(ctx);
    await requireActiveMembership(ctx, actor._id, args.orgId, OPERATIONS_ROLES);
    const limit = boundedLimit(args.limit);
    return args.status === undefined
      ? await ctx.db
          .query("customers")
          .withIndex("by_org", (index) => index.eq("orgId", args.orgId))
          .order("desc")
          .take(limit)
      : await ctx.db
          .query("customers")
          .withIndex("by_org_and_status", (index) =>
            index.eq("orgId", args.orgId).eq("status", args.status!),
          )
          .order("desc")
          .take(limit);
  },
});

export const createFromLead = mutation({
  args: {
    leadId: v.id("leads"),
    status: v.optional(customerStatusValidator),
  },
  returns: v.id("customers"),
  handler: async (ctx, args) => {
    const actor = await requireAuthenticatedUser(ctx);
    const lead = await ctx.db.get(args.leadId);
    if (!lead?.orgId) throw new Error("LEAD_NOT_FOUND");
    await requireActiveMembership(ctx, actor._id, lead.orgId, OPERATIONS_ROLES);

    const existing = await ctx.db
      .query("customers")
      .withIndex("by_lead", (index) => index.eq("leadId", lead._id))
      .unique();
    if (existing) {
      if (existing.orgId !== lead.orgId) throw new Error("RESOURCE_ORG_MISMATCH");
      return existing._id;
    }

    const now = Date.now();
    const customerId = await ctx.db.insert("customers", {
      orgId: lead.orgId,
      leadId: lead._id,
      name: lead.fullName,
      email: lead.email,
      phone: lead.phone,
      status: args.status ?? "prospect",
      createdAt: now,
      updatedAt: now,
    });
    const propertyId = await ctx.db.insert("properties", {
      orgId: lead.orgId,
      customerId,
      label: "Primary property",
      address: lead.serviceAddress,
      propertyType: lead.segment,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.patch(lead._id, { customerId, propertyId, updatedAt: now });
    await appendAuditEvent(ctx, {
      orgId: lead.orgId,
      actorId: actor._id,
      action: "customer.created_from_lead",
      targetResource: customerId,
      metadata: { leadId: lead._id, propertyId },
      timestamp: now,
    });
    return customerId;
  },
});

export const linkUser = mutation({
  args: {
    customerId: v.id("customers"),
    userId: v.id("users"),
  },
  returns: customerValidator,
  handler: async (ctx, args) => {
    const actor = await requireAuthenticatedUser(ctx);
    const customer = await ctx.db.get(args.customerId);
    if (!customer) throw new Error("CUSTOMER_NOT_FOUND");
    await requireActiveMembership(
      ctx,
      actor._id,
      customer.orgId,
      ROLE_ADMIN_ROLES,
    );
    await requireActiveMembership(
      ctx,
      args.userId,
      customer.orgId,
      CUSTOMER_ROLES,
    );

    const alreadyBound = await ctx.db
      .query("customers")
      .withIndex("by_org_and_user", (index) =>
        index.eq("orgId", customer.orgId).eq("userId", args.userId),
      )
      .unique();
    if (alreadyBound && alreadyBound._id !== customer._id) {
      throw new Error("CUSTOMER_USER_ALREADY_BOUND");
    }
    if (customer.userId && customer.userId !== args.userId) {
      throw new Error("CUSTOMER_ALREADY_BOUND");
    }

    const now = Date.now();
    await ctx.db.patch(customer._id, { userId: args.userId, updatedAt: now });
    await appendAuditEvent(ctx, {
      orgId: customer.orgId,
      actorId: actor._id,
      action: "customer.user_linked",
      targetResource: customer._id,
      metadata: { userId: args.userId },
      timestamp: now,
    });
    const updated = await ctx.db.get(customer._id);
    if (!updated) throw new Error("CUSTOMER_NOT_FOUND");
    return updated;
  },
});

export const getMyPortal = query({
  args: { orgId: v.id("organizations") },
  returns: v.union(
    v.null(),
    v.object({
      customer: portalCustomerValidator,
      properties: v.array(propertyValidator),
      estimates: v.array(portalEstimateValidator),
      jobs: v.array(portalJobValidator),
      updates: v.array(customerUpdateValidator),
    }),
  ),
  handler: async (ctx, args) => {
    const actor = await requireAuthenticatedUser(ctx);
    await requireActiveMembership(
      ctx,
      actor._id,
      args.orgId,
      CUSTOMER_ROLES,
    );
    const customer = await ctx.db
      .query("customers")
      .withIndex("by_org_and_user", (index) =>
        index.eq("orgId", args.orgId).eq("userId", actor._id),
      )
      .unique();
    if (!customer) return null;

    const [properties, estimates, jobs, updates] = await Promise.all([
      ctx.db
        .query("properties")
        .withIndex("by_org_and_customer", (index) =>
          index.eq("orgId", args.orgId).eq("customerId", customer._id),
        )
        .take(100),
      ctx.db
        .query("estimates")
        .withIndex("by_org_and_customer", (index) =>
          index.eq("orgId", args.orgId).eq("customerId", customer._id),
        )
        .order("desc")
        .take(100),
      ctx.db
        .query("jobs")
        .withIndex("by_org_and_customer", (index) =>
          index.eq("orgId", args.orgId).eq("customerId", customer._id),
        )
        .order("desc")
        .take(100),
      ctx.db
        .query("projectUpdates")
        .withIndex("by_org_and_customer_and_customer_visible_and_created_at", (index) =>
          index
            .eq("orgId", args.orgId)
            .eq("customerId", customer._id)
            .eq("customerVisible", true),
        )
        .order("desc")
        .take(100),
    ]);

    return {
      customer: {
        _id: customer._id,
        orgId: customer.orgId,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        status: customer.status,
      },
      properties: properties.map((property) => ({
        _id: property._id,
        label: property.label,
        address: property.address,
        propertyType: property.propertyType,
        accessNotes: property.accessNotes,
      })),
      estimates: estimates.map((estimate) => ({
        _id: estimate._id,
        propertyId: estimate.propertyId,
        scope: estimate.scope,
        pricing: estimate.pricing,
        status: estimate.status,
        createdAt: estimate.createdAt,
      })),
      jobs: jobs.map((job) => ({
        _id: job._id,
        propertyId: job.propertyId,
        title: job.title,
        address: job.address,
        status: job.status,
        schedule: job.schedule,
      })),
      updates: updates.map((update) => ({
        _id: update._id,
        _creationTime: update._creationTime,
        jobId: update.jobId,
        message: update.message,
        createdAt: update.createdAt,
      })),
    };
  },
});
