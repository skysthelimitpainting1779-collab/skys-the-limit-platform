/* eslint-disable @typescript-eslint/no-explicit-any */
// The mock DB helper necessarily emulates Convex's generic DatabaseWriter
// interface which cannot be typed without replicating the entire Convex runtime
// type system. `any` usage here is intentional and scoped only to test mocks.
import { describe, it, expect, vi } from "vitest";
import * as leads from "../../convex/leads";
import * as estimates from "../../convex/estimates";
import * as jobs from "../../convex/jobs";
import * as users from "../../convex/users";
import * as auditEvents from "../../convex/auditEvents";

function getHandler(fn: any) {
  return fn._handler || fn;
}

// Mock Database Context helper
function createMockDb() {
  const store = new Map<string, any>();
  let idCounter = 1;

  const mockDb = {
    store,
    insert: vi.fn(async (table: string, value: any) => {
      const _id = `${table}_${idCounter++}` as any;
      const doc = { _id, _creationTime: Date.now(), ...value };
      store.set(_id, doc);
      return _id;
    }),
    get: vi.fn(async (id: any) => {
      return store.get(id) || null;
    }),
    patch: vi.fn(async (id: any, value: any) => {
      const doc = store.get(id);
      if (!doc) throw new Error("Document not found");
      const updated = { ...doc, ...value };
      store.set(id, updated);
      return updated;
    }),
    query: vi.fn((table: string) => {
      let items = Array.from(store.values()).filter((doc) =>
        doc._id.startsWith(`${table}_`)
      );

      const queryObj: any = {
        withIndex: vi.fn((indexName: string, cb?: (q: any) => any) => {
          let eqField: string | null = null;
          let eqValue: any = null;
          let rangeField: string | null = null;
          let rangeMin: any = null;

          if (cb) {
            const qMock = {
              eq: (field: string, val: any) => {
                eqField = field;
                eqValue = val;
                return qMock;
              },
              gte: (field: string, val: any) => {
                rangeField = field;
                rangeMin = val;
                return qMock;
              },
              lte: (_field: string, _val: any) => qMock,
              gt:  (_field: string, _val: any) => qMock,
              lt:  (_field: string, _val: any) => qMock,
            };
            cb(qMock);
          }

          if (eqField !== null) {
            items = items.filter((doc) => doc[eqField!] === eqValue);
          }
          if (rangeField !== null) {
            items = items.filter((doc) => doc[rangeField!] >= rangeMin);
          }
          return queryObj;
        }),
        order: vi.fn((dir: "asc" | "desc") => {
          items.sort((a, b) =>
            dir === "desc"
              ? (b.timestamp || b._creationTime || 0) - (a.timestamp || a._creationTime || 0)
              : (a.timestamp || a._creationTime || 0) - (b.timestamp || b._creationTime || 0)
          );
          return queryObj;
        }),
        collect: vi.fn(async () => items),
        take: vi.fn(async (count: number) => items.slice(0, count)),
        unique: vi.fn(async () => items[0] || null),
      };

      return queryObj;
    }),
  };

  return {
    db: mockDb as any,
  };
}

describe("Convex Leads Module", () => {
  it("creates a lead with default status 'new'", async () => {
    const ctx = createMockDb();
    const handler = getHandler(leads.create);
    const result = await handler(ctx, {
      idempotencyKey: "00000000-0000-4000-8000-000000000001",
      fullName: "Alice Smith",
      email: "alice@example.com",
      phone: "+15550199000",
      segment: "residential",
      serviceAddress: "123 Oak St, Seattle WA",
      projectDetails: "Interior repaint full house",
      sourcePath: "/estimate",
    });

    expect(result.id).toBeDefined();
    expect(result.created).toBe(true);
    const doc = await ctx.db.get(result.id);
    expect(doc.fullName).toBe("Alice Smith");
    expect(doc.status).toBe("new");
    expect(doc.createdAt).toBeGreaterThan(0);
  });

  it("creates a lead with optional UTM fields", async () => {
    const ctx = createMockDb();
    const handler = getHandler(leads.create);
    const result = await handler(ctx, {
      idempotencyKey: "00000000-0000-4000-8000-000000000002",
      fullName: "Bob Builders",
      email: "bob@example.com",
      phone: "+15550200000",
      segment: "commercial",
      serviceAddress: "456 Commerce Blvd, Portland OR",
      projectDetails: "Exterior coating full building",
      sourcePath: "/commercial",
      utmSource: "google",
      utmMedium: "cpc",
    });

    const doc = await ctx.db.get(result.id);
    expect(doc.status).toBe("new");
    expect(doc.utmSource).toBe("google");
    expect(doc.utmMedium).toBe("cpc");
  });

  it("retrieves a lead by id using get", async () => {
    const ctx = createMockDb();
    const createHandler = getHandler(leads.create);
    const { id: leadId } = await createHandler(ctx, {
      idempotencyKey: "00000000-0000-4000-8000-000000000003",
      fullName: "Charlie",
      email: "charlie@example.com",
      phone: "+15550300000",
      segment: "public-sector",
      serviceAddress: "789 Government Rd, Olympia WA",
      projectDetails: "Municipal building exterior repaint",
      sourcePath: "/public-sector",
    });

    const getHandlerFn = getHandler(leads.get);
    const lead = await getHandlerFn(ctx, { leadId });
    expect(lead).toBeDefined();
    expect(lead._id).toBe(leadId);
  });

  it("lists leads with or without status filter", async () => {
    const ctx = createMockDb();
    const createHandler = getHandler(leads.create);
    const base = { serviceAddress: "1 Main St, Seattle WA", projectDetails: "Full exterior paint project", sourcePath: "/estimate" };
    await createHandler(ctx, { idempotencyKey: "00000000-0000-4000-8000-000000000011", fullName: "L1", email: "l1@example.com", phone: "+15550001111", segment: "residential" as const, ...base });
    await createHandler(ctx, { idempotencyKey: "00000000-0000-4000-8000-000000000012", fullName: "L2", email: "l2@example.com", phone: "+15550002222", segment: "commercial" as const, ...base });

    const listHandler = getHandler(leads.list);
    const allLeads = await listHandler(ctx, {});
    expect(allLeads.length).toBe(2);

    const residentialLeads = await listHandler(ctx, { status: "new" });
    expect(residentialLeads.length).toBe(2);
  });

  it("updates lead status and throws error if lead not found", async () => {
    const ctx = createMockDb();
    const createHandler = getHandler(leads.create);
    const { id: leadId } = await createHandler(ctx, {
      idempotencyKey: "00000000-0000-4000-8000-000000000021",
      fullName: "L1",
      email: "l1@example.com",
      phone: "+15550001234",
      segment: "residential" as const,
      serviceAddress: "1 Main St, Seattle WA",
      projectDetails: "Full exterior paint project needed",
      sourcePath: "/estimate",
    });

    const updateStatusHandler = getHandler(leads.updateStatus);
    const updated = await updateStatusHandler(ctx, { leadId, status: "scheduled" });
    expect(updated.status).toBe("scheduled");

    await expect(updateStatusHandler(ctx, { leadId: "leads_9999", status: "closed" })).rejects.toThrow("Lead not found");
  });

  it("searches leads matching query", async () => {
    const ctx = createMockDb();
    const createHandler = getHandler(leads.create);
    const base = { projectDetails: "Full repaint project required", sourcePath: "/estimate" };
    await createHandler(ctx, { idempotencyKey: "00000000-0000-4000-8000-000000000031", fullName: "John Doe", email: "john@acme.com", phone: "+15551234000", serviceAddress: "1 Oak St, Seattle WA", segment: "residential" as const, ...base });
    await createHandler(ctx, { idempotencyKey: "00000000-0000-4000-8000-000000000032", fullName: "Jane Smith", email: "jane@xyz.org", phone: "+15555678000", serviceAddress: "789 Pine Ave, Portland OR", segment: "commercial" as const, ...base });

    const searchHandler = getHandler(leads.search);
    const match1 = await searchHandler(ctx, { query: "acme" });
    expect(match1.length).toBe(1);
    expect(match1[0].fullName).toBe("John Doe");

    const match2 = await searchHandler(ctx, { query: "Pine" });
    expect(match2.length).toBe(1);
    expect(match2[0].fullName).toBe("Jane Smith");

    const all = await searchHandler(ctx, { query: "" });
    expect(all.length).toBe(2);
  });
});

describe("Convex Estimates Module", () => {
  it("computes pricing total helper correctly", () => {
    expect(estimates.computeTotalFromPricing(500)).toBe(500);
    expect(estimates.computeTotalFromPricing({ total: 1250 })).toBe(1250);
    expect(estimates.computeTotalFromPricing({ items: [{ amount: 100 }, { price: 200 }, 300] })).toBe(600);
    expect(estimates.computeTotalFromPricing({ labor: 400, materials: 600 })).toBe(1000);
  });

  it("creates an estimate and throws if lead or org missing", async () => {
    const ctx = createMockDb();
    const leadId = await ctx.db.insert("leads", { customerName: "C", email: "e@e.com", phone: "1", projectType: "residential", status: "new", createdAt: Date.now() });
    const orgId = await ctx.db.insert("organizations", { name: "Org 1", slug: "org-1", status: "active" });

    const createHandler = getHandler(estimates.create);
    const estId = await createHandler(ctx, {
      leadId,
      orgId,
      scope: "Roof replacement",
      pricing: 5000,
    });

    expect(estId).toBeDefined();
    const est = await ctx.db.get(estId);
    expect(est.scope).toBe("Roof replacement");
    expect(est.status).toBe("draft");

    await expect(createHandler(ctx, { leadId: "leads_999", orgId, scope: "x", pricing: 100 })).rejects.toThrow("Lead not found");
    await expect(createHandler(ctx, { leadId, orgId: "organizations_999", scope: "x", pricing: 100 })).rejects.toThrow("Organization not found");
  });

  it("gets and lists estimates by lead or org", async () => {
    const ctx = createMockDb();
    const leadId = await ctx.db.insert("leads", { customerName: "C", email: "e@e.com", phone: "1", projectType: "residential", status: "new", createdAt: Date.now() });
    const orgId = await ctx.db.insert("organizations", { name: "Org 1", slug: "org-1", status: "active" });

    const createHandler = getHandler(estimates.create);
    const estId1 = await createHandler(ctx, { leadId, orgId, scope: "S1", pricing: 1000, status: "sent" });
    await createHandler(ctx, { leadId, orgId, scope: "S2", pricing: 2000, status: "accepted" });

    const getHandlerFn = getHandler(estimates.get);
    const est1 = await getHandlerFn(ctx, { estimateId: estId1 });
    expect(est1.scope).toBe("S1");

    const listByLeadHandler = getHandler(estimates.listByLead);
    const leadEsts = await listByLeadHandler(ctx, { leadId });
    expect(leadEsts.length).toBe(2);

    const listHandler = getHandler(estimates.list);
    const sentEsts = await listHandler(ctx, { orgId, status: "sent" });
    expect(sentEsts.length).toBe(1);
    expect(sentEsts[0].scope).toBe("S1");
  });

  it("updates estimate scope, pricing, status", async () => {
    const ctx = createMockDb();
    const leadId = await ctx.db.insert("leads", { customerName: "C", email: "e@e.com", phone: "1", projectType: "residential", status: "new", createdAt: Date.now() });
    const orgId = await ctx.db.insert("organizations", { name: "Org 1", slug: "org-1", status: "active" });
    const estId = await ctx.db.insert("estimates", { leadId, orgId, scope: "Original", pricing: 1000, status: "draft", createdAt: Date.now() });

    const updateHandler = getHandler(estimates.update);
    const updated = await updateHandler(ctx, { estimateId: estId, scope: "Updated", status: "sent", pricing: 1500 });
    expect(updated.scope).toBe("Updated");
    expect(updated.status).toBe("sent");
    expect(updated.pricing).toBe(1500);

    await expect(updateHandler(ctx, { estimateId: "estimates_999", scope: "X" })).rejects.toThrow("Estimate not found");
  });

  it("calculates estimate total query", async () => {
    const ctx = createMockDb();
    const leadId = await ctx.db.insert("leads", { customerName: "C", email: "e@e.com", phone: "1", projectType: "residential", status: "new", createdAt: Date.now() });
    const orgId = await ctx.db.insert("organizations", { name: "Org 1", slug: "org-1", status: "active" });
    const estId = await ctx.db.insert("estimates", { leadId, orgId, scope: "Calc Test", pricing: { total: 3500 }, status: "draft", createdAt: Date.now() });

    const calcHandler = getHandler(estimates.calculateTotal);
    const totalFromId = await calcHandler(ctx, { estimateId: estId });
    expect(totalFromId).toBe(3500);

    const totalFromPricing = await calcHandler(ctx, { pricing: 4200 });
    expect(totalFromPricing).toBe(4200);

    const defaultTotal = await calcHandler(ctx, {});
    expect(defaultTotal).toBe(0);
  });
});

describe("Convex Jobs Module", () => {
  it("creates job from estimate and marks estimate accepted", async () => {
    const ctx = createMockDb();
    const leadId = await ctx.db.insert("leads", { customerName: "C", email: "e@e.com", phone: "1", projectType: "residential", status: "new", createdAt: Date.now() });
    const orgId = await ctx.db.insert("organizations", { name: "Org 1", slug: "org-1", status: "active" });
    const estId = await ctx.db.insert("estimates", { leadId, orgId, scope: "Job Scope", pricing: 5000, status: "sent", createdAt: Date.now() });

    const createHandler = getHandler(jobs.createFromEstimate);
    const jobId = await createHandler(ctx, {
      estimateId: estId,
      schedule: "2026-08-10T09:00:00Z",
    });

    expect(jobId).toBeDefined();
    const updatedEst = await ctx.db.get(estId);
    expect(updatedEst.status).toBe("accepted");

    const job = await ctx.db.get(jobId);
    expect(job.orgId).toBe(orgId);
    expect(job.status).toBe("scheduled");

    await expect(createHandler(ctx, { estimateId: "estimates_999", schedule: "now" })).rejects.toThrow("Estimate not found");
  });

  it("gets and lists jobs", async () => {
    const ctx = createMockDb();
    const orgId = await ctx.db.insert("organizations", { name: "O", slug: "o", status: "active" });
    const estId = await ctx.db.insert("estimates", { leadId: "l1" as any, orgId, scope: "S", pricing: 100, status: "accepted", createdAt: Date.now() });
    const jobId = await ctx.db.insert("jobs", { estimateId: estId, orgId, status: "in_progress", schedule: 12345, crewIds: [], createdAt: Date.now() });

    const getHandlerFn = getHandler(jobs.get);
    const fetched = await getHandlerFn(ctx, { jobId });
    expect(fetched._id).toBe(jobId);

    const listHandler = getHandler(jobs.list);
    const listResult = await listHandler(ctx, { orgId, status: "in_progress" });
    expect(listResult.length).toBe(1);
  });

  it("updates status and assigns crew", async () => {
    const ctx = createMockDb();
    const orgId = await ctx.db.insert("organizations", { name: "O", slug: "o", status: "active" });
    const estId = await ctx.db.insert("estimates", { leadId: "l1" as any, orgId, scope: "S", pricing: 100, status: "accepted", createdAt: Date.now() });
    const jobId = await ctx.db.insert("jobs", { estimateId: estId, orgId, status: "scheduled", schedule: 12345, crewIds: [], createdAt: Date.now() });

    const updateStatusHandler = getHandler(jobs.updateStatus);
    const updatedStatus = await updateStatusHandler(ctx, { jobId, status: "completed" });
    expect(updatedStatus.status).toBe("completed");

    const assignCrewHandler = getHandler(jobs.assignCrew);
    const userId1 = "users_1" as any;
    const userId2 = "users_2" as any;
    const updatedCrew = await assignCrewHandler(ctx, { jobId, crewIds: [userId1, userId2] });
    expect(updatedCrew.crewIds).toEqual([userId1, userId2]);

    await expect(updateStatusHandler(ctx, { jobId: "jobs_999", status: "cancelled" })).rejects.toThrow("Job not found");
    await expect(assignCrewHandler(ctx, { jobId: "jobs_999", crewIds: [] })).rejects.toThrow("Job not found");
  });
});

describe("Convex Users Module", () => {
  it("stores a user (insert new or update existing by externalId)", async () => {
    const ctx = createMockDb();
    const storeHandler = getHandler(users.store);

    const userId1 = await storeHandler(ctx, {
      externalId: "clerk_123",
      email: "user@example.com",
      name: "John User",
    });
    expect(userId1).toBeDefined();
    const doc1 = await ctx.db.get(userId1);
    expect(doc1.role).toBe("customer");

    const userId2 = await storeHandler(ctx, {
      externalId: "clerk_123",
      email: "user_new@example.com",
      name: "John User Updated",
      role: "owner",
    });
    expect(userId2).toBe(userId1);
    const doc2 = await ctx.db.get(userId1);
    expect(doc2.email).toBe("user_new@example.com");
    expect(doc2.role).toBe("owner");
  });

  it("gets user by id or by externalId", async () => {
    const ctx = createMockDb();
    const storeHandler = getHandler(users.store);
    const userId = await storeHandler(ctx, {
      externalId: "clerk_456",
      email: "clerk456@example.com",
      name: "Clerk User",
    });

    const getHandlerFn = getHandler(users.get);
    const u1 = await getHandlerFn(ctx, { userId });
    expect(u1.name).toBe("Clerk User");

    const getByClerkHandler = getHandler(users.getByClerkId);
    const u2 = await getByClerkHandler(ctx, { externalId: "clerk_456" });
    expect(u2._id).toBe(userId);
  });

  it("updates user role and lists users", async () => {
    const ctx = createMockDb();
    const storeHandler = getHandler(users.store);
    const uId1 = await storeHandler(ctx, { externalId: "e1", email: "e1@test.com", name: "U1", role: "staff" });
    await storeHandler(ctx, { externalId: "e2", email: "e2@test.com", name: "U2", role: "crew" });

    const updateRoleHandler = getHandler(users.updateRole);
    const updated = await updateRoleHandler(ctx, { userId: uId1, role: "owner" });
    expect(updated.role).toBe("owner");

    const listHandler = getHandler(users.list);
    const allUsers = await listHandler(ctx, {});
    expect(allUsers.length).toBe(2);

    const crewUsers = await listHandler(ctx, { role: "crew" });
    expect(crewUsers.length).toBe(1);
    expect(crewUsers[0].name).toBe("U2");

    await expect(updateRoleHandler(ctx, { userId: "users_999", role: "staff" })).rejects.toThrow("User not found");
  });
});

describe("Convex AuditEvents Module", () => {
  it("logs an audit event", async () => {
    const ctx = createMockDb();
    const logHandler = getHandler(auditEvents.log);

    const id = await logHandler(ctx, {
      actorId: "user_123",
      action: "lead.created",
      targetResource: "leads_1",
      metadata: { ip: "127.0.0.1" },
    });

    expect(id).toBeDefined();
    const event = await ctx.db.get(id);
    expect(event.actorId).toBe("user_123");
    expect(event.action).toBe("lead.created");
    expect(event.targetResource).toBe("leads_1");
  });

  it("lists audit events by entity and recent events", async () => {
    const ctx = createMockDb();
    const logHandler = getHandler(auditEvents.log);

    await logHandler(ctx, { actorId: "u1", action: "a1", targetResource: "res_1", timestamp: 100 });
    await logHandler(ctx, { actorId: "u1", action: "a2", targetResource: "res_1", timestamp: 200 });
    await logHandler(ctx, { actorId: "u2", action: "a3", targetResource: "res_2", timestamp: 300 });

    const listByEntityHandler = getHandler(auditEvents.listByEntity);
    const res1Events = await listByEntityHandler(ctx, { targetResource: "res_1" });
    expect(res1Events.length).toBe(2);

    const listRecentHandler = getHandler(auditEvents.listRecent);
    const recent = await listRecentHandler(ctx, { limit: 10 });
    expect(recent.length).toBe(3);

    const recentU1 = await listRecentHandler(ctx, { actorId: "u1", limit: 10 });
    expect(recentU1.length).toBe(2);
  });
});
