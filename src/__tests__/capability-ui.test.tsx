import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Id } from "@convex/_generated/dataModel";

const convexMocks = vi.hoisted(() => ({
  calls: [] as unknown[],
  responses: [] as unknown[],
}));

vi.mock("convex/react", () => ({
  useQuery: vi.fn((_reference: unknown, args: unknown) => {
    convexMocks.calls.push(args);
    return convexMocks.responses.shift();
  }),
  useMutation: vi.fn(() => vi.fn().mockResolvedValue(undefined)),
}));

vi.mock("@/design/motion/Reveal", () => ({
  MotionReveal: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("@/design/motion/Stagger", () => ({
  MotionStagger: ({ children }: { children: React.ReactNode }) => children,
  MotionStaggerItem: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("@/design/motion/Pressable", () => ({
  MotionPressable: ({ children }: { children: React.ReactNode }) => children,
}));

import { CrewDashboard } from "@/components/crew/CrewDashboard";
import { OperationsDashboard } from "@/components/operations/OperationsDashboard";

const orgId = "organizations_capability" as Id<"organizations">;
const job = {
  _id: "jobs_capability",
  status: "scheduled",
  schedule: "2026-08-15",
  crewIds: ["users_crew"],
  estimateId: "estimates_capability",
};

describe("role-aware dashboard query planning", () => {
  beforeEach(() => {
    convexMocks.calls.length = 0;
    convexMocks.responses.length = 0;
  });

  it("lets estimators load leads while skipping jobs and audit RPCs", () => {
    convexMocks.responses.push(
      {
        role: "estimator",
        canManageLeads: true,
        canReadJobs: false,
        canUpdateJobs: false,
        canReadAudit: false,
      },
      [],
      undefined,
      undefined,
    );
    const html = renderToStaticMarkup(<OperationsDashboard orgId={orgId} />);
    expect(convexMocks.calls).toEqual([
      { orgId },
      { orgId },
      "skip",
      "skip",
    ]);
    expect(html).toContain("Inbound Lead Pipeline");
    expect(html).toContain("Job operations are not available");
    expect(html).toContain("Audit logs are restricted");
  });

  it("lets project managers load leads and jobs while skipping audit RPCs", () => {
    convexMocks.responses.push(
      {
        role: "project_manager",
        canManageLeads: true,
        canReadJobs: true,
        canUpdateJobs: true,
        canReadAudit: false,
      },
      [],
      [],
      undefined,
    );
    const html = renderToStaticMarkup(<OperationsDashboard orgId={orgId} />);
    expect(convexMocks.calls).toEqual([
      { orgId },
      { orgId },
      { orgId },
      "skip",
    ]);
    expect(html).toContain("No active jobs currently in system");
    expect(html).toContain("Audit logs are restricted");
  });

  it("keeps crew-member schedules readable without rendering mutation controls", () => {
    convexMocks.responses.push(
      {
        role: "crew_member",
        canManageLeads: false,
        canReadJobs: true,
        canUpdateJobs: false,
        canReadAudit: false,
      },
      [job],
    );
    const html = renderToStaticMarkup(<CrewDashboard orgId={orgId} />);
    expect(convexMocks.calls).toEqual([{ orgId }, { orgId }]);
    expect(html).toContain("Job Dispatch");
    expect(html).not.toContain("Start Job");
    expect(html).not.toContain("Mark Complete");
  });

  it("renders assigned job mutation controls for a crew lead", () => {
    convexMocks.responses.push(
      {
        role: "crew_lead",
        canManageLeads: false,
        canReadJobs: true,
        canUpdateJobs: true,
        canReadAudit: false,
      },
      [job],
    );
    const html = renderToStaticMarkup(<CrewDashboard orgId={orgId} />);
    expect(html).toContain("Start Job");
    expect(html).toContain("Mark Complete");
  });
});
