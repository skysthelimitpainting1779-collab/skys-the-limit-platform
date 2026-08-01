import { describe, expect, it } from "vitest";
import schema from "../../convex/schema";

describe("Convex schema verification", () => {
  it("defines the seven core tables", () => {
    const tableNames = Object.keys(schema.tables);
    for (const table of [
      "users",
      "organizations",
      "memberships",
      "leads",
      "estimates",
      "jobs",
      "auditEvents",
    ]) {
      expect(tableNames).toContain(table);
    }
  });

  it("gives lead intake the indexes required for idempotency and abuse control", () => {
    const indexes = schema.tables.leads[" indexes"]();
    const byName = (name: string) =>
      indexes.find((index) => index.indexDescriptor === name)?.fields;

    expect(byName("by_status")).toEqual(["status"]);
    expect(byName("by_idempotency_key")).toEqual(["idempotencyKey"]);
    expect(byName("by_email_and_created_at")).toEqual(["email", "createdAt"]);
    expect(byName("by_phone_and_created_at")).toEqual(["phone", "createdAt"]);
    expect(byName("by_created_at")).toEqual(["createdAt"]);
  });

  it("keeps organization and downstream business indexes", () => {
    expect(
      schema.tables.users[" indexes"]().find(
        (index) => index.indexDescriptor === "by_externalId",
      )?.fields,
    ).toEqual(["externalId"]);
    expect(
      schema.tables.organizations[" indexes"]().find(
        (index) => index.indexDescriptor === "by_slug",
      )?.fields,
    ).toEqual(["slug"]);
    expect(
      schema.tables.estimates[" indexes"]().find(
        (index) => index.indexDescriptor === "by_lead",
      )?.fields,
    ).toEqual(["leadId"]);
    expect(
      schema.tables.jobs[" indexes"]().find(
        (index) => index.indexDescriptor === "by_status",
      )?.fields,
    ).toEqual(["status"]);
  });
});
