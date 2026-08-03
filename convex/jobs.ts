import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  CREW_ROLES,
  getActiveMembership,
  OPERATIONS_MANAGER_ROLES,
  requireActiveMembership,
  requireAuthenticatedUser,
} from "./lib/authorization";
import { jobValidator } from "./lib/returnValidators";

export const jobStatusValidator = v.union(
  v.literal("scheduled"),
  v.literal("in_progress"),
  v.literal("completed"),
  v.literal("cancelled"),
);

export const scheduleValidator = v.union(
  v.number(),
  v.record(v.string(), v.any()),
  v.string(),
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
    const actor = await requireAuthenticatedUser(ctx);
    const estimate = await ctx.db.get(args.estimateId);
    if (!estimate) throw new Error("ESTIMATE_NOT_FOUND");
    await requireActiveMembership(
      ctx,
      actor._id,
      estimate.orgId,
      OPERATIONS_MANAGER_ROLES,
    );
    for (const crewId of new Set(args.crewIds ?? [])) {
      await requireActiveMembership(ctx, crewId, estimate.orgId, CREW_ROLES);
    }
    if (estimate.status !== "accepted") {
      await ctx.db.patch(estimate._id, { status: "accepted" });
    }
    return await ctx.db.insert("jobs", {
      estimateId: estimate._id,
      orgId: estimate.orgId,
      status: args.status ?? "scheduled",
      schedule: args.schedule,
      crewIds: [...new Set(args.crewIds ?? [])],
      createdAt: Date.now(),
    });
  },
});

export const get = query({
  args: { jobId: v.id("jobs") },
  returns: v.union(v.null(), jobValidator),
  handler: async (ctx, args) => {
    const actor = await requireAuthenticatedUser(ctx);
    const job = await ctx.db.get(args.jobId);
    if (!job) return null;
    const membership = await getActiveMembership(ctx, actor._id, job.orgId);
    if (
      membership &&
      (OPERATIONS_MANAGER_ROLES.includes(membership.role) ||
        (CREW_ROLES.includes(membership.role) && job.crewIds.includes(actor._id)))
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
    const actor = await requireAuthenticatedUser(ctx);
    const membership = await requireActiveMembership(ctx, actor._id, args.orgId);
    if (
      !OPERATIONS_MANAGER_ROLES.includes(membership.role) &&
      !CREW_ROLES.includes(membership.role)
    ) {
      throw new Error("FORBIDDEN");
    }
    const jobs =
      args.status === undefined
        ? await ctx.db
            .query("jobs")
            .withIndex("by_org", (index) => index.eq("orgId", args.orgId))
            .order("desc")
            .take(100)
        : await ctx.db
            .query("jobs")
            .withIndex("by_org_and_status", (index) =>
              index.eq("orgId", args.orgId).eq("status", args.status!),
            )
            .order("desc")
            .take(100);
    return OPERATIONS_MANAGER_ROLES.includes(membership.role)
      ? jobs
      : jobs.filter((job) => job.crewIds.includes(actor._id));
  },
});

export const updateStatus = mutation({
  args: { jobId: v.id("jobs"), status: jobStatusValidator },
  returns: jobValidator,
  handler: async (ctx, args) => {
    const actor = await requireAuthenticatedUser(ctx);
    const job = await ctx.db.get(args.jobId);
    if (!job) throw new Error("JOB_NOT_FOUND");
    const membership = await requireActiveMembership(ctx, actor._id, job.orgId);
    const mayUpdate =
      OPERATIONS_MANAGER_ROLES.includes(membership.role) ||
      (membership.role === "crew_lead" &&
        job.crewIds.includes(actor._id));
    if (!mayUpdate) throw new Error("FORBIDDEN");
    await ctx.db.patch(job._id, { status: args.status });
    const updated = await ctx.db.get(job._id);
    if (!updated) throw new Error("JOB_NOT_FOUND");
    return updated;
  },
});

export const assignCrew = mutation({
  args: { jobId: v.id("jobs"), crewIds: v.array(v.id("users")) },
  returns: jobValidator,
  handler: async (ctx, args) => {
    const actor = await requireAuthenticatedUser(ctx);
    const job = await ctx.db.get(args.jobId);
    if (!job) throw new Error("JOB_NOT_FOUND");
    await requireActiveMembership(
      ctx,
      actor._id,
      job.orgId,
      OPERATIONS_MANAGER_ROLES,
    );
    const crewIds = [...new Set(args.crewIds)];
    for (const crewId of crewIds) {
      await requireActiveMembership(ctx, crewId, job.orgId, CREW_ROLES);
    }
    await ctx.db.patch(job._id, { crewIds });
    const updated = await ctx.db.get(job._id);
    if (!updated) throw new Error("JOB_NOT_FOUND");
    return updated;
  },
});
