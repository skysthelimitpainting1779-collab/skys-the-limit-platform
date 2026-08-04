import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  capabilities: {
    role: "owner",
    canManageLeads: true,
    canManageEstimates: true,
    canReadJobs: true,
    canUpdateJobs: true,
    canManageJobs: true,
    canManageCrew: true,
    canEditContent: false,
    canPublishContent: false,
    canManageTeam: true,
    canReadAudit: true,
    canManageDocuments: false,
    canAccessCustomerPortal: false,
  },
  queryCalls: [] as string[],
}));

vi.mock("@convex/_generated/api", () => ({
  api: {
    claims: { list: "claims.list", updateStatus: "claims.updateStatus" },
    cms: {
      listPages: "cms.listPages",
      updateStatus: "cms.updateStatus",
    },
    customers: {
      createFromLead: "customers.createFromLead",
      linkUser: "customers.linkUser",
      list: "customers.list",
    },
    estimates: {
      create: "estimates.create",
      list: "estimates.list",
      update: "estimates.update",
    },
    fileActions: { getDownloadUrl: "fileActions.getDownloadUrl" },
    files: { listDocuments: "files.listDocuments" },
    jobs: {
      assignCrew: "jobs.assignCrew",
      createFromEstimate: "jobs.createFromEstimate",
      list: "jobs.list",
      updateStatus: "jobs.updateStatus",
    },
    leads: {
      list: "leads.list",
      search: "leads.search",
      updateStatus: "leads.updateStatus",
    },
    notifications: {
      getUnreadCount: "notifications.getUnreadCount",
      listMine: "notifications.listMine",
      markAllAsRead: "notifications.markAllAsRead",
      markAsRead: "notifications.markAsRead",
    },
    users: {
      getMyCapabilities: "users.getMyCapabilities",
      listAssignableCrew: "users.listAssignableCrew",
      listTeamMemberships: "users.listTeamMemberships",
      updateRole: "users.updateRole",
    },
  },
}));

vi.mock("@/components/portal/PortalShell", () => ({
  usePortalWorkspace: () => ({
    context: { user: { name: "Pat" } },
    selectedOrgId: "organization_1",
  }),
}));

vi.mock("@/design/motion/Reveal", () => ({
  MotionReveal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("convex/react", () => ({
  useAction: () => vi.fn(async () => ({ url: "https://example.test" })),
  useMutation: () => vi.fn(async () => null),
  usePaginatedQuery: () => ({
    loadMore: vi.fn(),
    results: [],
    status: "Exhausted",
  }),
  useQuery: (reference: string, args: unknown) => {
    if (args === "skip") return undefined;
    state.queryCalls.push(reference);
    switch (reference) {
      case "users.getMyCapabilities":
        return state.capabilities;
      case "leads.list":
        return [
          {
            _id: "lead_1",
            fullName: "Jordan Customer",
            email: "jordan@example.com",
            phone: "+15555550100",
            serviceAddress: "101 Main Street",
            segment: "residential",
            status: "qualified",
          },
        ];
      case "estimates.list":
        return [
          {
            _id: "estimate_1",
            leadId: "lead_1",
            scope: "Interior repaint",
            pricing: 4800,
            status: "accepted",
            createdAt: 1,
          },
        ];
      case "jobs.list":
        return [
          {
            _id: "job_1",
            title: "Exterior repaint",
            status: "scheduled",
            crewIds: [],
            schedule: 1,
          },
        ];
      case "customers.list":
        return [
          {
            _id: "customer_1",
            name: "Jordan Customer",
            email: "jordan@example.com",
            status: "active",
          },
        ];
      case "users.listAssignableCrew":
        return [
          {
            userId: "crew_1",
            name: "Casey Crew",
            email: "casey@example.com",
            role: "crew_lead",
          },
        ];
      case "users.listTeamMemberships":
        return [
          {
            membershipId: "membership_1",
            userId: "customer_user_1",
            name: "Jordan Customer",
            email: "jordan@example.com",
            role: "customer",
            status: "active",
          },
          {
            membershipId: "membership_2",
            userId: "crew_1",
            name: "Casey Crew",
            email: "casey@example.com",
            role: "crew_lead",
            status: "active",
          },
        ];
      case "notifications.getUnreadCount":
        return 0;
      default:
        return [];
    }
  },
}));

import { OperationsDashboard } from "@/components/operations/OperationsDashboard";

function capabilities(
  role: string,
  overrides: Partial<typeof state.capabilities> = {},
) {
  return {
    canManageLeads: true,
    canManageEstimates: true,
    canReadJobs: true,
    canUpdateJobs: true,
    canManageJobs: true,
    canManageCrew: true,
    canEditContent: false,
    canPublishContent: false,
    canManageTeam: true,
    canReadAudit: true,
    canManageDocuments: false,
    canAccessCustomerPortal: false,
    role,
    ...overrides,
  };
}

function renderDashboard() {
  return renderToStaticMarkup(<OperationsDashboard />);
}

describe("operations lifecycle capability UI", () => {
  beforeEach(() => {
    state.queryCalls = [];
    state.capabilities = capabilities("owner");
  });

  it("mounts the complete lifecycle controls for an owner", () => {
    const html = renderDashboard();
    expect(html).toContain("Create customer");
    expect(html).toContain("Schedule job");
    expect(html).toContain("Manage crew");
    expect(html).toContain("Link portal access");
    expect(html).toContain("Team roles");
    expect(state.queryCalls).toContain("users.listAssignableCrew");
    expect(state.queryCalls).toContain("users.listTeamMemberships");
  });

  it("does not mount job, crew, customer-link, or team controls for an estimator", () => {
    state.capabilities = capabilities("estimator", {
      canUpdateJobs: false,
      canManageJobs: false,
      canManageCrew: false,
      canManageTeam: false,
      canReadAudit: false,
    });

    const html = renderDashboard();
    expect(html).toContain("Create customer");
    expect(html).toContain("Draft estimate");
    expect(html).not.toContain("Schedule job");
    expect(html).not.toContain("Manage crew");
    expect(html).not.toContain("Link portal access");
    expect(html).not.toContain("Team roles");
    expect(state.queryCalls).not.toContain("users.listAssignableCrew");
    expect(state.queryCalls).not.toContain("users.listTeamMemberships");
  });

  it("mounts scheduling and crew controls but no identity or role administration for a project manager", () => {
    state.capabilities = capabilities("project_manager", {
      canManageTeam: false,
      canReadAudit: false,
    });

    const html = renderDashboard();
    expect(html).toContain("Schedule job");
    expect(html).toContain("Manage crew");
    expect(html).not.toContain("Link portal access");
    expect(html).not.toContain("Team roles");
    expect(state.queryCalls).toContain("users.listAssignableCrew");
    expect(state.queryCalls).not.toContain("users.listTeamMemberships");
  });

  it("mounts only content capabilities for a content editor", () => {
    state.capabilities = capabilities("content_editor", {
      canManageLeads: false,
      canManageEstimates: false,
      canReadJobs: false,
      canUpdateJobs: false,
      canManageJobs: false,
      canManageCrew: false,
      canEditContent: true,
      canPublishContent: false,
      canManageTeam: false,
      canReadAudit: false,
      canManageDocuments: false,
    });

    const html = renderDashboard();
    expect(html).toContain("Proof governance");
    expect(html).toContain("Content publication");
    expect(html).not.toContain("Lead pipeline");
    expect(html).not.toContain("Estimates");
    expect(html).not.toContain("Jobs and schedule");
    expect(html).not.toContain("Customers");
    expect(html).not.toContain("Team roles");
    for (const protectedQuery of [
      "leads.list",
      "estimates.list",
      "jobs.list",
      "customers.list",
      "users.listAssignableCrew",
      "users.listTeamMemberships",
    ]) {
      expect(state.queryCalls).not.toContain(protectedQuery);
    }
  });
});
