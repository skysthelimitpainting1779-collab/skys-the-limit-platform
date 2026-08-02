import {
  authkit,
  handleAuthkitHeaders,
} from "@workos-inc/authkit-nextjs";
import { NextRequest, NextResponse } from "next/server";

function isProtectedPortalPath(pathname: string): boolean {
  return (
    pathname.startsWith("/operations") ||
    pathname.startsWith("/customer") ||
    pathname.startsWith("/crew")
  );
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  try {
    const { session, headers, authorizationUrl } = await authkit(request);

    if (isProtectedPortalPath(pathname) && !session.user) {
      const fallback = `/?auth=unavailable&returnTo=${encodeURIComponent(
        pathname,
      )}`;
      return handleAuthkitHeaders(request, headers, {
        redirect: authorizationUrl || fallback,
      });
    }

    return handleAuthkitHeaders(request, headers);
  } catch {
    if (isProtectedPortalPath(pathname)) {
      const unavailable = new URL("/", request.url);
      unavailable.searchParams.set("auth", "unavailable");
      unavailable.searchParams.set("returnTo", pathname);
      return NextResponse.redirect(unavailable);
    }

    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|brand|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
