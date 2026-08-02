import React from "react";
import { PortalShell } from "@/components/portal/PortalShell";

export const metadata = {
  title: "Operations Command | Sky's the Limit Platform",
  description: "Real-time operations management, lead intake, estimate tracking, crew dispatch, and CMS editing.",
};

export default function OperationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PortalShell
      portalRole="operations"
      userEmail="operations@skysthelimitpainting.com"
      userName="Operations Manager"
    >
      {children}
    </PortalShell>
  );
}
