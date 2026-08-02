import React from "react";
import { PortalShell } from "@/components/portal/PortalShell";

export const metadata = {
  title: "Field Crew Portal | Sky's the Limit Platform",
  description: "Mobile-first crew portal for active assignments, surface prep checklists, and project updates.",
};

export default function CrewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PortalShell
      portalRole="crew"
      userEmail="elena.rostova@skysthelimitpainting.com"
      userName="Elena Rostova (Crew Lead)"
    >
      {children}
    </PortalShell>
  );
}
