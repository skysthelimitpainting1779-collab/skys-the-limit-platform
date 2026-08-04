import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import {
  CREW_ROLES,
  OPERATIONS_MANAGER_ROLES,
  OPERATIONS_READ_ROLES,
  requireActiveMembership,
  requireAuthenticatedUser,
  requireCrewAssignment,
} from "./lib/authorization";

const MAX_CHECKLIST_ITEMS = 100;
const MAX_CHECKLISTS_PER_JOB = 20;
const MAX_TITLE_LENGTH = 200;
const MAX_ITEM_TEXT_LENGTH = 500;

export const checklistStatusValidator = v.union(
  v.literal("pending"),
  v.literal("in_progress"),
  v.literal("completed"),
);

const createChecklistItemValidator = v.object({
  id: v.string(),
  text: v.string(),
  completed: v.optional(v.boolean()),
});

const checklistItemResultValidator = v.object({
  _id: v.id("checklistItems"),
  _creationTime: v.number(),
  id: v.string(),
  text: v.string(),
  position: v.number(),
  completed: v.boolean(),
  completedBy: v.optional(v.id("users")),
  completedAt: v.optional(v.number()),
});

const checklistResultValidator = v.object({
  _id: v.id("checklists"),
  _creationTime: v.number(),
  jobId: v.id("jobs"),
  orgId: v.id("organizations"),
  title: v.string(),
  status: checklistStatusValidator,
  createdBy: v.id("users"),
  createdAt: v.number(),
  updatedAt: v.number(),
  items: v.array(checklistItemResultValidator),
});

type ChecklistContext = QueryCtx | MutationCtx;
type ChecklistAccess = "read" | "toggle" | "manage";

function validateChecklistInput(
  title: string,
  items: Array<{ id: string; text: string; completed?: boolean }>,
) {
  const normalizedTitle = title.trim();
  if (!normalizedTitle || normalizedTitle.length > MAX_TITLE_LENGTH) {
    throw new Error("INVALID_CHECKLIST_TITLE");
  }
  if (items.length > MAX_CHECKLIST_ITEMS) {
    throw new Error("CHECKLIST_ITEM_LIMIT_EXCEEDED");
  }

  const itemKeys = new Set<string>();
  const normalizedItems = items.map((item) => {
    const itemKey = item.id.trim();
    const text = item.text.trim();
    if (!itemKey || itemKey.length > 100 || itemKeys.has(itemKey)) {
      throw new Error("INVALID_CHECKLIST_ITEM_ID");
    }
    if (!text || text.length > MAX_ITEM_TEXT_LENGTH) {
      throw new Error("INVALID_CHECKLIST_ITEM_TEXT");
    }
    itemKeys.add(itemKey);
    return { itemKey, text, completed: item.completed ?? false };
  });

  return { title: normalizedTitle, items: normalizedItems };
}

function statusForItems(items: Array<{ completed: boolean }>) {
  if (items.length > 0 && items.every((item) => item.completed)) {
    return "completed" as const;
  }
  if (items.some((item) => item.completed)) return "in_progress" as const;
  return "pending" as const;
}

async function requireJobAccess(
  ctx: ChecklistContext,
  job: Doc<"jobs">,
  access: ChecklistAccess,
) {
  const actor = await requireAuthenticatedUser(ctx);
  const membership = await requireActiveMembership(ctx, actor._id, job.orgId);

  if (OPERATIONS_MANAGER_ROLES.includes(membership.role)) return actor;
  if (access === "read" && OPERATIONS_READ_ROLES.includes(membership.role)) {
    return actor;
  }
  if (CREW_ROLES.includes(membership.role)) {
    requireCrewAssignment(job, actor._id);
    if (access === "read" || (access === "toggle" && membership.role === "crew_lead")) {
      return actor;
    }
  }
  throw new Error("FORBIDDEN");
}

async function requireChecklistAccess(
  ctx: ChecklistContext,
  checklist: Doc<"checklists">,
  access: ChecklistAccess,
) {
  const job = await ctx.db.get(checklist.jobId);
  if (!job || job.orgId !== checklist.orgId) {
    throw new Error("CHECKLIST_RESOURCE_INVALID");
  }
  const actor = await requireJobAccess(ctx, job, access);
  return { actor, job };
}

async function loadItems(ctx: ChecklistContext, checklistId: Id<"checklists">) {
  const items = await ctx.db
    .query("checklistItems")
    .withIndex("by_checklist_and_position", (index) =>
      index.eq("checklistId", checklistId),
    )
    .take(MAX_CHECKLIST_ITEMS + 1);
  if (items.length > MAX_CHECKLIST_ITEMS) {
    throw new Error("CHECKLIST_ITEM_LIMIT_EXCEEDED");
  }
  return items;
}

async function checklistResult(
  ctx: ChecklistContext,
  checklist: Doc<"checklists">,
) {
  const items = await loadItems(ctx, checklist._id);
  return {
    ...checklist,
    items: items.map((item) => ({
      _id: item._id,
      _creationTime: item._creationTime,
      id: item.itemKey,
      text: item.text,
      position: item.position,
      completed: item.completed,
      completedBy: item.completedBy,
      completedAt: item.completedAt,
    })),
  };
}

export const create = mutation({
  args: {
    jobId: v.id("jobs"),
    title: v.string(),
    items: v.array(createChecklistItemValidator),
  },
  returns: v.id("checklists"),
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) throw new Error("JOB_NOT_FOUND");
    const actor = await requireJobAccess(ctx, job, "manage");
    const input = validateChecklistInput(args.title, args.items);
    const existingChecklists = await ctx.db
      .query("checklists")
      .withIndex("by_job_and_created_at", (index) =>
        index.eq("jobId", job._id),
      )
      .take(MAX_CHECKLISTS_PER_JOB);
    if (existingChecklists.length >= MAX_CHECKLISTS_PER_JOB) {
      throw new Error("CHECKLIST_LIMIT_EXCEEDED");
    }
    const now = Date.now();

    const checklistId = await ctx.db.insert("checklists", {
      jobId: job._id,
      orgId: job.orgId,
      title: input.title,
      status: statusForItems(input.items),
      createdBy: actor._id,
      createdAt: now,
      updatedAt: now,
    });

    for (const [position, item] of input.items.entries()) {
      await ctx.db.insert("checklistItems", {
        checklistId,
        itemKey: item.itemKey,
        text: item.text,
        position,
        completed: item.completed,
        completedBy: item.completed ? actor._id : undefined,
        completedAt: item.completed ? now : undefined,
      });
    }

    await ctx.db.insert("auditEvents", {
      orgId: job.orgId,
      actorId: actor._id,
      action: "checklist.created",
      targetResource: checklistId,
      metadata: { orgId: job.orgId, jobId: job._id },
      timestamp: now,
    });
    return checklistId;
  },
});

export const get = query({
  args: { checklistId: v.id("checklists") },
  returns: checklistResultValidator,
  handler: async (ctx, args) => {
    const checklist = await ctx.db.get(args.checklistId);
    if (!checklist) throw new Error("CHECKLIST_NOT_FOUND");
    await requireChecklistAccess(ctx, checklist, "read");
    return await checklistResult(ctx, checklist);
  },
});

export const listByJob = query({
  args: { jobId: v.id("jobs") },
  returns: v.array(checklistResultValidator),
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) throw new Error("JOB_NOT_FOUND");
    await requireJobAccess(ctx, job, "read");

    const checklists = await ctx.db
      .query("checklists")
      .withIndex("by_job_and_created_at", (index) =>
        index.eq("jobId", args.jobId),
      )
      .order("desc")
      .take(MAX_CHECKLISTS_PER_JOB);
    return await Promise.all(
      checklists.map((checklist) => checklistResult(ctx, checklist)),
    );
  },
});

export const toggleItem = mutation({
  args: {
    checklistId: v.id("checklists"),
    itemId: v.string(),
  },
  returns: checklistResultValidator,
  handler: async (ctx, args) => {
    const checklist = await ctx.db.get(args.checklistId);
    if (!checklist) throw new Error("CHECKLIST_NOT_FOUND");
    const { actor } = await requireChecklistAccess(ctx, checklist, "toggle");

    const item = await ctx.db
      .query("checklistItems")
      .withIndex("by_checklist_and_item_key", (index) =>
        index
          .eq("checklistId", checklist._id)
          .eq("itemKey", args.itemId),
      )
      .unique();
    if (!item) throw new Error("CHECKLIST_ITEM_NOT_FOUND");

    const now = Date.now();
    const completed = !item.completed;
    await ctx.db.patch(item._id, {
      completed,
      completedBy: completed ? actor._id : undefined,
      completedAt: completed ? now : undefined,
    });

    const items = await loadItems(ctx, checklist._id);
    const updatedState = items.map((candidate) =>
      candidate._id === item._id ? { ...candidate, completed } : candidate,
    );
    await ctx.db.patch(checklist._id, {
      status: statusForItems(updatedState),
      updatedAt: now,
    });
    await ctx.db.insert("auditEvents", {
      orgId: checklist.orgId,
      actorId: actor._id,
      action: completed ? "checklist.item_completed" : "checklist.item_reopened",
      targetResource: item._id,
      metadata: { checklistId: checklist._id, orgId: checklist.orgId },
      timestamp: now,
    });

    const updatedChecklist = await ctx.db.get(checklist._id);
    if (!updatedChecklist) throw new Error("CHECKLIST_NOT_FOUND");
    return await checklistResult(ctx, updatedChecklist);
  },
});

export const updateStatus = mutation({
  args: {
    checklistId: v.id("checklists"),
    status: checklistStatusValidator,
  },
  returns: checklistResultValidator,
  handler: async (ctx, args) => {
    const checklist = await ctx.db.get(args.checklistId);
    if (!checklist) throw new Error("CHECKLIST_NOT_FOUND");
    const { actor } = await requireChecklistAccess(ctx, checklist, "manage");
    const now = Date.now();
    await ctx.db.patch(checklist._id, { status: args.status, updatedAt: now });
    await ctx.db.insert("auditEvents", {
      orgId: checklist.orgId,
      actorId: actor._id,
      action: "checklist.status_updated",
      targetResource: checklist._id,
      metadata: { orgId: checklist.orgId, status: args.status },
      timestamp: now,
    });
    const updated = await ctx.db.get(checklist._id);
    if (!updated) throw new Error("CHECKLIST_NOT_FOUND");
    return await checklistResult(ctx, updated);
  },
});

export const deleteChecklist = mutation({
  args: { checklistId: v.id("checklists") },
  returns: v.object({ success: v.literal(true) }),
  handler: async (ctx, args) => {
    const checklist = await ctx.db.get(args.checklistId);
    if (!checklist) throw new Error("CHECKLIST_NOT_FOUND");
    const { actor } = await requireChecklistAccess(ctx, checklist, "manage");
    const items = await loadItems(ctx, checklist._id);
    for (const item of items) await ctx.db.delete(item._id);
    await ctx.db.delete(checklist._id);
    await ctx.db.insert("auditEvents", {
      orgId: checklist.orgId,
      actorId: actor._id,
      action: "checklist.deleted",
      targetResource: checklist._id,
      metadata: { orgId: checklist.orgId, jobId: checklist.jobId },
      timestamp: Date.now(),
    });
    return { success: true as const };
  },
});
