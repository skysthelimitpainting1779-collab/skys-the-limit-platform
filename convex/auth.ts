import { AuthKit, type AuthFunctions } from "@convex-dev/workos-authkit";
import { components, internal } from "./_generated/api";
import type { DataModel, Doc } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { appendAuditEvent } from "./lib/audit";
import { requireConfiguredWorkOSValue } from "./lib/workosEnvironment";

const configuredClientId = requireConfiguredWorkOSValue("WORKOS_CLIENT_ID");
const configuredApiKey = requireConfiguredWorkOSValue("WORKOS_API_KEY");
const configuredWebhookSecret = requireConfiguredWorkOSValue(
  "WORKOS_WEBHOOK_SECRET",
);

const authFunctions: AuthFunctions = internal.auth;

export const WORKOS_ORGANIZATION_LIFECYCLE_EVENTS = [
  "organization.created",
  "organization.updated",
  "organization.deleted",
  "organization_membership.created",
  "organization_membership.updated",
  "organization_membership.deleted",
] as const;

export const authKit = new AuthKit<DataModel>(components.workOSAuthKit, {
  authFunctions,
  clientId: configuredClientId,
  apiKey: configuredApiKey,
  webhookSecret: configuredWebhookSecret,
  additionalEventTypes: [...WORKOS_ORGANIZATION_LIFECYCLE_EVENTS],
});

type WorkOSProfile = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  profilePictureUrl?: string | null;
  updatedAt: string;
};

type WorkOSDeletedUser = {
  id: string;
  updatedAt: string;
};

type WorkOSOrganization = {
  id: string;
  name: string;
  externalId?: string | null;
  metadata?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
};

type WorkOSMembershipStatus = "active" | "inactive" | "pending";

type WorkOSOrganizationMembership = {
  id: string;
  organizationId: string;
  userId: string;
  status: WorkOSMembershipStatus;
  role: { slug: string };
  updatedAt: string;
};

type ConvexMembershipStatus = Doc<"memberships">["status"];
const WORKOS_AUDIT_ACTOR = "workos:webhook";

export function mapWorkOSMembershipStatus(
  status: WorkOSMembershipStatus,
): ConvexMembershipStatus {
  switch (status) {
    case "active":
      return "active";
    case "pending":
      return "invited";
    case "inactive":
      return "disabled";
  }
}

function requireTimestamp(value: string, label: string): number {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) {
    throw new Error(`INVALID_WORKOS_${label}_TIMESTAMP`);
  }
  return timestamp;
}

function assertOrganizationEventIsCurrent(
  organization: Doc<"organizations">,
  incomingUpdatedAt: string,
) {
  const settings = organization.settings;
  const deletedAt = settings?.workosDeletedAt;
  if (typeof deletedAt === "string") {
    throw new Error("WORKOS_ORGANIZATION_TOMBSTONED");
  }

  const previousUpdatedAt = settings?.workosUpdatedAt;
  if (
    typeof previousUpdatedAt === "string" &&
    requireTimestamp(incomingUpdatedAt, "ORGANIZATION") <
      requireTimestamp(previousUpdatedAt, "ORGANIZATION")
  ) {
    throw new Error("WORKOS_ORGANIZATION_EVENT_OUT_OF_ORDER");
  }
}

function organizationSettings(
  existing: Doc<"organizations">["settings"],
  organization: WorkOSOrganization,
  deletedAt?: string,
) {
  const settings: Record<string, unknown> = {
    ...(existing ?? {}),
    workosUpdatedAt: organization.updatedAt,
    workosMetadata: organization.metadata ?? {},
  };
  if (organization.externalId) {
    settings.workosExternalId = organization.externalId;
  }
  if (deletedAt) settings.workosDeletedAt = deletedAt;
  return settings;
}

function workOSOrganizationSlug(workosOrganizationId: string) {
  return `workos-${workosOrganizationId.toLowerCase()}`;
}

async function upsertWorkOSOrganization(
  ctx: MutationCtx,
  organization: WorkOSOrganization,
) {
  const timestamp = requireTimestamp(organization.updatedAt, "ORGANIZATION");
  const existing = await ctx.db
    .query("organizations")
    .withIndex("by_workosOrganizationId", (query) =>
      query.eq("workosOrganizationId", organization.id),
    )
    .unique();

  if (existing) {
    assertOrganizationEventIsCurrent(existing, organization.updatedAt);
    await ctx.db.patch(existing._id, {
      name: organization.name,
      settings: organizationSettings(existing.settings, organization),
    });
    await appendAuditEvent(ctx, {
      orgId: existing._id,
      actorId: WORKOS_AUDIT_ACTOR,
      action: "workos.organization_updated",
      targetResource: existing._id,
      metadata: { workosOrganizationId: organization.id },
      timestamp,
    });
    return existing._id;
  }

  const organizationId = await ctx.db.insert("organizations", {
    workosOrganizationId: organization.id,
    name: organization.name,
    slug: workOSOrganizationSlug(organization.id),
    status: "active",
    settings: organizationSettings(undefined, organization),
  });
  await appendAuditEvent(ctx, {
    orgId: organizationId,
    actorId: WORKOS_AUDIT_ACTOR,
    action: "workos.organization_created",
    targetResource: organizationId,
    metadata: { workosOrganizationId: organization.id },
    timestamp,
  });
  return organizationId;
}

async function suspendWorkOSOrganization(
  ctx: MutationCtx,
  organization: WorkOSOrganization,
) {
  const timestamp = requireTimestamp(organization.updatedAt, "ORGANIZATION");
  const existing = await ctx.db
    .query("organizations")
    .withIndex("by_workosOrganizationId", (query) =>
      query.eq("workosOrganizationId", organization.id),
    )
    .unique();
  if (!existing) throw new Error("WORKOS_ORGANIZATION_NOT_SYNCED");

  const previousUpdatedAt = existing.settings?.workosUpdatedAt;
  if (
    typeof previousUpdatedAt === "string" &&
    requireTimestamp(organization.updatedAt, "ORGANIZATION") <
      requireTimestamp(previousUpdatedAt, "ORGANIZATION")
  ) {
    throw new Error("WORKOS_ORGANIZATION_EVENT_OUT_OF_ORDER");
  }

  await ctx.db.patch(existing._id, {
    status: "suspended",
    settings: organizationSettings(
      existing.settings,
      organization,
      organization.updatedAt,
    ),
  });
  await appendAuditEvent(ctx, {
    orgId: existing._id,
    actorId: WORKOS_AUDIT_ACTOR,
    action: "workos.organization_deleted",
    targetResource: existing._id,
    metadata: { workosOrganizationId: organization.id },
    timestamp,
  });
}

async function requireWorkOSMembershipReferences(
  ctx: MutationCtx,
  membership: WorkOSOrganizationMembership,
) {
  const organization = await ctx.db
    .query("organizations")
    .withIndex("by_workosOrganizationId", (query) =>
      query.eq("workosOrganizationId", membership.organizationId),
    )
    .unique();
  if (!organization) throw new Error("WORKOS_ORGANIZATION_NOT_SYNCED");
  if (typeof organization.settings?.workosDeletedAt === "string") {
    throw new Error("WORKOS_ORGANIZATION_TOMBSTONED");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_externalId", (query) =>
      query.eq("externalId", membership.userId),
    )
    .unique();
  if (!user) throw new Error("WORKOS_USER_NOT_SYNCED");
  if (user.identityStatus === "disabled") {
    throw new Error("WORKOS_USER_DISABLED");
  }
  return { organization, user };
}

function requireWorkOSRoleSlug(membership: WorkOSOrganizationMembership) {
  const roleSlug = membership.role?.slug?.trim();
  if (!roleSlug) throw new Error("INVALID_WORKOS_ROLE_SLUG");
  return roleSlug;
}

function assertMembershipEventIsCurrent(
  membership: Doc<"memberships">,
  incomingUpdatedAt: string,
) {
  const incomingTimestamp = requireTimestamp(incomingUpdatedAt, "MEMBERSHIP");
  if (
    membership.workosUpdatedAt &&
    incomingTimestamp <
      requireTimestamp(membership.workosUpdatedAt, "MEMBERSHIP")
  ) {
    throw new Error("WORKOS_MEMBERSHIP_EVENT_OUT_OF_ORDER");
  }
  if (membership.workosDeletedAt) {
    throw new Error("WORKOS_MEMBERSHIP_TOMBSTONED");
  }
}

async function upsertWorkOSMembership(
  ctx: MutationCtx,
  membership: WorkOSOrganizationMembership,
) {
  const timestamp = requireTimestamp(membership.updatedAt, "MEMBERSHIP");
  const { organization, user } = await requireWorkOSMembershipReferences(
    ctx,
    membership,
  );
  const roleSlug = requireWorkOSRoleSlug(membership);
  const desiredStatus = mapWorkOSMembershipStatus(membership.status);

  const byWorkOSId = await ctx.db
    .query("memberships")
    .withIndex("by_workosMembershipId", (query) =>
      query.eq("workosMembershipId", membership.id),
    )
    .unique();
  const byUserAndOrganization = await ctx.db
    .query("memberships")
    .withIndex("by_user_org", (query) =>
      query.eq("userId", user._id).eq("orgId", organization._id),
    )
    .unique();

  if (
    byWorkOSId &&
    byUserAndOrganization &&
    byWorkOSId._id !== byUserAndOrganization._id
  ) {
    throw new Error("WORKOS_MEMBERSHIP_IDENTITY_COLLISION");
  }
  const existing = byWorkOSId ?? byUserAndOrganization;

  if (!existing) {
    const membershipId = await ctx.db.insert("memberships", {
      userId: user._id,
      orgId: organization._id,
      role: "member",
      status: desiredStatus,
      workosMembershipId: membership.id,
      workosRoleSlug: roleSlug,
      workosUpdatedAt: membership.updatedAt,
    });
    await appendAuditEvent(ctx, {
      orgId: organization._id,
      actorId: WORKOS_AUDIT_ACTOR,
      action: "workos.membership_created",
      targetResource: membershipId,
      metadata: {
        userId: user._id,
        workosMembershipId: membership.id,
        workosRoleSlug: roleSlug,
        status: desiredStatus,
      },
      timestamp,
    });
    return membershipId;
  }

  if (
    existing.workosDeletedAt &&
    existing.workosMembershipId !== membership.id
  ) {
    if (
      timestamp <=
      requireTimestamp(existing.workosDeletedAt, "MEMBERSHIP")
    ) {
      throw new Error("WORKOS_MEMBERSHIP_EVENT_OUT_OF_ORDER");
    }
    await ctx.db.patch(existing._id, {
      role: "member",
      status: desiredStatus,
      workosMembershipId: membership.id,
      workosRoleSlug: roleSlug,
      workosUpdatedAt: membership.updatedAt,
      workosDeletedAt: undefined,
    });
    await appendAuditEvent(ctx, {
      orgId: organization._id,
      actorId: WORKOS_AUDIT_ACTOR,
      action: "workos.membership_reinvited",
      targetResource: existing._id,
      metadata: {
        userId: user._id,
        previousWorkosMembershipId: existing.workosMembershipId,
        workosMembershipId: membership.id,
        workosRoleSlug: roleSlug,
        status: desiredStatus,
      },
      timestamp,
    });
    return existing._id;
  }

  if (
    existing.userId !== user._id ||
    existing.orgId !== organization._id ||
    (existing.workosMembershipId &&
      existing.workosMembershipId !== membership.id)
  ) {
    throw new Error("WORKOS_MEMBERSHIP_IDENTITY_COLLISION");
  }

  assertMembershipEventIsCurrent(existing, membership.updatedAt);

  if (desiredStatus === "active" && existing.status === "disabled") {
    throw new Error("WORKOS_MEMBERSHIP_REACTIVATION_REQUIRES_REVIEW");
  }
  if (
    desiredStatus === "active" &&
    existing.status !== "active" &&
    existing.role !== "member"
  ) {
    throw new Error("WORKOS_PRIVILEGED_MEMBERSHIP_ACTIVATION_REQUIRES_REVIEW");
  }

  await ctx.db.patch(existing._id, {
    status: desiredStatus,
    workosMembershipId: membership.id,
    workosRoleSlug: roleSlug,
    workosUpdatedAt: membership.updatedAt,
  });
  await appendAuditEvent(ctx, {
    orgId: organization._id,
    actorId: WORKOS_AUDIT_ACTOR,
    action: "workos.membership_updated",
    targetResource: existing._id,
    metadata: {
      userId: user._id,
      workosMembershipId: membership.id,
      workosRoleSlug: roleSlug,
      status: desiredStatus,
    },
    timestamp,
  });
  return existing._id;
}

async function disableWorkOSMembership(
  ctx: MutationCtx,
  membership: WorkOSOrganizationMembership,
) {
  const incomingTimestamp = requireTimestamp(
    membership.updatedAt,
    "MEMBERSHIP",
  );
  const roleSlug = requireWorkOSRoleSlug(membership);
  const existing = await ctx.db
    .query("memberships")
    .withIndex("by_workosMembershipId", (query) =>
      query.eq("workosMembershipId", membership.id),
    )
    .unique();
  if (!existing) throw new Error("WORKOS_MEMBERSHIP_NOT_SYNCED");

  const organization = await ctx.db.get(existing.orgId);
  const user = await ctx.db.get(existing.userId);
  if (
    !organization ||
    organization.workosOrganizationId !== membership.organizationId ||
    !user ||
    user.externalId !== membership.userId
  ) {
    throw new Error("WORKOS_MEMBERSHIP_IDENTITY_COLLISION");
  }

  if (
    existing.workosUpdatedAt &&
    incomingTimestamp <
      requireTimestamp(existing.workosUpdatedAt, "MEMBERSHIP")
  ) {
    throw new Error("WORKOS_MEMBERSHIP_EVENT_OUT_OF_ORDER");
  }

  await ctx.db.patch(existing._id, {
    status: "disabled",
    workosRoleSlug: roleSlug,
    workosUpdatedAt: membership.updatedAt,
    workosDeletedAt: membership.updatedAt,
  });
  await appendAuditEvent(ctx, {
    orgId: existing.orgId,
    actorId: WORKOS_AUDIT_ACTOR,
    action: "workos.membership_deleted",
    targetResource: existing._id,
    metadata: {
      userId: existing.userId,
      workosMembershipId: membership.id,
      workosRoleSlug: roleSlug,
    },
    timestamp: incomingTimestamp,
  });
}

function displayName(profile: WorkOSProfile) {
  return (
    [profile.firstName, profile.lastName]
      .filter((part): part is string => Boolean(part?.trim()))
      .join(" ") || profile.email
  );
}

async function appendWorkOSUserAuditEvents(
  ctx: MutationCtx,
  userId: Doc<"users">["_id"],
  action: "workos.user_created" | "workos.user_updated" | "workos.user_deleted",
  externalId: string,
  timestamp: number,
) {
  const memberships = await ctx.db
    .query("memberships")
    .withIndex("by_user", (index) => index.eq("userId", userId))
    .take(100);
  if (memberships.length === 0) {
    await appendAuditEvent(ctx, {
      actorId: WORKOS_AUDIT_ACTOR,
      action,
      targetResource: userId,
      metadata: { externalId },
      timestamp,
    });
    return;
  }
  for (const membership of memberships) {
    await appendAuditEvent(ctx, {
      orgId: membership.orgId,
      actorId: WORKOS_AUDIT_ACTOR,
      action,
      targetResource: userId,
      metadata: { externalId, membershipId: membership._id },
      timestamp,
    });
  }
}

async function syncVerifiedProfile(ctx: MutationCtx, profile: WorkOSProfile) {
  const incomingTimestamp = requireTimestamp(profile.updatedAt, "USER");
  const existing = await ctx.db
    .query("users")
    .withIndex("by_externalId", (query) => query.eq("externalId", profile.id))
    .unique();
  if (existing?.workosUpdatedAt) {
    const storedTimestamp = requireTimestamp(existing.workosUpdatedAt, "USER");
    if (incomingTimestamp < storedTimestamp) {
      throw new Error("WORKOS_USER_EVENT_OUT_OF_ORDER");
    }
  }
  if (existing?.workosDeletedAt) {
    throw new Error("WORKOS_USER_TOMBSTONED");
  }
  const verifiedProfile = {
    externalId: profile.id,
    email: profile.email,
    name: displayName(profile),
    avatarUrl: profile.profilePictureUrl ?? undefined,
    identitySource: "workos_webhook" as const,
    identityStatus: "active" as const,
    workosUpdatedAt: profile.updatedAt,
  };

  if (existing) {
    await ctx.db.patch(existing._id, verifiedProfile);
    await appendWorkOSUserAuditEvents(
      ctx,
      existing._id,
      "workos.user_updated",
      profile.id,
      incomingTimestamp,
    );
    return existing._id;
  }
  const userId = await ctx.db.insert("users", {
    ...verifiedProfile,
    role: "customer",
  });
  await appendWorkOSUserAuditEvents(
    ctx,
    userId,
    "workos.user_created",
    profile.id,
    incomingTimestamp,
  );
  return userId;
}

async function tombstoneWorkOSUser(
  ctx: MutationCtx,
  profile: WorkOSDeletedUser,
) {
  const incomingTimestamp = requireTimestamp(profile.updatedAt, "USER");
  const user = await ctx.db
    .query("users")
    .withIndex("by_externalId", (query) =>
      query.eq("externalId", profile.id),
    )
    .unique();
  if (!user) throw new Error("WORKOS_USER_NOT_SYNCED");

  if (user.workosUpdatedAt) {
    const storedTimestamp = requireTimestamp(user.workosUpdatedAt, "USER");
    if (incomingTimestamp < storedTimestamp) {
      throw new Error("WORKOS_USER_EVENT_OUT_OF_ORDER");
    }
  }
  if (user.workosDeletedAt) {
    const deletedTimestamp = requireTimestamp(user.workosDeletedAt, "USER");
    if (incomingTimestamp < deletedTimestamp) {
      throw new Error("WORKOS_USER_EVENT_OUT_OF_ORDER");
    }
    if (incomingTimestamp === deletedTimestamp) return;
  }

  await ctx.db.patch(user._id, {
    identityStatus: "disabled",
    workosUpdatedAt: profile.updatedAt,
    workosDeletedAt: profile.updatedAt,
  });
  await appendWorkOSUserAuditEvents(
    ctx,
    user._id,
    "workos.user_deleted",
    profile.id,
    incomingTimestamp,
  );
}

export const { authKitEvent } = authKit.events({
  "user.created": async (ctx, event) => {
    await syncVerifiedProfile(ctx, event.data);
  },
  "user.updated": async (ctx, event) => {
    await syncVerifiedProfile(ctx, event.data);
  },
  "user.deleted": async (ctx, event) => {
    await tombstoneWorkOSUser(ctx, event.data);
  },
  "organization.created": async (ctx, event) => {
    await upsertWorkOSOrganization(ctx, event.data);
  },
  "organization.updated": async (ctx, event) => {
    await upsertWorkOSOrganization(ctx, event.data);
  },
  "organization.deleted": async (ctx, event) => {
    await suspendWorkOSOrganization(ctx, event.data);
  },
  "organization_membership.created": async (ctx, event) => {
    await upsertWorkOSMembership(ctx, event.data);
  },
  "organization_membership.updated": async (ctx, event) => {
    await upsertWorkOSMembership(ctx, event.data);
  },
  "organization_membership.deleted": async (ctx, event) => {
    await disableWorkOSMembership(ctx, event.data);
  },
});

export const { backfillUsers } = authKit.utils();
