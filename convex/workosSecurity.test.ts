/// <reference types="vite/client" />
// @vitest-environment edge-runtime

import { convexTest } from "convex-test";
import { anyApi } from "convex/server";
import { describe, expect, it } from "vitest";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { isConfiguredEnvironmentValue } from "./lib/workosEnvironment";
import schema from "./schema";

Object.assign(process.env, {
  WORKOS_CLIENT_ID: "client_local_convex_test",
  WORKOS_API_KEY: "sk_" + "test_local_convex_test",
  WORKOS_WEBHOOK_SECRET: "whsec_" + "local_convex_test",
  WORKOS_ACTION_SECRET: "action_local_convex_test",
});

const modules = import.meta.glob("./**/*.ts");
const issuerA = "https://issuer-a.example/";
const issuerB = "https://issuer-b.example/";

function identity(subject: string, issuer = issuerA) {
  return {
    subject,
    issuer,
    tokenIdentifier: `${issuer}|${subject}`,
    email: `${subject}@example.com`,
  };
}

function workOSOrganization(
  id: string,
  name = "Sky's the Limit Painting LLC",
  updatedAt = "2026-08-04T12:00:00.000Z",
) {
  return {
    object: "organization",
    id,
    name,
    allowProfilesOutsideOrganization: false,
    domains: [],
    createdAt: "2026-08-04T11:00:00.000Z",
    updatedAt,
    externalId: "skys-the-limit-painting",
    metadata: { environment: "test" },
  };
}

function workOSMembership(
  id: string,
  organizationId: string,
  userId: string,
  status: "active" | "inactive" | "pending" = "active",
  roleSlug = "owner",
  updatedAt = "2026-08-04T12:00:00.000Z",
) {
  return {
    object: "organization_membership",
    id,
    organizationId,
    organizationName: "Sky's the Limit Painting LLC",
    status,
    userId,
    directoryManaged: false,
    createdAt: "2026-08-04T11:00:00.000Z",
    updatedAt,
    customAttributes: {},
    role: { slug: roleSlug },
  };
}

describe("WorkOS identity binding", () => {
  it("treats copied environment placeholders as unconfigured", () => {
    expect(isConfiguredEnvironmentValue(undefined)).toBe(false);
    expect(isConfiguredEnvironmentValue("client_REPLACE_ME")).toBe(false);
    expect(
      isConfiguredEnvironmentValue(
        "replace_with_environment_specific_webhook_secret",
      ),
    ).toBe(false);
    expect(
      isConfiguredEnvironmentValue("environment-specific-webhook-secret"),
    ).toBe(true);
  });

  it("binds only webhook-verified profiles and ignores caller role input", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(internal.auth.authKitEvent, {
      event: "user.created",
      data: {
        id: "ordinary-user",
        email: "ordinary-user@example.com",
        firstName: "Ordinary",
        lastName: "User",
        profilePictureUrl: null,
        updatedAt: "2026-08-04T12:00:00.000Z",
      },
    });

    const actor = t.withIdentity({
      ...identity("ordinary-user"),
      role: "owner",
      permissions: ["admin:*"],
    });
    const userId = await actor.mutation(anyApi.users.store, {});
    const stored = await t.run((ctx) => ctx.db.get(userId));
    expect(stored).toMatchObject({
      externalId: "ordinary-user",
      tokenIdentifier: `${issuerA}|ordinary-user`,
      role: "customer",
      identitySource: "workos_webhook",
      identityStatus: "active",
    });

    const memberships = await t.run((ctx) =>
      ctx.db
        .query("memberships")
        .withIndex("by_user", (index) => index.eq("userId", userId))
        .collect(),
    );
    expect(memberships).toEqual([]);
    await expect(
      actor.mutation(anyApi.users.store, { role: "owner" }),
    ).rejects.toThrow();
  });

  it("does not bind the same subject from a different issuer", async () => {
    const t = convexTest(schema, modules);
    await t.run((ctx) =>
      ctx.db.insert("users", {
        externalId: "shared-subject",
        tokenIdentifier: `${issuerA}|shared-subject`,
        identitySource: "workos_webhook",
        identityStatus: "active",
        email: "shared-subject@example.com",
        name: "Issuer A User",
        role: "customer",
      }),
    );

    await expect(
      t
        .withIdentity(identity("shared-subject", issuerB))
        .mutation(anyApi.users.store, {}),
    ).rejects.toThrow("IDENTITY_BINDING_REQUIRED");
  });

  it("disables deleted WorkOS identities", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(internal.auth.authKitEvent, {
      event: "user.created",
      data: {
        id: "deleted-user",
        email: "deleted-user@example.com",
        firstName: "Deleted",
        lastName: "User",
        profilePictureUrl: null,
        updatedAt: "2026-08-04T12:00:00.000Z",
      },
    });
    const actor = t.withIdentity(identity("deleted-user"));
    await actor.mutation(anyApi.users.store, {});
    await t.mutation(internal.auth.authKitEvent, {
      event: "user.deleted",
      data: {
        id: "deleted-user",
        updatedAt: "2026-08-04T13:00:00.000Z",
      },
    });
    await expect(actor.mutation(anyApi.users.store, {})).rejects.toThrow(
      "USER_DISABLED",
    );
  });

  it("prevents an admin from demoting an owner membership", async () => {
    const t = convexTest(schema, modules);
    let orgId!: Id<"organizations">;
    let ownerId!: Id<"users">;
    await t.run(async (ctx) => {
      orgId = await ctx.db.insert("organizations", {
        name: "Role Security",
        slug: "role-security",
        status: "active",
      });
      ownerId = await ctx.db.insert("users", {
        externalId: "role-owner",
        tokenIdentifier: `${issuerA}|role-owner`,
        identityStatus: "active",
        email: "role-owner@example.com",
        name: "Role Owner",
        role: "owner",
      });
      const adminId = await ctx.db.insert("users", {
        externalId: "role-admin",
        tokenIdentifier: `${issuerA}|role-admin`,
        identityStatus: "active",
        email: "role-admin@example.com",
        name: "Role Admin",
        role: "admin",
      });
      await ctx.db.insert("memberships", {
        userId: ownerId,
        orgId,
        role: "owner",
        status: "active",
      });
      await ctx.db.insert("memberships", {
        userId: adminId,
        orgId,
        role: "admin",
        status: "active",
      });
    });

    await expect(
      t.withIdentity(identity("role-admin")).mutation(anyApi.users.updateRole, {
        userId: ownerId,
        orgId,
        role: "customer",
      }),
    ).rejects.toThrow("FORBIDDEN");
  });

  it("tombstones deleted users against stale or newer resurrection", async () => {
    const t = convexTest(schema, modules);
    const user = {
      id: "tombstoned-user",
      email: "tombstoned-user@example.com",
      firstName: "Tombstoned",
      lastName: "User",
      profilePictureUrl: null,
    };
    await t.mutation(internal.auth.authKitEvent, {
      event: "user.created",
      data: { ...user, updatedAt: "2026-08-04T12:00:00.000Z" },
    });
    await t.mutation(internal.auth.authKitEvent, {
      event: "user.deleted",
      data: {
        id: user.id,
        updatedAt: "2026-08-04T14:00:00.000Z",
      },
    });
    await expect(
      t.mutation(internal.auth.authKitEvent, {
        event: "user.updated",
        data: { ...user, updatedAt: "2026-08-04T13:00:00.000Z" },
      }),
    ).rejects.toThrow("WORKOS_USER_EVENT_OUT_OF_ORDER");
    await expect(
      t.mutation(internal.auth.authKitEvent, {
        event: "user.updated",
        data: { ...user, updatedAt: "2026-08-04T15:00:00.000Z" },
      }),
    ).rejects.toThrow("WORKOS_USER_TOMBSTONED");

    await expect(
      t.mutation(internal.auth.authKitEvent, {
        event: "user.deleted",
        data: {
          id: user.id,
          updatedAt: "2026-08-04T14:00:00.000Z",
        },
      }),
    ).resolves.toBeNull();

    const stored = await t.run((ctx) =>
      ctx.db
        .query("users")
        .withIndex("by_externalId", (index) =>
          index.eq("externalId", user.id),
        )
        .unique(),
    );
    expect(stored).toMatchObject({
      identityStatus: "disabled",
      workosUpdatedAt: "2026-08-04T14:00:00.000Z",
      workosDeletedAt: "2026-08-04T14:00:00.000Z",
    });
  });

  it("syncs exact WorkOS organization IDs without granting WorkOS roles", async () => {
    const t = convexTest(schema, modules);
    const organization = workOSOrganization("org_workos_primary");
    await t.mutation(internal.auth.authKitEvent, {
      event: "organization.created",
      data: organization,
    });
    await t.mutation(internal.auth.authKitEvent, {
      event: "user.created",
      data: {
        id: "invited-staff",
        email: "invited-staff@example.com",
        firstName: "Invited",
        lastName: "Staff",
        profilePictureUrl: null,
        updatedAt: "2026-08-04T12:00:00.000Z",
      },
    });
    await t.mutation(internal.auth.authKitEvent, {
      event: "organization_membership.created",
      data: workOSMembership(
        "om_workos_staff",
        organization.id,
        "invited-staff",
        "active",
        "owner",
      ),
    });

    const result = await t.run(async (ctx) => {
      const org = await ctx.db
        .query("organizations")
        .withIndex("by_workosOrganizationId", (index) =>
          index.eq("workosOrganizationId", organization.id),
        )
        .unique();
      const membership = await ctx.db
        .query("memberships")
        .withIndex("by_workosMembershipId", (index) =>
          index.eq("workosMembershipId", "om_workos_staff"),
        )
        .unique();
      return { org, membership };
    });

    expect(result.org).toMatchObject({
      workosOrganizationId: organization.id,
      name: organization.name,
      status: "active",
    });
    expect(result.membership).toMatchObject({
      role: "member",
      status: "active",
      workosMembershipId: "om_workos_staff",
      workosRoleSlug: "owner",
    });
  });

  it("preserves Convex authority while WorkOS can revoke lifecycle access", async () => {
    const t = convexTest(schema, modules);
    const organization = workOSOrganization("org_workos_lifecycle");
    await t.mutation(internal.auth.authKitEvent, {
      event: "organization.created",
      data: organization,
    });
    await t.mutation(internal.auth.authKitEvent, {
      event: "user.created",
      data: {
        id: "convex-owner",
        email: "convex-owner@example.com",
        firstName: "Convex",
        lastName: "Owner",
        profilePictureUrl: null,
        updatedAt: "2026-08-04T12:00:00.000Z",
      },
    });
    const membership = workOSMembership(
      "om_workos_owner",
      organization.id,
      "convex-owner",
    );
    await t.mutation(internal.auth.authKitEvent, {
      event: "organization_membership.created",
      data: membership,
    });
    await t.run(async (ctx) => {
      const stored = await ctx.db
        .query("memberships")
        .withIndex("by_workosMembershipId", (index) =>
          index.eq("workosMembershipId", membership.id),
        )
        .unique();
      if (!stored) throw new Error("test membership missing");
      await ctx.db.patch(stored._id, { role: "owner" });
    });

    await t.mutation(internal.auth.authKitEvent, {
      event: "organization_membership.updated",
      data: workOSMembership(
        membership.id,
        organization.id,
        "convex-owner",
        "inactive",
        "admin",
      ),
    });
    const disabled = await t.run((ctx) =>
      ctx.db
        .query("memberships")
        .withIndex("by_workosMembershipId", (index) =>
          index.eq("workosMembershipId", membership.id),
        )
        .unique(),
    );
    expect(disabled).toMatchObject({
      role: "owner",
      status: "disabled",
      workosRoleSlug: "admin",
    });
    const lifecycleAudit = await t.run(async (ctx) => {
      const storedOrganization = await ctx.db
        .query("organizations")
        .withIndex("by_workosOrganizationId", (index) =>
          index.eq("workosOrganizationId", organization.id),
        )
        .unique();
      if (!storedOrganization) throw new Error("test organization missing");
      return await ctx.db
        .query("auditEvents")
        .withIndex("by_org_and_timestamp", (index) =>
          index.eq("orgId", storedOrganization._id),
        )
        .collect();
    });
    expect(lifecycleAudit.map((event) => event.action)).toEqual(
      expect.arrayContaining([
        "workos.organization_created",
        "workos.membership_created",
        "workos.membership_updated",
      ]),
    );
    expect(lifecycleAudit).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ actorId: "workos:webhook" }),
      ]),
    );

    await expect(
      t.mutation(internal.auth.authKitEvent, {
        event: "organization_membership.updated",
        data: workOSMembership(
          membership.id,
          organization.id,
          "convex-owner",
          "active",
          "owner",
        ),
      }),
    ).rejects.toThrow("WORKOS_MEMBERSHIP_REACTIVATION_REQUIRES_REVIEW");
  });

  it("tombstones deleted organizations and rejects stale resurrection", async () => {
    const t = convexTest(schema, modules);
    const organization = workOSOrganization("org_workos_deleted");
    await t.mutation(internal.auth.authKitEvent, {
      event: "organization.created",
      data: organization,
    });
    await t.mutation(internal.auth.authKitEvent, {
      event: "organization.deleted",
      data: workOSOrganization(
        organization.id,
        organization.name,
        "2026-08-04T13:00:00.000Z",
      ),
    });

    await expect(
      t.mutation(internal.auth.authKitEvent, {
        event: "organization.updated",
        data: workOSOrganization(
          organization.id,
          "Stale Organization Name",
          "2026-08-04T12:30:00.000Z",
        ),
      }),
    ).rejects.toThrow("WORKOS_ORGANIZATION_TOMBSTONED");

    const stored = await t.run((ctx) =>
      ctx.db
        .query("organizations")
        .withIndex("by_workosOrganizationId", (index) =>
          index.eq("workosOrganizationId", organization.id),
        )
        .unique(),
    );
    expect(stored).toMatchObject({
      name: organization.name,
      status: "suspended",
    });
    expect(stored?.settings?.workosDeletedAt).toBe(
      "2026-08-04T13:00:00.000Z",
    );
  });

  it("fails membership delivery until its exact WorkOS references exist", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.mutation(internal.auth.authKitEvent, {
        event: "organization_membership.created",
        data: workOSMembership(
          "om_out_of_order",
          "org_not_synced",
          "user_not_synced",
        ),
      }),
    ).rejects.toThrow("WORKOS_ORGANIZATION_NOT_SYNCED");

    const memberships = await t.run((ctx) =>
      ctx.db.query("memberships").collect(),
    );
    expect(memberships).toEqual([]);
  });

  it("rejects same-record resurrection and quarantines a new reinvitation", async () => {
    const t = convexTest(schema, modules);
    const organization = workOSOrganization("org_membership_tombstone");
    await t.mutation(internal.auth.authKitEvent, {
      event: "organization.created",
      data: organization,
    });
    await t.mutation(internal.auth.authKitEvent, {
      event: "user.created",
      data: {
        id: "deleted-membership-user",
        email: "deleted-membership-user@example.com",
        firstName: "Deleted",
        lastName: "Membership",
        profilePictureUrl: null,
        updatedAt: "2026-08-04T12:00:00.000Z",
      },
    });
    const membershipId = "om_membership_tombstone";
    await t.mutation(internal.auth.authKitEvent, {
      event: "organization_membership.created",
      data: workOSMembership(
        membershipId,
        organization.id,
        "deleted-membership-user",
        "active",
        "crew_member",
        "2026-08-04T12:00:00.000Z",
      ),
    });
    await t.mutation(internal.auth.authKitEvent, {
      event: "organization_membership.deleted",
      data: workOSMembership(
        membershipId,
        organization.id,
        "deleted-membership-user",
        "inactive",
        "crew_member",
        "2026-08-04T14:00:00.000Z",
      ),
    });

    await expect(
      t.mutation(internal.auth.authKitEvent, {
        event: "organization_membership.updated",
        data: workOSMembership(
          membershipId,
          organization.id,
          "deleted-membership-user",
          "active",
          "crew_member",
          "2026-08-04T13:00:00.000Z",
        ),
      }),
    ).rejects.toThrow("WORKOS_MEMBERSHIP_EVENT_OUT_OF_ORDER");
    await expect(
      t.mutation(internal.auth.authKitEvent, {
        event: "organization_membership.updated",
        data: workOSMembership(
          membershipId,
          organization.id,
          "deleted-membership-user",
          "active",
          "crew_member",
          "2026-08-04T15:00:00.000Z",
        ),
      }),
    ).rejects.toThrow("WORKOS_MEMBERSHIP_TOMBSTONED");

    const stored = await t.run((ctx) =>
      ctx.db
        .query("memberships")
        .withIndex("by_workosMembershipId", (index) =>
          index.eq("workosMembershipId", membershipId),
        )
        .unique(),
    );
    expect(stored).toMatchObject({
      role: "member",
      status: "disabled",
      workosUpdatedAt: "2026-08-04T14:00:00.000Z",
      workosDeletedAt: "2026-08-04T14:00:00.000Z",
    });

    const replacementMembershipId = "om_membership_reinvited";
    await t.mutation(internal.auth.authKitEvent, {
      event: "organization_membership.created",
      data: workOSMembership(
        replacementMembershipId,
        organization.id,
        "deleted-membership-user",
        "active",
        "owner",
        "2026-08-04T15:00:00.000Z",
      ),
    });
    const reinvited = await t.run((ctx) =>
      ctx.db
        .query("memberships")
        .withIndex("by_workosMembershipId", (index) =>
          index.eq("workosMembershipId", replacementMembershipId),
        )
        .unique(),
    );
    expect(reinvited).toMatchObject({
      role: "member",
      status: "active",
      workosMembershipId: replacementMembershipId,
      workosRoleSlug: "owner",
    });
    expect(reinvited?.workosDeletedAt).toBeUndefined();
  });
});
