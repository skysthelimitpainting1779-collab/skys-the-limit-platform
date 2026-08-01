import { ConvexHttpClient } from "convex/browser";
import { anyApi } from "convex/server";
import {
  createEstimateRequestHandler,
  type LeadPersistenceResult,
} from "@/lib/leads/submit";
import type { LeadPersistenceInput } from "@/lib/leads/schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 10;

let convexClient: ConvexHttpClient | undefined;

function getConvexClient(): ConvexHttpClient {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  const isLocal =
    url?.startsWith("http://localhost") || url?.startsWith("http://127.0.0.1");
  const isCloud = url?.startsWith("https://") && !url.includes("your-deployment");

  if (!url || (!isLocal && !isCloud)) {
    throw new Error("CONVEX_NOT_CONFIGURED");
  }

  convexClient ??= new ConvexHttpClient(url);
  return convexClient;
}

async function persistLead(
  input: LeadPersistenceInput,
): Promise<LeadPersistenceResult> {
  // Browser time is retained only for boundary-test evidence. Convex assigns
  // authoritative timestamps, so the public mutation never accepts them.
  const mutationInput = {
    idempotencyKey: input.idempotencyKey,
    fullName: input.fullName,
    email: input.email,
    phone: input.phone,
    segment: input.segment,
    serviceAddress: input.serviceAddress,
    projectDetails: input.projectDetails,
    desiredTimeframe: input.desiredTimeframe,
    sourcePath: input.sourcePath,
    utmSource: input.utmSource,
    utmMedium: input.utmMedium,
    utmCampaign: input.utmCampaign,
  };
  const result = await getConvexClient().mutation(
    anyApi.leads.create,
    mutationInput,
  );

  if (
    !result ||
    typeof result !== "object" ||
    typeof result.id !== "string" ||
    typeof result.created !== "boolean"
  ) {
    throw new Error("INVALID_CONVEX_RESPONSE");
  }

  return result as LeadPersistenceResult;
}

export const POST = createEstimateRequestHandler({ persistLead });
