/// <reference types="vite/client" />
// @vitest-environment edge-runtime

import { convexTest } from "convex-test";
import { anyApi } from "convex/server";
import { describe, expect, it } from "vitest";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import schema from "./schema";

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

describe("hostile Convex authorization paths", () => {
  it("rejects anonymous calls to every protected public RPC", async () => {
    const t = convexTest(schema, modules);
    let orgId: Id<"organizations">;
    let userId: Id<"users">;
    let customerId: Id<"customers">;
    let leadId: Id<"leads">;
    let estimateId: Id<"estimates">;
    let jobId: Id<"jobs">;
    let pageId: Id<"cmsPages">;

    await t.run(async (ctx) => {
      orgId = await ctx.db.insert("organizations", {
        name: "Anonymous Boundary Organization",
        slug: "anonymous-boundary-organization",
        status: "active",
      });
      userId = await ctx.db.insert("users", {
        externalId: "anonymous-boundary-owner",
        tokenIdentifier: `${issuerA}|anonymous-boundary-owner`,
        email: "anonymous-boundary-owner@example.com",
        name: "Anonymous Boundary Owner",
        role: "owner",
      });
      await ctx.db.insert("memberships", {
        userId,
        orgId,
        role: "owner",
        status: "active",
      });
      customerId = await ctx.db.insert("customers", {
        orgId,
        fullName: "Boundary Customer",
        email: "boundary-customer@example.com",
        phone: "+15555550100",
        createdAt: 1,
      });
      leadId = await ctx.db.insert("leads", {
        orgId,
        idempotencyKey: "anonymous-boundary-lead",
        fullName: "Boundary Customer",
        email: "boundary-customer@example.com",
        phone: "+15555550100",
        serviceAddress: "100 Boundary Street",
        segment: "residential",
        projectDetails: "Authorization boundary fixture",
        sourcePath: "/estimate",
        contactConsentAt: 1,
        status: "qualified",
        createdAt: 1,
        updatedAt: 1,
      });
      estimateId = await ctx.db.insert("estimates", {
        leadId,
        customerId,
        orgId,
        scope: "Boundary scope",
        pricing: 1_000,
        status: "accepted",
        createdAt: 1,
      });
      jobId = await ctx.db.insert("jobs", {
        estimateId,
        customerId,
        orgId,
        status: "scheduled",
        schedule: 1,
        crewIds: [userId],
        createdAt: 1,
      });
      pageId = await ctx.db.insert("cmsPages", {
        orgId,
        slug: "anonymous-boundary-page",
        routeType: "public",
        title: "Boundary Page",
        summary: "Boundary summary",
        layoutVariant: "default",
        seoTitle: "Boundary Page",
        seoDescription: "Boundary summary",
        canonicalPath: "/anonymous-boundary-page",
        indexable: false,
        status: "draft",
        updatedBy: userId,
        updatedAt: 1,
      });
    });

    const protectedCalls = [
      () => t.query(api.users.get, { userId: userId!, orgId: orgId! }),
      () =>
        t.query(api.users.getByClerkId, {
          externalId: "anonymous-boundary-owner",
        }),
      () => t.mutation(api.users.store, {}),
      () =>
        t.mutation(api.users.updateRole, {
          userId: userId!,
          orgId: orgId!,
          role: "customer",
        }),
      () =>
        t.mutation(api.users.linkCustomer, {
          userId: userId!,
          customerId: customerId!,
          orgId: orgId!,
        }),
      () => t.query(api.users.list, { orgId: orgId! }),
      () => t.query(api.leads.get, { leadId: leadId! }),
      () => t.query(api.leads.list, { orgId: orgId! }),
      () =>
        t.mutation(api.leads.updateStatus, {
          leadId: leadId!,
          status: "contacted",
        }),
      () =>
        t.query(api.leads.search, { orgId: orgId!, query: "Boundary" }),
      () =>
        t.mutation(api.estimates.create, {
          leadId: leadId!,
          orgId: orgId!,
          scope: "Anonymous scope",
          pricing: 1,
        }),
      () => t.query(api.estimates.get, { estimateId: estimateId! }),
      () => t.query(api.estimates.listByLead, { leadId: leadId! }),
      () => t.query(api.estimates.list, { orgId: orgId! }),
      () =>
        t.mutation(api.estimates.update, {
          estimateId: estimateId!,
          status: "sent",
        }),
      () =>
        t.mutation(api.jobs.createFromEstimate, {
          estimateId: estimateId!,
          schedule: 2,
        }),
      () => t.query(api.jobs.get, { jobId: jobId! }),
      () => t.query(api.jobs.list, { orgId: orgId! }),
      () =>
        t.mutation(api.jobs.updateStatus, {
          jobId: jobId!,
          status: "in_progress",
        }),
      () =>
        t.mutation(api.jobs.assignCrew, {
          jobId: jobId!,
          crewIds: [userId!],
        }),
      () =>
        t.query(api.auditEvents.listByEntity, {
          orgId: orgId!,
          targetResource: jobId!,
        }),
      () => t.query(api.auditEvents.listRecent, { orgId: orgId! }),
      () =>
        t.query(api.portals.getOperationsOverview, { orgId: orgId! }),
      () =>
        t.query(api.portals.listOperationsLeads, { orgId: orgId! }),
      () => t.query(api.portals.getCustomerOverview, {}),
      () => t.query(api.portals.getCrewTodayAssignments, {}),
      () =>
        t.mutation(api.portals.submitChecklistProgress, {
          jobId: jobId!,
          category: "safety",
          items: [],
        }),
      () => t.query(api.cms.listCmsPages, { orgId: orgId! }),
      () =>
        t.mutation(api.cms.updateCmsPageDraft, {
          pageId: pageId!,
          orgId: orgId!,
          slug: "anonymous-boundary-page",
          title: "Boundary Page",
          summary: "Boundary summary",
          layoutVariant: "default",
          seoTitle: "Boundary Page",
          seoDescription: "Boundary summary",
        }),
      () => t.mutation(api.cms.publishCmsPage, { pageId: pageId! }),
    ];

    for (const call of protectedCalls) {
      await expect(call()).rejects.toThrow("UNAUTHENTICATED");
    }

    await expect(
      t.mutation(anyApi.auditEvents.log, {
        orgId: orgId!,
        actorId: "forged-owner",
        action: "forged.audit.event",
        targetResource: "organizations/forged",
      }),
    ).rejects.toThrow();
  });

  it("does not bind a Convex user through subject alone across issuers", async () => {
    const t = convexTest(schema, modules);
    let orgId: Id<"organizations">;

    await t.run(async (ctx) => {
      const userId = await ctx.db.insert("users", {
        externalId: "shared-subject",
        tokenIdentifier: `${issuerA}|shared-subject`,
        email: "shared-subject@example.com",
        name: "Issuer A User",
        role: "owner",
      });
      orgId = await ctx.db.insert("organizations", {
        name: "Issuer A Organization",
        slug: "issuer-a-org",
        status: "active",
      });
      await ctx.db.insert("memberships", {
        userId,
        orgId,
        role: "owner",
        status: "active",
      });
    });

    const issuerBCollision = t.withIdentity(identity("shared-subject", issuerB));

    await expect(
      issuerBCollision.query(api.portals.getOperationsOverview, {
        orgId: orgId!,
      }),
    ).rejects.toThrow("USER_NOT_PROVISIONED");
  });

  it("does not claim an unlinked customer through mutable profile email", async () => {
    const t = convexTest(schema, modules);
    let customerId: Id<"customers">;

    await t.run(async (ctx) => {
      const userId = await ctx.db.insert("users", {
        externalId: "attacker",
        tokenIdentifier: `${issuerA}|attacker`,
        email: "victim@example.com",
        name: "Attacker",
        role: "customer",
      });
      const orgId = await ctx.db.insert("organizations", {
        name: "Victim Organization",
        slug: "victim-org",
        status: "active",
      });
      customerId = await ctx.db.insert("customers", {
        orgId,
        fullName: "Victim Customer",
        email: "victim@example.com",
        phone: "+15555550100",
        createdAt: 1,
      });

      expect(userId).toBeDefined();
    });

    const attacker = t.withIdentity({
      ...identity("attacker"),
      email: "victim@example.com",
    });
    const result = await attacker.query(api.portals.getCustomerOverview, {});

    expect(result.customer).toBeNull();
    expect(result.estimates).toEqual([]);
    expect(result.jobs).toEqual([]);
    expect(result.documents).toEqual([]);
    expect(customerId!).toBeDefined();
  });

  it("requires the target membership role and active organization for CMS publishing", async () => {
    const t = convexTest(schema, modules);
    let pageId: Id<"cmsPages">;

    await t.run(async (ctx) => {
      const userId = await ctx.db.insert("users", {
        externalId: "global-publisher",
        tokenIdentifier: `${issuerA}|global-publisher`,
        email: "publisher@example.com",
        name: "Global Publisher",
        role: "content_approver",
      });
      const orgId = await ctx.db.insert("organizations", {
        name: "Target Organization",
        slug: "target-org",
        status: "active",
      });
      await ctx.db.insert("memberships", {
        userId,
        orgId,
        role: "customer",
        status: "active",
      });
      pageId = await ctx.db.insert("cmsPages", {
        orgId,
        slug: "sensitive-page",
        routeType: "public",
        title: "Sensitive Page",
        summary: "Draft",
        layoutVariant: "default",
        seoTitle: "Sensitive Page",
        seoDescription: "Draft",
        canonicalPath: "/sensitive-page",
        indexable: false,
        status: "draft",
        updatedBy: userId,
        updatedAt: 1,
      });
    });

    const lowPrivilegeMember = t.withIdentity(identity("global-publisher"));

    await expect(
      lowPrivilegeMember.mutation(api.cms.publishCmsPage, { pageId: pageId! }),
    ).rejects.toThrow("FORBIDDEN");
  });

  it("scopes operations reads to an explicitly authorized organization", async () => {
    const t = convexTest(schema, modules);
    let orgA: Id<"organizations">;
    let orgB: Id<"organizations">;

    await t.run(async (ctx) => {
      const userId = await ctx.db.insert("users", {
        externalId: "tenant-owner",
        tokenIdentifier: `${issuerA}|tenant-owner`,
        email: "tenant-owner@example.com",
        name: "Tenant Owner",
        role: "owner",
      });
      orgA = await ctx.db.insert("organizations", {
        name: "Organization A",
        slug: "organization-a",
        status: "active",
      });
      orgB = await ctx.db.insert("organizations", {
        name: "Organization B",
        slug: "organization-b",
        status: "active",
      });
      await ctx.db.insert("memberships", {
        userId,
        orgId: orgA,
        role: "owner",
        status: "active",
      });

      for (const [orgId, fullName] of [
        [orgA, "Organization A Lead"],
        [orgB, "Organization B Lead"],
      ] as const) {
        await ctx.db.insert("leads", {
          orgId,
          idempotencyKey: `key-${fullName}`,
          fullName,
          email: `${orgId}@example.com`,
          phone: "+15555550111",
          serviceAddress: "100 Main Street",
          segment: "residential",
          projectDetails: "Exterior repaint",
          sourcePath: "/estimate",
          contactConsentAt: 1,
          status: "new",
          createdAt: 1,
          updatedAt: 1,
        });
      }
    });

    const owner = t.withIdentity(identity("tenant-owner"));
    const orgALeads = await owner.query(api.portals.listOperationsLeads, {
      orgId: orgA!,
    });

    expect(orgALeads.map((lead) => lead.fullName)).toEqual([
      "Organization A Lead",
    ]);
    await expect(
      owner.query(api.portals.listOperationsLeads, { orgId: orgB! }),
    ).rejects.toThrow("FORBIDDEN");
  });

  it("rejects CMS publication for a suspended organization", async () => {
    const t = convexTest(schema, modules);
    let pageId: Id<"cmsPages">;

    await t.run(async (ctx) => {
      const userId = await ctx.db.insert("users", {
        externalId: "suspended-publisher",
        tokenIdentifier: `${issuerA}|suspended-publisher`,
        email: "suspended-publisher@example.com",
        name: "Suspended Publisher",
        role: "content_approver",
      });
      const orgId = await ctx.db.insert("organizations", {
        name: "Suspended Organization",
        slug: "suspended-organization",
        status: "suspended",
      });
      await ctx.db.insert("memberships", {
        userId,
        orgId,
        role: "content_approver",
        status: "active",
      });
      pageId = await ctx.db.insert("cmsPages", {
        orgId,
        slug: "suspended-page",
        routeType: "public",
        title: "Suspended Page",
        summary: "Draft",
        layoutVariant: "default",
        seoTitle: "Suspended Page",
        seoDescription: "Draft",
        canonicalPath: "/suspended-page",
        indexable: false,
        status: "published",
        updatedBy: userId,
        updatedAt: 1,
        publishedAt: 1,
      });
    });

    const publisher = t.withIdentity(identity("suspended-publisher"));
    await expect(
      publisher.mutation(api.cms.publishCmsPage, { pageId: pageId! }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      t.query(api.cms.getPublishedPage, { slug: "suspended-page" }),
    ).resolves.toBeNull();
  });

  it("does not translate signed WorkOS role claims into Convex grants", async () => {
    const t = convexTest(schema, modules);
    let orgId: Id<"organizations">;

    await t.run(async (ctx) => {
      orgId = await ctx.db.insert("organizations", {
        externalId: "org_workos_123",
        name: "WorkOS Organization",
        slug: "workos-organization",
        status: "active",
      });
    });

    await t.mutation(internal.auth.authKitEvent, {
      event: "user.created",
      data: {
        id: "workos-owner",
        email: "workos-owner@example.com",
        firstName: "WorkOS",
        lastName: "Owner",
        profilePictureUrl: null,
      },
    });

    const workOSOwner = t.withIdentity({
      subject: "workos-owner",
      issuer: issuerA,
      tokenIdentifier: `${issuerA}|workos-owner`,
      sid: "session_workos_owner",
      org_id: "org_workos_123",
      role: "owner",
      permissions: [],
    });
    const userId = await workOSOwner.mutation(api.users.store, {});

    const provisioned = await t.run(async (ctx) => ({
      user: await ctx.db.get(userId),
      membership: await ctx.db
        .query("memberships")
        .withIndex("by_user_org", (query) =>
          query.eq("userId", userId).eq("orgId", orgId!),
        )
        .unique(),
    }));

    expect(provisioned.user?.tokenIdentifier).toBe(
      `${issuerA}|workos-owner`,
    );
    expect(provisioned.user?.role).toBe("customer");
    expect(provisioned.membership).toBeNull();

    await expect(
      workOSOwner.query(api.portals.getOperationsOverview, { orgId: orgId! }),
    ).rejects.toThrow("FORBIDDEN");

    await t.mutation(internal.users.provisionMembership, {
      actorId: "operator:security-bootstrap",
      userId,
      orgId: orgId!,
      role: "owner",
      status: "active",
    });

    await expect(
      workOSOwner.query(api.portals.getOperationsOverview, { orgId: orgId! }),
    ).resolves.toMatchObject({ countsCapped: false });
  });

  it("self-provisions an ordinary identity as customer and rejects caller role input", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(internal.auth.authKitEvent, {
      event: "user.created",
      data: {
        id: "ordinary-customer",
        email: "ordinary-customer@example.com",
        firstName: "Ordinary",
        lastName: "Customer",
        profilePictureUrl: null,
      },
    });
    const customer = t.withIdentity({
      subject: "ordinary-customer",
      issuer: issuerA,
      tokenIdentifier: `${issuerA}|ordinary-customer`,
      sid: "session_ordinary_customer",
      permissions: [],
    });

    const userId = await customer.mutation(api.users.store, {});
    await t.run((ctx) =>
      ctx.db.patch(userId, { phone: "+15555550119" }),
    );
    await t.mutation(internal.auth.authKitEvent, {
      event: "user.updated",
      data: {
        id: "ordinary-customer",
        email: "updated-customer@example.com",
        firstName: "Updated",
        lastName: "Customer",
        profilePictureUrl: null,
      },
    });
    await customer.mutation(api.users.store, {});
    const user = await t.run((ctx) => ctx.db.get(userId));
    expect(user?.role).toBe("customer");
    expect(user?.phone).toBe("+15555550119");
    expect(user?.email).toBe("updated-customer@example.com");
    expect(user?.name).toBe("Updated Customer");

    await expect(
      customer.mutation(anyApi.users.store, {
        name: "Ordinary Customer",
        role: "owner",
      }),
    ).rejects.toThrow();

    await t.mutation(internal.auth.authKitEvent, {
      event: "user.deleted",
      data: { id: "ordinary-customer" },
    });
    await expect(customer.mutation(api.users.store, {})).rejects.toThrow(
      "USER_DISABLED",
    );
  });

  it("returns records for an exactly linked customer and excludes other customers", async () => {
    const t = convexTest(schema, modules);
    let ownEstimateId: Id<"estimates">;
    let mismatchedEstimateId: Id<"estimates">;

    await t.run(async (ctx) => {
      const orgId = await ctx.db.insert("organizations", {
        name: "Customer Organization",
        slug: "customer-organization",
        status: "active",
      });
      const otherOrgId = await ctx.db.insert("organizations", {
        name: "Other Customer Organization",
        slug: "other-customer-organization",
        status: "active",
      });
      const userId = await ctx.db.insert("users", {
        externalId: "linked-customer",
        tokenIdentifier: `${issuerA}|linked-customer`,
        email: "linked@example.com",
        name: "Linked Customer",
        role: "customer",
      });
      const ownCustomerId = await ctx.db.insert("customers", {
        orgId,
        userId,
        fullName: "Linked Customer",
        email: "linked@example.com",
        phone: "+15555550121",
        createdAt: 1,
      });
      const otherCustomerId = await ctx.db.insert("customers", {
        orgId,
        fullName: "Other Customer",
        email: "other@example.com",
        phone: "+15555550122",
        createdAt: 1,
      });
      const leadId = await ctx.db.insert("leads", {
        orgId,
        idempotencyKey: "linked-customer-lead",
        fullName: "Linked Customer",
        email: "linked@example.com",
        phone: "+15555550121",
        serviceAddress: "121 Main Street",
        segment: "residential",
        projectDetails: "Interior repaint",
        sourcePath: "/estimate",
        contactConsentAt: 1,
        status: "qualified",
        createdAt: 1,
        updatedAt: 1,
      });
      ownEstimateId = await ctx.db.insert("estimates", {
        leadId,
        customerId: ownCustomerId,
        orgId,
        scope: "Linked scope",
        pricing: 1_500,
        status: "sent",
        createdAt: 1,
      });
      await ctx.db.insert("estimates", {
        leadId,
        customerId: otherCustomerId,
        orgId,
        scope: "Other scope",
        pricing: 9_999,
        status: "sent",
        createdAt: 1,
      });
      mismatchedEstimateId = await ctx.db.insert("estimates", {
        leadId,
        customerId: ownCustomerId,
        orgId: otherOrgId,
        scope: "Cross-organization legacy mismatch",
        pricing: 25_000,
        status: "sent",
        createdAt: 1,
      });
      await ctx.db.insert("documents", {
        orgId,
        customerId: ownCustomerId,
        title: "Own proposal",
        category: "proposal",
        fileUrl: "https://files.example/own",
        createdAt: 1,
      });
      await ctx.db.insert("documents", {
        orgId: otherOrgId,
        customerId: ownCustomerId,
        title: "Cross-organization legacy document",
        category: "proposal",
        fileUrl: "https://files.example/cross-organization",
        createdAt: 1,
      });
    });

    const linkedCustomer = t.withIdentity(identity("linked-customer"));
    const overview = await linkedCustomer.query(
      api.portals.getCustomerOverview,
      {},
    );

    expect(overview.customer?.userId).toBeDefined();
    expect(overview.estimates.map((estimate) => estimate._id)).toEqual([
      ownEstimateId!,
    ]);
    expect(overview.documents).toHaveLength(1);
    await expect(
      linkedCustomer.query(api.estimates.get, {
        estimateId: mismatchedEstimateId!,
      }),
    ).rejects.toThrow("FORBIDDEN");
  });

  it("denies direct customer records when the organization is suspended", async () => {
    const t = convexTest(schema, modules);
    let estimateId: Id<"estimates">;
    let jobId: Id<"jobs">;

    await t.run(async (ctx) => {
      const orgId = await ctx.db.insert("organizations", {
        name: "Suspended Customer Organization",
        slug: "suspended-customer-organization",
        status: "suspended",
      });
      const userId = await ctx.db.insert("users", {
        externalId: "suspended-customer",
        tokenIdentifier: `${issuerA}|suspended-customer`,
        email: "suspended-customer@example.com",
        name: "Suspended Customer",
        role: "customer",
      });
      const customerId = await ctx.db.insert("customers", {
        orgId,
        userId,
        fullName: "Suspended Customer",
        email: "suspended-customer@example.com",
        phone: "+15555550129",
        createdAt: 1,
      });
      const leadId = await ctx.db.insert("leads", {
        orgId,
        idempotencyKey: "suspended-customer-lead",
        fullName: "Suspended Customer",
        email: "suspended-customer@example.com",
        phone: "+15555550129",
        serviceAddress: "129 Suspended Street",
        segment: "residential",
        projectDetails: "Suspended customer fixture",
        sourcePath: "/estimate",
        contactConsentAt: 1,
        status: "qualified",
        createdAt: 1,
        updatedAt: 1,
      });
      estimateId = await ctx.db.insert("estimates", {
        leadId,
        customerId,
        orgId,
        scope: "Suspended scope",
        pricing: 2_500,
        status: "sent",
        createdAt: 1,
      });
      jobId = await ctx.db.insert("jobs", {
        estimateId,
        customerId,
        orgId,
        status: "scheduled",
        schedule: 1,
        crewIds: [],
        createdAt: 1,
      });
    });

    const suspendedCustomer = t.withIdentity(identity("suspended-customer"));
    await expect(
      suspendedCustomer.query(api.estimates.get, { estimateId: estimateId! }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      suspendedCustomer.query(api.jobs.get, { jobId: jobId! }),
    ).rejects.toThrow("FORBIDDEN");
  });

  it("allows assigned active crew and denies unassigned job updates", async () => {
    const t = convexTest(schema, modules);
    let assignedJobId: Id<"jobs">;
    let unassignedJobId: Id<"jobs">;

    await t.run(async (ctx) => {
      const orgId = await ctx.db.insert("organizations", {
        name: "Crew Organization",
        slug: "crew-organization",
        status: "active",
      });
      const userId = await ctx.db.insert("users", {
        externalId: "crew-user",
        tokenIdentifier: `${issuerA}|crew-user`,
        email: "crew-user@example.com",
        name: "Crew User",
        role: "crew_member",
      });
      await ctx.db.insert("memberships", {
        userId,
        orgId,
        role: "crew_member",
        status: "active",
      });
      const estimatorId = await ctx.db.insert("users", {
        externalId: "job-estimator",
        tokenIdentifier: `${issuerA}|job-estimator`,
        email: "job-estimator@example.com",
        name: "Job Estimator",
        role: "estimator",
      });
      await ctx.db.insert("memberships", {
        userId: estimatorId,
        orgId,
        role: "estimator",
        status: "active",
      });
      const leadId = await ctx.db.insert("leads", {
        orgId,
        idempotencyKey: "crew-job-lead",
        fullName: "Crew Job Customer",
        email: "crew-job-customer@example.com",
        phone: "+15555550123",
        serviceAddress: "123 Crew Street",
        segment: "residential",
        projectDetails: "Crew authorization fixture",
        sourcePath: "/estimate",
        contactConsentAt: 1,
        status: "qualified",
        createdAt: 1,
        updatedAt: 1,
      });
      const estimateId = await ctx.db.insert("estimates", {
        leadId,
        orgId,
        scope: "Crew scope",
        pricing: 500,
        status: "accepted",
        createdAt: 1,
      });
      assignedJobId = await ctx.db.insert("jobs", {
        estimateId,
        orgId,
        status: "scheduled",
        schedule: 1,
        crewIds: [userId],
        createdAt: 1,
      });
      unassignedJobId = await ctx.db.insert("jobs", {
        estimateId,
        orgId,
        status: "scheduled",
        schedule: 1,
        crewIds: [],
        createdAt: 1,
      });
    });

    const crew = t.withIdentity(identity("crew-user"));
    const assignments = await crew.query(
      api.portals.getCrewTodayAssignments,
      {},
    );
    expect(assignments.map((job) => job._id)).toEqual([assignedJobId!]);

    await expect(
      crew.mutation(api.jobs.updateStatus, {
        jobId: assignedJobId!,
        status: "in_progress",
      }),
    ).resolves.toMatchObject({ status: "in_progress" });
    await expect(
      crew.mutation(api.jobs.updateStatus, {
        jobId: unassignedJobId!,
        status: "in_progress",
      }),
    ).rejects.toThrow("FORBIDDEN");

    const estimator = t.withIdentity(identity("job-estimator"));
    await expect(
      estimator.query(api.jobs.get, { jobId: assignedJobId! }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      estimator.query(api.jobs.list, { orgId: assignments[0].orgId }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      estimator.mutation(api.jobs.updateStatus, {
        jobId: assignedJobId!,
        status: "completed",
      }),
    ).rejects.toThrow("FORBIDDEN");
  });

  it("allows operations changes only inside the actor organization", async () => {
    const t = convexTest(schema, modules);
    let orgA: Id<"organizations">;
    let orgB: Id<"organizations">;
    let leadA: Id<"leads">;
    let leadB: Id<"leads">;

    await t.run(async (ctx) => {
      const ownerId = await ctx.db.insert("users", {
        externalId: "operations-owner",
        tokenIdentifier: `${issuerA}|operations-owner`,
        email: "operations-owner@example.com",
        name: "Operations Owner",
        role: "owner",
      });
      orgA = await ctx.db.insert("organizations", {
        name: "Operations A",
        slug: "operations-a",
        status: "active",
      });
      orgB = await ctx.db.insert("organizations", {
        name: "Operations B",
        slug: "operations-b",
        status: "active",
      });
      await ctx.db.insert("memberships", {
        userId: ownerId,
        orgId: orgA,
        role: "owner",
        status: "active",
      });
      const insertLead = (orgId: Id<"organizations">, suffix: string) =>
        ctx.db.insert("leads", {
          orgId,
          idempotencyKey: `operations-${suffix}`,
          fullName: `Lead ${suffix}`,
          email: `lead-${suffix}@example.com`,
          phone: "+15555550131",
          serviceAddress: "131 Main Street",
          segment: "commercial" as const,
          projectDetails: "Commercial repaint",
          sourcePath: "/estimate",
          contactConsentAt: 1,
          status: "qualified" as const,
          createdAt: 1,
          updatedAt: 1,
        });
      leadA = await insertLead(orgA, "a");
      leadB = await insertLead(orgB, "b");
    });

    const owner = t.withIdentity(identity("operations-owner"));
    await expect(
      owner.mutation(api.estimates.create, {
        leadId: leadA!,
        orgId: orgA!,
        scope: "Authorized scope",
        pricing: 2_000,
      }),
    ).resolves.toBeDefined();
    await expect(
      owner.mutation(api.estimates.create, {
        leadId: leadB!,
        orgId: orgB!,
        scope: "Cross-tenant scope",
        pricing: 2_000,
      }),
    ).rejects.toThrow("FORBIDDEN");
  });

  it("allows owners to manage membership roles but prevents admin owner grants", async () => {
    const t = convexTest(schema, modules);
    let orgId: Id<"organizations">;
    let targetId: Id<"users">;

    await t.run(async (ctx) => {
      orgId = await ctx.db.insert("organizations", {
        name: "Role Organization",
        slug: "role-organization",
        status: "active",
      });
      for (const [subject, role] of [
        ["role-owner", "owner"],
        ["role-admin", "admin"],
        ["role-target", "staff"],
      ] as const) {
        const userId = await ctx.db.insert("users", {
          externalId: subject,
          tokenIdentifier: `${issuerA}|${subject}`,
          email: `${subject}@example.com`,
          name: subject,
          role,
        });
        await ctx.db.insert("memberships", {
          userId,
          orgId,
          role,
          status: "active",
        });
        if (subject === "role-target") targetId = userId;
      }
    });

    const owner = t.withIdentity(identity("role-owner"));
    await expect(
      owner.mutation(api.users.updateRole, {
        userId: targetId!,
        orgId: orgId!,
        role: "estimator",
      }),
    ).resolves.toMatchObject({ role: "estimator" });

    const admin = t.withIdentity(identity("role-admin"));
    await expect(
      admin.mutation(api.users.updateRole, {
        userId: targetId!,
        orgId: orgId!,
        role: "owner",
      }),
    ).rejects.toThrow("FORBIDDEN");
  });

  it("creates tenant-owned public leads only for active organizations", async () => {
    const t = convexTest(schema, modules);
    let activeOrgId: Id<"organizations">;
    let suspendedOrgId: Id<"organizations">;

    await t.run(async (ctx) => {
      activeOrgId = await ctx.db.insert("organizations", {
        name: "Active Intake",
        slug: "active-intake",
        status: "active",
      });
      suspendedOrgId = await ctx.db.insert("organizations", {
        name: "Suspended Intake",
        slug: "suspended-intake",
        status: "suspended",
      });
    });

    const leadInput = {
      idempotencyKey: "00000000-0000-4000-8000-000000000101",
      fullName: "Public Lead",
      email: "public-lead@example.com",
      phone: "+15555550141",
      segment: "residential" as const,
      serviceAddress: "141 Main Street, Minneapolis, MN",
      projectDetails: "Full exterior repaint with preparation",
      sourcePath: "/estimate",
    };

    const created = await t.mutation(api.leads.create, {
      ...leadInput,
      orgId: activeOrgId!,
    });
    const stored = await t.run((ctx) => ctx.db.get(created.id));
    expect(stored?.orgId).toBe(activeOrgId!);
    await expect(
      t.query(api.estimates.calculateTotal, {
        pricing: { labor: 750, materials: 250 },
      }),
    ).resolves.toBe(1_000);
    await expect(t.query(api.cms.getPublishedServices, {})).resolves.toEqual(
      [],
    );
    await expect(t.query(api.cms.getPublishedProjects, {})).resolves.toEqual(
      [],
    );

    await expect(
      t.mutation(api.leads.create, {
        ...leadInput,
        idempotencyKey: "00000000-0000-4000-8000-000000000102",
        orgId: suspendedOrgId!,
      }),
    ).rejects.toThrow("FORBIDDEN");
  });

  it("allows only owner/admin audit reads within the authorized organization", async () => {
    const t = convexTest(schema, modules);
    let orgId: Id<"organizations">;
    let ownerId: Id<"users">;

    await t.run(async (ctx) => {
      orgId = await ctx.db.insert("organizations", {
        name: "Audit Organization",
        slug: "audit-organization",
        status: "active",
      });
      for (const [subject, role] of [
        ["audit-owner", "owner"],
        ["audit-customer", "customer"],
      ] as const) {
        const userId = await ctx.db.insert("users", {
          externalId: subject,
          tokenIdentifier: `${issuerA}|${subject}`,
          email: `${subject}@example.com`,
          name: subject,
          role,
        });
        await ctx.db.insert("memberships", {
          userId,
          orgId,
          role,
          status: "active",
        });
        if (subject === "audit-owner") ownerId = userId;
      }
    });

    await t.mutation(internal.auditEvents.log, {
      orgId: orgId!,
      actorId: ownerId!,
      action: "authorized.audit.event",
      targetResource: "jobs/authorized",
    });

    const owner = t.withIdentity(identity("audit-owner"));
    await expect(
      owner.query(api.auditEvents.listRecent, { orgId: orgId! }),
    ).resolves.toHaveLength(1);

    const customer = t.withIdentity(identity("audit-customer"));
    await expect(
      customer.query(api.auditEvents.listRecent, { orgId: orgId! }),
    ).rejects.toThrow("FORBIDDEN");
  });

  it("keeps legacy leads without tenant ownership inaccessible", async () => {
    const t = convexTest(schema, modules);
    let legacyLeadId: Id<"leads">;

    await t.run(async (ctx) => {
      const ownerId = await ctx.db.insert("users", {
        externalId: "legacy-owner",
        tokenIdentifier: `${issuerA}|legacy-owner`,
        email: "legacy-owner@example.com",
        name: "Legacy Owner",
        role: "owner",
      });
      const orgId = await ctx.db.insert("organizations", {
        name: "Legacy Organization",
        slug: "legacy-organization",
        status: "active",
      });
      await ctx.db.insert("memberships", {
        userId: ownerId,
        orgId,
        role: "owner",
        status: "active",
      });
      legacyLeadId = await ctx.db.insert("leads", {
        idempotencyKey: "legacy-unscoped",
        fullName: "Legacy Lead",
        email: "legacy-lead@example.com",
        phone: "+15555550151",
        serviceAddress: "151 Main Street",
        segment: "residential",
        projectDetails: "Legacy unscoped record",
        sourcePath: "/estimate",
        contactConsentAt: 1,
        status: "new",
        createdAt: 1,
        updatedAt: 1,
      });
    });

    const owner = t.withIdentity(identity("legacy-owner"));
    await expect(
      owner.query(api.leads.get, { leadId: legacyLeadId! }),
    ).rejects.toThrow("LEAD_NOT_FOUND");
  });

  it("preserves legitimate CMS draft and publish behavior for target roles", async () => {
    const t = convexTest(schema, modules);
    let orgId: Id<"organizations">;

    await t.run(async (ctx) => {
      orgId = await ctx.db.insert("organizations", {
        name: "CMS Organization",
        slug: "cms-organization",
        status: "active",
      });
      for (const [subject, role] of [
        ["cms-editor", "content_editor"],
        ["cms-publisher", "content_approver"],
      ] as const) {
        const userId = await ctx.db.insert("users", {
          externalId: subject,
          tokenIdentifier: `${issuerA}|${subject}`,
          email: `${subject}@example.com`,
          name: subject,
          role,
        });
        await ctx.db.insert("memberships", {
          userId,
          orgId,
          role,
          status: "active",
        });
      }
    });

    const editor = t.withIdentity(identity("cms-editor"));
    const pageId = await editor.mutation(api.cms.updateCmsPageDraft, {
      orgId: orgId!,
      slug: "authorized-page",
      title: "Authorized Page",
      summary: "Authorized summary",
      layoutVariant: "default",
      seoTitle: "Authorized Page",
      seoDescription: "Authorized summary",
    });

    const publisher = t.withIdentity(identity("cms-publisher"));
    await expect(
      publisher.mutation(api.cms.publishCmsPage, { pageId }),
    ).resolves.toMatchObject({ success: true });
    await expect(
      t.query(api.cms.getPublishedPage, { slug: "authorized-page" }),
    ).resolves.toMatchObject({
      page: { _id: pageId, title: "Authorized Page", status: "published" },
    });
  });
});
