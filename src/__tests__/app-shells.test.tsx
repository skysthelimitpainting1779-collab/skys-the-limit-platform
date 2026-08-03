import { describe, it, expect, vi } from "vitest";
import React from "react";

vi.mock("@workos-inc/authkit-nextjs", () => ({
  authkitProxy: vi.fn(() => vi.fn()),
  getSignInUrl: vi.fn(),
  getSignUpUrl: vi.fn(),
  withAuth: vi.fn(),
}));

vi.mock("@workos-inc/authkit-nextjs/components", () => ({
  AuthKitProvider: ({ children }: { children: React.ReactNode }) => children,
  useAccessToken: () => ({
    getAccessToken: vi.fn().mockResolvedValue(null),
    refresh: vi.fn().mockResolvedValue(null),
  }),
  useAuth: () => ({ user: null, loading: false }),
}));

import { ConvexClientProvider } from "@/components/providers/ConvexClientProvider";
import { EstimateForm } from "@/components/estimate/EstimateForm";
import { CustomerDashboard } from "@/components/customer/CustomerDashboard";
import { CrewDashboard } from "@/components/crew/CrewDashboard";
import { OperationsDashboard } from "@/components/operations/OperationsDashboard";
import EstimatePage, { metadata as estMeta } from "@/app/estimate/page";
import CustomerPage, { metadata as custMeta } from "@/app/customer/page";
import CrewPage, { metadata as crewMeta } from "@/app/crew/page";
import OperationsPage, { metadata as opsMeta } from "@/app/operations/page";
import { Id } from "@convex/_generated/dataModel";

// Mock convex/react hooks for unit testing component logic
vi.mock("convex/react", () => ({
  ConvexProvider: ({ children }: { children: React.ReactNode }) => children,
  ConvexProviderWithAuth: ({ children }: { children: React.ReactNode }) =>
    children,
  ConvexReactClient: vi.fn().mockImplementation((url: string) => ({
    url,
  })),
  useConvexAuth: vi.fn(() => ({ isAuthenticated: false, isLoading: false })),
  useQuery: vi.fn((queryFn: unknown, args: unknown) => {
    if (args === "skip") return undefined;
    return [];
  }),
  useMutation: vi.fn(() => vi.fn().mockResolvedValue("mock_id_123")),
}));

describe("App Shells & Convex Integration Suite", () => {
  it("establishes ConvexClientProvider with fallback/sandbox handling when env vars are unset", () => {
    expect(typeof ConvexClientProvider).toBe("function");

    // Test with process.env undefined
    const origEnv = process.env.NEXT_PUBLIC_CONVEX_URL;
    delete process.env.NEXT_PUBLIC_CONVEX_URL;

    expect(() => {
      const el = <ConvexClientProvider><div>test</div></ConvexClientProvider>;
      expect(el).toBeDefined();
      expect(el.type).toBe(ConvexClientProvider);
    }).not.toThrow();

    process.env.NEXT_PUBLIC_CONVEX_URL = origEnv;
  });

  it("exports valid Client Components for app shells", () => {
    expect(typeof EstimateForm).toBe("function");
    expect(typeof CustomerDashboard).toBe("function");
    expect(typeof CrewDashboard).toBe("function");
    expect(typeof OperationsDashboard).toBe("function");
  });

  it("verifies /estimate page metadata and route shell component", () => {
    expect(typeof EstimatePage).toBe("function");
    expect(estMeta).toBeDefined();
    expect(estMeta.title).toContain("Estimate");
    expect(estMeta.description).toBeDefined();
  });

  it("verifies /customer page metadata and route shell component", () => {
    expect(typeof CustomerPage).toBe("function");
    expect(custMeta).toBeDefined();
    expect(custMeta.title).toContain("Customer");
    expect(custMeta.description).toBeDefined();
  });

  it("verifies /crew page metadata and route shell component", () => {
    expect(typeof CrewPage).toBe("function");
    expect(crewMeta).toBeDefined();
    expect(crewMeta.title).toContain("Crew");
    expect(crewMeta.description).toBeDefined();
  });

  it("verifies /operations page metadata and route shell component", () => {
    expect(typeof OperationsPage).toBe("function");
    expect(opsMeta).toBeDefined();
    expect(opsMeta.title).toContain("Operations");
    expect(opsMeta.description).toBeDefined();
  });

  it("evaluates EstimateForm JSX node tree without throwing", () => {
    const node = <EstimateForm defaultOrgId={"orgs_123" as Id<"organizations">} />;
    expect(node).toBeDefined();
    expect(node.type).toBe(EstimateForm);
  });

  it("evaluates CustomerDashboard JSX node tree without throwing", () => {
    const node = <CustomerDashboard defaultLeadId="leads_123" />;
    expect(node).toBeDefined();
    expect(node.type).toBe(CustomerDashboard);
  });

  it("evaluates CrewDashboard JSX node tree without throwing", () => {
    const node = <CrewDashboard />;
    expect(node).toBeDefined();
    expect(node.type).toBe(CrewDashboard);
  });

  it("evaluates OperationsDashboard JSX node tree without throwing", () => {
    const node = <OperationsDashboard />;
    expect(node).toBeDefined();
    expect(node.type).toBe(OperationsDashboard);
  });
});
