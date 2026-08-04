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

async function seedCrewFixture() {
  const t = convexTest(schema, modules);
  const ids = {} as {
    orgId: Id<"organizations">;
    ownerId: Id<"users">;
    crewLeadId: Id<"users">;
    crewMemberId: Id<"users">;
    leadId: Id<"leads">;
  };

  await t.run(async (ctx) => {
    ids.orgId = await ctx.db.insert("organizations", {
      name: "Crew Authorization Organization",
      slug: "crew-authorization",
      status: "active",
    });

    for (const [subject, role] of [
      ["crew-auth-owner", "owner"],
      ["crew-auth-lead", "crew_lead"],
      ["crew-auth-member", "crew_member"],
    ] as const) {
      const userId = await ctx.db.insert("users", {
        externalId: subject,
        tokenIdentifier: `${issuer}|${subject}`,
        identityStatus: "active",
        email: `${subject}@example.com`,
        name: subject,
        role,
      });
      await ctx.db.insert("memberships", {
        userId,
        orgId: ids.orgId,
        role,
        status: "active",
      });
      if (role === "owner") ids.ownerId = userId;
      if (role === "crew_lead") ids.crewLeadId = userId;
      if (role === "crew_member") ids.crewMemberId = userId;
    }

    ids.leadId = await ctx.db.insert("leads", {
      orgId: ids.orgId,
      idempotencyKey: "crew-authorization-lead",
      fullName: "Crew Authorization Customer",
      email: "crew-customer@example.com",
      phone: "+15555550199",
      serviceAddress: "199 Crew Way",
      segment: "residential",
      projectDetails: "Crew assignment verification",
      sourcePath: "/estimate",
      contactConsentAt: 1,
      status: "qualified",
      createdAt: 1,
      updatedAt: 1,
    });
  });

  return { t, ...ids };
}

describe("normalized crew assignment authorization", () => {
  it("keeps crew members read-only while assigned crew leads may mutate field work", async () => {
    const { t, orgId, crewLeadId, crewMemberId } = await seedCrewFixture();
    const owner = t.withIdentity(identity("crew-auth-owner"));
    const crewLead = t.withIdentity(identity("crew-auth-lead"));
    const crewMember = t.withIdentity(identity("crew-auth-member"));
    const jobId = await owner.mutation(anyApi.jobs.create, {
      orgId,
      title: "Read-only crew policy",
      schedule: "Tomorrow",
    });
    await owner.mutation(anyApi.jobs.assignCrew, {
      jobId,
      crewIds: [crewLeadId, crewMemberId],
    });
    const taskId = await owner.mutation(anyApi.jobs.createTask, {
      jobId,
      title: "Mask the room",
      assigneeId: crewMemberId,
    });

    await expect(
      crewMember.mutation(anyApi.jobs.updateTask, {
        taskId,
        completed: true,
      }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      crewMember.mutation(anyApi.jobs.addProjectUpdate, {
        jobId,
        message: "Crew members must not write field logs",
      }),
    ).rejects.toThrow("FORBIDDEN");

    await expect(
      crewLead.mutation(anyApi.jobs.updateTask, {
        taskId,
        completed: true,
      }),
    ).resolves.toMatchObject({ completed: true, completedBy: crewLeadId });
    await expect(
      crewLead.mutation(anyApi.jobs.addProjectUpdate, {
        jobId,
        message: "Crew lead field log",
      }),
    ).resolves.toBeDefined();
  });

  it("returns an assigned job even when newer unassigned jobs fill the requested bound", async () => {
    const { t, orgId, crewMemberId } = await seedCrewFixture();
    const owner = t.withIdentity(identity("crew-auth-owner"));
    const crewMember = t.withIdentity(identity("crew-auth-member"));
    const assignedJobId = await owner.mutation(anyApi.jobs.create, {
      orgId,
      title: "Assigned older job",
      schedule: "Monday",
    });
    await owner.mutation(anyApi.jobs.assignCrew, {
      jobId: assignedJobId,
      crewIds: [crewMemberId],
    });

    for (const title of ["New unassigned one", "New unassigned two"]) {
      await owner.mutation(anyApi.jobs.create, {
        orgId,
        title,
        schedule: "Tuesday",
      });
    }

    await expect(
      crewMember.query(anyApi.jobs.list, { orgId, limit: 1 }),
    ).resolves.toEqual([
      expect.objectContaining({ _id: assignedJobId, title: "Assigned older job" }),
    ]);
  });

  it("fails closed for legacy array-only assignments until an authorized manager repairs them", async () => {
    const { t, orgId, crewMemberId } = await seedCrewFixture();
    const owner = t.withIdentity(identity("crew-auth-owner"));
    const crewMember = t.withIdentity(identity("crew-auth-member"));
    let legacyJobId!: Id<"jobs">;
    await t.run(async (ctx) => {
      legacyJobId = await ctx.db.insert("jobs", {
        orgId,
        title: "Legacy array-only assignment",
        status: "scheduled",
        schedule: "Wednesday",
        crewIds: [crewMemberId],
        createdAt: 1,
      });
    });

    await expect(
      crewMember.query(anyApi.jobs.get, { jobId: legacyJobId }),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      crewMember.query(anyApi.jobs.list, { orgId, limit: 10 }),
    ).resolves.toEqual([]);

    await owner.mutation(anyApi.jobs.assignCrew, {
      jobId: legacyJobId,
      crewIds: [crewMemberId],
    });
    await expect(
      crewMember.query(anyApi.jobs.get, { jobId: legacyJobId }),
    ).resolves.toMatchObject({ _id: legacyJobId });
  });

  it("keeps assignment status indexes synchronized across both job update paths", async () => {
    const { t, orgId, crewLeadId } = await seedCrewFixture();
    const owner = t.withIdentity(identity("crew-auth-owner"));
    const crewLead = t.withIdentity(identity("crew-auth-lead"));
    const jobId = await owner.mutation(anyApi.jobs.create, {
      orgId,
      title: "Status-indexed assignment",
      schedule: "Thursday",
    });
    await owner.mutation(anyApi.jobs.assignCrew, {
      jobId,
      crewIds: [crewLeadId],
    });

    await crewLead.mutation(anyApi.jobs.updateStatus, {
      jobId,
      status: "in_progress",
    });
    await expect(
      crewLead.query(anyApi.jobs.list, {
        orgId,
        status: "in_progress",
        limit: 10,
      }),
    ).resolves.toEqual([expect.objectContaining({ _id: jobId })]);

    await owner.mutation(anyApi.jobs.update, {
      jobId,
      status: "completed",
    });
    await expect(
      crewLead.query(anyApi.jobs.list, {
        orgId,
        status: "completed",
        limit: 10,
      }),
    ).resolves.toEqual([expect.objectContaining({ _id: jobId })]);
    await expect(
      crewLead.query(anyApi.jobs.list, {
        orgId,
        status: "in_progress",
        limit: 10,
      }),
    ).resolves.toEqual([]);
  });

  it("creates normalized assignments in the create-from-estimate transaction", async () => {
    const { t, orgId, leadId, crewMemberId } = await seedCrewFixture();
    const owner = t.withIdentity(identity("crew-auth-owner"));
    const crewMember = t.withIdentity(identity("crew-auth-member"));
    const estimateId = await owner.mutation(anyApi.estimates.create, {
      orgId,
      leadId,
      scope: "Exterior repaint",
      pricing: 4_500,
      status: "accepted",
    });
    const jobId = await owner.mutation(anyApi.jobs.createFromEstimate, {
      estimateId,
      schedule: "Friday",
      crewIds: [crewMemberId],
    });

    await expect(
      crewMember.query(anyApi.jobs.get, { jobId }),
    ).resolves.toMatchObject({ _id: jobId, crewIds: [crewMemberId] });
  });

  it("makes estimate-to-job conversion idempotent", async () => {
    const { t, orgId, leadId } = await seedCrewFixture();
    const owner = t.withIdentity(identity("crew-auth-owner"));
    const estimateId = await owner.mutation(anyApi.estimates.create, {
      orgId,
      leadId,
      scope: "Idempotent scheduled work",
      pricing: 2_500,
      status: "accepted",
    });

    const firstJobId = await owner.mutation(anyApi.jobs.createFromEstimate, {
      estimateId,
      schedule: "Monday",
    });
    const retriedJobId = await owner.mutation(anyApi.jobs.createFromEstimate, {
      estimateId,
      schedule: "Tuesday",
    });

    expect(retriedJobId).toBe(firstJobId);
    const matchingJobs = await t.run(async (ctx) =>
      await ctx.db
        .query("jobs")
        .withIndex("by_estimate", (index) => index.eq("estimateId", estimateId))
        .collect(),
    );
    expect(matchingJobs).toHaveLength(1);
    expect(matchingJobs[0]?.schedule).toBe("Monday");
  });
});
