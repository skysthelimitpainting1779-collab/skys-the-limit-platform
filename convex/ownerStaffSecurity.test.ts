/// <reference types="vite/client" />
// @vitest-environment edge-runtime

import { anyApi } from "convex/server";
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");
const issuer = "https://issuer.example/";

function identity(subject: string) {
  return {
    subject,
    issuer,
    tokenIdentifier: `${issuer}|${subject}`,
    email: `${subject}@example.com`,
  };
}

async function seed() {
  const t = convexTest(schema, modules);
  const ids = {} as {
    orgA: Id<"organizations">;
    orgB: Id<"organizations">;
    ownerA: Id<"users">;
    ownerB: Id<"users">;
    editorA: Id<"users">;
    approverA: Id<"users">;
    estimatorA: Id<"users">;
    crewA: Id<"users">;
    crewOtherA: Id<"users">;
    customerA: Id<"users">;
    customerB: Id<"users">;
    leadA: Id<"leads">;
    leadB: Id<"leads">;
  };

  await t.run(async (ctx) => {
    ids.orgA = await ctx.db.insert("organizations", {
      workosOrganizationId: "org_workos_a",
      name: "Organization A",
      slug: "organization-a",
      status: "active",
    });
    ids.orgB = await ctx.db.insert("organizations", {
      workosOrganizationId: "org_workos_b",
      name: "Organization B",
      slug: "organization-b",
      status: "active",
    });

    const users = [
      ["owner-a", "owner"],
      ["owner-b", "owner"],
      ["editor-a", "content_editor"],
      ["approver-a", "content_approver"],
      ["estimator-a", "estimator"],
      ["crew-a", "crew_member"],
      ["crew-other-a", "crew_member"],
      ["customer-a", "customer"],
      ["customer-b", "customer"],
    ] as const;
    const userIds = new Map<string, Id<"users">>();
    for (const [subject, role] of users) {
      const userId = await ctx.db.insert("users", {
        externalId: subject,
        tokenIdentifier: `${issuer}|${subject}`,
        identityStatus: "active",
        email: `${subject}@example.com`,
        name: subject,
        // Deliberately untrusted compatibility field; membership is authority.
        role: subject === "customer-a" ? "owner" : role,
      });
      userIds.set(subject, userId);
    }
    ids.ownerA = userIds.get("owner-a")!;
    ids.ownerB = userIds.get("owner-b")!;
    ids.editorA = userIds.get("editor-a")!;
    ids.approverA = userIds.get("approver-a")!;
    ids.estimatorA = userIds.get("estimator-a")!;
    ids.crewA = userIds.get("crew-a")!;
    ids.crewOtherA = userIds.get("crew-other-a")!;
    ids.customerA = userIds.get("customer-a")!;
    ids.customerB = userIds.get("customer-b")!;

    for (const [subject, orgId, role] of [
      ["owner-a", ids.orgA, "owner"],
      ["owner-b", ids.orgB, "owner"],
      ["editor-a", ids.orgA, "content_editor"],
      ["approver-a", ids.orgA, "content_approver"],
      ["estimator-a", ids.orgA, "estimator"],
      ["crew-a", ids.orgA, "crew_member"],
      ["crew-other-a", ids.orgA, "crew_member"],
      ["customer-a", ids.orgA, "customer"],
      ["customer-b", ids.orgB, "customer"],
    ] as const) {
      await ctx.db.insert("memberships", {
        workosMembershipId: `membership_${subject}`,
        workosRoleSlug: role,
        userId: userIds.get(subject)!,
        orgId,
        role,
        status: "active",
      });
    }

    ids.leadA = await ctx.db.insert("leads", {
      orgId: ids.orgA,
      idempotencyKey: "lead-a",
      fullName: "Customer A",
      email: "customer-a@example.com",
      phone: "+15555550101",
      serviceAddress: "101 A Street",
      segment: "residential",
      projectDetails: "Lead A",
      sourcePath: "/estimate",
      contactConsentAt: 1,
      status: "qualified",
      createdAt: 1,
      updatedAt: 1,
    });
    ids.leadB = await ctx.db.insert("leads", {
      orgId: ids.orgB,
      idempotencyKey: "lead-b",
      fullName: "Customer B",
      email: "customer-b@example.com",
      phone: "+15555550102",
      serviceAddress: "202 B Street",
      segment: "commercial",
      projectDetails: "Lead B",
      sourcePath: "/estimate",
      contactConsentAt: 1,
      status: "qualified",
      createdAt: 1,
      updatedAt: 1,
    });
  });

  return { t, ...ids };
}

describe("tenant capability context", () => {
  it("derives context and capabilities from active membership, never global role", async () => {
    const { t, orgA, customerA } = await seed();
    const customer = t.withIdentity(identity("customer-a"));
    const context = await customer.query(anyApi.users.getMyContext, {});
    expect(context.user._id).toBe(customerA);
    expect(context.defaultOrgId).toBe(orgA);
    expect(context.memberships).toHaveLength(1);
    expect(context.memberships[0]).toMatchObject({ orgId: orgA, role: "customer" });

    const capabilities = await customer.query(anyApi.users.getMyCapabilities, {
      orgId: orgA,
    });
    expect(capabilities.role).toBe("customer");
    expect(capabilities.canManageTeam).toBe(false);
    expect(capabilities.canManageJobs).toBe(false);
    expect(capabilities.canAccessCustomerPortal).toBe(true);
  });

  it("skips and rejects a membership tombstone even if status remains active", async () => {
    const { t, orgA, customerA } = await seed();
    await t.run(async (ctx) => {
      const membership = await ctx.db
        .query("memberships")
        .withIndex("by_user_org", (index) =>
          index.eq("userId", customerA).eq("orgId", orgA),
        )
        .unique();
      if (!membership) throw new Error("membership fixture missing");
      await ctx.db.patch(membership._id, {
        status: "active",
        workosDeletedAt: "2026-08-03T23:00:00.000Z",
      });
    });
    const customer = t.withIdentity(identity("customer-a"));
    await expect(customer.query(anyApi.users.getMyContext, {})).resolves.toMatchObject({
      memberships: [],
      defaultOrgId: null,
    });
    await expect(
      customer.query(anyApi.users.getMyCapabilities, { orgId: orgA }),
    ).rejects.toThrow("FORBIDDEN");
  });
});

describe("membership governance", () => {
  it("preserves a last active owner while allowing a redundant owner to demote", async () => {
    const { t, orgA, ownerA } = await seed();
    const owner = t.withIdentity(identity("owner-a"));
    await expect(
      owner.mutation(anyApi.users.updateRole, {
        userId: ownerA,
        orgId: orgA,
        role: "staff",
      }),
    ).rejects.toThrow("LAST_ACTIVE_OWNER");

    await t.run(async (ctx) => {
      const secondOwner = await ctx.db.insert("users", {
        externalId: "second-owner-a",
        tokenIdentifier: `${issuer}|second-owner-a`,
        identityStatus: "active",
        email: "second-owner-a@example.com",
        name: "Second Owner A",
        role: "customer",
      });
      await ctx.db.insert("memberships", {
        userId: secondOwner,
        orgId: orgA,
        role: "owner",
        status: "active",
      });
    });
    await expect(
      owner.mutation(anyApi.users.updateRole, {
        userId: ownerA,
        orgId: orgA,
        role: "staff",
      }),
    ).resolves.toMatchObject({ role: "staff" });
  });

  it("does not let generic provisioning resurrect a WorkOS tombstone", async () => {
    const { t, orgA, customerA } = await seed();
    await t.run(async (ctx) => {
      const membership = await ctx.db
        .query("memberships")
        .withIndex("by_user_org", (index) =>
          index.eq("userId", customerA).eq("orgId", orgA),
        )
        .unique();
      if (!membership) throw new Error("membership fixture missing");
      await ctx.db.patch(membership._id, {
        status: "disabled",
        workosDeletedAt: "2026-08-03T21:00:00.000Z",
      });
    });
    await expect(
      t.mutation(internal.users.provisionMembership, {
        actorId: "bootstrap",
        userId: customerA,
        orgId: orgA,
        role: "customer",
        status: "active",
      }),
    ).rejects.toThrow("WORKOS_MEMBERSHIP_TOMBSTONED");
  });

  it("does not activate or invite a disabled or tombstoned WorkOS user", async () => {
    const { t, orgA, customerA } = await seed();
    await t.run(async (ctx) => {
      await ctx.db.patch(customerA, { identityStatus: "disabled" });
    });
    await expect(
      t.mutation(internal.users.provisionMembership, {
        actorId: "bootstrap",
        userId: customerA,
        orgId: orgA,
        role: "customer",
        status: "active",
      }),
    ).rejects.toThrow("PROVISIONING_USER_NOT_ACTIVE");

    await t.run(async (ctx) => {
      await ctx.db.patch(customerA, {
        identityStatus: "active",
        workosDeletedAt: "2026-08-03T22:00:00.000Z",
      });
    });
    await expect(
      t.mutation(internal.users.provisionMembership, {
        actorId: "bootstrap",
        userId: customerA,
        orgId: orgA,
        role: "customer",
        status: "invited",
      }),
    ).rejects.toThrow("PROVISIONING_USER_NOT_ACTIVE");
  });

  it("does not count disabled, tombstoned, or invited identities as usable owners", async () => {
    const { t, orgA, ownerA } = await seed();
    let invitedOwner!: Id<"users">;
    await t.run(async (ctx) => {
      const disabledOwner = await ctx.db.insert("users", {
        externalId: "disabled-owner-a",
        tokenIdentifier: `${issuer}|disabled-owner-a`,
        identityStatus: "disabled",
        email: "disabled-owner-a@example.com",
        name: "Disabled Owner",
        role: "owner",
      });
      await ctx.db.insert("memberships", {
        userId: disabledOwner,
        orgId: orgA,
        role: "owner",
        status: "active",
      });
      const tombstonedOwner = await ctx.db.insert("users", {
        externalId: "tombstoned-owner-a",
        tokenIdentifier: `${issuer}|tombstoned-owner-a`,
        identityStatus: "active",
        workosDeletedAt: "2026-08-03T21:00:00.000Z",
        email: "tombstoned-owner-a@example.com",
        name: "Tombstoned Owner",
        role: "owner",
      });
      await ctx.db.insert("memberships", {
        userId: tombstonedOwner,
        orgId: orgA,
        role: "owner",
        status: "active",
      });
      invitedOwner = await ctx.db.insert("users", {
        externalId: "invited-owner-a",
        tokenIdentifier: `${issuer}|invited-owner-a`,
        identityStatus: "active",
        email: "invited-owner-a@example.com",
        name: "Invited Owner",
        role: "owner",
      });
      await ctx.db.insert("memberships", {
        userId: invitedOwner,
        orgId: orgA,
        role: "owner",
        status: "invited",
      });
    });

    const owner = t.withIdentity(identity("owner-a"));
    await expect(
      owner.mutation(anyApi.users.updateRole, {
        userId: ownerA,
        orgId: orgA,
        role: "staff",
      }),
    ).rejects.toThrow("LAST_ACTIVE_OWNER");
    await expect(
      owner.mutation(anyApi.users.updateRole, {
        userId: invitedOwner,
        orgId: orgA,
        role: "staff",
      }),
    ).resolves.toMatchObject({ status: "invited", role: "staff" });
  });
});

describe("document audit integrity", () => {
  it("audits metadata registration and deletion with the server-derived actor", async () => {
    const { t, orgA, ownerA } = await seed();
    const owner = t.withIdentity(identity("owner-a"));
    const documentId = await owner.mutation(internal.files.registerDocument, {
      blobUrl: "https://blob.example/audited-document",
      blobPathname: `organizations/${orgA}/users/${ownerA}/audited.pdf`,
      name: "audited.pdf",
      mimeType: "application/pdf",
      size: 128,
      orgId: orgA,
      accessLevel: "internal",
    });
    await owner.mutation(internal.files.deleteDocumentMetadata, { documentId });

    const events = await t.run(async (ctx) =>
      await ctx.db
        .query("auditEvents")
        .withIndex("by_org_and_target", (index) =>
          index.eq("orgId", orgA).eq("targetResource", documentId),
        )
        .take(10),
    );
    expect(events.map((event) => event.action)).toEqual([
      "document.registered",
      "document.metadata_deleted",
    ]);
    expect(events.every((event) => event.actorId === ownerA)).toBe(true);
  });
});

describe("customer ownership", () => {
  it("binds portal records only by exact authenticated user id", async () => {
    const { t, orgA, customerA, customerB, leadA } = await seed();
    const owner = t.withIdentity(identity("owner-a"));
    const customerId = await owner.mutation(anyApi.customers.createFromLead, {
      leadId: leadA,
      status: "active",
    });
    await owner.mutation(anyApi.customers.linkUser, {
      customerId,
      userId: customerA,
    });

    await expect(
      owner.mutation(anyApi.customers.linkUser, {
        customerId,
        userId: customerB,
      }),
    ).rejects.toThrow("FORBIDDEN");

    const portal = await t
      .withIdentity(identity("customer-a"))
      .query(anyApi.customers.getMyPortal, { orgId: orgA });
    expect(portal).toMatchObject({ customer: { _id: customerId } });
    expect(portal?.customer).not.toHaveProperty("userId");
    await expect(
      t.withIdentity(identity("customer-b")).query(anyApi.customers.getMyPortal, {
        orgId: orgA,
      }),
    ).rejects.toThrow("FORBIDDEN");
  });
});

describe("job, notification, and publication boundaries", () => {
  it("keeps assigned crew members read-only for job work", async () => {
    const { t, orgA, leadA, crewA } = await seed();
    const owner = t.withIdentity(identity("owner-a"));
    const estimateId = await owner.mutation(anyApi.estimates.create, {
      leadId: leadA,
      orgId: orgA,
      scope: "Interior repaint",
      pricing: 2_500,
      status: "accepted",
    });
    const jobId = await owner.mutation(anyApi.jobs.create, {
      orgId: orgA,
      estimateId,
      title: "Interior repaint",
      address: "101 A Street",
      schedule: "Tomorrow",
    });
    await owner.mutation(anyApi.jobs.assignCrew, { jobId, crewIds: [crewA] });

    const estimator = t.withIdentity(identity("estimator-a"));
    await expect(
      estimator.query(anyApi.jobs.list, { orgId: orgA, limit: 10 }),
    ).resolves.toEqual(expect.arrayContaining([expect.objectContaining({ _id: jobId })]));
    await expect(
      estimator.mutation(anyApi.jobs.update, {
        jobId,
        title: "Estimator must not mutate jobs",
      }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      estimator.mutation(anyApi.jobs.addProjectUpdate, {
        jobId,
        message: "Estimator must not write project updates",
      }),
    ).rejects.toThrow("FORBIDDEN");

    await expect(
      t.withIdentity(identity("crew-other-a")).query(anyApi.jobs.listTasks, {
        jobId,
      }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      t.withIdentity(identity("crew-a")).mutation(anyApi.jobs.addProjectUpdate, {
        jobId,
        message: "Crew members must not write project updates",
        customerVisible: false,
      }),
    ).rejects.toThrow("FORBIDDEN");
  });

  it("keeps notifications bound to the exact recipient", async () => {
    const { t, orgA, customerA } = await seed();
    let notificationId!: Id<"notifications">;
    await t.run(async (ctx) => {
      notificationId = await ctx.db.insert("notifications", {
        orgId: orgA,
        recipientUserId: customerA,
        title: "Estimate ready",
        body: "Your estimate is ready.",
        type: "estimate_ready",
        isRead: false,
        createdAt: 1,
      });
      await ctx.db.insert("notificationCounters", {
        orgId: orgA,
        userId: customerA,
        unreadCount: 1,
        updatedAt: 1,
      });
    });

    const customer = t.withIdentity(identity("customer-a"));
    expect(
      await customer.query(anyApi.notifications.getUnreadCount, { orgId: orgA }),
    ).toBe(1);
    await expect(
      t.withIdentity(identity("owner-a")).mutation(anyApi.notifications.markAsRead, {
        notificationId,
      }),
    ).rejects.toThrow("FORBIDDEN");
    await customer.mutation(anyApi.notifications.markAsRead, { notificationId });
    expect(
      await customer.query(anyApi.notifications.getUnreadCount, { orgId: orgA }),
    ).toBe(0);

    let revokedNotificationId!: Id<"notifications">;
    let customerMembershipId!: Id<"memberships">;
    await t.run(async (ctx) => {
      revokedNotificationId = await ctx.db.insert("notifications", {
        orgId: orgA,
        recipientUserId: customerA,
        title: "Private update",
        body: "This must disappear on revocation.",
        type: "project_update",
        isRead: false,
        createdAt: 2,
      });
      const counter = await ctx.db
        .query("notificationCounters")
        .withIndex("by_org_and_user", (index) =>
          index.eq("orgId", orgA).eq("userId", customerA),
        )
        .unique();
      if (!counter) throw new Error("counter fixture missing");
      await ctx.db.patch(counter._id, { unreadCount: 1, updatedAt: 2 });
      const membership = await ctx.db
        .query("memberships")
        .withIndex("by_user_org", (index) =>
          index.eq("userId", customerA).eq("orgId", orgA),
        )
        .unique();
      if (!membership) throw new Error("membership fixture missing");
      customerMembershipId = membership._id;
      await ctx.db.patch(membership._id, { status: "disabled" });
    });
    await expect(
      customer.query(anyApi.notifications.listMine, { orgId: orgA }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      customer.query(anyApi.notifications.getUnreadCount, { orgId: orgA }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      customer.mutation(anyApi.notifications.markAsRead, {
        notificationId: revokedNotificationId,
      }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      customer.mutation(anyApi.notifications.markAllAsRead, { orgId: orgA }),
    ).rejects.toThrow("FORBIDDEN");

    await t.run(async (ctx) => {
      await ctx.db.patch(customerMembershipId, { status: "active" });
      await ctx.db.patch(orgA, { status: "suspended" });
    });
    await expect(
      customer.query(anyApi.notifications.listMine, { orgId: orgA }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      customer.mutation(anyApi.notifications.markAsRead, {
        notificationId: revokedNotificationId,
      }),
    ).rejects.toThrow("FORBIDDEN");
  });

  it("separates content editing from approval and enforces the claims gate", async () => {
    const { t, orgA } = await seed();
    const editor = t.withIdentity(identity("editor-a"));
    const approver = t.withIdentity(identity("approver-a"));
    const claimId = await editor.mutation(anyApi.claims.create, {
      orgId: orgA,
      claimKey: "licensed",
      text: "Licensed contractor",
    });
    const pageId = await editor.mutation(anyApi.cms.createDraft, {
      orgId: orgA,
      slug: "about",
      title: "About",
      content: "We are licensed.",
      claimIds: [claimId],
    });

    await expect(
      editor.mutation(anyApi.cms.updateStatus, { pageId, status: "published" }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      approver.mutation(anyApi.cms.updateStatus, { pageId, status: "published" }),
    ).rejects.toThrow("CLAIMS_VERIFICATION_FAILED");
    await approver.mutation(anyApi.claims.updateStatus, {
      claimId,
      status: "verified",
      notes: "License checked",
    });
    await expect(
      approver.mutation(anyApi.cms.updateStatus, { pageId, status: "published" }),
    ).resolves.toMatchObject({ status: "published" });

    const unverifiedClaimId = await editor.mutation(anyApi.claims.create, {
      orgId: orgA,
      claimKey: "insured",
      text: "Fully insured",
    });
    await expect(
      approver.mutation(anyApi.cms.updateContent, {
        pageId,
        claimIds: [claimId, unverifiedClaimId],
      }),
    ).rejects.toThrow("CLAIMS_VERIFICATION_FAILED");
    await expect(
      approver.mutation(anyApi.claims.updateStatus, {
        claimId: unverifiedClaimId,
        status: "rejected",
        notes: "x".repeat(2_001),
      }),
    ).rejects.toThrow("INVALID_CLAIM_NOTES");

    await expect(
      t.query(anyApi.cms.getPublishedBySlug, { orgId: orgA, slug: "about" }),
    ).resolves.toMatchObject({ _id: pageId, status: "published" });
    await approver.mutation(anyApi.claims.updateStatus, {
      claimId,
      status: "rejected",
      notes: "Verification withdrawn",
    });
    await expect(
      t.query(anyApi.cms.getPublishedBySlug, { orgId: orgA, slug: "about" }),
    ).resolves.toBeNull();
    await expect(
      t.query(anyApi.cms.listPages, { orgId: orgA, status: "published" }),
    ).resolves.toEqual([]);
  });
});

describe("estimate input bounds", () => {
  it("rejects empty, negative, and oversized estimate payloads", async () => {
    const { t, orgA, leadA } = await seed();
    const owner = t.withIdentity(identity("owner-a"));
    await expect(
      owner.mutation(anyApi.estimates.create, {
        leadId: leadA,
        orgId: orgA,
        scope: "   ",
        pricing: 100,
      }),
    ).rejects.toThrow("INVALID_ESTIMATE_SCOPE");
    await expect(
      owner.mutation(anyApi.estimates.create, {
        leadId: leadA,
        orgId: orgA,
        scope: "Valid scope",
        pricing: -1,
      }),
    ).rejects.toThrow("INVALID_ESTIMATE_PRICING");
    await expect(
      owner.mutation(anyApi.estimates.create, {
        leadId: leadA,
        orgId: orgA,
        scope: "Valid scope",
        pricing: { total: -1 },
      }),
    ).rejects.toThrow("INVALID_ESTIMATE_PRICING");
    await expect(
      owner.mutation(anyApi.estimates.create, {
        leadId: leadA,
        orgId: orgA,
        scope: "Valid scope",
        pricing: { details: "x".repeat(100_001) },
      }),
    ).rejects.toThrow("ESTIMATE_PRICING_LIMIT_EXCEEDED");
  });
});

describe("job relationship integrity", () => {
  it("rejects same-tenant customer and property swaps against an estimate", async () => {
    const { t, orgA, leadA } = await seed();
    const owner = t.withIdentity(identity("owner-a"));
    const customerA = await owner.mutation(anyApi.customers.createFromLead, {
      leadId: leadA,
      status: "active",
    });
    let leadB!: Id<"leads">;
    await t.run(async (ctx) => {
      leadB = await ctx.db.insert("leads", {
        orgId: orgA,
        idempotencyKey: "same-org-lead-b",
        fullName: "Same Org Customer B",
        email: "same-org-b@example.com",
        phone: "+15555550133",
        serviceAddress: "303 B Street",
        segment: "residential",
        projectDetails: "Second customer in the same tenant",
        sourcePath: "/estimate",
        contactConsentAt: 1,
        status: "qualified",
        createdAt: 1,
        updatedAt: 1,
      });
    });
    const customerB = await owner.mutation(anyApi.customers.createFromLead, {
      leadId: leadB,
      status: "active",
    });
    const { propertyA, propertyB } = await t.run(async (ctx) => {
      const [propertyA] = await ctx.db
        .query("properties")
        .withIndex("by_org_and_customer", (index) =>
          index.eq("orgId", orgA).eq("customerId", customerA),
        )
        .take(1);
      const [propertyB] = await ctx.db
        .query("properties")
        .withIndex("by_org_and_customer", (index) =>
          index.eq("orgId", orgA).eq("customerId", customerB),
        )
        .take(1);
      if (!propertyA || !propertyB) throw new Error("property fixtures missing");
      return { propertyA: propertyA._id, propertyB: propertyB._id };
    });
    const estimateId = await owner.mutation(anyApi.estimates.create, {
      leadId: leadA,
      orgId: orgA,
      scope: "Customer A scope",
      pricing: 1_000,
      status: "accepted",
    });

    await expect(
      owner.mutation(anyApi.jobs.create, {
        orgId: orgA,
        estimateId,
        customerId: customerB,
        title: "Mismatched customer",
        schedule: "Tomorrow",
      }),
    ).rejects.toThrow("RESOURCE_LINK_MISMATCH");
    await expect(
      owner.mutation(anyApi.jobs.create, {
        orgId: orgA,
        estimateId,
        propertyId: propertyB,
        title: "Mismatched property",
        schedule: "Tomorrow",
      }),
    ).rejects.toThrow("RESOURCE_LINK_MISMATCH");

    const jobId = await owner.mutation(anyApi.jobs.create, {
      orgId: orgA,
      estimateId,
      customerId: customerA,
      propertyId: propertyA,
      title: "Correct relationships",
      schedule: "Tomorrow",
    });
    await expect(
      owner.mutation(anyApi.jobs.update, { jobId, customerId: customerB }),
    ).rejects.toThrow("RESOURCE_LINK_MISMATCH");
    await expect(
      owner.mutation(anyApi.jobs.update, { jobId, propertyId: propertyB }),
    ).rejects.toThrow("RESOURCE_LINK_MISMATCH");
  });

  it("rejects oversized schedule documents", async () => {
    const { t, orgA } = await seed();
    await expect(
      t.withIdentity(identity("owner-a")).mutation(anyApi.jobs.create, {
        orgId: orgA,
        title: "Oversized schedule",
        schedule: { details: "x".repeat(20_001) },
      }),
    ).rejects.toThrow("JOB_SCHEDULE_LIMIT_EXCEEDED");
  });
});
