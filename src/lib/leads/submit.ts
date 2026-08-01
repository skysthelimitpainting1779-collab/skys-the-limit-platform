import {
  leadSubmissionSchema,
  prepareLeadForPersistence,
  type LeadPersistenceInput,
} from "./schema";

export interface LeadPersistenceResult {
  id: string;
  created: boolean;
}

export type PersistLead = (
  input: LeadPersistenceInput,
) => Promise<LeadPersistenceResult>;

interface EstimateHandlerDependencies {
  persistLead: PersistLead;
  now?: () => number;
}

const RESPONSE_HEADERS = {
  "cache-control": "no-store, max-age=0",
};

function json(body: unknown, status: number): Response {
  return Response.json(body, { status, headers: RESPONSE_HEADERS });
}

export function createEstimateRequestHandler({
  persistLead,
  now = Date.now,
}: EstimateHandlerDependencies) {
  return async function handleEstimateRequest(request: Request): Promise<Response> {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("application/json")) {
      return json({ error: "unsupported_media_type" }, 415);
    }

    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (Number.isFinite(contentLength) && contentLength > 32_000) {
      return json({ error: "payload_too_large" }, 413);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return json({ error: "invalid_json" }, 400);
    }

    const parsed = leadSubmissionSchema.safeParse(body);
    if (!parsed.success) {
      return json(
        {
          error: "validation_failed",
          fieldErrors: parsed.error.flatten().fieldErrors,
        },
        400,
      );
    }

    // Bot submissions get a success-shaped response without touching storage.
    if (parsed.data.companyWebsite.trim()) {
      return json({ accepted: true }, 202);
    }

    try {
      const result = await persistLead(
        prepareLeadForPersistence(parsed.data, now()),
      );
      return json(
        {
          accepted: true,
          duplicate: !result.created,
          receiptId: result.id,
        },
        result.created ? 201 : 200,
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes("RATE_LIMITED")) {
        return json({ accepted: false, error: "rate_limited" }, 429);
      }
      return json({ accepted: false, error: "temporarily_unavailable" }, 503);
    }
  };
}
