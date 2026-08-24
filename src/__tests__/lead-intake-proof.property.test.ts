import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  createLeadIntakeProof,
  verifyLeadIntakeProof,
  type LeadIntakePayload,
} from "@/lib/leads/intakeProof";

const secret = "property-test-only-lead-intake-secret-32-chars";
const propertyOptions = { numRuns: 100, seed: 20_260_814 } as const;

const payloadArbitrary: fc.Arbitrary<LeadIntakePayload> = fc.record({
  workosOrganizationId: fc.string({ minLength: 1, maxLength: 48 }),
  idempotencyKey: fc.uuid(),
  fullName: fc.string({ maxLength: 80 }),
  email: fc.string({ maxLength: 80 }),
  phone: fc.string({ maxLength: 32 }),
  segment: fc.constantFrom("residential", "commercial", "public-sector"),
  serviceAddress: fc.string({ maxLength: 120 }),
  projectDetails: fc.string({ maxLength: 240 }),
  desiredTimeframe: fc.option(fc.string({ maxLength: 80 }), { nil: undefined }),
  contactConsent: fc.constant(true as const),
  sourcePath: fc.string({ maxLength: 100 }),
  utmSource: fc.option(fc.string({ maxLength: 80 }), { nil: undefined }),
  utmMedium: fc.option(fc.string({ maxLength: 80 }), { nil: undefined }),
  utmCampaign: fc.option(fc.string({ maxLength: 80 }), { nil: undefined }),
});

describe("lead intake proof properties", () => {
  it("accepts only the exact signed payload", async () => {
    await fc.assert(
      fc.asyncProperty(
        payloadArbitrary,
        fc.integer({ min: 1, max: 2_000_000_000 }),
        async (payload, issuedAt) => {
          const proof = await createLeadIntakeProof(secret, payload, issuedAt);
          expect(await verifyLeadIntakeProof(secret, payload, issuedAt, proof, issuedAt)).toBe(true);
          expect(
            await verifyLeadIntakeProof(
              secret,
              { ...payload, email: `${payload.email}\u0000tampered` },
              issuedAt,
              proof,
              issuedAt,
            ),
          ).toBe(false);
        },
      ),
      propertyOptions,
    );
  });

  it("enforces the proof age boundary without an off-by-one gap", async () => {
    await fc.assert(
      fc.asyncProperty(
        payloadArbitrary,
        fc.integer({ min: 1, max: 2_000_000_000 }),
        async (payload, issuedAt) => {
          const proof = await createLeadIntakeProof(secret, payload, issuedAt);
          expect(await verifyLeadIntakeProof(secret, payload, issuedAt, proof, issuedAt + 300_000)).toBe(true);
          expect(await verifyLeadIntakeProof(secret, payload, issuedAt, proof, issuedAt + 300_001)).toBe(false);
        },
      ),
      propertyOptions,
    );
  });
});
