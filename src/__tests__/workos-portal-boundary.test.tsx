import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const mocks = vi.hoisted(() => ({
  withAuth: vi.fn(),
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

vi.mock("@workos-inc/authkit-nextjs", () => ({ withAuth: mocks.withAuth }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/components/portal/PortalShell", () => ({
  PortalShell: ({ children }: { children: unknown }) => children,
}));

import { AuthenticatedPortal } from "@/components/portal/AuthenticatedPortal";

describe("WorkOS portal organization boundary", () => {
  const originalOrganizationId = process.env.WORKOS_ORGANIZATION_ID;

  beforeEach(() => {
    mocks.withAuth.mockReset();
    mocks.redirect.mockClear();
    process.env.WORKOS_ORGANIZATION_ID = "org_required";
  });

  afterEach(() => {
    if (originalOrganizationId === undefined) {
      delete process.env.WORKOS_ORGANIZATION_ID;
    } else {
      process.env.WORKOS_ORGANIZATION_ID = originalOrganizationId;
    }
  });

  it("fails closed if an anonymous session reaches the server fallback", async () => {
    mocks.withAuth.mockResolvedValue({ user: null });

    const output = renderToStaticMarkup(
      await AuthenticatedPortal({ children: "private", returnTo: "/crew" }),
    );

    expect(output).toContain("Sign in to the authorized WorkOS organization");
    expect(output).toContain('/login?returnTo=%2Fcrew');
    expect(output).not.toContain("private");
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("rejects a valid session from a different WorkOS organization", async () => {
    mocks.withAuth.mockResolvedValue({
      user: { email: "other@example.com" },
      organizationId: "org_other",
    });

    const output = renderToStaticMarkup(
      await AuthenticatedPortal({
        children: "private",
        returnTo: "/operations",
      }),
    );

    expect(output).toContain("authorized WorkOS organization");
    expect(output).toContain('/login?returnTo=%2Foperations');
    expect(output).not.toContain("private");
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("accepts only the configured organization session", async () => {
    mocks.withAuth.mockResolvedValue({
      user: {
        email: "owner@example.com",
        firstName: "Avery",
        lastName: "Owner",
        profilePictureUrl: null,
      },
      organizationId: "org_required",
    });

    await expect(
      AuthenticatedPortal({ children: "private", returnTo: "/operations" }),
    ).resolves.toBeDefined();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});
