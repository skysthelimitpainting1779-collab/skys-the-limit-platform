/// <reference types="vite/client" />
// @vitest-environment edge-runtime

import { anyApi } from "convex/server";
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
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

type Role =
  | "owner"
  | "admin"
  | "estimator"
  | "project_manager"
  | "crew_lead"
  | "crew_member"
  | "customer";

async function seedDirectory() {
  const t = convexTest(schema, modules);
  const ids = {} as {
    orgA: Id<"organizations">;
    orgB: Id<"organizations">;
    ownerA: Id<"users">;
    adminA: Id<"users">;
    managerA: Id<"users">;
    estimatorA: Id<"users">;
    crewLeadA: Id<"users">;
    crewMemberA: Id<"users">;
    disabledCrewA: Id<"users">;
    crewB: Id<"users">;
    customerA: Id<"users">;
  };

  await t.run(async (ctx) => {
    ids.orgA = await ctx.db.insert("organizations", {
      name: "Operations tenant A",
      slug: "operations-a",
      status: "active",
    });
    ids.orgB = await ctx.db.insert("organizations", {
      name: "Operations tenant B",
      slug: "operations-b",
      status: "active",
    });

    const users: Array<{
      key: keyof Omit<typeof ids, "orgA" | "orgB">;
      subject: string;
      role: Role;
      orgId: Id<"organizations">;
      membershipStatus?: "active" | "disabled";
    }> = [
      { key: "ownerA", subject: "owner-a", role: "owner", orgId: ids.orgA },
      { key: "adminA", subject: "admin-a", role: "admin", orgId: ids.orgA },
      {
        key: "managerA",
        subject: "manager-a",
        role: "project_manager",
        orgId: ids.orgA,
      },
      {
        key: "estimatorA",
        subject: "estimator-a",
        role: "estimator",
        orgId: ids.orgA,
      },
      {
        key: "crewLeadA",
        subject: "crew-lead-a",
        role: "crew_lead",
        orgId: ids.orgA,
      },
      {
        key: "crewMemberA",
        subject: "crew-member-a",
        role: "crew_member",
        orgId: ids.orgA,
      },
      {
        key: "disabledCrewA",
        subject: "disabled-crew-a",
        role: "crew_member",
        orgId: ids.orgA,
        membershipStatus: "disabled",
      },
      {
        key: "crewB",
        subject: "crew-b",
        role: "crew_member",
        orgId: ids.orgB,
      },
      {
        key: "customerA",
        subject: "customer-a",
        role: "customer",
        orgId: ids.orgA,
      },
    ];

    for (const fixture of users) {
      const userId = await ctx.db.insert("users", {
        externalId: fixture.subject,
        tokenIdentifier: `${issuer}|${fixture.subject}`,
        identityStatus: "active",
        email: `${fixture.subject}@example.com`,
        name: fixture.subject,
        role: fixture.role,
      });
      ids[fixture.key] = userId;
      await ctx.db.insert("memberships", {
        userId,
        orgId: fixture.orgId,
        role: fixture.role,
        status: fixture.membershipStatus ?? "active",
      });
    }
  });

  return { t, ...ids };
}

describe("operations lifecycle directories", () => {
  it("returns only active, same-organization crew to operations managers", async () => {
    const { t, orgA, orgB, crewLeadA, crewMemberA, disabledCrewA, crewB } =
      await seedDirectory();
    const manager = t.withIdentity(identity("manager-a"));

    const directory = await manager.query(anyApi.users.listAssignableCrew, {
      orgId: orgA,
    });

    expect(directory.map((entry: { userId: Id<"users"> }) => entry.userId)).toEqual(
      expect.arrayContaining([crewLeadA, crewMemberA]),
    );
    expect(directory.map((entry: { userId: Id<"users"> }) => entry.userId)).not.toEqual(
      expect.arrayContaining([disabledCrewA, crewB]),
    );
    await expect(
      manager.query(anyApi.users.listAssignableCrew, { orgId: orgB }),
    ).rejects.toThrow("FORBIDDEN");
  });

  it("keeps crew selection unavailable to estimators and anonymous callers", async () => {
    const { t, orgA } = await seedDirectory();
    await expect(
      t.withIdentity(identity("estimator-a")).query(anyApi.users.listAssignableCrew, {
        orgId: orgA,
      }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      t.query(anyApi.users.listAssignableCrew, { orgId: orgA }),
    ).rejects.toThrow("UNAUTHENTICATED");
  });

  it("returns tenant-scoped membership roles only to role administrators", async () => {
    const { t, orgA, orgB, customerA, crewB } = await seedDirectory();
    const owner = t.withIdentity(identity("owner-a"));
    const admin = t.withIdentity(identity("admin-a"));

    const directory = await owner.query(anyApi.users.listTeamMemberships, {
      orgId: orgA,
    });
    expect(directory.some((entry: { userId: Id<"users"> }) => entry.userId === customerA)).toBe(
      true,
    );
    expect(directory.some((entry: { userId: Id<"users"> }) => entry.userId === crewB)).toBe(
      false,
    );
    await expect(
      admin.query(anyApi.users.listTeamMemberships, { orgId: orgA }),
    ).resolves.toEqual(expect.any(Array));
    await expect(
      t.withIdentity(identity("manager-a")).query(anyApi.users.listTeamMemberships, {
        orgId: orgA,
      }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      owner.query(anyApi.users.listTeamMemberships, { orgId: orgB }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      t.query(anyApi.users.listTeamMemberships, { orgId: orgA }),
    ).rejects.toThrow("UNAUTHENTICATED");
  });
});
