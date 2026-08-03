import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const authkit = vi.hoisted(() => ({
  getSignInUrl: vi.fn(),
  getSignUpUrl: vi.fn(),
  withAuth: vi.fn(),
}));

vi.mock("@workos-inc/authkit-nextjs", () => ({
  getSignInUrl: authkit.getSignInUrl,
  getSignUpUrl: authkit.getSignUpUrl,
  withAuth: authkit.withAuth,
}));

import {
  getCurrentSession,
  getPlatformSignInUrl,
  getPlatformSignUpUrl,
} from "@/lib/auth/workos";

function configureWorkOS() {
  vi.stubEnv("WORKOS_API_KEY", "sk_test_configured");
  vi.stubEnv("WORKOS_CLIENT_ID", "client_configured");
  vi.stubEnv("WORKOS_COOKIE_PASSWORD", "a_secure_cookie_password_32_chars");
  vi.stubEnv(
    "NEXT_PUBLIC_WORKOS_REDIRECT_URI",
    "http://localhost:3000/auth/callback",
  );
}

describe("WorkOS AuthKit fail-closed integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("WORKOS_API_KEY", "");
    vi.stubEnv("WORKOS_CLIENT_ID", "");
    vi.stubEnv("WORKOS_COOKIE_PASSWORD", "");
    vi.stubEnv("NEXT_PUBLIC_WORKOS_REDIRECT_URI", "");
    vi.stubEnv("ALLOW_LOCAL_AUTH_MOCK", "false");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns an unauthenticated session when WorkOS is not configured", async () => {
    const session = await getCurrentSession();

    expect(session).toEqual({
      isAuthenticated: false,
      user: null,
      mode: "unauthenticated",
    });
  });

  it("permits the owner mock only in explicit local development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("ALLOW_LOCAL_AUTH_MOCK", "true");

    const session = await getCurrentSession();

    expect(session.isAuthenticated).toBe(true);
    expect(session.mode).toBe("local_dev_mock");
    expect(session.user?.role).toBe("owner");
  });

  it("does not enable the mock in preview, production, or test environments", async () => {
    vi.stubEnv("ALLOW_LOCAL_AUTH_MOCK", "true");

    const session = await getCurrentSession();

    expect(session.isAuthenticated).toBe(false);
    expect(session.user).toBeNull();
  });

  it("fails closed when AuthKit session retrieval throws", async () => {
    configureWorkOS();
    authkit.withAuth.mockRejectedValue(new Error("session unavailable"));

    const session = await getCurrentSession();

    expect(session.isAuthenticated).toBe(false);
    expect(session.user).toBeNull();
    expect(session.mode).toBe("unauthenticated");
  });

  it("accepts only recognized server-provided roles", async () => {
    configureWorkOS();
    authkit.withAuth.mockResolvedValue({
      organizationId: "org_workos_123",
      role: "customer",
      user: {
        id: "user_workos_123",
        email: "customer@example.com",
        firstName: "Taylor",
        lastName: "Customer",
      },
    });

    const session = await getCurrentSession();

    expect(session.isAuthenticated).toBe(true);
    expect(session.user?.role).toBe("customer");
    expect(session.user?.organizationId).toBe("org_workos_123");
    expect(session.mode).toBe("live_authkit");
  });

  it("does not invent an owner role when authenticated metadata has no valid role", async () => {
    configureWorkOS();
    authkit.withAuth.mockResolvedValue({
      organizationId: "org_workos_456",
      role: "super_owner",
      user: {
        id: "user_workos_456",
        email: "unknown@example.com",
        firstName: "Unknown",
        lastName: "Role",
      },
    });

    const session = await getCurrentSession();

    expect(session.isAuthenticated).toBe(true);
    expect(session.user?.role).toBeNull();
  });

  it("does not trust mutable user metadata as an authorization role", async () => {
    configureWorkOS();
    authkit.withAuth.mockResolvedValue({
      organizationId: "org_workos_789",
      user: {
        id: "user_workos_789",
        email: "attacker@example.com",
        firstName: "Metadata",
        lastName: "Attacker",
        metadata: { role: "owner" },
      },
    });

    const session = await getCurrentSession();

    expect(session.isAuthenticated).toBe(true);
    expect(session.user?.role).toBeNull();
  });

  it("returns an explicit unavailable route rather than a protected destination when auth is unconfigured", async () => {
    await expect(getPlatformSignInUrl("/operations")).resolves.toBe(
      "/?auth=unavailable&returnTo=%2Foperations",
    );
    await expect(getPlatformSignUpUrl("/customer")).resolves.toBe(
      "/?auth=unavailable&returnTo=%2Fcustomer",
    );
  });
});
