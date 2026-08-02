import { getSignInUrl as getAuthKitSignInUrl, getSignUpUrl as getAuthKitSignUpUrl, withAuth } from "@workos-inc/authkit-nextjs";

export interface PlatformUserSession {
  isAuthenticated: boolean;
  user: {
    id: string;
    email: string;
    name: string;
    role: "owner" | "admin" | "estimator" | "project_manager" | "crew_lead" | "crew_member" | "customer" | "content_editor" | "content_approver";
    avatarUrl?: string;
  } | null;
  mode: "live_authkit" | "local_dev_mock";
}

/**
 * Returns the current authenticated user session from WorkOS AuthKit or mock fallback.
 */
export async function getCurrentSession(): Promise<PlatformUserSession> {
  const isWorkOSConfigured = Boolean(
    process.env.WORKOS_API_KEY &&
      process.env.WORKOS_CLIENT_ID &&
      !process.env.WORKOS_API_KEY.includes("REPLACE_ME")
  );

  if (isWorkOSConfigured) {
    try {
      const { user } = await withAuth();
      if (user) {
        return {
          isAuthenticated: true,
          user: {
            id: user.id,
            email: user.email,
            name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
            role: "owner",
            avatarUrl: user.profilePictureUrl || undefined,
          },
          mode: "live_authkit",
        };
      }
    } catch (err) {
      console.warn("[WorkOS] Session retrieval error, falling back to dev session:", err);
    }
  }

  // Local development / preview mock session default
  return {
    isAuthenticated: true,
    user: {
      id: "user_operator_local",
      email: "operator@skysthelimitpainting.com",
      name: "Sky’s Operator",
      role: "owner",
    },
    mode: "local_dev_mock",
  };
}

/**
 * Generates the WorkOS AuthKit Sign-In URL or local fallback.
 */
export async function getPlatformSignInUrl(returnTo: string = "/operations"): Promise<string> {
  const isWorkOSConfigured = Boolean(
    process.env.WORKOS_API_KEY &&
      process.env.WORKOS_CLIENT_ID &&
      !process.env.WORKOS_API_KEY.includes("REPLACE_ME")
  );

  if (isWorkOSConfigured) {
    try {
      return await getAuthKitSignInUrl({ state: returnTo });
    } catch (err) {
      console.warn("[WorkOS] Failed to generate AuthKit sign-in URL:", err);
    }
  }

  return returnTo;
}

/**
 * Generates the WorkOS AuthKit Sign-Up URL or local fallback.
 */
export async function getPlatformSignUpUrl(returnTo: string = "/operations"): Promise<string> {
  const isWorkOSConfigured = Boolean(
    process.env.WORKOS_API_KEY &&
      process.env.WORKOS_CLIENT_ID &&
      !process.env.WORKOS_API_KEY.includes("REPLACE_ME")
  );

  if (isWorkOSConfigured) {
    try {
      return await getAuthKitSignUpUrl({ state: returnTo });
    } catch (err) {
      console.warn("[WorkOS] Failed to generate AuthKit sign-up URL:", err);
    }
  }

  return returnTo;
}
