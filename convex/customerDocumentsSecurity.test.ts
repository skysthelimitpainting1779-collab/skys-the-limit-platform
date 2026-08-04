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

async function seedCustomerDocuments() {
  const t = convexTest(schema, modules);
  const ids = {} as {
    allowed: Id<"documents">;
    crossOrg: Id<"documents">;
    customerA: Id<"customers">;
    customerB: Id<"customers">;
    internal: Id<"documents">;
    jobA: Id<"jobs">;
    orgA: Id<"organizations">;
    orgB: Id<"organizations">;
    otherCustomer: Id<"documents">;
    restricted: Id<"documents">;
    unbound: Id<"documents">;
  };

  await t.run(async (ctx) => {
    ids.orgA = await ctx.db.insert("organizations", {
      name: "Customer documents A",
      slug: "customer-documents-a",
      status: "active",
    });
    ids.orgB = await ctx.db.insert("organizations", {
      name: "Customer documents B",
      slug: "customer-documents-b",
      status: "active",
    });

    const ownerA = await ctx.db.insert("users", {
      externalId: "customer-documents-owner-a",
      tokenIdentifier: `${issuer}|customer-documents-owner-a`,
      identityStatus: "active",
      email: "owner-a@example.com",
      name: "Owner A",
      role: "owner",
    });
    const customerUserA = await ctx.db.insert("users", {
      externalId: "customer-documents-customer-a",
      tokenIdentifier: `${issuer}|customer-documents-customer-a`,
      identityStatus: "active",
      email: "customer-a@example.com",
      name: "Customer A",
      role: "customer",
    });
    const customerUserB = await ctx.db.insert("users", {
      externalId: "customer-documents-customer-b",
      tokenIdentifier: `${issuer}|customer-documents-customer-b`,
      identityStatus: "active",
      email: "customer-b@example.com",
      name: "Customer B",
      role: "customer",
    });

    for (const membership of [
      { userId: ownerA, orgId: ids.orgA, role: "owner" as const },
      { userId: customerUserA, orgId: ids.orgA, role: "customer" as const },
      { userId: customerUserB, orgId: ids.orgA, role: "customer" as const },
    ]) {
      await ctx.db.insert("memberships", {
        ...membership,
        status: "active",
      });
    }

    ids.customerA = await ctx.db.insert("customers", {
      orgId: ids.orgA,
      userId: customerUserA,
      name: "Customer A",
      email: "customer-a@example.com",
      status: "active",
      createdAt: 1,
      updatedAt: 1,
    });
    ids.customerB = await ctx.db.insert("customers", {
      orgId: ids.orgA,
      userId: customerUserB,
      name: "Customer B",
      email: "customer-b@example.com",
      status: "active",
      createdAt: 1,
      updatedAt: 1,
    });

    const crewA = await ctx.db.insert("users", {
      externalId: "customer-documents-crew-a",
      tokenIdentifier: `${issuer}|customer-documents-crew-a`,
      identityStatus: "active",
      email: "crew-a@example.com",
      name: "Crew A",
      role: "crew_member",
    });
    await ctx.db.insert("memberships", {
      userId: crewA,
      orgId: ids.orgA,
      role: "crew_member",
      status: "active",
    });

    ids.jobA = await ctx.db.insert("jobs", {
      orgId: ids.orgA,
      customerId: ids.customerA,
      status: "scheduled",
      schedule: 1,
      crewIds: [crewA],
      createdAt: 1,
    });
    const jobB = await ctx.db.insert("jobs", {
      orgId: ids.orgA,
      customerId: ids.customerB,
      status: "scheduled",
      schedule: 1,
      crewIds: [],
      createdAt: 1,
    });
    const crossOrgJob = await ctx.db.insert("jobs", {
      orgId: ids.orgB,
      customerId: ids.customerA,
      status: "scheduled",
      schedule: 1,
      crewIds: [],
      createdAt: 1,
    });

    const insertDocument = async (
      name: string,
      accessLevel: "public" | "customer" | "internal" | "restricted",
      jobId?: Id<"jobs">,
    ) =>
      await ctx.db.insert("documents", {
        blobUrl: `https://blob.example/${name}`,
        blobPathname: `organizations/${ids.orgA}/users/${ownerA}/${name}`,
        name,
        mimeType: "application/pdf",
        size: 128,
        orgId: ids.orgA,
        uploadedBy: ownerA,
        accessLevel,
        jobId,
        createdAt: 1,
      });

    ids.allowed = await insertDocument("allowed.pdf", "customer", ids.jobA);
    ids.crossOrg = await insertDocument(
      "cross-org.pdf",
      "customer",
      crossOrgJob,
    );
    ids.otherCustomer = await insertDocument(
      "other-customer.pdf",
      "customer",
      jobB,
    );
    ids.internal = await insertDocument("internal.pdf", "internal", ids.jobA);
    ids.restricted = await insertDocument(
      "restricted.pdf",
      "restricted",
      ids.jobA,
    );
    ids.unbound = await insertDocument("unbound.pdf", "customer");
  });

  return { t, ids };
}

const firstPage = {
  paginationOpts: { numItems: 25, cursor: null },
};

describe("customer document authorization", () => {
  it("rejects anonymous and wrong-organization callers", async () => {
    const { t, ids } = await seedCustomerDocuments();

    await expect(
      t.query(anyApi.files.listMyCustomerDocuments, {
        orgId: ids.orgA,
        ...firstPage,
      }),
    ).rejects.toThrow("UNAUTHENTICATED");
    await expect(
      t
        .withIdentity(identity("customer-documents-customer-a"))
        .query(anyApi.files.listMyCustomerDocuments, {
          orgId: ids.orgB,
          ...firstPage,
        }),
    ).rejects.toThrow("FORBIDDEN");
  });

  it("returns only customer documents bound through the exact customer job", async () => {
    const { t, ids } = await seedCustomerDocuments();
    const customerA = t.withIdentity(
      identity("customer-documents-customer-a"),
    );

    const result = await customerA.query(
      anyApi.files.listMyCustomerDocuments,
      { orgId: ids.orgA, ...firstPage },
    );

    expect(result.page).toEqual([
      expect.objectContaining({
        _id: ids.allowed,
        jobId: expect.any(String),
        name: "allowed.pdf",
        accessLevel: "customer",
      }),
    ]);
    expect(result.page[0]).not.toHaveProperty("blobUrl");
    expect(result.page[0]).not.toHaveProperty("blobPathname");
    expect(result.page.map((document: { _id: string }) => document._id)).not.toEqual(
      expect.arrayContaining([
        ids.otherCustomer,
        ids.crossOrg,
        ids.internal,
        ids.restricted,
        ids.unbound,
      ]),
    );
  });

  it("keeps customer documents out of every anonymous generic read path", async () => {
    const { t, ids } = await seedCustomerDocuments();

    await expect(
      t.query(anyApi.files.getDocument, { documentId: ids.allowed }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      t.action(anyApi.fileActions.getDownloadUrl, {
        documentId: ids.allowed,
      }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      t.query(internal.files.getAuthorizedBlob, {
        documentId: ids.allowed,
      }),
    ).rejects.toThrow("FORBIDDEN");

    const publicDocuments = await t.query(anyApi.files.listDocuments, {
      orgId: ids.orgA,
      accessLevel: "public",
      paginationOpts: { numItems: 25, cursor: null },
    });
    expect(publicDocuments.page).toEqual([]);
    await expect(
      t.query(anyApi.files.listDocuments, {
        orgId: ids.orgA,
        accessLevel: "customer",
        paginationOpts: { numItems: 25, cursor: null },
      }),
    ).rejects.toThrow();
  });

  it("allows only operations staff to create customer document grants", async () => {
    const { t, ids } = await seedCustomerDocuments();
    const owner = t.withIdentity(identity("customer-documents-owner-a"));
    const crew = t.withIdentity(identity("customer-documents-crew-a"));

    await expect(
      owner.query(internal.files.authorizeDocumentUpload, {
        orgId: ids.orgA,
        accessLevel: "customer",
        jobId: ids.jobA,
      }),
    ).resolves.toMatchObject({ actorId: expect.any(String) });
    await expect(
      owner.query(internal.files.authorizeDocumentUpload, {
        orgId: ids.orgA,
        accessLevel: "customer",
      }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      crew.query(internal.files.authorizeDocumentUpload, {
        orgId: ids.orgA,
        accessLevel: "customer",
        jobId: ids.jobA,
      }),
    ).rejects.toThrow("FORBIDDEN");
  });

  it("denies other-customer, internal, and restricted download grants", async () => {
    const { t, ids } = await seedCustomerDocuments();
    const customerA = t.withIdentity(
      identity("customer-documents-customer-a"),
    );
    const customerB = t.withIdentity(
      identity("customer-documents-customer-b"),
    );

    await expect(
      t.query(internal.files.getCustomerAuthorizedBlob, {
        documentId: ids.allowed,
      }),
    ).rejects.toThrow("UNAUTHENTICATED");
    await expect(
      customerB.query(internal.files.getCustomerAuthorizedBlob, {
        documentId: ids.allowed,
      }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      customerA.query(internal.files.getCustomerAuthorizedBlob, {
        documentId: ids.internal,
      }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      customerA.query(internal.files.getCustomerAuthorizedBlob, {
        documentId: ids.restricted,
      }),
    ).rejects.toThrow("FORBIDDEN");
  });

  it("returns private Blob coordinates only after exact customer authorization", async () => {
    const { t, ids } = await seedCustomerDocuments();
    const customerA = t.withIdentity(
      identity("customer-documents-customer-a"),
    );

    await expect(
      customerA.query(internal.files.getCustomerAuthorizedBlob, {
        documentId: ids.allowed,
      }),
    ).resolves.toEqual({
      blobUrl: "https://blob.example/allowed.pdf",
      blobPathname: expect.stringContaining("allowed.pdf"),
      name: "allowed.pdf",
    });
  });

  it("rejects oversized pagination requests before reading documents", async () => {
    const { t, ids } = await seedCustomerDocuments();
    const customerA = t.withIdentity(
      identity("customer-documents-customer-a"),
    );

    await expect(
      customerA.query(anyApi.files.listMyCustomerDocuments, {
        orgId: ids.orgA,
        paginationOpts: { numItems: 51, cursor: null },
      }),
    ).rejects.toThrow("INVALID_PAGINATION");
  });
});
