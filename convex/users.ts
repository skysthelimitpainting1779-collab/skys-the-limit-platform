import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
  ROLE_ADMIN_ROLES,
  requireActiveMembership,
  requireAuthenticatedUser,
} from "./lib/authorization";
import {
  membershipValidator,
  userValidator,
} from "./lib/returnValidators";

export const userRoleValidator = v.union(
  v.literal("owner"),
  v.literal("admin"),
  v.literal("estimator"),
  v.literal("project_manager"),
  v.literal("crew_lead"),
  v.literal("crew_member"),
  v.literal("crew"),
  v.literal("staff"),
  v.literal("customer"),
  v.literal("content_editor"),
  v.literal("content_approver"),
);

export const get = query({
  args: {
    userId: v.id("users"),
    orgId: v.optional(v.id("organizations")),
  },
  returns: v.union(v.null(), userValidator),
  handler: async (ctx, args) => {
    const currentUser = await requireAuthenticatedUser(ctx);
    if (currentUser._id !== args.userId) {
      if (!args.orgId) throw new Error("FORBIDDEN");
      await requireActiveMembership(
        ctx,
        currentUser._id,
        args.orgId,
        ROLE_ADMIN_ROLES,
      );
      await requireActiveMembership(ctx, args.userId, args.orgId);
    }
    return await ctx.db.get(args.userId);
  },
});

export const getByClerkId = query({
  args: {
    externalId: v.string(),
  },
  returns: userValidator,
  handler: async (ctx, args) => {
    const currentUser = await requireAuthenticatedUser(ctx);
    if (currentUser.externalId !== args.externalId) {
      throw new Error("FORBIDDEN");
    }
    return currentUser;
  },
});

/**
 * Binds an authenticated JWT to a profile created by the signature-verified
 * WorkOS webhook. Caller-selected profile fields and grants are absent.
 */
export const store = mutation({
  args: {},
  returns: v.id("users"),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier || !identity.subject) {
      throw new Error("UNAUTHENTICATED");
    }

    let user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (query) =>
        query.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) {
      const verifiedProfile = await ctx.db
        .query("users")
        .withIndex("by_externalId", (query) =>
          query.eq("externalId", identity.subject),
        )
        .unique();
      if (
        !verifiedProfile ||
        verifiedProfile.identitySource !== "workos_webhook" ||
        verifiedProfile.identityStatus !== "active" ||
        verifiedProfile.tokenIdentifier
      ) {
        throw new Error("IDENTITY_BINDING_REQUIRED");
      }
      await ctx.db.patch(verifiedProfile._id, {
        tokenIdentifier: identity.tokenIdentifier,
      });
      user = {
        ...verifiedProfile,
        tokenIdentifier: identity.tokenIdentifier,
      };
    }

    if (user.externalId !== identity.subject) {
      throw new Error("IDENTITY_BINDING_REQUIRED");
    }
    if (user.identityStatus === "disabled") throw new Error("USER_DISABLED");
    return user._id;
  },
});

export const updateRole = mutation({
  args: {
    userId: v.id("users"),
    orgId: v.id("organizations"),
    role: userRoleValidator,
  },
  returns: membershipValidator,
  handler: async (ctx, args) => {
    const actor = await requireAuthenticatedUser(ctx);
    const actorMembership = await requireActiveMembership(
      ctx,
      actor._id,
      args.orgId,
      ROLE_ADMIN_ROLES,
    );

    if (
      (args.role === "owner" || args.role === "admin") &&
      actorMembership.role !== "owner"
    ) {
      throw new Error("FORBIDDEN");
    }

    const targetMembership = await ctx.db
      .query("memberships")
      .withIndex("by_user_org", (query) =>
        query.eq("userId", args.userId).eq("orgId", args.orgId),
      )
      .unique();
    if (!targetMembership || targetMembership.status === "disabled") {
      throw new Error("MEMBERSHIP_NOT_FOUND");
    }

    await ctx.db.patch(targetMembership._id, { role: args.role });
    await ctx.db.insert("auditEvents", {
      orgId: args.orgId,
      actorId: actor._id,
      action: "membership_role_updated",
      targetResource: targetMembership._id,
      metadata: { role: args.role, targetUserId: args.userId },
      timestamp: Date.now(),
    });

    const updated = await ctx.db.get(targetMembership._id);
    if (!updated) throw new Error("MEMBERSHIP_NOT_FOUND");
    return updated;
  },
});

export const linkCustomer = mutation({
  args: {
    orgId: v.id("organizations"),
    customerId: v.id("customers"),
    userId: v.id("users"),
  },
  returns: v.id("customers"),
  handler: async (ctx, args) => {
    const actor = await requireAuthenticatedUser(ctx);
    await requireActiveMembership(
      ctx,
      actor._id,
      args.orgId,
      ROLE_ADMIN_ROLES,
    );

    const customer = await ctx.db.get(args.customerId);
    const targetUser = await ctx.db.get(args.userId);
    if (!customer || customer.orgId !== args.orgId || !targetUser) {
      throw new Error("CUSTOMER_LINK_TARGET_NOT_FOUND");
    }

    const existingLink = await ctx.db
      .query("customers")
      .withIndex("by_user", (query) => query.eq("userId", args.userId))
      .unique();
    if (existingLink && existingLink._id !== customer._id) {
      throw new Error("CUSTOMER_USER_ALREADY_LINKED");
    }

    await ctx.db.patch(customer._id, { userId: targetUser._id });
    await ctx.db.insert("auditEvents", {
      orgId: args.orgId,
      actorId: actor._id,
      action: "customer_user_linked",
      targetResource: customer._id,
      metadata: { userId: targetUser._id },
      timestamp: Date.now(),
    });
    return customer._id;
  },
});

export const list = query({
  args: {
    orgId: v.id("organizations"),
    role: v.optional(userRoleValidator),
  },
  returns: v.array(userValidator),
  handler: async (ctx, args) => {
    const actor = await requireAuthenticatedUser(ctx);
    await requireActiveMembership(
      ctx,
      actor._id,
      args.orgId,
      ROLE_ADMIN_ROLES,
    );

    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_org", (query) => query.eq("orgId", args.orgId))
      .take(100);
    const selected = memberships.filter(
      (membership) =>
        membership.status === "active" &&
        (!args.role || membership.role === args.role),
    );

    const users = await Promise.all(
      selected.map((membership) => ctx.db.get(membership.userId)),
    );
    return users.filter((user) => user !== null);
  },
});

/**
 * Trusted provisioning seam for an operator or verified WorkOS webhook.
 * Public clients cannot create, activate, disable, or elevate memberships.
 */
export const provisionMembership = internalMutation({
  args: {
    actorId: v.string(),
    userId: v.id("users"),
    orgId: v.id("organizations"),
    role: userRoleValidator,
    status: v.union(
      v.literal("active"),
      v.literal("invited"),
      v.literal("disabled"),
    ),
  },
  returns: membershipValidator,
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    const organization = await ctx.db.get(args.orgId);
    if (!user || !organization) throw new Error("PROVISIONING_TARGET_NOT_FOUND");
    if (args.status === "active" && organization.status !== "active") {
      throw new Error("FORBIDDEN");
    }

    const existing = await ctx.db
      .query("memberships")
      .withIndex("by_user_org", (query) =>
        query.eq("userId", args.userId).eq("orgId", args.orgId),
      )
      .unique();

    let membershipId;
    if (existing) {
      membershipId = existing._id;
      await ctx.db.patch(membershipId, {
        role: args.role,
        status: args.status,
      });
    } else {
      membershipId = await ctx.db.insert("memberships", {
        userId: args.userId,
        orgId: args.orgId,
        role: args.role,
        status: args.status,
      });
    }

    await ctx.db.insert("auditEvents", {
      orgId: args.orgId,
      actorId: args.actorId,
      action: "membership_provisioned",
      targetResource: membershipId,
      metadata: {
        role: args.role,
        status: args.status,
        targetUserId: args.userId,
      },
      timestamp: Date.now(),
    });

    const membership = await ctx.db.get(membershipId);
    if (!membership) throw new Error("MEMBERSHIP_NOT_FOUND");
    return membership;
  },
});

/**
 * One-time operator-controlled migration seam. It is not exposed through api.*
 * and deliberately never falls back to subject or email at request time.
 */
export const bindLegacyIdentity = internalMutation({
  args: {
    userId: v.id("users"),
    subject: v.string(),
    tokenIdentifier: v.string(),
  },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user || user.externalId !== args.subject || user.tokenIdentifier) {
      throw new Error("LEGACY_IDENTITY_BINDING_REJECTED");
    }

    const collision = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (query) =>
        query.eq("tokenIdentifier", args.tokenIdentifier),
      )
      .unique();
    if (collision) throw new Error("TOKEN_IDENTIFIER_ALREADY_BOUND");

    await ctx.db.patch(user._id, { tokenIdentifier: args.tokenIdentifier });
    return user._id;
  },
});
