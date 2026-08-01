import { describe, it, expect } from "vitest";
import schema from "../../convex/schema";

describe("Convex Schema Verification", () => {
  it("defines the 7 core tables", () => {
    const tableNames = Object.keys(schema.tables);
    expect(tableNames).toContain("users");
    expect(tableNames).toContain("organizations");
    expect(tableNames).toContain("memberships");
    expect(tableNames).toContain("leads");
    expect(tableNames).toContain("estimates");
    expect(tableNames).toContain("jobs");
    expect(tableNames).toContain("auditEvents");
  });

  it("verifies users table schema and index", () => {
    const usersTable = schema.tables.users;
    expect(usersTable).toBeDefined();
    const indexes = usersTable[" indexes"]();
    const externalIdIndex = indexes.find((i) => i.indexDescriptor === "by_externalId");
    expect(externalIdIndex).toBeDefined();
    expect(externalIdIndex?.fields).toEqual(["externalId"]);
  });

  it("verifies organizations table schema and index", () => {
    const orgsTable = schema.tables.organizations;
    expect(orgsTable).toBeDefined();
    const indexes = orgsTable[" indexes"]();
    const slugIndex = indexes.find((i) => i.indexDescriptor === "by_slug");
    expect(slugIndex).toBeDefined();
    expect(slugIndex?.fields).toEqual(["slug"]);
  });

  it("verifies memberships table schema and indexes", () => {
    const membershipsTable = schema.tables.memberships;
    expect(membershipsTable).toBeDefined();
    const indexes = membershipsTable[" indexes"]();

    const userOrgIndex = indexes.find((i) => i.indexDescriptor === "by_user_org");
    expect(userOrgIndex?.fields).toEqual(["userId", "orgId"]);

    const orgIndex = indexes.find((i) => i.indexDescriptor === "by_org");
    expect(orgIndex?.fields).toEqual(["orgId"]);

    const userIndex = indexes.find((i) => i.indexDescriptor === "by_user");
    expect(userIndex?.fields).toEqual(["userId"]);
  });

  it("verifies leads table schema and index", () => {
    const leadsTable = schema.tables.leads;
    expect(leadsTable).toBeDefined();
    const indexes = leadsTable[" indexes"]();
    const statusIndex = indexes.find((i) => i.indexDescriptor === "by_status");
    expect(statusIndex?.fields).toEqual(["status"]);
  });

  it("verifies estimates table schema and indexes", () => {
    const estimatesTable = schema.tables.estimates;
    expect(estimatesTable).toBeDefined();
    const indexes = estimatesTable[" indexes"]();

    const leadIndex = indexes.find((i) => i.indexDescriptor === "by_lead");
    expect(leadIndex?.fields).toEqual(["leadId"]);

    const orgIndex = indexes.find((i) => i.indexDescriptor === "by_org");
    expect(orgIndex?.fields).toEqual(["orgId"]);
  });

  it("verifies jobs table schema and indexes", () => {
    const jobsTable = schema.tables.jobs;
    expect(jobsTable).toBeDefined();
    const indexes = jobsTable[" indexes"]();

    const orgIndex = indexes.find((i) => i.indexDescriptor === "by_org");
    expect(orgIndex?.fields).toEqual(["orgId"]);

    const statusIndex = indexes.find((i) => i.indexDescriptor === "by_status");
    expect(statusIndex?.fields).toEqual(["status"]);
  });

  it("verifies auditEvents table schema and indexes", () => {
    const auditEventsTable = schema.tables.auditEvents;
    expect(auditEventsTable).toBeDefined();
    const indexes = auditEventsTable[" indexes"]();

    const targetIndex = indexes.find((i) => i.indexDescriptor === "by_target");
    expect(targetIndex?.fields).toEqual(["targetResource"]);

    const actorIndex = indexes.find((i) => i.indexDescriptor === "by_actor");
    expect(actorIndex?.fields).toEqual(["actorId"]);
  });
});
