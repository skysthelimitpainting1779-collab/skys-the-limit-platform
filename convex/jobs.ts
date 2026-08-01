import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const jobStatusValidator = v.union(
  v.literal("scheduled"),
  v.literal("in_progress"),
  v.literal("completed"),
  v.literal("cancelled")
);

export const scheduleValidator = v.union(
  v.number(),
  v.record(v.string(), v.any()),
  v.string()
);

export const createFromEstimate = mutation({
  args: {
    estimateId: v.id("estimates"),
    schedule: scheduleValidator,
    crewIds: v.optional(v.array(v.id("users"))),
    status: v.optional(jobStatusValidator),
  },
  handler: async (ctx, args) => {
    const estimate = await ctx.db.get(args.estimateId);
    if (!estimate) {
      throw new Error("Estimate not found");
    }

    if (estimate.status !== "accepted") {
      await ctx.db.patch(args.estimateId, { status: "accepted" });
    }

    const jobId = await ctx.db.insert("jobs", {
      estimateId: args.estimateId,
      orgId: estimate.orgId,
      status: args.status ?? "scheduled",
      schedule: args.schedule,
      crewIds: args.crewIds ?? [],
      createdAt: Date.now(),
    });
    return jobId;
  },
});

export const get = query({
  args: {
    jobId: v.id("jobs"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.jobId);
  },
});

export const list = query({
  args: {
    orgId: v.optional(v.id("organizations")),
    status: v.optional(jobStatusValidator),
  },
  handler: async (ctx, args) => {
    if (args.orgId !== undefined && args.status !== undefined) {
      const orgJobs = await ctx.db
        .query("jobs")
        .withIndex("by_org", (q) => q.eq("orgId", args.orgId!))
        .collect();
      return orgJobs.filter((job) => job.status === args.status);
    } else if (args.orgId !== undefined) {
      return await ctx.db
        .query("jobs")
        .withIndex("by_org", (q) => q.eq("orgId", args.orgId!))
        .collect();
    } else if (args.status !== undefined) {
      return await ctx.db
        .query("jobs")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .collect();
    }
    return await ctx.db.query("jobs").collect();
  },
});

export const updateStatus = mutation({
  args: {
    jobId: v.id("jobs"),
    status: jobStatusValidator,
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.jobId);
    if (!existing) {
      throw new Error("Job not found");
    }
    await ctx.db.patch(args.jobId, { status: args.status });
    return await ctx.db.get(args.jobId);
  },
});

export const assignCrew = mutation({
  args: {
    jobId: v.id("jobs"),
    crewIds: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.jobId);
    if (!existing) {
      throw new Error("Job not found");
    }
    await ctx.db.patch(args.jobId, { crewIds: args.crewIds });
    return await ctx.db.get(args.jobId);
  },
});
