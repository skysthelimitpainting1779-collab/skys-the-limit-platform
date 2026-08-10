import { authkit, handleAuthkitProxy } from "@workos-inc/authkit-nextjs";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = new Set([
  "/",
  "/residential",
  "/commercial",
  "/public-sector",
  "/estimate",
  "/api/estimate",
  "/auth/callback",
  "/login",
]);

const PORTAL_ROOTS = ["/operations", "/crew", "/customer"] as const;

function safePortalReturnTo(pathname: string) {
  return (
    PORTAL_ROOTS.find(
      (portalRoot) =>
        pathname === portalRoot || pathname.startsWith(`${portalRoot}/`),
    ) ?? "/operations"
  );
}

export default async function proxy(request: NextRequest) {
  const { session, headers } = await authkit(request, {
    redirectUri: process.env.WORKOS_REDIRECT_URI,
  });

  if (!PUBLIC_PATHS.has(request.nextUrl.pathname) && !session.user) {
    const returnTo = safePortalReturnTo(request.nextUrl.pathname);
    return handleAuthkitProxy(request, headers, {
      redirect: `/login?returnTo=${encodeURIComponent(returnTo)}`,
    });
  }

  return handleAuthkitProxy(request, headers);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|brand|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
