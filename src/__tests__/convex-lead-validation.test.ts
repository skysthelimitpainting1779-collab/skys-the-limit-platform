import { describe, expect, it } from "vitest";
import {
  assertLeadMutationInput,
  type LeadMutationInput,
} from "../../convex/lib/leadValidation";

const validInput: LeadMutationInput = {
  idempotencyKey: "550e8400-e29b-41d4-a716-446655440000",
  fullName: "Jane Doe",
  email: "jane@example.com",
  phone: "+16514104196",
  segment: "residential",
  serviceAddress: "123 Main St, Saint Paul, MN",
  projectDetails: "Paint the living room and repair minor wall damage.",
  desiredTimeframe: "Within 30 days",
  sourcePath: "/estimate",
  utmSource: "google",
  utmMedium: "cpc",
  utmCampaign: "summer-painting",
};

describe("direct Convex lead mutation validation", () => {
  it("accepts the normalized server contract", () => {
    expect(() => assertLeadMutationInput(validInput)).not.toThrow();
  });

  it.each([
    ["idempotency key", { idempotencyKey: "not-a-uuid" }],
    ["email", { email: "not-an-email" }],
    ["phone", { phone: "6514104196" }],
    ["project details", { projectDetails: "too short" }],
    ["source path", { sourcePath: "https://evil.example/estimate" }],
    ["utm source", { utmSource: "x".repeat(121) }],
  ])("rejects invalid %s when the Route Handler is bypassed", (_label, patch) => {
    expect(() =>
      assertLeadMutationInput({ ...validInput, ...patch }),
    ).toThrow("INVALID_LEAD_INPUT");
  });
});
