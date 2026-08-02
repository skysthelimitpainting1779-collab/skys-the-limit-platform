import type { Id } from "../_generated/dataModel";
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
  allowedRoles?: readonly AppRole[],
) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("UNAUTHENTICATED");
  }

  const externalId = identity.subject || identity.tokenIdentifier;
  if (!externalId) {
    throw new Error("UNAUTHENTICATED");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_externalId", (query) =>
      query.eq("externalId", externalId),
    )
    .unique();

  if (!user) {
    throw new Error("USER_NOT_PROVISIONED");
  }

  if (allowedRoles) {
    assertAllowedRole(user.role, allowedRoles);
  }

  return user;
}

export async function requireActiveMembership(
  ctx: AuthContext,
  userId: Id<"users">,
  orgId: Id<"organizations">,
): Promise<void> {
  const membership = await ctx.db
    .query("memberships")
    .withIndex("by_user_org", (query) =>
      query.eq("userId", userId).eq("orgId", orgId),
    )
    .unique();

  if (!membership || membership.status !== "active") {
    throw new Error("FORBIDDEN");
  }
}
