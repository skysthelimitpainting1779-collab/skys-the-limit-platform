import React from "react";
import { PortalShell } from "@/components/portal/PortalShell";

export const metadata = {
  title: "Customer Hub | Sky's the Limit Platform",
  description: "View project progress, written scope proposals, preparation guidelines, and project documents.",
};

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PortalShell
      portalRole="customer"
      userEmail="sarah.jenkins@example.com"
      userName="Sarah Jenkins"
    >
      {children}
    </PortalShell>
  );
}
