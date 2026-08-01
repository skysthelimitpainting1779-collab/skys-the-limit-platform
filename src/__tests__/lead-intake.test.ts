import { describe, expect, it, vi } from "vitest";
import { createEstimateRequestHandler } from "@/lib/leads/submit";

const validBody = {
  fullName: "  Jane   Doe ",
  email: " JANE@EXAMPLE.COM ",
  phone: "(651) 410-4196",
  segment: "residential",
  serviceAddress: "123 Main St, Saint Paul, MN",
  projectDetails: "  Paint the living room and repair minor wall damage.  ",
  desiredTimeframe: " Within 30 days ",
  contactConsent: true,
  sourcePath: "/estimate",
  utmSource: " google ",
  companyWebsite: "",
  idempotencyKey: "550e8400-e29b-41d4-a716-446655440000",
};

function post(body: unknown) {
  return new Request("http://localhost/api/estimate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("estimate request boundary", () => {
  it("rejects an invalid email without calling persistence", async () => {
    const persistLead = vi.fn();
    const handle = createEstimateRequestHandler({ persistLead });

    const response = await handle(post({ ...validBody, email: "not-an-email" }));

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: "validation_failed" });
    expect(persistLead).not.toHaveBeenCalled();
  });

  it("requires explicit contact consent", async () => {
    const persistLead = vi.fn();
    const handle = createEstimateRequestHandler({ persistLead });
    const body = { ...validBody } as Record<string, unknown>;
    delete body.contactConsent;

    const response = await handle(post(body));

    expect(response.status).toBe(400);
    expect(persistLead).not.toHaveBeenCalled();
  });

  it("rejects unknown buyer segments", async () => {
    const persistLead = vi.fn();
    const handle = createEstimateRequestHandler({ persistLead });

    const response = await handle(post({ ...validBody, segment: "industrial" }));

    expect(response.status).toBe(400);
    expect(persistLead).not.toHaveBeenCalled();
  });

  it("silently accepts honeypot submissions without storing them", async () => {
    const persistLead = vi.fn();
    const handle = createEstimateRequestHandler({ persistLead });

    const response = await handle(
      post({ ...validBody, companyWebsite: "https://spam.example" }),
    );

    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ accepted: true });
    expect(persistLead).not.toHaveBeenCalled();
  });

  it("normalizes and stores a valid lead", async () => {
    const persistLead = vi.fn(async () => ({ id: "lead_123", created: true }));
    const handle = createEstimateRequestHandler({
      persistLead,
      now: () => 1_785_700_000_000,
    });

    const response = await handle(post(validBody));

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      accepted: true,
      duplicate: false,
      receiptId: "lead_123",
    });
    expect(persistLead).toHaveBeenCalledWith(
      expect.objectContaining({
        fullName: "Jane Doe",
        email: "jane@example.com",
        phone: "+16514104196",
        serviceAddress: "123 Main St, Saint Paul, MN",
        projectDetails: "Paint the living room and repair minor wall damage.",
        desiredTimeframe: "Within 30 days",
        sourcePath: "/estimate",
        utmSource: "google",
        consentAt: 1_785_700_000_000,
        createdAt: 1_785_700_000_000,
      }),
    );
  });

  it("returns the original receipt for an idempotent duplicate", async () => {
    const persistLead = vi.fn(async () => ({ id: "lead_existing", created: false }));
    const handle = createEstimateRequestHandler({ persistLead });

    const response = await handle(post(validBody));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      accepted: true,
      duplicate: true,
      receiptId: "lead_existing",
    });
  });

  it("returns a recoverable response when persistence is unavailable", async () => {
    const persistLead = vi.fn(async () => {
      throw new Error("backend unavailable");
    });
    const handle = createEstimateRequestHandler({ persistLead });

    const response = await handle(post(validBody));

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      accepted: false,
      error: "temporarily_unavailable",
    });
  });

  it("rejects malformed JSON", async () => {
    const persistLead = vi.fn();
    const handle = createEstimateRequestHandler({ persistLead });
    const request = new Request("http://localhost/api/estimate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{",
    });

    const response = await handle(request);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid_json" });
    expect(persistLead).not.toHaveBeenCalled();
  });
});
