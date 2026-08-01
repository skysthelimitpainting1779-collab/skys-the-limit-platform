import type { Metadata } from "next";
import { ServicePathPage } from "@/components/marketing/ServicePathPage";

export const metadata: Metadata = {
  title: "Commercial Painting Project Intake",
  description:
    "Describe the property, occupied-space constraints, surfaces, decision process, and timing for a commercial painting estimate.",
};

const scopeCards = [
  {
    title: "Property context",
    description: "The building, responsible contact, and affected spaces",
    prompts: [
      "Identify the property type and the person responsible for scope decisions.",
      "List common areas, tenant spaces, offices, service areas, or exterior elevations.",
      "State whether drawings, finish schedules, or property standards exist.",
    ],
  },
  {
    title: "Access and occupancy",
    description: "Constraints that affect how the scope must be reviewed",
    prompts: [
      "Describe operating hours, occupied zones, loading access, and security procedures.",
      "Call out lifts, ladders, roof access, traffic control, or tenant coordination that may be relevant.",
      "Do not assume an alternate work schedule until availability is confirmed.",
    ],
  },
  {
    title: "Decision and documentation",
    description: "What the buyer needs before approving work",
    prompts: [
      "Provide the desired proposal format, deadline, and required contacts.",
      "List insurance, vendor-registration, or site-orientation requirements for review.",
      "Separate base scope, alternates, exclusions, and future phases when possible.",
    ],
  },
] as const;

const intakeQuestions = [
  "Who owns the scope decision and who will approve the final estimate?",
  "Which spaces must remain accessible while the project is evaluated?",
  "Are drawings, specifications, or property standards available?",
  "What proposal date and potential work window should be reviewed?",
] as const;

export default function CommercialPage() {
  return (
    <ServicePathPage
      badge="Commercial project path"
      title="Define the property, operating constraints, and approval path"
      introduction="Commercial pricing depends on more than square footage. The intake should identify affected spaces, occupancy, access, documentation, decision-makers, and timing so the first review can determine what must be measured or clarified."
      scopeCards={scopeCards}
      intakeQuestions={intakeQuestions}
      note="Availability, access planning, materials, insurance requirements, and any special site conditions are reviewed before a commitment is made."
      estimateLabel="Start commercial estimate"
    />
  );
}
