/// <reference types="vite/client" />
// @vitest-environment edge-runtime

import { anyApi } from "convex/server";
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import type { Id } from "./_generated/dataModel";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

async function seedProtectedResources() {
  const t = convexTest(schema, modules);
  const ids = {} as {
    auditEvent: Id<"auditEvents">;
    checklist: Id<"checklists">;
    claim: Id<"claims">;
    customer: Id<"customers">;
    document: Id<"documents">;
    estimate: Id<"estimates">;
    job: Id<"jobs">;
    lead: Id<"leads">;
    notification: Id<"notifications">;
    org: Id<"organizations">;
    page: Id<"cmsPages">;
    task: Id<"tasks">;
    user: Id<"users">;
  };

  await t.run(async (ctx) => {
    ids.org = await ctx.db.insert("organizations", {
      name: "Anonymous denial tenant",
      slug: "anonymous-denial-tenant",
      status: "active",
    });
    ids.user = await ctx.db.insert("users", {
      externalId: "anonymous-denial-owner",
      tokenIdentifier: "https://issuer.example/|anonymous-denial-owner",
      identityStatus: "active",
      email: "anonymous-denial-owner@example.com",
      name: "Anonymous Denial Owner",
      role: "owner",
    });
    await ctx.db.insert("memberships", {
      userId: ids.user,
      orgId: ids.org,
      role: "owner",
      status: "active",
    });
    ids.lead = await ctx.db.insert("leads", {
      orgId: ids.org,
      idempotencyKey: "anonymous-denial-lead",
      fullName: "Protected Customer",
      email: "protected-customer@example.com",
      phone: "+15555550999",
      serviceAddress: "999 Protected Way",
      segment: "residential",
      projectDetails: "Protected project",
      sourcePath: "/estimate",
      contactConsentAt: 1,
      status: "qualified",
      createdAt: 1,
      updatedAt: 1,
    });
    ids.customer = await ctx.db.insert("customers", {
      orgId: ids.org,
      userId: ids.user,
      leadId: ids.lead,
      name: "Protected Customer",
      email: "protected-customer@example.com",
      phone: "+15555550999",
      status: "active",
      createdAt: 1,
      updatedAt: 1,
    });
    const property = await ctx.db.insert("properties", {
      orgId: ids.org,
      customerId: ids.customer,
      address: "999 Protected Way",
      createdAt: 1,
      updatedAt: 1,
    });
    await ctx.db.patch(ids.lead, {
      customerId: ids.customer,
      propertyId: property,
    });
    ids.estimate = await ctx.db.insert("estimates", {
      leadId: ids.lead,
      orgId: ids.org,
      customerId: ids.customer,
      propertyId: property,
      scope: "Protected estimate",
      pricing: 1_000,
      status: "accepted",
      createdAt: 1,
      updatedAt: 1,
    });
    ids.job = await ctx.db.insert("jobs", {
      estimateId: ids.estimate,
      orgId: ids.org,
      customerId: ids.customer,
      propertyId: property,
      title: "Protected job",
      address: "999 Protected Way",
      status: "scheduled",
      schedule: "Tomorrow",
      crewIds: [],
      createdAt: 1,
      updatedAt: 1,
    });
    ids.task = await ctx.db.insert("tasks", {
      orgId: ids.org,
      jobId: ids.job,
      title: "Protected task",
      completed: false,
      createdBy: ids.user,
      createdAt: 1,
      updatedAt: 1,
    });
    await ctx.db.insert("projectUpdates", {
      orgId: ids.org,
      jobId: ids.job,
      customerId: ids.customer,
      actorId: ids.user,
      message: "Protected update",
      customerVisible: false,
      createdAt: 1,
    });
    ids.checklist = await ctx.db.insert("checklists", {
      orgId: ids.org,
      jobId: ids.job,
      title: "Protected checklist",
      status: "pending",
      createdBy: ids.user,
      createdAt: 1,
      updatedAt: 1,
    });
    await ctx.db.insert("checklistItems", {
      checklistId: ids.checklist,
      itemKey: "protected-item",
      text: "Protected item",
      position: 0,
      completed: false,
    });
    ids.document = await ctx.db.insert("documents", {
      blobUrl: "https://blob.example/protected",
      blobPathname: `organizations/${ids.org}/users/${ids.user}/protected.pdf`,
      name: "protected.pdf",
      mimeType: "application/pdf",
      size: 128,
      orgId: ids.org,
      uploadedBy: ids.user,
      accessLevel: "internal",
      jobId: ids.job,
      createdAt: 1,
    });
    ids.claim = await ctx.db.insert("claims", {
      orgId: ids.org,
      claimKey: "protected-claim",
      text: "Protected claim",
      status: "candidate",
      createdBy: ids.user,
      createdAt: 1,
      updatedAt: 1,
    });
    ids.page = await ctx.db.insert("cmsPages", {
      orgId: ids.org,
      slug: "protected-page",
      title: "Protected page",
      content: "Protected draft content",
      status: "draft",
      claimIds: [ids.claim],
      createdBy: ids.user,
      updatedBy: ids.user,
      createdAt: 1,
      updatedAt: 1,
    });
    ids.notification = await ctx.db.insert("notifications", {
      orgId: ids.org,
      recipientUserId: ids.user,
      title: "Protected notification",
      body: "Protected body",
      type: "protected",
      isRead: false,
      createdAt: 1,
    });
    await ctx.db.insert("notificationCounters", {
      orgId: ids.org,
      userId: ids.user,
      unreadCount: 1,
      updatedAt: 1,
    });
    ids.auditEvent = await ctx.db.insert("auditEvents", {
      orgId: ids.org,
      actorId: ids.user,
      action: "fixture.created",
      targetResource: ids.lead,
      timestamp: 1,
    });
  });

  return { t, ids };
}

describe("anonymous protected API denial receipts", () => {
  it("rejects anonymous callers at every protected public Convex export", async () => {
    const { t, ids } = await seedProtectedResources();
    const calls: Array<[string, () => Promise<unknown>]> = [
      [
        "auditEvents.listByEntity",
        () =>
          t.query(anyApi.auditEvents.listByEntity, {
            orgId: ids.org,
            targetResource: ids.lead,
          }),
      ],
      [
        "auditEvents.listRecent",
        () => t.query(anyApi.auditEvents.listRecent, { orgId: ids.org }),
      ],
      [
        "checklists.create",
        () =>
          t.mutation(anyApi.checklists.create, {
            jobId: ids.job,
            title: "Anonymous checklist",
            items: [],
          }),
      ],
      [
        "checklists.deleteChecklist",
        () =>
          t.mutation(anyApi.checklists.deleteChecklist, {
            checklistId: ids.checklist,
          }),
      ],
      [
        "checklists.get",
        () => t.query(anyApi.checklists.get, { checklistId: ids.checklist }),
      ],
      [
        "checklists.listByJob",
        () => t.query(anyApi.checklists.listByJob, { jobId: ids.job }),
      ],
      [
        "checklists.toggleItem",
        () =>
          t.mutation(anyApi.checklists.toggleItem, {
            checklistId: ids.checklist,
            itemId: "protected-item",
          }),
      ],
      [
        "checklists.updateStatus",
        () =>
          t.mutation(anyApi.checklists.updateStatus, {
            checklistId: ids.checklist,
            status: "completed",
          }),
      ],
      [
        "claims.create",
        () =>
          t.mutation(anyApi.claims.create, {
            orgId: ids.org,
            claimKey: "anonymous-claim",
            text: "Anonymous claim",
          }),
      ],
      ["claims.list", () => t.query(anyApi.claims.list, { orgId: ids.org })],
      [
        "claims.updateStatus",
        () =>
          t.mutation(anyApi.claims.updateStatus, {
            claimId: ids.claim,
            status: "verified",
          }),
      ],
      [
        "cms.createDraft",
        () =>
          t.mutation(anyApi.cms.createDraft, {
            orgId: ids.org,
            slug: "anonymous-draft",
            title: "Anonymous draft",
            content: "Anonymous content",
          }),
      ],
      [
        "cms.updateContent",
        () =>
          t.mutation(anyApi.cms.updateContent, {
            pageId: ids.page,
            title: "Anonymous edit",
          }),
      ],
      [
        "cms.updateStatus",
        () =>
          t.mutation(anyApi.cms.updateStatus, {
            pageId: ids.page,
            status: "in_review",
          }),
      ],
      [
        "customers.createFromLead",
        () =>
          t.mutation(anyApi.customers.createFromLead, { leadId: ids.lead }),
      ],
      [
        "customers.getMyPortal",
        () => t.query(anyApi.customers.getMyPortal, { orgId: ids.org }),
      ],
      [
        "customers.linkUser",
        () =>
          t.mutation(anyApi.customers.linkUser, {
            customerId: ids.customer,
            userId: ids.user,
          }),
      ],
      [
        "customers.list",
        () => t.query(anyApi.customers.list, { orgId: ids.org }),
      ],
      [
        "estimates.create",
        () =>
          t.mutation(anyApi.estimates.create, {
            leadId: ids.lead,
            orgId: ids.org,
            scope: "Anonymous estimate",
            pricing: 100,
          }),
      ],
      [
        "estimates.get",
        () => t.query(anyApi.estimates.get, { estimateId: ids.estimate }),
      ],
      [
        "estimates.list",
        () => t.query(anyApi.estimates.list, { orgId: ids.org }),
      ],
      [
        "estimates.listByLead",
        () => t.query(anyApi.estimates.listByLead, { leadId: ids.lead }),
      ],
      [
        "estimates.update",
        () =>
          t.mutation(anyApi.estimates.update, {
            estimateId: ids.estimate,
            status: "sent",
          }),
      ],
      [
        "fileActions.deleteDocument",
        () => t.action(anyApi.fileActions.deleteDocument, { documentId: ids.document }),
      ],
      [
        "fileActions.finalizeUpload",
        () =>
          t.action(anyApi.fileActions.finalizeUpload, {
            blobUrl: "https://blob.example/anonymous",
            name: "anonymous.pdf",
            orgId: ids.org,
            accessLevel: "internal",
          }),
      ],
      [
        "fileActions.generateUploadUrl",
        () =>
          t.action(anyApi.fileActions.generateUploadUrl, {
            name: "anonymous.pdf",
            mimeType: "application/pdf",
            fileSize: 128,
            orgId: ids.org,
            accessLevel: "internal",
          }),
      ],
      [
        "jobs.addProjectUpdate",
        () =>
          t.mutation(anyApi.jobs.addProjectUpdate, {
            jobId: ids.job,
            message: "Anonymous update",
          }),
      ],
      [
        "jobs.assignCrew",
        () =>
          t.mutation(anyApi.jobs.assignCrew, { jobId: ids.job, crewIds: [] }),
      ],
      [
        "jobs.create",
        () =>
          t.mutation(anyApi.jobs.create, {
            orgId: ids.org,
            title: "Anonymous job",
            schedule: "Tomorrow",
          }),
      ],
      [
        "jobs.createFromEstimate",
        () =>
          t.mutation(anyApi.jobs.createFromEstimate, {
            estimateId: ids.estimate,
            schedule: "Tomorrow",
          }),
      ],
      [
        "jobs.createTask",
        () =>
          t.mutation(anyApi.jobs.createTask, {
            jobId: ids.job,
            title: "Anonymous task",
          }),
      ],
      ["jobs.get", () => t.query(anyApi.jobs.get, { jobId: ids.job })],
      ["jobs.list", () => t.query(anyApi.jobs.list, { orgId: ids.org })],
      [
        "jobs.listProjectUpdates",
        () => t.query(anyApi.jobs.listProjectUpdates, { jobId: ids.job }),
      ],
      [
        "jobs.listTasks",
        () => t.query(anyApi.jobs.listTasks, { jobId: ids.job }),
      ],
      [
        "jobs.update",
        () => t.mutation(anyApi.jobs.update, { jobId: ids.job, title: "Anonymous" }),
      ],
      [
        "jobs.updateStatus",
        () =>
          t.mutation(anyApi.jobs.updateStatus, {
            jobId: ids.job,
            status: "in_progress",
          }),
      ],
      [
        "jobs.updateTask",
        () =>
          t.mutation(anyApi.jobs.updateTask, {
            taskId: ids.task,
            completed: true,
          }),
      ],
      ["leads.get", () => t.query(anyApi.leads.get, { leadId: ids.lead })],
      ["leads.list", () => t.query(anyApi.leads.list, { orgId: ids.org })],
      [
        "leads.search",
        () => t.query(anyApi.leads.search, { orgId: ids.org, query: "protected" }),
      ],
      [
        "leads.updateStatus",
        () =>
          t.mutation(anyApi.leads.updateStatus, {
            leadId: ids.lead,
            status: "closed",
          }),
      ],
      [
        "notifications.getUnreadCount",
        () => t.query(anyApi.notifications.getUnreadCount, { orgId: ids.org }),
      ],
      [
        "notifications.listMine",
        () => t.query(anyApi.notifications.listMine, { orgId: ids.org }),
      ],
      [
        "notifications.markAllAsRead",
        () => t.mutation(anyApi.notifications.markAllAsRead, { orgId: ids.org }),
      ],
      [
        "notifications.markAsRead",
        () =>
          t.mutation(anyApi.notifications.markAsRead, {
            notificationId: ids.notification,
          }),
      ],
      [
        "users.get",
        () => t.query(anyApi.users.get, { userId: ids.user, orgId: ids.org }),
      ],
      [
        "users.getByClerkId",
        () =>
          t.query(anyApi.users.getByClerkId, {
            externalId: "anonymous-denial-owner",
          }),
      ],
      [
        "users.getMyCapabilities",
        () => t.query(anyApi.users.getMyCapabilities, { orgId: ids.org }),
      ],
      ["users.getMyContext", () => t.query(anyApi.users.getMyContext, {})],
      ["users.list", () => t.query(anyApi.users.list, { orgId: ids.org })],
      ["users.store", () => t.mutation(anyApi.users.store, {})],
      [
        "users.updateRole",
        () =>
          t.mutation(anyApi.users.updateRole, {
            userId: ids.user,
            orgId: ids.org,
            role: "admin",
          }),
      ],
    ];

    const receipts: string[] = [];
    for (const [name, invoke] of calls) {
      await expect(invoke(), name).rejects.toThrow("UNAUTHENTICATED");
      receipts.push(name);
    }
    expect(receipts).toHaveLength(53);
    expect(new Set(receipts).size).toBe(receipts.length);
  });
});
