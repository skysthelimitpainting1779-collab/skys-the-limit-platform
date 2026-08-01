import type { Metadata } from "next";
import { PortalSetupState } from "@/components/platform/PortalSetupState";

export const metadata: Metadata = {
  title: "Customer Portal Setup",
  description: "Protected customer access is reserved until identity and isolated data environments are verified.",
  robots: { index: false, follow: false },
};

const requirements = [
  "Configure WorkOS Staging redirects and session handling for the Preview origin.",
  "Connect a non-production Convex deployment containing only test records.",
  "Pass tests proving each customer can reach only records linked to that customer.",
  "Complete a protected Preview review before enabling invitations.",
] as const;

export default function CustomerPage() {
  return (
    <PortalSetupState
      audience="Customer portal"
      title="Customer access is not active yet"
      description="This route is reserved for authenticated customer access, but it intentionally exposes no estimates, projects, documents, messages, or payment functions until the identity and data boundaries are provisioned and tested."
      activationRequirements={requirements}
    />
  );
}
