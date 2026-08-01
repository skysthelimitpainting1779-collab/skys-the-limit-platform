import type { Metadata } from "next";
import { PortalSetupState } from "@/components/platform/PortalSetupState";

export const metadata: Metadata = {
  title: "Operations Workspace Setup",
  description: "Privileged operations access is reserved until authentication, authorization, and audit boundaries are verified.",
  robots: { index: false, follow: false },
};

const requirements = [
  "Provision invitation-only operations identities with multi-factor authentication.",
  "Connect a non-production Convex deployment and seed synthetic business records.",
  "Pass role, organization, audit-event, and destructive-action authorization tests.",
  "Complete an independent security review before any real business record is imported.",
] as const;

export default function OperationsPage() {
  return (
    <PortalSetupState
      audience="Operations workspace"
      title="Privileged operations access is not active yet"
      description="This route is reserved for authenticated owner and office workflows. It intentionally exposes no customer records, lead queues, estimates, schedules, crew data, financial data, or administrative controls while provider setup is incomplete."
      activationRequirements={requirements}
    />
  );
}
