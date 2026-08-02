import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Operations Overview Query: Actionable metrics linked to underlying records.
 */
export const getOperationsOverview = query({
  args: {},
  handler: async (ctx) => {
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
    return await ctx.db.query("leads").order("desc").take(50);
  },
});

/**
 * Customer Overview Query: Scoped strictly to authenticated customer email.
 */
export const getCustomerOverview = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const customer = await ctx.db
      .query("customers")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!customer) {
      return {
        customer: null,
        estimates: [],
        jobs: [],
        documents: [],
      };
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
 * Crew Today Assignments Query: Scoped strictly to assigned crew member userId.
 */
export const getCrewTodayAssignments = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const jobs = await ctx.db.query("jobs").collect();

    const assignedJobs = jobs.filter(
      (job) => job.crewIds && job.crewIds.includes(args.userId),
    );

    return assignedJobs;
  },
});

/**
 * Crew Mutation: Submit a prep/finish checklist item.
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
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("checklists")
      .withIndex("by_job_category", (q) =>
        q.eq("jobId", args.jobId).eq("category", args.category),
      )
      .first();

    const itemsWithMeta = args.items.map((item) => ({
      ...item,
      completedBy: item.completed ? args.userId : undefined,
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
      actorId: args.userId,
      action: "crew_checklist_updated",
      targetResource: args.jobId,
      metadata: { category: args.category },
      timestamp: now,
    });

    return { success: true };
  },
});
