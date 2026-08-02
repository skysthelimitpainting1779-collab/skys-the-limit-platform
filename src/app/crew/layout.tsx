import React from "react";
import { PortalShell } from "@/components/portal/PortalShell";
import { requirePortalSession } from "@/lib/auth/workos";

export const metadata = {
  title: "Field Crew Portal | Sky's the Limit Platform",
  description:
    "Mobile-first crew portal for active assignments, surface prep checklists, and project updates.",
};

const CREW_ROLES = ["crew_lead", "crew_member", "crew", "staff"] as const;

export default async function CrewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requirePortalSession(CREW_ROLES, "/crew");

  return (
    <PortalShell
      portalRole="crew"
      userEmail={user.email}
      userName={user.name}
    >
      {children}
    </PortalShell>
  );
}
