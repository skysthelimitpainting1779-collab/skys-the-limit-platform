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

const ENV_KEYS = [
  "WORKOS_API_KEY",
  "WORKOS_CLIENT_ID",
  "ALLOW_LOCAL_AUTH_MOCK",
] as const;

function clearAuthEnvironment() {
  for (const key of ENV_KEYS) delete process.env[key];
}

function configureWorkOS() {
  process.env.WORKOS_API_KEY = "sk_test_configured";
  process.env.WORKOS_CLIENT_ID = "client_configured";
}

describe("WorkOS AuthKit fail-closed integration", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.clearAllMocks();
    clearAuthEnvironment();
    process.env.NODE_ENV = "test";
  });

  afterEach(() => {
    clearAuthEnvironment();
    process.env.NODE_ENV = originalNodeEnv;
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
    process.env.NODE_ENV = "development";
    process.env.ALLOW_LOCAL_AUTH_MOCK = "true";

    const session = await getCurrentSession();

    expect(session.isAuthenticated).toBe(true);
    expect(session.mode).toBe("local_dev_mock");
    expect(session.user?.role).toBe("owner");
  });

  it("does not enable the mock in preview, production, or test environments", async () => {
    process.env.ALLOW_LOCAL_AUTH_MOCK = "true";

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
      user: {
        id: "user_workos_123",
        email: "customer@example.com",
        firstName: "Taylor",
        lastName: "Customer",
        metadata: { role: "customer" },
      },
    });

    const session = await getCurrentSession();

    expect(session.isAuthenticated).toBe(true);
    expect(session.user?.role).toBe("customer");
    expect(session.mode).toBe("live_authkit");
  });

  it("does not invent an owner role when authenticated metadata has no valid role", async () => {
    configureWorkOS();
    authkit.withAuth.mockResolvedValue({
      user: {
        id: "user_workos_456",
        email: "unknown@example.com",
        firstName: "Unknown",
        lastName: "Role",
        metadata: { role: "super_owner" },
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
