import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

export type AppRole =
  | "owner"
  | "admin"
  | "estimator"
  | "project_manager"
  | "crew_lead"
  | "crew_member"
  | "crew"
  | "staff"
  | "customer"
  | "content_editor"
  | "content_approver";

export const OPERATIONS_ROLES: readonly AppRole[] = [
  "owner",
  "admin",
  "estimator",
  "project_manager",
];

export const OPERATIONS_MANAGER_ROLES: readonly AppRole[] = [
  "owner",
  "admin",
  "project_manager",
];

export const ROLE_ADMIN_ROLES: readonly AppRole[] = ["owner", "admin"];

export const CMS_EDITOR_ROLES: readonly AppRole[] = [
  "owner",
  "admin",
  "content_editor",
  "content_approver",
];

export const CMS_PUBLISHER_ROLES: readonly AppRole[] = [
  "owner",
  "admin",
  "content_approver",
];

export const CREW_ROLES: readonly AppRole[] = [
  "crew_lead",
  "crew_member",
  "crew",
  "staff",
];

export const AUDIT_READER_ROLES: readonly AppRole[] = ["owner", "admin"];

type AuthContext =
  | Pick<QueryCtx, "auth" | "db">
  | Pick<MutationCtx, "auth" | "db">;

export function assertAllowedRole(
  role: AppRole | null | undefined,
  allowedRoles: readonly AppRole[],
): asserts role is AppRole {
  if (!role || !allowedRoles.includes(role)) {
    throw new Error("FORBIDDEN");
  }
}

export function assertCustomerOwnership(
  customerUserId: string | undefined,
  currentUserId: string,
): void {
  if (!customerUserId || customerUserId !== currentUserId) {
    throw new Error("FORBIDDEN");
  }
}

export function assertCrewAssignment(
  crewIds: readonly string[],
  currentUserId: string,
  role: AppRole,
): void {
  if (OPERATIONS_ROLES.includes(role)) return;
  if (!CREW_ROLES.includes(role) || !crewIds.includes(currentUserId)) {
    throw new Error("FORBIDDEN");
  }
}

export async function requireAuthenticatedUser(
  ctx: AuthContext,
): Promise<Doc<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity?.tokenIdentifier) {
    throw new Error("UNAUTHENTICATED");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_tokenIdentifier", (query) =>
      query.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();

  if (!user) {
    throw new Error("USER_NOT_PROVISIONED");
  }
  if (user.identityStatus === "disabled") {
    throw new Error("USER_DISABLED");
  }

  return user;
}

export async function requireActiveOrganization(
  ctx: AuthContext,
  orgId: Id<"organizations">,
): Promise<Doc<"organizations">> {
  const organization = await ctx.db.get(orgId);
  if (!organization || organization.status !== "active") {
    throw new Error("FORBIDDEN");
  }
  return organization;
}

export async function getActiveMembership(
  ctx: AuthContext,
  userId: Id<"users">,
  orgId: Id<"organizations">,
): Promise<Doc<"memberships"> | null> {
  const membership = await ctx.db
    .query("memberships")
    .withIndex("by_user_org", (query) =>
      query.eq("userId", userId).eq("orgId", orgId),
    )
    .unique();

  if (!membership || membership.status !== "active") return null;

  const organization = await ctx.db.get(orgId);
  if (!organization || organization.status !== "active") return null;

  return membership;
}

export async function requireActiveMembership(
  ctx: AuthContext,
  userId: Id<"users">,
  orgId: Id<"organizations">,
  allowedRoles?: readonly AppRole[],
): Promise<Doc<"memberships">> {
  const membership = await getActiveMembership(ctx, userId, orgId);
  if (!membership) {
    throw new Error("FORBIDDEN");
  }

  if (allowedRoles) {
    assertAllowedRole(membership.role, allowedRoles);
  }

  return membership;
}

export async function listActiveMemberships(
  ctx: AuthContext,
  userId: Id<"users">,
  allowedRoles?: readonly AppRole[],
): Promise<Doc<"memberships">[]> {
  const memberships = await ctx.db
    .query("memberships")
    .withIndex("by_user", (query) => query.eq("userId", userId))
    .take(50);

  const activeMemberships: Doc<"memberships">[] = [];
  for (const membership of memberships) {
    if (membership.status !== "active") continue;
    if (allowedRoles && !allowedRoles.includes(membership.role)) continue;

    const organization = await ctx.db.get(membership.orgId);
    if (organization?.status === "active") {
      activeMemberships.push(membership);
    }
  }

  return activeMemberships;
}
