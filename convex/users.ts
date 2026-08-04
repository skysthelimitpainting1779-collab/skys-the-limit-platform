import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { internalMutation, mutation, query } from "./_generated/server";
import {
  AUDIT_READER_ROLES,
  CONTENT_APPROVER_ROLES,
  CONTENT_EDITOR_ROLES,
  CREW_ROLES,
  CUSTOMER_ROLES,
  OPERATIONS_MANAGER_ROLES,
  OPERATIONS_READ_ROLES,
  OPERATIONS_ROLES,
  ROLE_ADMIN_ROLES,
  requireActiveMembership,
  requireAuthenticatedUser,
} from "./lib/authorization";

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

export const membershipRoleValidator = v.union(
  userRoleValidator,
  v.literal("member"),
);

const userValidator = v.object({
  _id: v.id("users"),
  _creationTime: v.number(),
  externalId: v.string(),
  tokenIdentifier: v.optional(v.string()),
  identitySource: v.optional(v.literal("workos_webhook")),
  identityStatus: v.optional(
    v.union(v.literal("active"), v.literal("disabled")),
  ),
  workosUpdatedAt: v.optional(v.string()),
  workosDeletedAt: v.optional(v.string()),
  email: v.string(),
  role: userRoleValidator,
  name: v.string(),
  phone: v.optional(v.string()),
  avatarUrl: v.optional(v.string()),
});

const membershipValidator = v.object({
  _id: v.id("memberships"),
  _creationTime: v.number(),
  userId: v.id("users"),
  orgId: v.id("organizations"),
  workosMembershipId: v.optional(v.string()),
  workosRoleSlug: v.optional(v.string()),
  workosUpdatedAt: v.optional(v.string()),
  workosDeletedAt: v.optional(v.string()),
  role: membershipRoleValidator,
  status: v.union(
    v.literal("active"),
    v.literal("invited"),
    v.literal("disabled"),
  ),
});

const organizationSummaryValidator = v.object({
  _id: v.id("organizations"),
  name: v.string(),
  slug: v.string(),
  status: v.union(
    v.literal("active"),
    v.literal("inactive"),
    v.literal("suspended"),
  ),
});

async function countUsableActiveOwners(
  ctx: Pick<MutationCtx, "db">,
  orgId: Id<"organizations">,
) {
  const ownerMemberships = await ctx.db
    .query("memberships")
    .withIndex("by_org_and_role_and_status", (index) =>
      index
        .eq("orgId", orgId)
        .eq("role", "owner")
        .eq("status", "active"),
    )
    .take(100);
  let usable = 0;
  for (const membership of ownerMemberships) {
    const user = await ctx.db.get(membership.userId);
    if (
      user?.identityStatus === "active" &&
      !user.workosDeletedAt &&
      ++usable >= 2
    ) {
      return usable;
    }
  }
  return usable;
}

export const getMyContext = query({
  args: {},
  returns: v.object({
    user: v.object({
      _id: v.id("users"),
      name: v.string(),
      email: v.string(),
      avatarUrl: v.optional(v.string()),
      identityStatus: v.optional(
        v.union(v.literal("active"), v.literal("disabled")),
      ),
    }),
    memberships: v.array(
      v.object({
        membershipId: v.id("memberships"),
        orgId: v.id("organizations"),
        role: membershipRoleValidator,
        organization: organizationSummaryValidator,
      }),
    ),
    defaultOrgId: v.union(v.id("organizations"), v.null()),
  }),
  handler: async (ctx) => {
    const actor = await requireAuthenticatedUser(ctx);
    const candidates = await ctx.db
      .query("memberships")
      .withIndex("by_user", (index) => index.eq("userId", actor._id))
      .order("asc")
      .take(50);

    const memberships = [];
    for (const membership of candidates) {
      if (membership.status !== "active" || membership.workosDeletedAt) continue;
      const organization = await ctx.db.get(membership.orgId);
      if (!organization || organization.status !== "active") continue;
      memberships.push({
        membershipId: membership._id,
        orgId: organization._id,
        role: membership.role,
        organization: {
          _id: organization._id,
          name: organization.name,
          slug: organization.slug,
          status: organization.status,
        },
      });
    }

    return {
      user: {
        _id: actor._id,
        name: actor.name,
        email: actor.email,
        avatarUrl: actor.avatarUrl,
        identityStatus: actor.identityStatus,
      },
      memberships,
      defaultOrgId: memberships[0]?.orgId ?? null,
    };
  },
});

export const getMyCapabilities = query({
  args: { orgId: v.id("organizations") },
  returns: v.object({
    role: membershipRoleValidator,
    canManageLeads: v.boolean(),
    canManageEstimates: v.boolean(),
    canReadJobs: v.boolean(),
    canUpdateJobs: v.boolean(),
    canManageJobs: v.boolean(),
    canManageCrew: v.boolean(),
    canEditContent: v.boolean(),
    canPublishContent: v.boolean(),
    canManageTeam: v.boolean(),
    canReadAudit: v.boolean(),
    canManageDocuments: v.boolean(),
    canAccessCustomerPortal: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const actor = await requireAuthenticatedUser(ctx);
    const membership = await requireActiveMembership(ctx, actor._id, args.orgId);
    return {
      role: membership.role,
      canManageLeads: OPERATIONS_ROLES.includes(membership.role),
      canManageEstimates: OPERATIONS_ROLES.includes(membership.role),
      canReadJobs:
        OPERATIONS_READ_ROLES.includes(membership.role) ||
        CREW_ROLES.includes(membership.role),
      canUpdateJobs:
        OPERATIONS_MANAGER_ROLES.includes(membership.role) ||
        membership.role === "crew_lead",
      canManageJobs: OPERATIONS_MANAGER_ROLES.includes(membership.role),
      canManageCrew: OPERATIONS_MANAGER_ROLES.includes(membership.role),
      canEditContent: CONTENT_EDITOR_ROLES.includes(membership.role),
      canPublishContent: CONTENT_APPROVER_ROLES.includes(membership.role),
      canManageTeam: ROLE_ADMIN_ROLES.includes(membership.role),
      canReadAudit: AUDIT_READER_ROLES.includes(membership.role),
      canManageDocuments:
        OPERATIONS_READ_ROLES.includes(membership.role) ||
        CONTENT_EDITOR_ROLES.includes(membership.role),
      canAccessCustomerPortal: CUSTOMER_ROLES.includes(membership.role),
    };
  },
});

export const get = query({
  args: {
    userId: v.id("users"),
    orgId: v.optional(v.id("organizations")),
  },
  returns: v.union(v.null(), userValidator),
  handler: async (ctx, args) => {
    const actor = await requireAuthenticatedUser(ctx);
    if (actor._id !== args.userId) {
      if (!args.orgId) throw new Error("FORBIDDEN");
      await requireActiveMembership(
        ctx,
        actor._id,
        args.orgId,
        ROLE_ADMIN_ROLES,
      );
      await requireActiveMembership(ctx, args.userId, args.orgId);
    }
    return await ctx.db.get(args.userId);
  },
});
export const getByClerkId = query({
  args: { externalId: v.string() },
  returns: userValidator,
  handler: async (ctx, args) => {
    const actor = await requireAuthenticatedUser(ctx);
    if (actor.externalId !== args.externalId) throw new Error("FORBIDDEN");
    return actor;
  },
});
/** Bind an authenticated JWT only to a signature-verified WorkOS profile. */
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
      .withIndex("by_tokenIdentifier", (index) =>
        index.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (!user) {
      const verifiedProfile = await ctx.db
        .query("users")
        .withIndex("by_externalId", (index) =>
          index.eq("externalId", identity.subject),
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
      user = { ...verifiedProfile, tokenIdentifier: identity.tokenIdentifier };
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
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_user_org", (index) =>
        index.eq("userId", args.userId).eq("orgId", args.orgId),
      )
      .unique();
    if (
      !membership ||
      membership.status === "disabled" ||
      membership.workosDeletedAt
    ) {
      throw new Error("MEMBERSHIP_NOT_FOUND");
    }
    if (
      (membership.role === "owner" ||
        args.role === "owner" ||
        args.role === "admin") &&
      actorMembership.role !== "owner"
    ) {
      throw new Error("FORBIDDEN");
    }
    if (
      membership.role === "owner" &&
      membership.status === "active" &&
      args.role !== "owner"
    ) {
      if ((await countUsableActiveOwners(ctx, args.orgId)) < 2) {
        throw new Error("LAST_ACTIVE_OWNER");
      }
    }
    await ctx.db.patch(membership._id, { role: args.role });
    await ctx.db.insert("auditEvents", {
      orgId: args.orgId,
      actorId: actor._id,
      action: "membership.role_updated",
      targetResource: membership._id,
      metadata: { orgId: args.orgId, role: args.role, userId: args.userId },
      timestamp: Date.now(),
    });
    const updated = await ctx.db.get(membership._id);
    if (!updated) throw new Error("MEMBERSHIP_NOT_FOUND");
    return updated;
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
      .withIndex("by_org", (index) => index.eq("orgId", args.orgId))
      .take(100);
    const selected = memberships.filter(
      (membership) =>
        membership.status === "active" &&
        !membership.workosDeletedAt &&
        (!args.role || membership.role === args.role),
    );
    const users = await Promise.all(
      selected.map((membership) => ctx.db.get(membership.userId)),
    );
    return users.filter(
      (user): user is NonNullable<typeof user> =>
        user !== null &&
        user.identityStatus !== "disabled" &&
        !user.workosDeletedAt,
    );
  },
});

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
    if (
      args.status !== "disabled" &&
      (user.identityStatus !== "active" || user.workosDeletedAt)
    ) {
      throw new Error("PROVISIONING_USER_NOT_ACTIVE");
    }
    if (args.status === "active" && organization.status !== "active") {
      throw new Error("FORBIDDEN");
    }

    const existing = await ctx.db
      .query("memberships")
      .withIndex("by_user_org", (index) =>
        index.eq("userId", args.userId).eq("orgId", args.orgId),
      )
      .unique();
    if (existing?.workosDeletedAt) {
      throw new Error("WORKOS_MEMBERSHIP_TOMBSTONED");
    }
    if (
      existing?.role === "owner" &&
      existing.status === "active" &&
      (args.role !== "owner" || args.status !== "active")
    ) {
      if ((await countUsableActiveOwners(ctx, args.orgId)) < 2) {
        throw new Error("LAST_ACTIVE_OWNER");
      }
    }
    const membershipId = existing
      ? existing._id
      : await ctx.db.insert("memberships", {
          userId: args.userId,
          orgId: args.orgId,
          role: args.role,
          status: args.status,
        });
    if (existing) {
      await ctx.db.patch(existing._id, { role: args.role, status: args.status });
    }
    await ctx.db.insert("auditEvents", {
      orgId: args.orgId,
      actorId: args.actorId,
      action: "membership.provisioned",
      targetResource: membershipId,
      metadata: { orgId: args.orgId, role: args.role, userId: args.userId },
      timestamp: Date.now(),
    });
    const membership = await ctx.db.get(membershipId);
    if (!membership) throw new Error("MEMBERSHIP_NOT_FOUND");
    return membership;
  },
});

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
      .withIndex("by_tokenIdentifier", (index) =>
        index.eq("tokenIdentifier", args.tokenIdentifier),
      )
      .unique();
    if (collision) throw new Error("TOKEN_IDENTIFIER_ALREADY_BOUND");
    await ctx.db.patch(user._id, { tokenIdentifier: args.tokenIdentifier });
    return user._id;
  },
});
