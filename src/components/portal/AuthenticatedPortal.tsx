import { withAuth } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { signOutFromPortal } from "@/app/actions/auth";
import { PortalShell } from "./PortalShell";

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
  if (!user || organizationId !== requiredOrganizationId) redirect(loginPath);
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
