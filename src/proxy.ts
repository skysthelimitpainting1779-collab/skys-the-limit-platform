import { authkitProxy } from "@workos-inc/authkit-nextjs";

export default authkitProxy({
  redirectUri: process.env.WORKOS_REDIRECT_URI,
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
    ],
  },
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|brand|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
