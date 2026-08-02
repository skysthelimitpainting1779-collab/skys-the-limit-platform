import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
  assertCrewAssignment,
  assertCustomerOwnership,
  CREW_ROLES,
  OPERATIONS_ROLES,
  requireAuthenticatedUser,
} from "./lib/authorization";

/**
 * Operations Overview Query: restricted to authenticated operations roles.
 */
export const getOperationsOverview = query({
  args: {},
  handler: async (ctx) => {
    await requireAuthenticatedUser(ctx, OPERATIONS_ROLES);

    const newLeads = await ctx.db
      .query("leads")
      .withIndex("by_status", (q) => q.eq("status", "new"))
      .collect();

    const pendingEstimates = await ctx.db
      .query("estimates")
      .withIndex("by_status", (q) => q.eq("status", "sent"))
      .collect();

    const activeJobs = await ctx.db
      .query("jobs")
      .withIndex("by_stage", (q) => q.eq("stage", "in_progress"))
      .collect();

    const auditCount = (await ctx.db.query("auditEvents").take(20)).length;

    return {
      newLeadsCount: newLeads.length,
      pendingEstimatesCount: pendingEstimates.length,
      activeJobsCount: activeJobs.length,
      recentAuditCount: auditCount,
      timestamp: Date.now(),
    };
  },
});

/**
 * Operations Leads Directory Query.
 */
export const listOperationsLeads = query({
  args: {},
  handler: async (ctx) => {
    await requireAuthenticatedUser(ctx, OPERATIONS_ROLES);
    return await ctx.db.query("leads").order("desc").take(50);
  },
});

/**
 * Customer Overview Query: identity is derived from the authenticated Convex
 * token. The client cannot select another customer's email or user ID.
 */
export const getCustomerOverview = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await requireAuthenticatedUser(ctx, ["customer"]);

    const customerByUser = await ctx.db
      .query("customers")
      .withIndex("by_user", (q) => q.eq("userId", currentUser._id))
      .first();

    const customer =
      customerByUser ??
      (await ctx.db
        .query("customers")
        .withIndex("by_email", (q) => q.eq("email", currentUser.email))
        .first());

    if (!customer) {
      return {
        customer: null,
        estimates: [],
        jobs: [],
        documents: [],
      };
    }

    if (customer.userId) {
      assertCustomerOwnership(customer.userId, currentUser._id);
    } else if (customer.email !== currentUser.email) {
      throw new Error("FORBIDDEN");
    }

    const estimates = await ctx.db
      .query("estimates")
      .withIndex("by_customer", (q) => q.eq("customerId", customer._id))
      .collect();

    const jobs = await ctx.db
      .query("jobs")
      .withIndex("by_customer", (q) => q.eq("customerId", customer._id))
      .collect();

    const documents = await ctx.db
      .query("documents")
      .withIndex("by_customer", (q) => q.eq("customerId", customer._id))
      .collect();

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
  handler: async (ctx) => {
    const currentUser = await requireAuthenticatedUser(ctx, CREW_ROLES);
    const jobs = await ctx.db.query("jobs").collect();

    return jobs.filter(
      (job) => job.crewIds && job.crewIds.includes(currentUser._id),
    );
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
  handler: async (ctx, args) => {
    const currentUser = await requireAuthenticatedUser(ctx, CREW_ROLES);
    const job = await ctx.db.get(args.jobId);
    if (!job) throw new Error("JOB_NOT_FOUND");

    assertCrewAssignment(job.crewIds, currentUser._id, currentUser.role);

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
      actorId: currentUser._id,
      action: "crew_checklist_updated",
      targetResource: args.jobId,
      metadata: { category: args.category },
      timestamp: now,
    });

    return { success: true };
  },
});
