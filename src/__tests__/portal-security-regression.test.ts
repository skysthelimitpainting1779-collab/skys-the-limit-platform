import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function source(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("portal security regression contract", () => {
  it("configures WorkOS JWT verification for Convex", () => {
    const authConfig = source("convex/auth.config.ts");
    const auth = source("convex/auth.ts");
    const http = source("convex/http.ts");

    expect(authConfig).toContain("authKit.getAuthConfigProviders()");
    expect(auth).toContain("new AuthKit<DataModel>");
    expect(auth).toContain("authKit.events");
    expect(auth).toContain("globalThis.crypto.randomUUID()");
    expect(auth).not.toContain("whsec_UNCONFIGURED_FAIL_CLOSED");
    expect(http).toContain("authKit.registerRoutes(http)");
  });

  it("passes AuthKit access tokens to Convex", () => {
    const provider = source(
      "src/components/providers/ConvexClientProvider.tsx",
    );

    expect(provider).toContain("ConvexProviderWithAuth");
    expect(provider).toContain("AuthKitProvider");
    expect(provider).toContain("useAccessToken");
    expect(provider).toContain("api.users.store");
    expect(provider).toContain("ProvisionAuthenticatedUser");
    expect(provider).not.toContain("FALLBACK_CONVEX_URL");
  });

  it("binds Convex users to issuer-scoped WorkOS principals", () => {
    const authorization = source("convex/lib/authorization.ts");
    const users = source("convex/users.ts");
    const storeMutation = users.slice(
      users.indexOf("export const store"),
      users.indexOf("export const updateRole"),
    );

    expect(authorization).toContain("identity.tokenIdentifier");
    expect(authorization).not.toContain("identity.subject ||");
    expect(users).toContain('withIndex("by_tokenIdentifier"');
    expect(storeMutation).not.toContain("args.role");
    expect(storeMutation).not.toContain("role: userRoleValidator");
    expect(storeMutation).not.toContain('stringClaim(identity, "role")');
    expect(storeMutation).toContain('"workos_webhook"');
    expect(users).toContain(
      "export const provisionMembership = internalMutation",
    );
  });

  it("tenant-scopes anonymous lead intake from server configuration", () => {
    const estimateRoute = source("src/app/api/estimate/route.ts");

    expect(estimateRoute).toContain("NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID");
    expect(estimateRoute).toContain("const mutationInput");
    expect(estimateRoute).toContain("orgId,");
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
    expect(envExample).toContain("WORKOS_WEBHOOK_SECRET=whsec_REPLACE_ME");
    expect(workos).toContain('process.env.NODE_ENV === "development"');
    expect(workos).toContain('process.env.ALLOW_LOCAL_AUTH_MOCK === "true"');
  });
});
