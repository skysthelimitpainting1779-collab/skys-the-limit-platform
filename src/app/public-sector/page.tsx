import type { Metadata } from "next";
import { ServicePathPage } from "@/components/marketing/ServicePathPage";

export const metadata: Metadata = {
  title: "Public-Sector Opportunity Intake",
  description:
    "Share a solicitation identifier, agency, deadline, scope documents, and submission requirements for an initial opportunity review.",
};

const scopeCards = [
  {
    title: "Opportunity identity",
    description: "The exact source record that governs the review",
    prompts: [
      "Provide the agency, solicitation number, public portal, and deadline with timezone.",
      "List mandatory meetings, site visits, question deadlines, and addenda.",
      "Use source documents rather than summaries when requirements conflict.",
    ],
  },
  {
    title: "Scope documents",
    description: "Files and sections needed to understand the requested work",
    prompts: [
      "Identify specifications, drawings, schedules, bid forms, and pricing sheets.",
      "Separate painting scope from repair, traffic, access, or other trade requirements.",
      "Record document revisions so an obsolete addendum is never treated as current.",
    ],
  },
  {
    title: "Submission requirements",
    description: "Items that must be verified before any bid decision",
    prompts: [
      "List insurance, registration, wage-program, bonding, and certification requirements exactly as written.",
      "Identify required signatures, acknowledgements, forms, and delivery method.",
      "Do not infer eligibility or prior experience that has not been documented.",
    ],
  },
] as const;

const intakeQuestions = [
  "What is the exact solicitation identifier and official source URL?",
  "Which date, time, and timezone control the submission deadline?",
  "Which requirements are mandatory before a bid can be considered responsive?",
  "Have all addenda and site-visit obligations been captured?",
] as const;

export default function PublicSectorPage() {
  return (
    <ServicePathPage
      badge="Public-sector opportunity path"
      title="Start with the solicitation, deadline, and source documents"
      introduction="This path supports an initial opportunity review. It does not assert eligibility, certifications, wage-program compliance, bonding, or award history. Every requirement must be verified against current source documents before any submission decision."
      scopeCards={scopeCards}
      intakeQuestions={intakeQuestions}
      note="Submitting an opportunity through this intake is not a bid, qualification statement, or promise to submit. It creates a traceable record for document and requirement review."
      estimateLabel="Start opportunity intake"
    />
  );
}
