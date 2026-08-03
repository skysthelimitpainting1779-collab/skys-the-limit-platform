import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
  CREW_ROLES,
  getActiveMembership,
  OPERATIONS_MANAGER_ROLES,
  requireActiveMembership,
  requireActiveOrganization,
  requireAuthenticatedUser,
} from "./lib/authorization";
import { jobValidator } from "./lib/returnValidators";

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
  returns: v.id("jobs"),
  handler: async (ctx, args) => {
    const currentUser = await requireAuthenticatedUser(ctx);
    const estimate = await ctx.db.get(args.estimateId);
    if (!estimate) {
      throw new Error("Estimate not found");
    }
    await requireActiveMembership(
      ctx,
      currentUser._id,
      estimate.orgId,
      OPERATIONS_MANAGER_ROLES,
    );

    for (const crewId of args.crewIds ?? []) {
      await requireActiveMembership(ctx, crewId, estimate.orgId, CREW_ROLES);
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
  returns: v.union(v.null(), jobValidator),
  handler: async (ctx, args) => {
    const currentUser = await requireAuthenticatedUser(ctx);
    const job = await ctx.db.get(args.jobId);
    if (!job) return null;

    if (job.customerId) {
      const customer = await ctx.db.get(job.customerId);
      if (customer?.userId === currentUser._id) {
        if (customer.orgId !== job.orgId) throw new Error("FORBIDDEN");
        await requireActiveOrganization(ctx, job.orgId);
        return job;
      }
    }

    const membership = await getActiveMembership(
      ctx,
      currentUser._id,
      job.orgId,
    );
    if (
      membership &&
      (OPERATIONS_MANAGER_ROLES.includes(membership.role) ||
        (CREW_ROLES.includes(membership.role) &&
          job.crewIds.includes(currentUser._id)))
    ) {
      return job;
    }

    throw new Error("FORBIDDEN");
  },
});

export const list = query({
  args: {
    orgId: v.id("organizations"),
    status: v.optional(jobStatusValidator),
  },
  returns: v.array(jobValidator),
  handler: async (ctx, args) => {
    const currentUser = await requireAuthenticatedUser(ctx);
    const membership = await requireActiveMembership(
      ctx,
      currentUser._id,
      args.orgId,
    );
    if (
      !OPERATIONS_MANAGER_ROLES.includes(membership.role) &&
      !CREW_ROLES.includes(membership.role)
    ) {
      throw new Error("FORBIDDEN");
    }

    const jobs =
      args.status !== undefined
        ? await ctx.db
            .query("jobs")
            .withIndex("by_org_and_status", (q) =>
              q.eq("orgId", args.orgId).eq("status", args.status!),
            )
            .order("desc")
            .take(100)
        : await ctx.db
            .query("jobs")
            .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
            .order("desc")
            .take(100);

    return OPERATIONS_MANAGER_ROLES.includes(membership.role)
      ? jobs
      : jobs.filter((job) => job.crewIds.includes(currentUser._id));
  },
});

export const updateStatus = mutation({
  args: {
    jobId: v.id("jobs"),
    status: jobStatusValidator,
  },
  returns: jobValidator,
  handler: async (ctx, args) => {
    const currentUser = await requireAuthenticatedUser(ctx);
    const existing = await ctx.db.get(args.jobId);
    if (!existing) {
      throw new Error("Job not found");
    }
    const membership = await requireActiveMembership(
      ctx,
      currentUser._id,
      existing.orgId,
    );
    const mayUpdate =
      OPERATIONS_MANAGER_ROLES.includes(membership.role) ||
      (CREW_ROLES.includes(membership.role) &&
        existing.crewIds.includes(currentUser._id));
    if (!mayUpdate) throw new Error("FORBIDDEN");
    await ctx.db.patch(args.jobId, { status: args.status });
    const updated = await ctx.db.get(args.jobId);
    if (!updated) throw new Error("Job not found");
    return updated;
  },
});

export const assignCrew = mutation({
  args: {
    jobId: v.id("jobs"),
    crewIds: v.array(v.id("users")),
  },
  returns: jobValidator,
  handler: async (ctx, args) => {
    const currentUser = await requireAuthenticatedUser(ctx);
    const existing = await ctx.db.get(args.jobId);
    if (!existing) {
      throw new Error("Job not found");
    }
    await requireActiveMembership(
      ctx,
      currentUser._id,
      existing.orgId,
      OPERATIONS_MANAGER_ROLES,
    );
    for (const crewId of args.crewIds) {
      await requireActiveMembership(ctx, crewId, existing.orgId, CREW_ROLES);
    }
    await ctx.db.patch(args.jobId, { crewIds: args.crewIds });
    const updated = await ctx.db.get(args.jobId);
    if (!updated) throw new Error("Job not found");
    return updated;
  },
});
