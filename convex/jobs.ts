import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import {
  CREW_ROLES,
  OPERATIONS_MANAGER_ROLES,
  OPERATIONS_READ_ROLES,
  getActiveMembership,
  requireActiveMembership,
  requireAuthenticatedUser,
  requireCrewAssignment,
} from "./lib/authorization";
import { appendAuditEvent } from "./lib/audit";
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

const taskValidator = v.object({
  _id: v.id("tasks"),
  _creationTime: v.number(),
  orgId: v.id("organizations"),
  jobId: v.id("jobs"),
  title: v.string(),
  description: v.optional(v.string()),
  assigneeId: v.optional(v.id("users")),
  completed: v.boolean(),
  completedBy: v.optional(v.id("users")),
  completedAt: v.optional(v.number()),
  createdBy: v.id("users"),
  createdAt: v.number(),
  updatedAt: v.number(),
});

const projectUpdateValidator = v.object({
  _id: v.id("projectUpdates"),
  _creationTime: v.number(),
  orgId: v.id("organizations"),
  jobId: v.id("jobs"),
  customerId: v.optional(v.id("customers")),
  actorId: v.id("users"),
  message: v.string(),
  customerVisible: v.boolean(),
  createdAt: v.number(),
});

type JobContext = QueryCtx | MutationCtx;
const MAX_CREW_ASSIGNMENTS_PER_JOB = 50;

function boundedLimit(value: number | undefined, fallback = 50) {
  return Math.min(Math.max(Math.floor(value ?? fallback), 1), 100);
}

function normalizedRequired(value: string, code: string, max: number) {
  const normalized = value.trim();
  if (!normalized || normalized.length > max) throw new Error(code);
  return normalized;
}

function normalizeSchedule(
  schedule: number | Record<string, unknown> | string,
): number | Record<string, unknown> | string {
  if (typeof schedule === "number") {
    if (!Number.isFinite(schedule)) throw new Error("INVALID_JOB_SCHEDULE");
    return schedule;
  }
  if (typeof schedule === "string") {
    return normalizedRequired(schedule, "INVALID_JOB_SCHEDULE", 500);
  }
  let serialized: string;
  try {
    serialized = JSON.stringify(schedule);
  } catch {
    throw new Error("INVALID_JOB_SCHEDULE");
  }
  if (new TextEncoder().encode(serialized).byteLength > 20_000) {
    throw new Error("JOB_SCHEDULE_LIMIT_EXCEEDED");
  }
  return schedule;
}

function uniqueCrewIds(crewIds: Id<"users">[]) {
  const unique = [...new Set(crewIds)];
  if (unique.length > MAX_CREW_ASSIGNMENTS_PER_JOB) {
    throw new Error("CREW_ASSIGNMENT_LIMIT_EXCEEDED");
  }
  return unique;
}

async function syncCrewAssignments(
  ctx: MutationCtx,
  job: Doc<"jobs">,
  crewIds: Id<"users">[],
  now: number,
) {
  const desiredCrewIds = uniqueCrewIds(crewIds);
  const existingAssignments = await ctx.db
    .query("assignments")
    .withIndex("by_job", (index) => index.eq("jobId", job._id))
    .take(MAX_CREW_ASSIGNMENTS_PER_JOB + 1);
  if (existingAssignments.length > MAX_CREW_ASSIGNMENTS_PER_JOB) {
    throw new Error("CREW_ASSIGNMENT_RELATION_LIMIT_EXCEEDED");
  }

  const existingByUser = new Map<
    Id<"users">,
    Doc<"assignments">
  >();
  for (const assignment of existingAssignments) {
    if (existingByUser.has(assignment.userId)) {
      throw new Error("CREW_ASSIGNMENT_RELATION_INVALID");
    }
    existingByUser.set(assignment.userId, assignment);
  }

  const desired = new Set(desiredCrewIds);
  for (const assignment of existingAssignments) {
    if (!desired.has(assignment.userId)) {
      await ctx.db.delete(assignment._id);
    }
  }
  for (const userId of desiredCrewIds) {
    const existing = existingByUser.get(userId);
    if (existing) {
      if (
        existing.orgId !== job.orgId ||
        existing.jobStatus !== job.status ||
        existing.jobCreatedAt !== job.createdAt
      ) {
        await ctx.db.patch(existing._id, {
          orgId: job.orgId,
          jobStatus: job.status,
          jobCreatedAt: job.createdAt,
        });
      }
      continue;
    }
    await ctx.db.insert("assignments", {
      orgId: job.orgId,
      jobId: job._id,
      userId,
      jobStatus: job.status,
      jobCreatedAt: job.createdAt,
      assignedAt: now,
    });
  }
}

async function requireJobRead(ctx: JobContext, job: Doc<"jobs">) {
  const actor = await requireAuthenticatedUser(ctx);
  const membership = await getActiveMembership(ctx, actor._id, job.orgId);
  if (!membership) throw new Error("FORBIDDEN");
  if (OPERATIONS_READ_ROLES.includes(membership.role)) {
    return { actor, membership };
  }
  if (CREW_ROLES.includes(membership.role)) {
    await requireCrewAssignment(ctx, job, actor._id);
    return { actor, membership };
  }
  throw new Error("FORBIDDEN");
}

async function requireJobWork(ctx: JobContext, job: Doc<"jobs">) {
  const actor = await requireAuthenticatedUser(ctx);
  const membership = await getActiveMembership(ctx, actor._id, job.orgId);
  if (!membership) throw new Error("FORBIDDEN");
  if (OPERATIONS_MANAGER_ROLES.includes(membership.role)) {
    return { actor, membership };
  }
  if (membership.role === "crew_lead") {
    await requireCrewAssignment(ctx, job, actor._id);
    return { actor, membership };
  }
  throw new Error("FORBIDDEN");
}

async function validateJobLinks(
  ctx: MutationCtx,
  args: {
    orgId: Id<"organizations">;
    estimateId?: Id<"estimates">;
    customerId?: Id<"customers">;
    propertyId?: Id<"properties">;
  },
) {
  const estimate = args.estimateId ? await ctx.db.get(args.estimateId) : null;
  if (args.estimateId && (!estimate || estimate.orgId !== args.orgId)) {
    throw new Error("ESTIMATE_NOT_FOUND");
  }
  if (
    estimate &&
    ((args.customerId !== undefined &&
      args.customerId !== estimate.customerId) ||
      (args.propertyId !== undefined &&
        args.propertyId !== estimate.propertyId))
  ) {
    throw new Error("RESOURCE_LINK_MISMATCH");
  }
  const customerId = args.customerId ?? estimate?.customerId;
  const propertyId = args.propertyId ?? estimate?.propertyId;
  const customer = customerId ? await ctx.db.get(customerId) : null;
  if (customerId && (!customer || customer.orgId !== args.orgId)) {
    throw new Error("CUSTOMER_NOT_FOUND");
  }
  const property = propertyId ? await ctx.db.get(propertyId) : null;
  if (
    propertyId &&
    (!property ||
      property.orgId !== args.orgId ||
      (customerId !== undefined && property.customerId !== customerId))
  ) {
    throw new Error("PROPERTY_NOT_FOUND");
  }
  return { estimate, customerId, propertyId, property };
}

export const create = mutation({
  args: {
    orgId: v.id("organizations"),
    estimateId: v.optional(v.id("estimates")),
    customerId: v.optional(v.id("customers")),
    propertyId: v.optional(v.id("properties")),
    title: v.string(),
    address: v.optional(v.string()),
    schedule: scheduleValidator,
    status: v.optional(jobStatusValidator),
  },
  returns: v.id("jobs"),
  handler: async (ctx, args) => {
    const actor = await requireAuthenticatedUser(ctx);
    await requireActiveMembership(
      ctx,
      actor._id,
      args.orgId,
      OPERATIONS_MANAGER_ROLES,
    );
    const links = await validateJobLinks(ctx, args);
    const now = Date.now();
    const jobId = await ctx.db.insert("jobs", {
      orgId: args.orgId,
      estimateId: args.estimateId,
      customerId: links.customerId,
      propertyId: links.propertyId,
      title: normalizedRequired(args.title, "INVALID_JOB_TITLE", 200),
      address: args.address?.trim() || links.property?.address,
      schedule: normalizeSchedule(args.schedule),
      status: args.status ?? "scheduled",
      crewIds: [],
      createdAt: now,
      updatedAt: now,
    });
    if (links.estimate && links.estimate.status !== "accepted") {
      await ctx.db.patch(links.estimate._id, { status: "accepted", updatedAt: now });
    }
    await appendAuditEvent(ctx, {
      orgId: args.orgId,
      actorId: actor._id,
      action: "job.created",
      targetResource: jobId,
      metadata: {
        estimateId: args.estimateId,
        customerId: links.customerId,
        propertyId: links.propertyId,
      },
      timestamp: now,
    });
    return jobId;
  },
});

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
    const existingJobs = await ctx.db
      .query("jobs")
      .withIndex("by_estimate", (index) =>
        index.eq("estimateId", estimate._id),
      )
      .take(2);
    if (existingJobs.length > 1) throw new Error("JOB_ESTIMATE_DUPLICATE");
    if (existingJobs[0]) {
      if (existingJobs[0].orgId !== estimate.orgId) {
        throw new Error("RESOURCE_ORG_MISMATCH");
      }
      return existingJobs[0]._id;
    }
    const crewIds = uniqueCrewIds(args.crewIds ?? []);
    for (const crewId of crewIds) {
      await requireActiveMembership(ctx, crewId, estimate.orgId, CREW_ROLES);
    }
    const lead = await ctx.db.get(estimate.leadId);
    const property = estimate.propertyId
      ? await ctx.db.get(estimate.propertyId)
      : null;
    const now = Date.now();
    const jobId = await ctx.db.insert("jobs", {
      estimateId: estimate._id,
      orgId: estimate.orgId,
      customerId: estimate.customerId,
      propertyId: estimate.propertyId,
      title: estimate.scope.slice(0, 200),
      address: property?.address ?? lead?.serviceAddress,
      status: args.status ?? "scheduled",
      schedule: normalizeSchedule(args.schedule),
      crewIds,
      createdAt: now,
      updatedAt: now,
    });
    const job = await ctx.db.get(jobId);
    if (!job) throw new Error("JOB_NOT_FOUND");
    await syncCrewAssignments(ctx, job, crewIds, now);
    if (estimate.status !== "accepted") {
      await ctx.db.patch(estimate._id, { status: "accepted", updatedAt: now });
    }
    await appendAuditEvent(ctx, {
      orgId: estimate.orgId,
      actorId: actor._id,
      action: "job.created_from_estimate",
      targetResource: jobId,
      metadata: { estimateId: estimate._id, crewIds },
      timestamp: now,
    });
    return jobId;
  },
});

export const get = query({
  args: { jobId: v.id("jobs") },
  returns: v.union(v.null(), jobValidator),
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) return null;
    await requireJobRead(ctx, job);
    return job;
  },
});

export const list = query({
  args: {
    orgId: v.id("organizations"),
    status: v.optional(jobStatusValidator),
    limit: v.optional(v.number()),
  },
  returns: v.array(jobValidator),
  handler: async (ctx, args) => {
    const actor = await requireAuthenticatedUser(ctx);
    const membership = await requireActiveMembership(ctx, actor._id, args.orgId);
    if (
      !OPERATIONS_READ_ROLES.includes(membership.role) &&
      !CREW_ROLES.includes(membership.role)
    ) {
      throw new Error("FORBIDDEN");
    }
    const limit = boundedLimit(args.limit);
    if (OPERATIONS_READ_ROLES.includes(membership.role)) {
      return args.status === undefined
        ? await ctx.db
            .query("jobs")
            .withIndex("by_org", (index) => index.eq("orgId", args.orgId))
            .order("desc")
            .take(limit)
        : await ctx.db
            .query("jobs")
            .withIndex("by_org_and_status", (index) =>
              index.eq("orgId", args.orgId).eq("status", args.status!),
            )
            .order("desc")
            .take(limit);
    }

    const assignments =
      args.status === undefined
        ? await ctx.db
            .query("assignments")
            .withIndex("by_org_and_user_and_job_created_at", (index) =>
              index.eq("orgId", args.orgId).eq("userId", actor._id),
            )
            .order("desc")
            .take(limit)
        : await ctx.db
            .query("assignments")
            .withIndex(
              "by_org_and_user_and_job_status_and_job_created_at",
              (index) =>
                index
                  .eq("orgId", args.orgId)
                  .eq("userId", actor._id)
                  .eq("jobStatus", args.status!),
            )
            .order("desc")
            .take(limit);
    const jobs = await Promise.all(
      assignments.map((assignment) => ctx.db.get(assignment.jobId)),
    );
    return jobs.filter(
      (job): job is Doc<"jobs"> =>
        job !== null &&
        job.orgId === args.orgId &&
        job.crewIds.includes(actor._id) &&
        assignments.some(
          (assignment) =>
            assignment.jobId === job._id &&
            assignment.jobStatus === job.status &&
            assignment.jobCreatedAt === job.createdAt,
        ),
    );
  },
});

export const update = mutation({
  args: {
    jobId: v.id("jobs"),
    title: v.optional(v.string()),
    address: v.optional(v.string()),
    schedule: v.optional(scheduleValidator),
    status: v.optional(jobStatusValidator),
    customerId: v.optional(v.id("customers")),
    propertyId: v.optional(v.id("properties")),
  },
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
    const links = await validateJobLinks(ctx, {
      orgId: job.orgId,
      estimateId: job.estimateId,
      customerId: args.customerId ?? job.customerId,
      propertyId: args.propertyId ?? job.propertyId,
    });
    const now = Date.now();
    await ctx.db.patch(job._id, {
      title:
        args.title === undefined
          ? job.title
          : normalizedRequired(args.title, "INVALID_JOB_TITLE", 200),
      address: args.address === undefined ? job.address : args.address.trim(),
      schedule:
        args.schedule === undefined
          ? job.schedule
          : normalizeSchedule(args.schedule),
      status: args.status ?? job.status,
      customerId: links.customerId,
      propertyId: links.propertyId,
      updatedAt: now,
    });
    const updated = await ctx.db.get(job._id);
    if (!updated) throw new Error("JOB_NOT_FOUND");
    await syncCrewAssignments(ctx, updated, updated.crewIds, now);
    await appendAuditEvent(ctx, {
      orgId: job.orgId,
      actorId: actor._id,
      action: "job.updated",
      targetResource: job._id,
      metadata: { status: args.status },
      timestamp: now,
    });
    return updated;
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
      (membership.role === "crew_lead" && job.crewIds.includes(actor._id));
    if (!mayUpdate) throw new Error("FORBIDDEN");
    if (membership.role === "crew_lead") {
      await requireCrewAssignment(ctx, job, actor._id);
    }
    const now = Date.now();
    await ctx.db.patch(job._id, { status: args.status, updatedAt: now });
    const updated = await ctx.db.get(job._id);
    if (!updated) throw new Error("JOB_NOT_FOUND");
    await syncCrewAssignments(ctx, updated, updated.crewIds, now);
    await appendAuditEvent(ctx, {
      orgId: job.orgId,
      actorId: actor._id,
      action: "job.status_updated",
      targetResource: job._id,
      metadata: { status: args.status },
      timestamp: now,
    });
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
    const crewIds = uniqueCrewIds(args.crewIds);
    for (const crewId of crewIds) {
      await requireActiveMembership(ctx, crewId, job.orgId, CREW_ROLES);
    }
    const now = Date.now();
    await ctx.db.patch(job._id, { crewIds, updatedAt: now });
    const updated = await ctx.db.get(job._id);
    if (!updated) throw new Error("JOB_NOT_FOUND");
    await syncCrewAssignments(ctx, updated, crewIds, now);
    await appendAuditEvent(ctx, {
      orgId: job.orgId,
      actorId: actor._id,
      action: "job.crew_assigned",
      targetResource: job._id,
      metadata: { crewIds },
      timestamp: now,
    });
    return updated;
  },
});

export const listTasks = query({
  args: { jobId: v.id("jobs") },
  returns: v.array(taskValidator),
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) throw new Error("JOB_NOT_FOUND");
    await requireJobRead(ctx, job);
    return await ctx.db
      .query("tasks")
      .withIndex("by_job_and_created_at", (index) =>
        index.eq("jobId", job._id),
      )
      .take(200);
  },
});

export const createTask = mutation({
  args: {
    jobId: v.id("jobs"),
    title: v.string(),
    description: v.optional(v.string()),
    assigneeId: v.optional(v.id("users")),
  },
  returns: v.id("tasks"),
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
    if (args.assigneeId) {
      const assignee = await requireActiveMembership(
        ctx,
        args.assigneeId,
        job.orgId,
      );
      if (
        !OPERATIONS_READ_ROLES.includes(assignee.role) &&
        !CREW_ROLES.includes(assignee.role)
      ) {
        throw new Error("INVALID_TASK_ASSIGNEE");
      }
      if (
        CREW_ROLES.includes(assignee.role) &&
        !job.crewIds.includes(args.assigneeId)
      ) {
        throw new Error("INVALID_TASK_ASSIGNEE");
      }
      if (CREW_ROLES.includes(assignee.role)) {
        await requireCrewAssignment(ctx, job, args.assigneeId);
      }
    }
    const now = Date.now();
    const taskId = await ctx.db.insert("tasks", {
      orgId: job.orgId,
      jobId: job._id,
      title: normalizedRequired(args.title, "INVALID_TASK_TITLE", 200),
      description: args.description?.trim(),
      assigneeId: args.assigneeId,
      completed: false,
      createdBy: actor._id,
      createdAt: now,
      updatedAt: now,
    });
    await appendAuditEvent(ctx, {
      orgId: job.orgId,
      actorId: actor._id,
      action: "task.created",
      targetResource: taskId,
      metadata: { jobId: job._id, assigneeId: args.assigneeId },
      timestamp: now,
    });
    return taskId;
  },
});

export const updateTask = mutation({
  args: { taskId: v.id("tasks"), completed: v.boolean() },
  returns: taskValidator,
  handler: async (ctx, args) => {
    const actor = await requireAuthenticatedUser(ctx);
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("TASK_NOT_FOUND");
    const job = await ctx.db.get(task.jobId);
    if (!job || job.orgId !== task.orgId) throw new Error("TASK_RESOURCE_INVALID");
    const membership = await requireActiveMembership(ctx, actor._id, job.orgId);
    if (!OPERATIONS_MANAGER_ROLES.includes(membership.role)) {
      if (membership.role !== "crew_lead") throw new Error("FORBIDDEN");
      await requireCrewAssignment(ctx, job, actor._id);
    }
    const now = Date.now();
    await ctx.db.patch(task._id, {
      completed: args.completed,
      completedBy: args.completed ? actor._id : undefined,
      completedAt: args.completed ? now : undefined,
      updatedAt: now,
    });
    await appendAuditEvent(ctx, {
      orgId: job.orgId,
      actorId: actor._id,
      action: args.completed ? "task.completed" : "task.reopened",
      targetResource: task._id,
      metadata: { jobId: job._id },
      timestamp: now,
    });
    const updated = await ctx.db.get(task._id);
    if (!updated) throw new Error("TASK_NOT_FOUND");
    return updated;
  },
});

export const listProjectUpdates = query({
  args: { jobId: v.id("jobs") },
  returns: v.array(projectUpdateValidator),
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) throw new Error("JOB_NOT_FOUND");
    await requireJobRead(ctx, job);
    return await ctx.db
      .query("projectUpdates")
      .withIndex("by_job_and_created_at", (index) =>
        index.eq("jobId", job._id),
      )
      .order("desc")
      .take(100);
  },
});

export const addProjectUpdate = mutation({
  args: {
    jobId: v.id("jobs"),
    message: v.string(),
    customerVisible: v.optional(v.boolean()),
  },
  returns: v.id("projectUpdates"),
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) throw new Error("JOB_NOT_FOUND");
    const { actor, membership } = await requireJobWork(ctx, job);
    const isManager = OPERATIONS_MANAGER_ROLES.includes(membership.role);
    if (!isManager && args.customerVisible) throw new Error("FORBIDDEN");
    const now = Date.now();
    const updateId = await ctx.db.insert("projectUpdates", {
      orgId: job.orgId,
      jobId: job._id,
      customerId: job.customerId,
      actorId: actor._id,
      message: normalizedRequired(args.message, "INVALID_PROJECT_UPDATE", 2_000),
      customerVisible: args.customerVisible ?? false,
      createdAt: now,
    });
    await appendAuditEvent(ctx, {
      orgId: job.orgId,
      actorId: actor._id,
      action: "project_update.created",
      targetResource: updateId,
      metadata: {
        jobId: job._id,
        customerVisible: args.customerVisible ?? false,
      },
      timestamp: now,
    });
    return updateId;
  },
});
