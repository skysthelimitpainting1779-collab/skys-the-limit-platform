import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function source(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("portal security regression contract", () => {
  it("configures WorkOS JWT verification for Convex", () => {
    const authConfig = source("convex/auth.config.ts");

    expect(authConfig).toContain('type: "customJwt"');
    expect(authConfig).toContain("WORKOS_CLIENT_ID");
    expect(authConfig).toContain("api.workos.com/sso/jwks");
  });

  it("passes AuthKit access tokens to Convex", () => {
    const provider = source(
      "src/components/providers/ConvexClientProvider.tsx",
    );

    expect(provider).toContain("ConvexProviderWithAuth");
    expect(provider).toContain("AuthKitProvider");
    expect(provider).toContain("useAccessToken");
    expect(provider).not.toContain("FALLBACK_CONVEX_URL");
  });

  it("protects portal routes before rendering", () => {
    const proxy = source("src/proxy.ts");

    expect(proxy).toContain("authorizationUrl");
    expect(proxy).toContain('pathname.startsWith("/operations")');
    expect(proxy).toContain('pathname.startsWith("/customer")');
    expect(proxy).toContain('pathname.startsWith("/crew")');
    expect(proxy).toContain("handleAuthkitHeaders");
  });

  it.each([
    "src/app/operations/layout.tsx",
    "src/app/customer/layout.tsx",
    "src/app/crew/layout.tsx",
  ])("derives portal identity in %s", (path) => {
    const layout = source(path);

    expect(layout).toContain("requirePortalSession");
    expect(layout).not.toContain("operations@skysthelimitpainting.com");
    expect(layout).not.toContain("sarah.jenkins@example.com");
    expect(layout).not.toContain("elena.rostova@skysthelimitpainting.com");
  });

  it("derives customer, crew, author, approver, and audit identity from Convex auth", () => {
    const portals = source("convex/portals.ts");
    const cms = source("convex/cms.ts");

    expect(portals).toContain("requireAuthenticatedUser");
    expect(portals).not.toContain("args: { email: v.string() }");
    expect(portals).not.toContain('userId: v.id("users")');

    expect(cms).toContain("requireAuthenticatedUser");
    expect(cms).not.toContain('authorId: v.id("users")');
    expect(cms).not.toContain('approverId: v.id("users")');
  });

  it("keeps local owner impersonation explicitly disabled by default", () => {
    const envExample = source(".env.example");
    const workos = source("src/lib/auth/workos.ts");

    expect(envExample).toContain("ALLOW_LOCAL_AUTH_MOCK=false");
    expect(workos).toContain('process.env.NODE_ENV === "development"');
    expect(workos).toContain('process.env.ALLOW_LOCAL_AUTH_MOCK === "true"');
  });
});
