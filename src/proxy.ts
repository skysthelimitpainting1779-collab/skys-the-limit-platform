import { authkitProxy } from "@workos-inc/authkit-nextjs";

// Populate WorkOS environment variables at runtime if not present
if (!process.env.WORKOS_COOKIE_PASSWORD || process.env.WORKOS_COOKIE_PASSWORD.length < 32) {
  process.env.WORKOS_COOKIE_PASSWORD = "skys_signature_platform_cookie_password_32chars_min";
}

if (!process.env.WORKOS_REDIRECT_URI) {
  process.env.WORKOS_REDIRECT_URI =
    process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI || "http://localhost:3000/auth/callback";
}

export default authkitProxy({
  redirectUri: process.env.WORKOS_REDIRECT_URI,
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|brand|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
