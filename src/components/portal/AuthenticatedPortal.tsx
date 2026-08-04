import { withAuth } from "@workos-inc/authkit-nextjs";
import type { ReactNode } from "react";
import { signOutFromPortal } from "@/app/actions/auth";
import { PortalShell } from "./PortalShell";

function PortalAccessDenied({
  loginPath,
  hasSession,
}: {
  loginPath: string;
  hasSession: boolean;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-16 text-foreground">
      <section className="w-full max-w-xl rounded-xl border border-border bg-card p-6 shadow-sm">
        <p className="text-sm font-semibold text-primary">Protected workspace</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">
          {hasSession
            ? "This WorkOS organization is not authorized"
            : "Sign in is required"}
        </h1>
        <p className="mt-3 max-w-prose text-sm leading-6 text-muted-foreground">
          {hasSession
            ? "Your session belongs to a different WorkOS organization. No protected records were loaded."
            : "No authenticated WorkOS session is available. No protected records were loaded."}
        </p>
        {/* A full navigation lets the AuthKit route handler set its transaction cookie. */}
        <a
          href={loginPath}
          className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Sign in to the authorized WorkOS organization
        </a>
      </section>
    </main>
  );
}

export async function AuthenticatedPortal({
  children,
  returnTo,
}: {
  children: ReactNode;
  returnTo: "/operations" | "/crew" | "/customer";
}) {
  const requiredOrganizationId = process.env.WORKOS_ORGANIZATION_ID;
  if (!requiredOrganizationId) {
    throw new Error("WORKOS_ORGANIZATION_ID must be configured");
  }
  const { user, organizationId } = await withAuth();
  const loginPath = `/login?returnTo=${encodeURIComponent(returnTo)}`;
  if (!user || organizationId !== requiredOrganizationId) {
    return <PortalAccessDenied loginPath={loginPath} hasSession={Boolean(user)} />;
  }
  const name =
    [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
    user.email;

  return (
    <PortalShell
      serverUser={{
        name,
        email: user.email,
        avatarUrl: user.profilePictureUrl ?? undefined,
      }}
      signOutAction={signOutFromPortal}
    >
      {children}
    </PortalShell>
  );
}
