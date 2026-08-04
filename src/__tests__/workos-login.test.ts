import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const authMocks = vi.hoisted(() => ({
  getSignInUrl: vi.fn().mockResolvedValue("https://auth.example.test/sign-in"),
  redirect: vi.fn(),
}));

vi.mock("@workos-inc/authkit-nextjs", () => ({
  getSignInUrl: authMocks.getSignInUrl,
}));

vi.mock("next/navigation", () => ({
  redirect: authMocks.redirect,
}));

import { GET } from "@/app/login/route";

describe("WorkOS login organization boundary", () => {
  const originalOrganizationId = process.env.WORKOS_ORGANIZATION_ID;

  beforeEach(() => {
    authMocks.getSignInUrl.mockClear();
    authMocks.redirect.mockClear();
    process.env.WORKOS_ORGANIZATION_ID = "org_trusted_server_config";
  });

  afterEach(() => {
    if (originalOrganizationId === undefined) {
      delete process.env.WORKOS_ORGANIZATION_ID;
    } else {
      process.env.WORKOS_ORGANIZATION_ID = originalOrganizationId;
    }
  });

  it("passes the server-configured organization to AuthKit", async () => {
    await GET(new Request("http://localhost/login?returnTo=%2Fcrew"));

    expect(authMocks.getSignInUrl).toHaveBeenCalledWith({
      organizationId: "org_trusted_server_config",
      returnTo: "/crew",
    });
    expect(authMocks.redirect).toHaveBeenCalledWith(
      "https://auth.example.test/sign-in",
    );
  });

  it("rejects an arbitrary return path", async () => {
    await GET(
      new Request(
        "http://localhost/login?returnTo=https%3A%2F%2Fevil.example.test",
      ),
    );

    expect(authMocks.getSignInUrl).toHaveBeenCalledWith({
      organizationId: "org_trusted_server_config",
      returnTo: "/operations",
    });
  });

  it("fails closed when the trusted organization is not configured", async () => {
    delete process.env.WORKOS_ORGANIZATION_ID;

    await expect(
      GET(new Request("http://localhost/login?returnTo=%2Foperations")),
    ).rejects.toThrow("WORKOS_ORGANIZATION_ID must be configured");
    expect(authMocks.getSignInUrl).not.toHaveBeenCalled();
  });
});
