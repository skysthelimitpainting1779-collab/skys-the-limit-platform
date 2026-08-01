import type { Metadata } from "next";
import { ServicePathPage } from "@/components/marketing/ServicePathPage";

export const metadata: Metadata = {
  title: "Residential Painting Project Intake",
  description:
    "Describe the rooms, exterior areas, surface condition, access, and timing for a residential painting estimate.",
};

const scopeCards = [
  {
    title: "Interior areas",
    description: "Rooms and surfaces included in the requested scope",
    prompts: [
      "List walls, ceilings, trim, doors, cabinets, or other surfaces separately.",
      "Note visible stains, peeling, cracks, holes, or prior repairs.",
      "Identify occupied rooms, furniture constraints, pets, or access limits.",
    ],
  },
  {
    title: "Exterior areas",
    description: "Building sides, trim, entries, decks, and detached structures",
    prompts: [
      "Describe the siding or surface material when known.",
      "Call out height, slope, landscaping, gates, or neighboring-property access.",
      "Include photos later only when a secure upload path is available.",
    ],
  },
  {
    title: "Detail or repair work",
    description: "Items that may need separate review before pricing",
    prompts: [
      "Describe woodwork, cabinets, railings, or other detailed surfaces.",
      "Separate known repairs from painting so the scope is not ambiguous.",
      "State the desired outcome without assuming a specific product or method.",
    ],
  },
] as const;

const intakeQuestions = [
  "Which areas are included, and which areas should be excluded?",
  "What surface condition or prior coating problems are visible?",
  "Will the property be occupied while the work is considered?",
  "What date range matters, and is that date flexible?",
] as const;

export default function ResidentialPage() {
  return (
    <ServicePathPage
      badge="Residential project path"
      title="Start with the surfaces, condition, and access"
      introduction="A useful residential estimate request identifies the property, the exact areas under consideration, the current condition, and the timing. Final preparation methods, products, sequence, and feasibility are confirmed only after the scope is reviewed."
      scopeCards={scopeCards}
      intakeQuestions={intakeQuestions}
      note="The first review determines whether the information is sufficient for a written scope or whether measurements, additional photos, or a site visit are needed."
      estimateLabel="Start residential estimate"
    />
  );
}
