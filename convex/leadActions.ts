import { v } from "convex/values";
import {
  verifyLeadIntakeProof,
  type LeadIntakePayload,
} from "../src/lib/leads/intakeProof";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { action } from "./_generated/server";

const segmentValidator = v.union(
  v.literal("residential"),
  v.literal("commercial"),
  v.literal("public-sector"),
);

function requireIntakeSecret() {
  const secret = process.env.LEAD_INTAKE_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("LEAD_INTAKE_UNAVAILABLE");
  }
  return secret;
}

/** Anonymous transport with a short-lived proof minted by the validated Next route. */
export const submit = action({
  args: {
    orgId: v.id("organizations"),
    idempotencyKey: v.string(),
    fullName: v.string(),
    email: v.string(),
    phone: v.string(),
    segment: segmentValidator,
    serviceAddress: v.string(),
    projectDetails: v.string(),
    desiredTimeframe: v.optional(v.string()),
    contactConsent: v.literal(true),
    sourcePath: v.string(),
    utmSource: v.optional(v.string()),
    utmMedium: v.optional(v.string()),
    utmCampaign: v.optional(v.string()),
    issuedAt: v.number(),
    proof: v.string(),
  },
  returns: v.object({ id: v.id("leads"), created: v.boolean() }),
  handler: async (ctx, args): Promise<{ id: Id<"leads">; created: boolean }> => {
    const { issuedAt, proof, ...payload } = args;
    const verified = await verifyLeadIntakeProof(
      requireIntakeSecret(),
      payload satisfies LeadIntakePayload,
      issuedAt,
      proof,
    );
    if (!verified) throw new Error("INVALID_INTAKE_PROOF");
    return await ctx.runMutation(internal.leads.create, payload);
  },
});
