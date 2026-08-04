import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

const authKitMocks = vi.hoisted(() => ({
  authkitProxy: vi.fn(
    (options: {
      middlewareAuth?: {
        enabled?: boolean;
        unauthenticatedPaths?: string[];
      };
    }) =>
      async (request: NextRequest) => {
        const isPublic = options.middlewareAuth?.unauthenticatedPaths?.includes(
          request.nextUrl.pathname,
        );
        return options.middlewareAuth?.enabled && !isPublic
          ? Response.redirect("https://api.workos.com/user_management/authorize", 307)
          : new Response(null, { status: 200 });
      },
  ),
}));

vi.mock("@workos-inc/authkit-nextjs", () => ({
  authkitProxy: authKitMocks.authkitProxy,
}));

import proxy from "../proxy";

describe("WorkOS AuthKit proxy enforcement", () => {
  it("enables middleware authentication with an explicit public allowlist", () => {
    expect(authKitMocks.authkitProxy).toHaveBeenCalledWith(
      expect.objectContaining({
        middlewareAuth: {
          enabled: true,
          unauthenticatedPaths: [
            "/",
            "/residential",
            "/commercial",
            "/public-sector",
            "/estimate",
            "/api/estimate",
            "/auth/callback",
            "/login",
            "/operations",
            "/crew",
            "/customer",
          ],
        },
      }),
    );
  });

  it.each(["/operations", "/crew", "/customer"])(
    "defers anonymous %s to the organization-scoped server layout",
    async (pathname) => {
      const response = await proxy(
        new NextRequest(`http://localhost:3000${pathname}`),
        {} as never,
      );
      if (!(response instanceof Response)) {
        throw new Error("AuthKit proxy did not return a response");
      }
      expect(response.status).toBe(200);
      expect(response.headers.get("location")).toBeNull();
    },
  );

  it.each(["/", "/estimate", "/api/estimate", "/auth/callback", "/login"])(
    "keeps the intentionally public %s path reachable",
    async (pathname) => {
      const response = await proxy(
        new NextRequest(`http://localhost:3000${pathname}`),
        {} as never,
      );
      if (!(response instanceof Response)) {
        throw new Error("AuthKit proxy did not return a response");
      }
      expect(response.status).toBe(200);
      expect(response.headers.get("location")).toBeNull();
    },
  );
});
