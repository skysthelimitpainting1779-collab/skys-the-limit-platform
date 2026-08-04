/// <reference types="vite/client" />
// @vitest-environment edge-runtime

import { convexTest } from "convex-test";
import { anyApi } from "convex/server";
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

async function seedTenantFixture() {
  const t = convexTest(schema, modules);
  let orgA!: Id<"organizations">;
  let orgB!: Id<"organizations">;
  let ownerA!: Id<"users">;
  let ownerB!: Id<"users">;
  let crewA!: Id<"users">;
  let crewLeadA!: Id<"users">;
  let jobA!: Id<"jobs">;

  await t.run(async (ctx) => {
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

    ownerA = await ctx.db.insert("users", {
      externalId: "owner-a",
      tokenIdentifier: `${issuer}|owner-a`,
      identityStatus: "active",
      email: "owner-a@example.com",
      name: "Owner A",
      role: "owner",
    });
    ownerB = await ctx.db.insert("users", {
      externalId: "owner-b",
      tokenIdentifier: `${issuer}|owner-b`,
      identityStatus: "active",
      email: "owner-b@example.com",
      name: "Owner B",
      role: "owner",
    });
    crewA = await ctx.db.insert("users", {
      externalId: "crew-a",
      tokenIdentifier: `${issuer}|crew-a`,
      identityStatus: "active",
      email: "crew-a@example.com",
      name: "Crew A",
      role: "crew_member",
    });
    crewLeadA = await ctx.db.insert("users", {
      externalId: "crew-lead-a",
      tokenIdentifier: `${issuer}|crew-lead-a`,
      identityStatus: "active",
      email: "crew-lead-a@example.com",
      name: "Crew Lead A",
      role: "crew_lead",
    });

    await ctx.db.insert("memberships", {
      userId: ownerA,
      orgId: orgA,
      role: "owner",
      status: "active",
    });
    await ctx.db.insert("memberships", {
      userId: ownerB,
      orgId: orgB,
      role: "owner",
      status: "active",
    });
    await ctx.db.insert("memberships", {
      userId: crewA,
      orgId: orgA,
      role: "crew_member",
      status: "active",
    });
    await ctx.db.insert("memberships", {
      userId: crewLeadA,
      orgId: orgA,
      role: "crew_lead",
      status: "active",
    });

    const leadId = await ctx.db.insert("leads", {
      orgId: orgA,
      idempotencyKey: "fixture-lead",
      fullName: "Fixture Customer",
      email: "fixture@example.com",
      phone: "+15555550100",
      serviceAddress: "100 Main Street",
      segment: "residential",
      projectDetails: "Security fixture",
      sourcePath: "/estimate",
      contactConsentAt: 1,
      status: "qualified",
      createdAt: 1,
      updatedAt: 1,
    });
    const estimateId = await ctx.db.insert("estimates", {
      leadId,
      orgId: orgA,
      scope: "Fixture scope",
      pricing: 1_000,
      status: "accepted",
      createdAt: 1,
    });
    jobA = await ctx.db.insert("jobs", {
      estimateId,
      orgId: orgA,
      status: "scheduled",
      schedule: 1,
      crewIds: [crewA, crewLeadA],
      createdAt: 1,
    });
  });

  return { t, orgA, orgB, ownerA, ownerB, crewA, crewLeadA, jobA };
}

describe("checklist authorization and integrity", () => {
  it("rejects anonymous and cross-tenant callers", async () => {
    const { t, jobA } = await seedTenantFixture();
    const args = {
      jobId: jobA,
      title: "Safety",
      items: [{ id: "ppe", text: "Verify PPE", completed: false }],
    };

    await expect(t.mutation(anyApi.checklists.create, args)).rejects.toThrow(
      "UNAUTHENTICATED",
    );
    await expect(
      t.withIdentity(identity("owner-b")).mutation(anyApi.checklists.create, args),
    ).rejects.toThrow("FORBIDDEN");
  });

  it("stores items as child documents and derives completion actor", async () => {
    const { t, jobA, crewA, crewLeadA } = await seedTenantFixture();
    const owner = t.withIdentity(identity("owner-a"));
    const checklistId = await owner.mutation(anyApi.checklists.create, {
      jobId: jobA,
      title: "Safety",
      items: [{ id: "ppe", text: "Verify PPE", completed: false }],
    });

    const stored = await t.run((ctx) => ctx.db.get(checklistId));
    expect(stored).not.toHaveProperty("items");

    const crewMember = t.withIdentity(identity("crew-a"));
    await expect(
      crewMember.query(anyApi.checklists.get, { checklistId }),
    ).resolves.toMatchObject({ title: "Safety" });
    await expect(
      crewMember.mutation(anyApi.checklists.toggleItem, {
        checklistId,
        itemId: "ppe",
      }),
    ).rejects.toThrow("FORBIDDEN");

    const crewLead = t.withIdentity(identity("crew-lead-a"));
    const updated = await crewLead.mutation(anyApi.checklists.toggleItem, {
      checklistId,
      itemId: "ppe",
    });
    expect(updated.items[0]).toMatchObject({
      completed: true,
      completedBy: crewLeadA,
    });

    await expect(
      crewLead.mutation(anyApi.checklists.toggleItem, {
        checklistId,
        itemId: "ppe",
        completedBy: "users_forged",
      }),
    ).rejects.toThrow();
    expect(crewA).not.toBe(crewLeadA);
  });

  it("denies unassigned crew and caps checklist creation", async () => {
    const { t, jobA } = await seedTenantFixture();
    await t.run(async (ctx) => {
      const unassigned = await ctx.db.insert("users", {
        externalId: "crew-unassigned",
        tokenIdentifier: `${issuer}|crew-unassigned`,
        identityStatus: "active",
        email: "crew-unassigned@example.com",
        name: "Unassigned Crew",
        role: "crew_member",
      });
      const job = await ctx.db.get(jobA);
      await ctx.db.insert("memberships", {
        userId: unassigned,
        orgId: job!.orgId,
        role: "crew_member",
        status: "active",
      });
    });

    await expect(
      t.withIdentity(identity("crew-unassigned")).query(
        anyApi.checklists.listByJob,
        { jobId: jobA },
      ),
    ).rejects.toThrow("FORBIDDEN");

    await expect(
      t.withIdentity(identity("owner-a")).mutation(anyApi.checklists.create, {
        jobId: jobA,
        title: "Oversized",
        items: Array.from({ length: 101 }, (_, index) => ({
          id: `item-${index}`,
          text: "Bounded item",
          completed: false,
        })),
      }),
    ).rejects.toThrow("CHECKLIST_ITEM_LIMIT_EXCEEDED");

    const owner = t.withIdentity(identity("owner-a"));
    for (let index = 0; index < 20; index += 1) {
      await owner.mutation(anyApi.checklists.create, {
        jobId: jobA,
        title: `Checklist ${index + 1}`,
        items: [],
      });
    }
    await expect(
      owner.mutation(anyApi.checklists.create, {
        jobId: jobA,
        title: "Checklist 21",
        items: [],
      }),
    ).rejects.toThrow("CHECKLIST_LIMIT_EXCEEDED");
  });
});

describe("document metadata authorization", () => {
  it("revokes direct restricted-file access when crew assignment ends", async () => {
    const { t, orgA, crewA, jobA } = await seedTenantFixture();
    let documentId!: Id<"documents">;
    await t.run(async (ctx) => {
      documentId = await ctx.db.insert("documents", {
        blobUrl: "https://blob.example/revoked-crew",
        blobPathname: `organizations/${orgA}/users/${crewA}/revoked.pdf`,
        name: "Revoked assignment.pdf",
        mimeType: "application/pdf",
        size: 20,
        orgId: orgA,
        uploadedBy: crewA,
        accessLevel: "restricted",
        jobId: jobA,
        createdAt: 1,
      });
      await ctx.db.patch(jobA, { crewIds: [] });
    });

    const revokedCrew = t.withIdentity(identity("crew-a"));
    await expect(
      revokedCrew.query(anyApi.files.getDocument, { documentId }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      revokedCrew.query(internal.files.getAuthorizedBlob, { documentId }),
    ).rejects.toThrow("FORBIDDEN");
  });

  it("exposes only public metadata anonymously", async () => {
    const { t, orgA, ownerA } = await seedTenantFixture();
    let publicId!: Id<"documents">;
    let internalId!: Id<"documents">;

    await t.run(async (ctx) => {
      publicId = await ctx.db.insert("documents", {
        blobUrl: "https://blob.example/public",
        blobPathname: `${orgA}/public.pdf`,
        name: "Public.pdf",
        mimeType: "application/pdf",
        size: 20,
        orgId: orgA,
        uploadedBy: ownerA,
        accessLevel: "public",
        createdAt: 1,
      });
      internalId = await ctx.db.insert("documents", {
        blobUrl: "https://blob.example/internal",
        blobPathname: `${orgA}/internal.pdf`,
        name: "Internal.pdf",
        mimeType: "application/pdf",
        size: 20,
        orgId: orgA,
        uploadedBy: ownerA,
        accessLevel: "internal",
        createdAt: 2,
      });
    });

    await expect(
      t.query(anyApi.files.getDocument, { documentId: publicId }),
    ).resolves.toMatchObject({ name: "Public.pdf", accessLevel: "public" });
    await expect(
      t.query(anyApi.files.getDocument, { documentId: internalId }),
    ).rejects.toThrow("UNAUTHENTICATED");

    const listed = await t.query(anyApi.files.listDocuments, {
      orgId: orgA,
      accessLevel: "public",
      paginationOpts: { numItems: 10, cursor: null },
    });
    expect(listed.page.map((document: { _id: string }) => document._id)).toEqual([
      publicId,
    ]);
    expect(listed.page[0]).not.toHaveProperty("blobUrl");
    expect(listed.page[0]).not.toHaveProperty("blobPathname");
    expect(listed.page[0]).not.toHaveProperty("orgId");
    expect(listed.page[0]).not.toHaveProperty("jobId");
  });

  it("enforces document organization and restricted ownership", async () => {
    const { t, orgA, ownerA, jobA } = await seedTenantFixture();
    let internalId!: Id<"documents">;
    let restrictedId!: Id<"documents">;

    await t.run(async (ctx) => {
      internalId = await ctx.db.insert("documents", {
        blobUrl: "https://blob.example/internal",
        blobPathname: `${orgA}/internal.pdf`,
        name: "Internal.pdf",
        mimeType: "application/pdf",
        size: 20,
        orgId: orgA,
        uploadedBy: ownerA,
        accessLevel: "internal",
        jobId: jobA,
        createdAt: 1,
      });
      restrictedId = await ctx.db.insert("documents", {
        blobUrl: "https://blob.example/restricted",
        blobPathname: `${orgA}/restricted.pdf`,
        name: "Restricted.pdf",
        mimeType: "application/pdf",
        size: 20,
        orgId: orgA,
        uploadedBy: ownerA,
        accessLevel: "restricted",
        createdAt: 2,
      });
    });

    await expect(
      t.withIdentity(identity("owner-b")).query(anyApi.files.getDocument, {
        documentId: internalId,
      }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      t.withIdentity(identity("crew-a")).query(anyApi.files.getDocument, {
        documentId: internalId,
      }),
    ).resolves.toMatchObject({ name: "Internal.pdf" });
    await expect(
      t.withIdentity(identity("crew-a")).query(anyApi.files.getDocument, {
        documentId: restrictedId,
      }),
    ).rejects.toThrow("FORBIDDEN");
  });

  it("separates public publication and deletion authority", async () => {
    const { t, orgA, crewA, jobA } = await seedTenantFixture();
    let publicId!: Id<"documents">;
    let restrictedId!: Id<"documents">;

    await t.run(async (ctx) => {
      for (const [externalId, role] of [
        ["project-manager-a", "project_manager"],
        ["content-editor-a", "content_editor"],
        ["content-approver-a", "content_approver"],
        ["admin-a", "admin"],
      ] as const) {
        const userId = await ctx.db.insert("users", {
          externalId,
          tokenIdentifier: `${issuer}|${externalId}`,
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
        if (externalId === "content-editor-a") {
          publicId = await ctx.db.insert("documents", {
            blobUrl: "https://blob.example/editor-public",
            blobPathname: `${orgA}/editor-public.pdf`,
            name: "Editor public.pdf",
            mimeType: "application/pdf",
            size: 20,
            orgId: orgA,
            uploadedBy: userId,
            accessLevel: "public",
            createdAt: 1,
          });
        }
      }
      restrictedId = await ctx.db.insert("documents", {
        blobUrl: "https://blob.example/crew-restricted",
        blobPathname: `${orgA}/crew-restricted.pdf`,
        name: "Crew restricted.pdf",
        mimeType: "application/pdf",
        size: 20,
        orgId: orgA,
        uploadedBy: crewA,
        accessLevel: "restricted",
        jobId: jobA,
        createdAt: 2,
      });
    });

    for (const externalId of ["project-manager-a", "content-editor-a"]) {
      await expect(
        t.withIdentity(identity(externalId)).query(
          internal.files.authorizeDocumentUpload,
          { orgId: orgA, accessLevel: "public" },
        ),
      ).rejects.toThrow("FORBIDDEN");
    }
    await expect(
      t.withIdentity(identity("content-approver-a")).query(
        internal.files.authorizeDocumentUpload,
        { orgId: orgA, accessLevel: "public" },
      ),
    ).resolves.toMatchObject({
      pathnamePrefix: expect.stringContaining(`organizations/${orgA}/users/`),
    });
    await expect(
      t.withIdentity(identity("content-editor-a")).query(
        internal.files.getDeletableBlob,
        { documentId: publicId },
      ),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      t.withIdentity(identity("crew-a")).query(
        internal.files.getDeletableBlob,
        { documentId: restrictedId },
      ),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      t.withIdentity(identity("admin-a")).query(
        internal.files.getDeletableBlob,
        { documentId: publicId },
      ),
    ).resolves.toMatchObject({ blobUrl: "https://blob.example/editor-public" });
  });
});
