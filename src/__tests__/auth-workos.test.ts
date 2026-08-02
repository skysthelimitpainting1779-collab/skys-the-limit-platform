import { describe, it, expect, vi } from "vitest";

vi.mock("@workos-inc/authkit-nextjs", () => ({
  getSignInUrl: vi.fn().mockResolvedValue("https://api.workos.com/user_management/authorize"),
  getSignUpUrl: vi.fn().mockResolvedValue("https://api.workos.com/user_management/authorize?screen_hint=sign-up"),
  withAuth: vi.fn().mockResolvedValue({
    user: {
      id: "user_workos_123",
      email: "operator@skysthelimitpainting.com",
      firstName: "Sky's",
      lastName: "Operator",
    },
  }),
  authkitMiddleware: vi.fn(() => vi.fn()),
  handleAuth: vi.fn(() => vi.fn()),
  signOut: vi.fn().mockResolvedValue(undefined),
}));

import { getCurrentSession, getPlatformSignInUrl, getPlatformSignUpUrl } from "@/lib/auth/workos";

describe("WorkOS AuthKit Integration Module", () => {
  it("provides active user session fallback in development/preview mode", async () => {
    const session = await getCurrentSession();
    expect(session.isAuthenticated).toBe(true);
    expect(session.user).not.toBeNull();
    expect(session.user?.email).toBe("operator@skysthelimitpainting.com");
    expect(session.user?.role).toBe("owner");
  });

  it("returns returnTo destination URL when WorkOS credentials are in mock mode", async () => {
    const signInUrl = await getPlatformSignInUrl("/operations");
    const signUpUrl = await getPlatformSignUpUrl("/customer");

    expect(signInUrl).toBe("/operations");
    expect(signUpUrl).toBe("/customer");
  });
});
