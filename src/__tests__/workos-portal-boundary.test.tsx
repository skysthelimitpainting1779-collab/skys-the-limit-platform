import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

  it("redirects an anonymous session through the organization-pinned login", async () => {
    mocks.withAuth.mockResolvedValue({ user: null });

    await expect(
      AuthenticatedPortal({ children: "private", returnTo: "/crew" }),
    ).rejects.toThrow("NEXT_REDIRECT");
    expect(mocks.redirect).toHaveBeenCalledWith("/login?returnTo=%2Fcrew");
  });

  it("rejects a valid session from a different WorkOS organization", async () => {
    mocks.withAuth.mockResolvedValue({
      user: { email: "other@example.com" },
      organizationId: "org_other",
    });

    await expect(
      AuthenticatedPortal({ children: "private", returnTo: "/operations" }),
    ).rejects.toThrow("NEXT_REDIRECT");
    expect(mocks.redirect).toHaveBeenCalledWith(
      "/login?returnTo=%2Foperations",
    );
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
