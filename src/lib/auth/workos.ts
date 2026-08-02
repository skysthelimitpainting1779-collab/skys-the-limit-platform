import "server-only";

import {
  getSignInUrl as getAuthKitSignInUrl,
  getSignUpUrl as getAuthKitSignUpUrl,
  withAuth,
} from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";

export const APP_ROLES = [
  "owner",
  "admin",
  "estimator",
  "project_manager",
  "crew_lead",
  "crew_member",
  "crew",
  "staff",
  "customer",
  "content_editor",
  "content_approver",
] as const;

export type AppRole = (typeof APP_ROLES)[number];

export interface PlatformUserSession {
  isAuthenticated: boolean;
  user: {
    id: string;
    email: string;
    name: string;
    role: AppRole | null;
    avatarUrl?: string;
  } | null;
  mode: "live_authkit" | "local_dev_mock" | "unauthenticated";
}

function isRecognizedRole(value: unknown): value is AppRole {
  return typeof value === "string" && APP_ROLES.includes(value as AppRole);
}

function getServerProvidedRole(user: unknown): AppRole | null {
  const metadata = (user as { metadata?: Record<string, unknown> } | null)
    ?.metadata;
  const role = metadata?.role;
  return isRecognizedRole(role) ? role : null;
}

function isWorkOSConfigured(): boolean {
  return Boolean(
    process.env.WORKOS_API_KEY &&
      process.env.WORKOS_CLIENT_ID &&
      !process.env.WORKOS_API_KEY.includes("REPLACE_ME") &&
      !process.env.WORKOS_CLIENT_ID.includes("REPLACE_ME"),
  );
}

function isLocalAuthMockAllowed(): boolean {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.ALLOW_LOCAL_AUTH_MOCK === "true"
  );
}

function unauthenticatedSession(): PlatformUserSession {
  return {
    isAuthenticated: false,
    user: null,
    mode: "unauthenticated",
  };
}

function sanitizeReturnTo(returnTo: string): string {
  return returnTo.startsWith("/") && !returnTo.startsWith("//")
    ? returnTo
    : "/";
}

function authUnavailableUrl(returnTo: string): string {
  return `/?auth=unavailable&returnTo=${encodeURIComponent(returnTo)}`;
}

/**
 * Returns the current WorkOS session. Missing configuration and provider
 * failures are unauthenticated by default. The owner mock is available only
 * during local development with an explicit opt-in.
 */
export async function getCurrentSession(): Promise<PlatformUserSession> {
  if (isWorkOSConfigured()) {
    try {
      const { user } = await withAuth();
      if (!user) return unauthenticatedSession();

      return {
        isAuthenticated: true,
        user: {
          id: user.id,
          email: user.email,
          name:
            `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
            user.email,
          role: getServerProvidedRole(user),
          avatarUrl: user.profilePictureUrl || undefined,
        },
        mode: "live_authkit",
      };
    } catch {
      console.error("[WorkOS] Session retrieval failed; access denied.");
      return unauthenticatedSession();
    }
  }

  if (isLocalAuthMockAllowed()) {
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

  return unauthenticatedSession();
}

export async function requirePortalSession(
  allowedRoles: readonly AppRole[],
  returnTo: string,
): Promise<NonNullable<PlatformUserSession["user"]>> {
  const safeReturnTo = sanitizeReturnTo(returnTo);
  const session = await getCurrentSession();

  if (!session.isAuthenticated || !session.user) {
    redirect(`/sign-in?returnTo=${encodeURIComponent(safeReturnTo)}`);
  }

  if (!session.user.role || !allowedRoles.includes(session.user.role)) {
    redirect("/?auth=forbidden");
  }

  return session.user;
}

export async function getPlatformSignInUrl(
  returnTo: string = "/operations",
): Promise<string> {
  const safeReturnTo = sanitizeReturnTo(returnTo);

  if (isWorkOSConfigured()) {
    try {
      return await getAuthKitSignInUrl({ state: safeReturnTo });
    } catch {
      console.error("[WorkOS] Sign-in URL generation failed.");
      return authUnavailableUrl(safeReturnTo);
    }
  }

  return isLocalAuthMockAllowed()
    ? safeReturnTo
    : authUnavailableUrl(safeReturnTo);
}

export async function getPlatformSignUpUrl(
  returnTo: string = "/operations",
): Promise<string> {
  const safeReturnTo = sanitizeReturnTo(returnTo);

  if (isWorkOSConfigured()) {
    try {
      return await getAuthKitSignUpUrl({ state: safeReturnTo });
    } catch {
      console.error("[WorkOS] Sign-up URL generation failed.");
      return authUnavailableUrl(safeReturnTo);
    }
  }

  return isLocalAuthMockAllowed()
    ? safeReturnTo
    : authUnavailableUrl(safeReturnTo);
}
