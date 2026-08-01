import type { Metadata } from "next";
import { PortalSetupState } from "@/components/platform/PortalSetupState";

export const metadata: Metadata = {
  title: "Crew Workspace Setup",
  description: "Protected crew access is reserved until role and assignment isolation are verified.",
  robots: { index: false, follow: false },
};

const requirements = [
  "Create invitation-only crew identities in WorkOS Staging.",
  "Connect a non-production Convex deployment with synthetic assignments only.",
  "Pass tests proving crew members can access only their own assigned projects.",
  "Review mobile, accessibility, and offline-risk behavior before field use.",
] as const;

export default function CrewPage() {
  return (
    <PortalSetupState
      audience="Crew workspace"
      title="Crew access is not active yet"
      description="This route is reserved for authenticated field access. It does not currently display schedules, customer details, instructions, checklists, photos, time records, or safety records."
      activationRequirements={requirements}
    />
  );
}
