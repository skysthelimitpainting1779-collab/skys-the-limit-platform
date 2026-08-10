import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const authKitMocks = vi.hoisted(() => ({
  authkit: vi.fn(),
  handleAuthkitProxy: vi.fn(
    (
      request: NextRequest,
      _headers: Headers,
      options?: { redirect?: string | URL; redirectStatus?: number },
    ) =>
      options?.redirect
        ? Response.redirect(new URL(options.redirect, request.url), options.redirectStatus ?? 307)
        : new Response(null, { status: 200 }),
  ),
}));

vi.mock("@workos-inc/authkit-nextjs", () => ({
  authkit: authKitMocks.authkit,
  handleAuthkitProxy: authKitMocks.handleAuthkitProxy,
}));

import proxy from "../proxy";

describe("WorkOS AuthKit proxy enforcement", () => {
  beforeEach(() => {
    authKitMocks.authkit.mockReset();
    authKitMocks.handleAuthkitProxy.mockClear();
    authKitMocks.authkit.mockResolvedValue({
      session: { user: null },
      headers: new Headers(),
      authorizationUrl: "https://api.workos.com/user_management/authorize",
    });
  });

  it.each(["/operations", "/crew", "/customer"])(
    "routes anonymous %s through the organization-pinned login handler",
    async (pathname) => {
      const response = await proxy(
        new NextRequest(`http://localhost:3000${pathname}`),
      );
      if (!(response instanceof Response)) {
        throw new Error("AuthKit proxy did not return a response");
      }
      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe(
        `http://localhost:3000/login?returnTo=${encodeURIComponent(pathname)}`,
      );
    },
  );

  it("reduces nested protected paths to an allowlisted portal return path", async () => {
    const response = await proxy(
      new NextRequest("http://localhost:3000/operations/jobs/private"),
    );
    if (!(response instanceof Response)) {
      throw new Error("AuthKit proxy did not return a response");
    }
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?returnTo=%2Foperations",
    );
  });

  it.each([
    "/",
    "/residential",
    "/commercial",
    "/public-sector",
    "/estimate",
    "/api/estimate",
    "/auth/callback",
    "/login",
  ])(
    "keeps the intentionally public %s path reachable",
    async (pathname) => {
      const response = await proxy(
        new NextRequest(`http://localhost:3000${pathname}`),
      );
      if (!(response instanceof Response)) {
        throw new Error("AuthKit proxy did not return a response");
      }
      expect(response.status).toBe(200);
      expect(response.headers.get("location")).toBeNull();
    },
  );

  it("allows an authenticated session to continue", async () => {
    authKitMocks.authkit.mockResolvedValue({
      session: { user: { id: "user_preview" } },
      headers: new Headers(),
      authorizationUrl: null,
    });

    const response = await proxy(
      new NextRequest("http://localhost:3000/operations"),
    );
    if (!(response instanceof Response)) {
      throw new Error("AuthKit proxy did not return a response");
    }
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });
});
