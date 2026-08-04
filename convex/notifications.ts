import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import {
  requireActiveMembership,
  requireAuthenticatedUser,
} from "./lib/authorization";
import { appendAuditEvent } from "./lib/audit";

const notificationValidator = v.object({
  _id: v.id("notifications"),
  _creationTime: v.number(),
  orgId: v.id("organizations"),
  recipientUserId: v.id("users"),
  title: v.string(),
  body: v.string(),
  type: v.string(),
  link: v.optional(v.string()),
  isRead: v.boolean(),
  createdAt: v.number(),
  readAt: v.optional(v.number()),
});

function boundedLimit(value: number | undefined) {
  return Math.min(Math.max(Math.floor(value ?? 50), 1), 100);
}

function normalized(value: string, code: string, max: number) {
  const result = value.trim();
  if (!result || result.length > max) throw new Error(code);
  return result;
}

export const create = internalMutation({
  args: {
    orgId: v.id("organizations"),
    recipientUserId: v.id("users"),
    title: v.string(),
    body: v.string(),
    type: v.string(),
    link: v.optional(v.string()),
  },
  returns: v.id("notifications"),
  handler: async (ctx, args) => {
    const organization = await ctx.db.get(args.orgId);
    const recipient = await ctx.db.get(args.recipientUserId);
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_user_org", (index) =>
        index.eq("userId", args.recipientUserId).eq("orgId", args.orgId),
      )
      .unique();
    if (
      !organization ||
      organization.status !== "active" ||
      !recipient ||
      recipient.identityStatus === "disabled" ||
      recipient.workosDeletedAt ||
      !membership ||
      membership.status !== "active" ||
      membership.workosDeletedAt
    ) {
      throw new Error("INVALID_NOTIFICATION_RECIPIENT");
    }
    const now = Date.now();
    const notificationId = await ctx.db.insert("notifications", {
      orgId: args.orgId,
      recipientUserId: args.recipientUserId,
      title: normalized(args.title, "INVALID_NOTIFICATION_TITLE", 200),
      body: normalized(args.body, "INVALID_NOTIFICATION_BODY", 5_000),
      type: normalized(args.type, "INVALID_NOTIFICATION_TYPE", 100),
      link:
        args.link === undefined
          ? undefined
          : normalized(args.link, "INVALID_NOTIFICATION_LINK", 2_000),
      isRead: false,
      createdAt: now,
    });
    const counter = await ctx.db
      .query("notificationCounters")
      .withIndex("by_org_and_user", (index) =>
        index.eq("orgId", args.orgId).eq("userId", args.recipientUserId),
      )
      .unique();
    if (counter) {
      await ctx.db.patch(counter._id, {
        unreadCount: counter.unreadCount + 1,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("notificationCounters", {
        orgId: args.orgId,
        userId: args.recipientUserId,
        unreadCount: 1,
        updatedAt: now,
      });
    }
    return notificationId;
  },
});

export const listMine = query({
  args: {
    orgId: v.id("organizations"),
    unreadOnly: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  returns: v.array(notificationValidator),
  handler: async (ctx, args) => {
    const actor = await requireAuthenticatedUser(ctx);
    await requireActiveMembership(ctx, actor._id, args.orgId);
    const limit = boundedLimit(args.limit);
    return args.unreadOnly
      ? await ctx.db
          .query("notifications")
          .withIndex("by_org_and_recipient_and_is_read_and_created_at", (index) =>
            index
              .eq("orgId", args.orgId)
              .eq("recipientUserId", actor._id)
              .eq("isRead", false),
          )
          .order("desc")
          .take(limit)
      : await ctx.db
          .query("notifications")
          .withIndex("by_org_and_recipient_and_created_at", (index) =>
            index.eq("orgId", args.orgId).eq("recipientUserId", actor._id),
          )
          .order("desc")
          .take(limit);
  },
});

export const getUnreadCount = query({
  args: { orgId: v.id("organizations") },
  returns: v.number(),
  handler: async (ctx, args) => {
    const actor = await requireAuthenticatedUser(ctx);
    await requireActiveMembership(ctx, actor._id, args.orgId);
    const counter = await ctx.db
      .query("notificationCounters")
      .withIndex("by_org_and_user", (index) =>
        index.eq("orgId", args.orgId).eq("userId", actor._id),
      )
      .unique();
    return Math.max(counter?.unreadCount ?? 0, 0);
  },
});

export const markAsRead = mutation({
  args: { notificationId: v.id("notifications") },
  returns: notificationValidator,
  handler: async (ctx, args) => {
    const actor = await requireAuthenticatedUser(ctx);
    const notification = await ctx.db.get(args.notificationId);
    if (!notification || notification.recipientUserId !== actor._id) {
      throw new Error("FORBIDDEN");
    }
    await requireActiveMembership(ctx, actor._id, notification.orgId);
    if (!notification.isRead) {
      const now = Date.now();
      await ctx.db.patch(notification._id, { isRead: true, readAt: now });
      const counter = await ctx.db
        .query("notificationCounters")
        .withIndex("by_org_and_user", (index) =>
          index.eq("orgId", notification.orgId).eq("userId", actor._id),
        )
        .unique();
      if (counter) {
        await ctx.db.patch(counter._id, {
          unreadCount: Math.max(counter.unreadCount - 1, 0),
          updatedAt: now,
        });
      }
      await appendAuditEvent(ctx, {
        orgId: notification.orgId,
        actorId: actor._id,
        action: "notification.read",
        targetResource: notification._id,
        timestamp: now,
      });
    }
    const updated = await ctx.db.get(notification._id);
    if (!updated) throw new Error("NOTIFICATION_NOT_FOUND");
    return updated;
  },
});

export const markAllAsRead = mutation({
  args: { orgId: v.id("organizations") },
  returns: v.object({ read: v.number(), remaining: v.number() }),
  handler: async (ctx, args) => {
    const actor = await requireAuthenticatedUser(ctx);
    await requireActiveMembership(ctx, actor._id, args.orgId);
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_org_and_recipient_and_is_read_and_created_at", (index) =>
        index
          .eq("orgId", args.orgId)
          .eq("recipientUserId", actor._id)
          .eq("isRead", false),
      )
      .take(100);
    const now = Date.now();
    for (const notification of unread) {
      await ctx.db.patch(notification._id, { isRead: true, readAt: now });
    }
    const counter = await ctx.db
      .query("notificationCounters")
      .withIndex("by_org_and_user", (index) =>
        index.eq("orgId", args.orgId).eq("userId", actor._id),
      )
      .unique();
    const remaining = Math.max((counter?.unreadCount ?? unread.length) - unread.length, 0);
    if (counter) {
      await ctx.db.patch(counter._id, { unreadCount: remaining, updatedAt: now });
    }
    if (unread.length > 0) {
      await appendAuditEvent(ctx, {
        orgId: args.orgId,
        actorId: actor._id,
        action: "notifications.read_all_batch",
        targetResource: actor._id,
        metadata: { count: unread.length },
        timestamp: now,
      });
    }
    return { read: unread.length, remaining };
  },
});
