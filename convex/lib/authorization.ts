import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

export type AppRole = Doc<"memberships">["role"];

export const OPERATIONS_READ_ROLES: readonly AppRole[] = [
  "owner",
  "admin",
  "estimator",
  "project_manager",
  "staff",
];

export const OPERATIONS_MANAGER_ROLES: readonly AppRole[] = [
  "owner",
  "admin",
  "project_manager",
  "staff",
];

export const OPERATIONS_ROLES: readonly AppRole[] = [
  "owner",
  "admin",
  "estimator",
  "project_manager",
  "staff",
];

export const ROLE_ADMIN_ROLES: readonly AppRole[] = ["owner", "admin"];

export const AUDIT_READER_ROLES: readonly AppRole[] = ["owner", "admin"];

export const CREW_ROLES: readonly AppRole[] = [
  "crew_lead",
  "crew_member",
  "crew",
];

export const FILE_PUBLICATION_ROLES: readonly AppRole[] = [
  "owner",
  "admin",
  "content_approver",
];

export const CONTENT_EDITOR_ROLES: readonly AppRole[] = [
  "owner",
  "admin",
  "content_editor",
  "content_approver",
];

export const CONTENT_APPROVER_ROLES: readonly AppRole[] = [
  "owner",
  "admin",
  "content_approver",
];

export const CUSTOMER_ROLES: readonly AppRole[] = ["customer"];

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

export async function requireAuthenticatedUser(
  ctx: AuthContext,
): Promise<Doc<"users">> {
  const identity = await ctx.auth?.getUserIdentity();
  if (!identity?.tokenIdentifier) {
    throw new Error("UNAUTHENTICATED");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_tokenIdentifier", (query) =>
      query.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();

  if (!user) throw new Error("USER_NOT_PROVISIONED");
  if (user.identityStatus === "disabled" || user.workosDeletedAt) {
    throw new Error("USER_DISABLED");
  }
  return user;
}

export async function requireActiveOrganization(
  ctx: Pick<QueryCtx, "db"> | Pick<MutationCtx, "db">,
  orgId: Id<"organizations">,
): Promise<Doc<"organizations">> {
  const organization = await ctx.db.get(orgId);
  if (!organization || organization.status !== "active") {
    throw new Error("FORBIDDEN");
  }
  return organization;
}

export async function requireActiveMembership(
  ctx: AuthContext,
  userId: Id<"users">,
  orgId: Id<"organizations">,
  allowedRoles?: readonly AppRole[],
): Promise<Doc<"memberships">> {
  await requireActiveOrganization(ctx, orgId);

  const membership = await ctx.db
    .query("memberships")
    .withIndex("by_user_org", (query) =>
      query.eq("userId", userId).eq("orgId", orgId),
    )
    .unique();

  const memberUser = await ctx.db.get(userId);

  if (
    !membership ||
    membership.status !== "active" ||
    membership.workosDeletedAt ||
    !memberUser ||
    memberUser.identityStatus === "disabled" ||
    memberUser.workosDeletedAt
  ) {
    throw new Error("FORBIDDEN");
  }
  if (allowedRoles) assertAllowedRole(membership.role, allowedRoles);
  return membership;
}

export async function getActiveMembership(
  ctx: AuthContext,
  userId: Id<"users">,
  orgId: Id<"organizations">,
): Promise<Doc<"memberships"> | null> {
  const organization = await ctx.db.get(orgId);
  if (!organization || organization.status !== "active") return null;

  const membership = await ctx.db
    .query("memberships")
    .withIndex("by_user_org", (query) =>
      query.eq("userId", userId).eq("orgId", orgId),
    )
    .unique();
  const memberUser = await ctx.db.get(userId);
  return membership?.status === "active" &&
    !membership.workosDeletedAt &&
    memberUser &&
    memberUser.identityStatus !== "disabled" &&
    !memberUser.workosDeletedAt
    ? membership
    : null;
}

export function requireCrewAssignment(
  job: Doc<"jobs">,
  userId: Id<"users">,
): void {
  if (!job.crewIds.includes(userId)) throw new Error("FORBIDDEN");
}
