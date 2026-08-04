import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("authenticated portal UI contracts", () => {
  it("protects every portal segment with the WorkOS server boundary", () => {
    const boundary = source("src/components/portal/AuthenticatedPortal.tsx");
    expect(boundary).toContain("await withAuth()");
    expect(boundary).toContain("organizationId !== requiredOrganizationId");
    expect(boundary).toContain("WORKOS_ORGANIZATION_ID");

    for (const segment of ["operations", "crew", "customer"]) {
      expect(source(`src/app/${segment}/layout.tsx`)).toContain(
        "AuthenticatedPortal",
      );
      expect(source(`src/app/${segment}/layout.tsx`)).toContain(
        `returnTo="/${segment}"`,
      );
    }
  });

  it("scopes login to the trusted WorkOS organization configuration", () => {
    const login = source("src/app/login/route.ts");
    expect(login).toContain("process.env.WORKOS_ORGANIZATION_ID");
    expect(login).toContain("organizationId");
    expect(login).toContain("ALLOWED_RETURN_PATHS");

    const proxy = source("src/proxy.ts");
    expect(proxy).toContain('"/login"');
    expect(proxy).toContain('"/auth/callback"');
    expect(proxy).not.toContain('"/logout"');
  });

  it("does not prefetch protected portals from the anonymous footer", () => {
    const footer = source("src/components/navigation/Footer.tsx");

    for (const path of ["/operations", "/crew", "/customer"]) {
      expect(footer).toContain(`href="${path}" prefetch={false}`);
    }
  });

  it("renders only canonical role-appropriate portal destinations", () => {
    const shell = source("src/components/portal/PortalShell.tsx");
    expect(shell).toContain(
      'const CUSTOMER_ROLES = new Set<MembershipRole>(["customer"]);',
    );
    expect(shell).toContain('href: "/operations"');
    expect(shell).toContain('href: "/crew"');
    expect(shell).toContain('href: "/customer"');
    expect(shell).toContain("canAccessActiveRoute");
    expect(shell).toContain("context === undefined");
    expect(shell).toContain("!canAccessActiveRoute");
    expect(shell).not.toContain("href: \"/settings\"");
  });

  it("wires the crew workspace to authorized job work and Vercel Blob actions", () => {
    const crew = source("src/components/crew/CrewDashboard.tsx");
    for (const contract of [
      "api.jobs.list",
      "api.jobs.listTasks",
      "api.jobs.createTask",
      "api.jobs.updateTask",
      "api.jobs.listProjectUpdates",
      "api.jobs.addProjectUpdate",
      "api.checklists.listByJob",
      "api.checklists.toggleItem",
      "api.fileActions.generateUploadUrl",
      "api.fileActions.finalizeUpload",
      "api.fileActions.getDownloadUrl",
      "api.files.listDocuments",
    ]) {
      expect(crew).toContain(contract);
    }
    expect(crew).not.toContain("completedBy:");
    expect(crew).not.toContain("CREW_JOBS");
    expect(crew).not.toContain("weather");
    expect(crew).toContain("customerVisible: canManageWork ? customerVisible : false");
    expect(crew).toContain("const canAddProjectUpdate = canUpdateFieldState");
    expect(crew).toContain("!canUpdateFieldState || busyKey");
  });

  it("keeps operations queries and publication controls capability-scoped", () => {
    const operations = source("src/components/operations/OperationsDashboard.tsx");
    expect(operations).toContain("capabilities?.canEditContent === true");
    expect(operations).toContain("capabilities?.canPublishContent === true");
    expect(operations).toContain("capabilities?.canManageDocuments === true");
    expect(operations).toContain("activeOrgId && canOperate");
    expect(operations).toContain("markAllNotificationsRead({ orgId: activeOrgId })");
    expect(operations).toContain("canApproveContent ?");
    expect(operations).toContain("export function OperationsDashboard()");
  });

  it("uses exact customer binding and keeps document access fail-closed", () => {
    const customer = source("src/components/customer/CustomerDashboard.tsx");
    expect(customer).toContain("api.customers.getMyPortal");
    expect(customer).toContain("Secure account linking required");
    expect(customer).toContain("Document downloads fail closed");
    expect(customer).not.toContain("defaultLeadId");
    expect(customer).not.toContain("defaultOrgId");
  });

  it("does not substitute a fake Convex endpoint", () => {
    const provider = source("src/components/providers/ConvexClientProvider.tsx");
    expect(provider).toContain("ConvexConfigurationError");
    expect(provider).toContain("Retry secure setup");
    expect(provider).not.toContain("sandbox-placeholder");
    expect(provider).not.toContain("your-deployment.convex.cloud");
  });

  it("keeps primary action contrast and route recovery explicit", () => {
    const globalStyles = source("src/app/globals.css");
    expect(globalStyles).toContain("--primary: oklch(0.5 0.17 46)");
    expect(source("src/app/loading.tsx")).toContain('aria-busy="true"');
    expect(source("src/app/error.tsx")).toContain("Protected records could not be loaded");
  });
});
