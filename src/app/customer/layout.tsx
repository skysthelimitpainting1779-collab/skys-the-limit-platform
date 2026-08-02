import React from "react";
import { PortalShell } from "@/components/portal/PortalShell";
import { requirePortalSession } from "@/lib/auth/workos";

export const metadata = {
  title: "Customer Hub | Sky's the Limit Platform",
  description:
    "View project progress, written scope proposals, preparation guidelines, and project documents.",
};

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requirePortalSession(["customer"], "/customer");

  return (
    <PortalShell
      portalRole="customer"
      userEmail={user.email}
      userName={user.name}
    >
      {children}
    </PortalShell>
  );
}
