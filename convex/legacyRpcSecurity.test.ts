/// <reference types="vite/client" />
// @vitest-environment edge-runtime

import { convexTest } from "convex-test";
import { anyApi } from "convex/server";
import { describe, expect, it } from "vitest";
import { createLeadIntakeProof } from "../src/lib/leads/intakeProof";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

function identity(subject: string) {
  const issuer = "https://issuer.example/";
  return {
    subject,
    issuer,
    tokenIdentifier: `${issuer}|${subject}`,
    email: `${subject}@example.com`,
  };
}

async function seedLegacyRpcFixture() {
  const t = convexTest(schema, modules);
  let orgId!: Id<"organizations">;
  let userId!: Id<"users">;
  let leadId!: Id<"leads">;
  let estimateId!: Id<"estimates">;
  let jobId!: Id<"jobs">;

  await t.run(async (ctx) => {
    orgId = await ctx.db.insert("organizations", {
      name: "Security Organization",
      slug: "security-organization",
      status: "active",
    });
    userId = await ctx.db.insert("users", {
      externalId: "security-owner",
      tokenIdentifier: "https://issuer.example/|security-owner",
      identityStatus: "active",
      email: "owner@example.com",
      name: "Security Owner",
      role: "owner",
    });
    await ctx.db.insert("memberships", {
      userId,
      orgId,
      role: "owner",
      status: "active",
    });
    leadId = await ctx.db.insert("leads", {
      idempotencyKey: "legacy-unscoped-lead",
      fullName: "Private Customer",
      email: "private@example.com",
      phone: "+15555550100",
      serviceAddress: "100 Private Way",
      segment: "residential",
      projectDetails: "Private project details",
      sourcePath: "/estimate",
      contactConsentAt: 1,
      status: "qualified",
      createdAt: 1,
      updatedAt: 1,
    });
    estimateId = await ctx.db.insert("estimates", {
      leadId,
      orgId,
      scope: "Private estimate",
      pricing: 12_345,
      status: "accepted",
      createdAt: 1,
    });
    jobId = await ctx.db.insert("jobs", {
      estimateId,
      orgId,
      status: "scheduled",
      schedule: 1,
      crewIds: [],
      createdAt: 1,
    });
  });

  return { t, orgId, userId, leadId, estimateId, jobId };
}

async function seedTenantScopedRpcFixture() {
  const t = convexTest(schema, modules);
  let orgA!: Id<"organizations">;
  let orgB!: Id<"organizations">;
  let ownerA!: Id<"users">;
  let ownerB!: Id<"users">;
  let crewMemberA!: Id<"users">;
  let crewLeadA!: Id<"users">;
  let crewMemberB!: Id<"users">;
  let leadA!: Id<"leads">;
  let leadB!: Id<"leads">;
  let estimateA!: Id<"estimates">;
  let jobA!: Id<"jobs">;

  await t.run(async (ctx) => {
    orgA = await ctx.db.insert("organizations", {
      name: "Organization A",
      slug: "legacy-rpc-a",
      workosOrganizationId: "org_workos_a",
      status: "active",
    });
    orgB = await ctx.db.insert("organizations", {
      name: "Organization B",
      slug: "legacy-rpc-b",
      workosOrganizationId: "org_workos_b",
      status: "active",
    });
    const users = [
      ["owner-a", "owner", orgA],
      ["owner-b", "owner", orgB],
      ["crew-member-a", "crew_member", orgA],
      ["crew-lead-a", "crew_lead", orgA],
      ["crew-member-b", "crew_member", orgB],
    ] as const;
    for (const [externalId, role, orgId] of users) {
      const userId = await ctx.db.insert("users", {
        externalId,
        tokenIdentifier: `https://issuer.example/|${externalId}`,
        identityStatus: "active",
        email: `${externalId}@example.com`,
        name: externalId,
        role,
      });
      await ctx.db.insert("memberships", {
        userId,
        orgId,
        role,
        status: "active",
      });
      if (externalId === "owner-a") ownerA = userId;
      if (externalId === "owner-b") ownerB = userId;
      if (externalId === "crew-member-a") crewMemberA = userId;
      if (externalId === "crew-lead-a") crewLeadA = userId;
      if (externalId === "crew-member-b") crewMemberB = userId;
    }

    const leadInput = {
      idempotencyKey: "scoped-lead",
      fullName: "Scoped Customer",
      email: "scoped@example.com",
      phone: "+15555550101",
      serviceAddress: "101 Scoped Way",
      segment: "residential" as const,
      projectDetails: "Scoped project",
      sourcePath: "/estimate",
      contactConsentAt: 1,
      status: "qualified" as const,
      createdAt: 1,
      updatedAt: 1,
    };
    leadA = await ctx.db.insert("leads", { ...leadInput, orgId: orgA });
    leadB = await ctx.db.insert("leads", {
      ...leadInput,
      orgId: orgB,
      idempotencyKey: "scoped-lead-b",
      email: "scoped-b@example.com",
    });
    estimateA = await ctx.db.insert("estimates", {
      leadId: leadA,
      orgId: orgA,
      scope: "Scoped estimate",
      pricing: 8_000,
      status: "accepted",
      createdAt: 1,
    });
    jobA = await ctx.db.insert("jobs", {
      estimateId: estimateA,
      orgId: orgA,
      status: "scheduled",
      schedule: 1,
      crewIds: [crewMemberA, crewLeadA],
      createdAt: 1,
    });
    for (const userId of [crewMemberA, crewLeadA]) {
      await ctx.db.insert("assignments", {
        orgId: orgA,
        jobId: jobA,
        userId,
        jobStatus: "scheduled",
        jobCreatedAt: 1,
        assignedAt: 1,
      });
    }
    await ctx.db.insert("auditEvents", {
      orgId: orgA,
      actorId: ownerA,
      action: "fixture.created",
      targetResource: leadA,
      timestamp: 1,
    });
  });

  return {
    t,
    orgA,
    ownerA,
    ownerB,
    crewMemberA,
    crewLeadA,
    crewMemberB,
    leadA,
    leadB,
    estimateA,
    jobA,
  };
}

describe("legacy public Convex RPC boundary", () => {
  it("rejects anonymous lead PII reads and writes", async () => {
    const { t, orgId, leadId } = await seedLegacyRpcFixture();
    await expect(t.query(anyApi.leads.get, { leadId })).rejects.toThrow(
      "UNAUTHENTICATED",
    );
    await expect(t.query(anyApi.leads.list, { orgId })).rejects.toThrow(
      "UNAUTHENTICATED",
    );
    await expect(
      t.mutation(anyApi.leads.updateStatus, { leadId, status: "closed" }),
    ).rejects.toThrow("UNAUTHENTICATED");
    await expect(
      t.query(anyApi.leads.search, { orgId, query: "private" }),
    ).rejects.toThrow("UNAUTHENTICATED");
  });

  it("rejects anonymous estimate reads and writes, including stored pricing", async () => {
    const { t, orgId, leadId, estimateId } = await seedLegacyRpcFixture();
    await expect(
      t.mutation(anyApi.estimates.create, {
        leadId,
        orgId,
        scope: "Forged estimate",
        pricing: 1,
      }),
    ).rejects.toThrow();
    await expect(
      t.query(anyApi.estimates.get, { estimateId }),
    ).rejects.toThrow();
    await expect(
      t.query(anyApi.estimates.listByLead, { leadId }),
    ).rejects.toThrow();
    await expect(t.query(anyApi.estimates.list, { orgId })).rejects.toThrow(
      "UNAUTHENTICATED",
    );
    await expect(
      t.mutation(anyApi.estimates.update, { estimateId, pricing: 0 }),
    ).rejects.toThrow();
    await expect(
      t.query(anyApi.estimates.calculateTotal, { estimateId }),
    ).rejects.toThrow();
  });

  it("rejects anonymous job reads, writes, and crew assignment", async () => {
    const { t, orgId, estimateId, jobId, userId } =
      await seedLegacyRpcFixture();
    await expect(
      t.mutation(anyApi.jobs.createFromEstimate, {
        estimateId,
        schedule: 2,
      }),
    ).rejects.toThrow();
    await expect(t.query(anyApi.jobs.get, { jobId })).rejects.toThrow();
    await expect(t.query(anyApi.jobs.list, { orgId })).rejects.toThrow(
      "UNAUTHENTICATED",
    );
    await expect(
      t.mutation(anyApi.jobs.updateStatus, {
        jobId,
        status: "completed",
      }),
    ).rejects.toThrow();
    await expect(
      t.mutation(anyApi.jobs.assignCrew, { jobId, crewIds: [userId] }),
    ).rejects.toThrow();
  });

  it("rejects anonymous audit forgery and enumeration", async () => {
    const { t, orgId, userId } = await seedLegacyRpcFixture();
    await expect(
      t.mutation(anyApi.auditEvents.log, {
        actorId: userId,
        action: "forged.owner_action",
        targetResource: "victim",
      }),
    ).rejects.toThrow();
    await expect(
      t.query(anyApi.auditEvents.listByEntity, {
        orgId,
        targetResource: "victim",
      }),
    ).rejects.toThrow("UNAUTHENTICATED");
    await expect(
      t.query(anyApi.auditEvents.listRecent, { orgId, limit: 10 }),
    ).rejects.toThrow("UNAUTHENTICATED");
  });

  it("allows the right tenant and rejects a valid wrong-tenant owner", async () => {
    const { t, orgA, leadA, leadB, estimateA, jobA } =
      await seedTenantScopedRpcFixture();
    const ownerA = t.withIdentity(identity("owner-a"));
    const ownerB = t.withIdentity(identity("owner-b"));

    await expect(ownerA.query(anyApi.leads.get, { leadId: leadA })).resolves.toMatchObject({
      orgId: orgA,
    });
    await expect(
      ownerA.query(anyApi.estimates.get, { estimateId: estimateA }),
    ).resolves.toMatchObject({ orgId: orgA });
    await expect(ownerA.query(anyApi.jobs.get, { jobId: jobA })).resolves.toMatchObject({
      orgId: orgA,
    });
    await expect(
      ownerA.query(anyApi.auditEvents.listRecent, { orgId: orgA, limit: 10 }),
    ).resolves.toHaveLength(1);

    await expect(ownerB.query(anyApi.leads.get, { leadId: leadA })).rejects.toThrow(
      "FORBIDDEN",
    );
    await expect(ownerA.query(anyApi.leads.get, { leadId: leadB })).rejects.toThrow(
      "FORBIDDEN",
    );
    await expect(
      ownerB.query(anyApi.estimates.get, { estimateId: estimateA }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(ownerB.query(anyApi.jobs.get, { jobId: jobA })).rejects.toThrow(
      "FORBIDDEN",
    );
    await expect(
      ownerB.query(anyApi.auditEvents.listRecent, { orgId: orgA, limit: 10 }),
    ).rejects.toThrow("FORBIDDEN");
  });

  it("fails closed on unscoped legacy leads even for an authenticated owner", async () => {
    const { t, leadId } = await seedLegacyRpcFixture();
    await expect(
      t.withIdentity(identity("security-owner")).query(anyApi.leads.get, {
        leadId,
      }),
    ).rejects.toThrow("LEAD_NOT_FOUND");
  });

  it("enforces job crew role and tenant assignment boundaries", async () => {
    const { t, jobA, crewMemberB } = await seedTenantScopedRpcFixture();
    const crewMember = t.withIdentity(identity("crew-member-a"));
    const crewLead = t.withIdentity(identity("crew-lead-a"));
    const ownerA = t.withIdentity(identity("owner-a"));

    await expect(crewMember.query(anyApi.jobs.get, { jobId: jobA })).resolves.toMatchObject({
      _id: jobA,
    });
    await expect(
      crewMember.mutation(anyApi.jobs.updateStatus, {
        jobId: jobA,
        status: "in_progress",
      }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      crewLead.mutation(anyApi.jobs.updateStatus, {
        jobId: jobA,
        status: "in_progress",
      }),
    ).resolves.toMatchObject({ status: "in_progress" });
    await expect(
      ownerA.mutation(anyApi.jobs.assignCrew, {
        jobId: jobA,
        crewIds: [crewMemberB],
      }),
    ).rejects.toThrow("FORBIDDEN");
  });

  it("keeps anonymous intake tenant-bound and idempotent", async () => {
    const { t, orgA } = await seedTenantScopedRpcFixture();
    const input = {
      workosOrganizationId: "org_workos_a",
      idempotencyKey: "00000000-0000-4000-8000-000000000099",
      fullName: "Public Intake",
      email: "public-intake@example.com",
      phone: "+15555550199",
      segment: "residential" as const,
      serviceAddress: "199 Public Way, Minneapolis MN",
      projectDetails: "Full exterior painting project",
      sourcePath: "/estimate",
      contactConsent: true as const,
    };

    const { contactConsent, ...withoutConsent } = input;
    expect(contactConsent).toBe(true);
    await expect(
      t.action(anyApi.leadActions.submit, {
        ...withoutConsent,
        issuedAt: Date.now(),
        proof: "0".repeat(64),
      }),
    ).rejects.toThrow();
    await expect(
      t.action(anyApi.leadActions.submit, {
        ...withoutConsent,
        contactConsent: false,
        issuedAt: Date.now(),
        proof: "0".repeat(64),
      }),
    ).rejects.toThrow();

    const secret = "local-test-only-lead-intake-secret-32-chars";
    process.env.LEAD_INTAKE_SECRET = secret;
    const issuedAt = Date.now();
    const proof = await createLeadIntakeProof(secret, input, issuedAt);
    await expect(
      t.action(anyApi.leadActions.submit, {
        ...input,
        issuedAt,
        proof: "0".repeat(64),
      }),
    ).rejects.toThrow("INVALID_INTAKE_PROOF");

    const first = await t.action(anyApi.leadActions.submit, {
      ...input,
      issuedAt,
      proof,
    });
    const duplicate = await t.action(anyApi.leadActions.submit, {
      ...input,
      issuedAt,
      proof,
    });
    expect(first.created).toBe(true);
    expect(duplicate).toEqual({ id: first.id, created: false });
    await expect(
      t.withIdentity(identity("owner-a")).query(anyApi.leads.get, {
        leadId: first.id,
      }),
    ).resolves.toMatchObject({ orgId: orgA, email: input.email });
  });

  it("rejects a signed intake for an unknown WorkOS organization", async () => {
    const { t } = await seedTenantScopedRpcFixture();
    const input = {
      workosOrganizationId: "org_workos_unknown",
      idempotencyKey: "00000000-0000-4000-8000-000000000098",
      fullName: "Unknown Tenant",
      email: "unknown-tenant@example.com",
      phone: "+15555550198",
      segment: "residential" as const,
      serviceAddress: "198 Unknown Way, Minneapolis MN",
      projectDetails: "A valid request that must fail tenant resolution.",
      sourcePath: "/estimate",
      contactConsent: true as const,
    };
    const secret = "local-test-only-lead-intake-secret-32-chars";
    process.env.LEAD_INTAKE_SECRET = secret;
    const issuedAt = Date.now();
    const proof = await createLeadIntakeProof(secret, input, issuedAt);

    await expect(
      t.action(anyApi.leadActions.submit, { ...input, issuedAt, proof }),
    ).rejects.toThrow("ORGANIZATION_NOT_FOUND");
  });

  it("caps signed anonymous intake across rotated contact details", async () => {
    const { t, orgA } = await seedTenantScopedRpcFixture();
    const now = Date.now();
    await t.run(async (ctx) => {
      for (let index = 0; index < 100; index += 1) {
        await ctx.db.insert("leads", {
          orgId: orgA,
          idempotencyKey: `seed-${index}`,
          fullName: `Rotated Caller ${index}`,
          email: `rotated-${index}@example.com`,
          phone: `+155500${String(index).padStart(5, "0")}`,
          segment: "residential",
          serviceAddress: `${index} Rotated Way, Minneapolis MN`,
          projectDetails: "A syntactically valid but automated intake request.",
          sourcePath: "/estimate",
          contactConsentAt: now,
          status: "new",
          createdAt: now,
          updatedAt: now,
        });
      }
    });

    const input = {
      workosOrganizationId: "org_workos_a",
      idempotencyKey: "00000000-0000-4000-8000-000000000100",
      fullName: "Rotated Caller 101",
      email: "rotated-101@example.com",
      phone: "+15555550200",
      segment: "residential" as const,
      serviceAddress: "200 Rotated Way, Minneapolis MN",
      projectDetails: "Another syntactically valid automated intake request.",
      contactConsent: true as const,
      sourcePath: "/estimate",
    };
    const secret = "local-test-only-lead-intake-secret-32-chars";
    process.env.LEAD_INTAKE_SECRET = secret;
    const issuedAt = Date.now();
    const proof = await createLeadIntakeProof(secret, input, issuedAt);

    await expect(
      t.action(anyApi.leadActions.submit, { ...input, issuedAt, proof }),
    ).rejects.toThrow("RATE_LIMITED");
  });

  it("allows authorized estimate and job write paths", async () => {
    const { t, orgA, leadA, estimateA, crewMemberA, crewLeadA } =
      await seedTenantScopedRpcFixture();
    const owner = t.withIdentity(identity("owner-a"));
    const estimateId = await owner.mutation(anyApi.estimates.create, {
      leadId: leadA,
      orgId: orgA,
      scope: "Authorized scope",
      pricing: 9_500,
      status: "sent",
    });
    await expect(
      owner.mutation(anyApi.estimates.update, {
        estimateId,
        status: "accepted",
      }),
    ).resolves.toMatchObject({ status: "accepted" });

    const jobId = await owner.mutation(anyApi.jobs.createFromEstimate, {
      estimateId: estimateA,
      schedule: "2026-08-15",
      crewIds: [crewLeadA],
    });
    await expect(
      owner.mutation(anyApi.jobs.assignCrew, {
        jobId,
        crewIds: [crewLeadA, crewMemberA],
      }),
    ).resolves.toMatchObject({ crewIds: [crewLeadA, crewMemberA] });
  });

  it("allows internal audit append and tenant-authorized audit reads", async () => {
    const { t, orgA, ownerA, leadA } = await seedTenantScopedRpcFixture();
    const auditId = await t.mutation(internal.auditEvents.log, {
      orgId: orgA,
      actorId: ownerA,
      action: "lead.reviewed",
      targetResource: leadA,
    });
    const events = await t.withIdentity(identity("owner-a")).query(
      anyApi.auditEvents.listByEntity,
      { orgId: orgA, targetResource: leadA },
    );
    expect(events.map((event: { _id: string }) => event._id)).toContain(auditId);
  });

  it("derives role-aware UI capabilities from the active membership", async () => {
    const { t, orgA } = await seedTenantScopedRpcFixture();
    await t.run(async (ctx) => {
      for (const role of ["estimator", "project_manager"] as const) {
        const externalId = `capability-${role}`;
        const userId = await ctx.db.insert("users", {
          externalId,
          tokenIdentifier: `https://issuer.example/|${externalId}`,
          identityStatus: "active",
          email: `${externalId}@example.com`,
          name: externalId,
          role,
        });
        await ctx.db.insert("memberships", {
          userId,
          orgId: orgA,
          role,
          status: "active",
        });
      }
      const legacyMemberId = await ctx.db.insert("users", {
        externalId: "capability-member",
        tokenIdentifier: "https://issuer.example/|capability-member",
        identityStatus: "active",
        email: "capability-member@example.com",
        name: "Legacy Member",
        role: "customer",
      });
      await ctx.db.insert("memberships", {
        userId: legacyMemberId,
        orgId: orgA,
        role: "member",
        status: "active",
      });
    });

    await expect(
      t.withIdentity(identity("owner-a")).query(anyApi.users.getMyCapabilities, {
        orgId: orgA,
      }),
    ).resolves.toMatchObject({
      canManageLeads: true,
      canReadJobs: true,
      canUpdateJobs: true,
      canReadAudit: true,
    });
    await expect(
      t.withIdentity(identity("capability-estimator")).query(
        anyApi.users.getMyCapabilities,
        { orgId: orgA },
      ),
    ).resolves.toMatchObject({
      canManageLeads: true,
      canReadJobs: true,
      canUpdateJobs: false,
      canReadAudit: false,
    });
    await expect(
      t.withIdentity(identity("capability-project_manager")).query(
        anyApi.users.getMyCapabilities,
        { orgId: orgA },
      ),
    ).resolves.toMatchObject({
      canManageLeads: true,
      canReadJobs: true,
      canUpdateJobs: true,
      canReadAudit: false,
    });
    await expect(
      t.withIdentity(identity("crew-member-a")).query(
        anyApi.users.getMyCapabilities,
        { orgId: orgA },
      ),
    ).resolves.toMatchObject({
      canManageLeads: false,
      canReadJobs: true,
      canUpdateJobs: false,
      canReadAudit: false,
    });
    await expect(
      t.withIdentity(identity("crew-lead-a")).query(
        anyApi.users.getMyCapabilities,
        { orgId: orgA },
      ),
    ).resolves.toMatchObject({ canReadJobs: true, canUpdateJobs: true });
    await expect(
      t.withIdentity(identity("capability-member")).query(
        anyApi.users.getMyCapabilities,
        { orgId: orgA },
      ),
    ).resolves.toEqual({
      role: "member",
      canManageLeads: false,
      canManageEstimates: false,
      canReadJobs: false,
      canUpdateJobs: false,
      canManageJobs: false,
      canManageCrew: false,
      canEditContent: false,
      canPublishContent: false,
      canManageTeam: false,
      canReadAudit: false,
      canManageDocuments: false,
      canAccessCustomerPortal: false,
    });
  });
});
