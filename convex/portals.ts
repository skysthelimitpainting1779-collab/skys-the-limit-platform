import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import {
  assertCrewAssignment,
  assertCustomerOwnership,
  CREW_ROLES,
  listActiveMemberships,
  OPERATIONS_ROLES,
  requireActiveMembership,
  requireActiveOrganization,
  requireAuthenticatedUser,
} from "./lib/authorization";
import {
  customerValidator,
  documentValidator,
  estimateValidator,
  jobValidator,
  leadValidator,
} from "./lib/returnValidators";

/**
 * Operations Overview Query: restricted to authenticated operations roles.
 */
export const getOperationsOverview = query({
  args: { orgId: v.id("organizations") },
  returns: v.object({
    newLeadsCount: v.number(),
    pendingEstimatesCount: v.number(),
    activeJobsCount: v.number(),
    recentAuditCount: v.number(),
    countsCapped: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const currentUser = await requireAuthenticatedUser(ctx);
    await requireActiveMembership(
      ctx,
      currentUser._id,
      args.orgId,
      OPERATIONS_ROLES,
    );

    const newLeads = await ctx.db
      .query("leads")
      .withIndex("by_org_and_status", (q) =>
        q.eq("orgId", args.orgId).eq("status", "new"),
      )
      .take(501);

    const pendingEstimates = await ctx.db
      .query("estimates")
      .withIndex("by_org_and_status", (q) =>
        q.eq("orgId", args.orgId).eq("status", "sent"),
      )
      .take(501);

    const activeJobs = await ctx.db
      .query("jobs")
      .withIndex("by_org_and_stage", (q) =>
        q.eq("orgId", args.orgId).eq("stage", "in_progress"),
      )
      .take(501);

    const auditCount = (
      await ctx.db
        .query("auditEvents")
        .withIndex("by_org_and_timestamp", (q) =>
          q.eq("orgId", args.orgId),
        )
        .order("desc")
        .take(20)
    ).length;

    return {
      newLeadsCount: Math.min(newLeads.length, 500),
      pendingEstimatesCount: Math.min(pendingEstimates.length, 500),
      activeJobsCount: Math.min(activeJobs.length, 500),
      recentAuditCount: auditCount,
      countsCapped:
        newLeads.length > 500 ||
        pendingEstimates.length > 500 ||
        activeJobs.length > 500,
    };
  },
});

/**
 * Operations Leads Directory Query.
 */
export const listOperationsLeads = query({
  args: {
    orgId: v.id("organizations"),
    status: v.optional(
      v.union(
        v.literal("new"),
        v.literal("contacted"),
        v.literal("qualified"),
        v.literal("scheduled"),
        v.literal("closed"),
        v.literal("lost"),
      ),
    ),
  },
  returns: v.array(leadValidator),
  handler: async (ctx, args) => {
    const currentUser = await requireAuthenticatedUser(ctx);
    await requireActiveMembership(
      ctx,
      currentUser._id,
      args.orgId,
      OPERATIONS_ROLES,
    );

    if (args.status) {
      return await ctx.db
        .query("leads")
        .withIndex("by_org_and_status", (q) =>
          q.eq("orgId", args.orgId).eq("status", args.status!),
        )
        .order("desc")
        .take(50);
    }

    return await ctx.db
      .query("leads")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .order("desc")
      .take(50);
  },
});

/**
 * Customer Overview Query: identity is derived from the authenticated Convex
 * token. The client cannot select another customer's email or user ID.
 */
export const getCustomerOverview = query({
  args: {},
  returns: v.object({
    customer: v.union(v.null(), customerValidator),
    estimates: v.array(estimateValidator),
    jobs: v.array(jobValidator),
    documents: v.array(documentValidator),
  }),
  handler: async (ctx) => {
    const currentUser = await requireAuthenticatedUser(ctx);

    const customerByUser = await ctx.db
      .query("customers")
      .withIndex("by_user", (q) => q.eq("userId", currentUser._id))
      .first();

    const customer = customerByUser;

    if (!customer) {
      return {
        customer: null,
        estimates: [],
        jobs: [],
        documents: [],
      };
    }

    assertCustomerOwnership(customer.userId, currentUser._id);
    await requireActiveOrganization(ctx, customer.orgId);

    const estimates = (
      await ctx.db
        .query("estimates")
        .withIndex("by_customer", (q) => q.eq("customerId", customer._id))
        .take(100)
    ).filter((estimate) => estimate.orgId === customer.orgId);

    const jobs = (
      await ctx.db
        .query("jobs")
        .withIndex("by_customer", (q) => q.eq("customerId", customer._id))
        .take(100)
    ).filter((job) => job.orgId === customer.orgId);

    const documents = (
      await ctx.db
        .query("documents")
        .withIndex("by_customer", (q) => q.eq("customerId", customer._id))
        .take(100)
    ).filter((document) => document.orgId === customer.orgId);

    return {
      customer,
      estimates,
      jobs,
      documents,
    };
  },
});

/**
 * Crew assignments are derived from the authenticated application user.
 */
export const getCrewTodayAssignments = query({
  args: {},
  returns: v.array(jobValidator),
  handler: async (ctx) => {
    const currentUser = await requireAuthenticatedUser(ctx);
    const memberships = await listActiveMemberships(
      ctx,
      currentUser._id,
      CREW_ROLES,
    );
    if (memberships.length === 0) throw new Error("FORBIDDEN");

    const authorizedJobs = new Map<Id<"jobs">, Doc<"jobs">>();
    for (const membership of memberships) {
      const jobs = await ctx.db
        .query("jobs")
        .withIndex("by_org", (q) => q.eq("orgId", membership.orgId))
        .order("desc")
        .take(100);
      for (const job of jobs) {
        if (job.crewIds.includes(currentUser._id)) {
          authorizedJobs.set(job._id, job);
        }
      }
    }

    return Array.from(authorizedJobs.values());
  },
});

/**
 * Crew Mutation: submit checklist progress only for an assigned job. Actor and
 * audit identity are derived from the authenticated token.
 */
export const submitChecklistProgress = mutation({
  args: {
    jobId: v.id("jobs"),
    category: v.union(
      v.literal("preparation"),
      v.literal("safety"),
      v.literal("quality"),
      v.literal("completion"),
    ),
    items: v.array(
      v.object({
        id: v.string(),
        label: v.string(),
        completed: v.boolean(),
      }),
    ),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const currentUser = await requireAuthenticatedUser(ctx);
    const job = await ctx.db.get(args.jobId);
    if (!job) throw new Error("JOB_NOT_FOUND");

    const membership = await requireActiveMembership(
      ctx,
      currentUser._id,
      job.orgId,
      CREW_ROLES,
    );
    assertCrewAssignment(job.crewIds, currentUser._id, membership.role);

    const now = Date.now();
    const existing = await ctx.db
      .query("checklists")
      .withIndex("by_job_category", (q) =>
        q.eq("jobId", args.jobId).eq("category", args.category),
      )
      .first();

    const itemsWithMeta = args.items.map((item) => ({
      ...item,
      completedBy: item.completed ? currentUser._id : undefined,
      completedAt: item.completed ? now : undefined,
    }));

    if (existing) {
      await ctx.db.patch(existing._id, { items: itemsWithMeta });
    } else {
      await ctx.db.insert("checklists", {
        jobId: args.jobId,
        category: args.category,
        items: itemsWithMeta,
      });
    }

    await ctx.db.insert("auditEvents", {
      orgId: job.orgId,
      actorId: currentUser._id,
      action: "crew_checklist_updated",
      targetResource: args.jobId,
      metadata: { category: args.category },
      timestamp: now,
    });

    return { success: true };
  },
});
