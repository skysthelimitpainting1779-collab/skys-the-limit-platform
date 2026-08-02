import React from "react";
import { PortalShell } from "@/components/portal/PortalShell";
import { requirePortalSession } from "@/lib/auth/workos";

export const metadata = {
  title: "Operations Command | Sky's the Limit Platform",
  description:
    "Real-time operations management, lead intake, estimate tracking, crew dispatch, and CMS editing.",
};

const OPERATIONS_ROLES = [
  "owner",
  "admin",
  "estimator",
  "project_manager",
  "content_editor",
  "content_approver",
] as const;

export default async function OperationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requirePortalSession(OPERATIONS_ROLES, "/operations");

  return (
    <PortalShell
      portalRole="operations"
      userEmail={user.email}
      userName={user.name}
    >
      {children}
    </PortalShell>
  );
}
