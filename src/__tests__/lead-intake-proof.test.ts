import { describe, expect, it } from "vitest";
import {
  createLeadIntakeProof,
  verifyLeadIntakeProof,
  type LeadIntakePayload,
} from "@/lib/leads/intakeProof";

const secret = "local-test-only-lead-intake-secret-32-chars";
const payload: LeadIntakePayload = {
  workosOrganizationId: "org_workos_example",
  idempotencyKey: "550e8400-e29b-41d4-a716-446655440000",
  fullName: "Jane Doe",
  email: "jane@example.com",
  phone: "+16514104196",
  segment: "residential",
  serviceAddress: "123 Main St, Saint Paul, MN",
  projectDetails: "Paint the living room and repair minor wall damage.",
  desiredTimeframe: "Within 30 days",
  contactConsent: true,
  sourcePath: "/estimate",
  utmSource: "google",
};

describe("lead intake server proof", () => {
  it("accepts the exact short-lived signed payload", async () => {
    const issuedAt = 1_785_700_000_000;
    const proof = await createLeadIntakeProof(secret, payload, issuedAt);

    await expect(
      verifyLeadIntakeProof(secret, payload, issuedAt, proof, issuedAt + 1_000),
    ).resolves.toBe(true);
  });

  it("rejects tampering, expiry, and malformed proofs", async () => {
    const issuedAt = 1_785_700_000_000;
    const proof = await createLeadIntakeProof(secret, payload, issuedAt);

    await expect(
      verifyLeadIntakeProof(
        secret,
        { ...payload, email: "attacker@example.com" },
        issuedAt,
        proof,
        issuedAt + 1_000,
      ),
    ).resolves.toBe(false);
    await expect(
      verifyLeadIntakeProof(secret, payload, issuedAt, proof, issuedAt + 301_000),
    ).resolves.toBe(false);
    await expect(
      verifyLeadIntakeProof(secret, payload, issuedAt, "not-a-proof", issuedAt),
    ).resolves.toBe(false);
  });

  it("refuses weak shared secrets", async () => {
    await expect(createLeadIntakeProof("too-short", payload, 1)).rejects.toThrow(
      "LEAD_INTAKE_SECRET_INVALID",
    );
  });
});
