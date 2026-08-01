#!/usr/bin/env node
import { randomUUID } from "node:crypto";

const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:3100";
const idempotencyKey = randomUUID();
const testSuffix = idempotencyKey.slice(0, 8);

const validPayload = {
  fullName: "Integration Test Customer",
  email: `lead-e2e-${testSuffix}@example.com`,
  phone: "+16515550100",
  segment: "residential",
  serviceAddress: "123 Integration Way, Saint Paul, MN",
  projectDetails:
    "Integration test scope for validating the complete estimate intake pipeline.",
  desiredTimeframe: "Within 30 days",
  contactConsent: true,
  sourcePath: "/estimate",
  utmSource: "github-actions",
  utmMedium: "integration-test",
  companyWebsite: "",
  idempotencyKey,
};

async function post(payload) {
  const response = await fetch(`${baseUrl}/api/estimate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await response.json();
  return { response, body };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const invalid = await post({ ...validPayload, email: "not-an-email", idempotencyKey: randomUUID() });
assert(invalid.response.status === 400, `invalid email returned ${invalid.response.status}`);
assert(invalid.body.error === "validation_failed", "invalid email did not return validation_failed");

const honeypot = await post({
  ...validPayload,
  idempotencyKey: randomUUID(),
  companyWebsite: "https://spam.example",
});
assert(honeypot.response.status === 202, `honeypot returned ${honeypot.response.status}`);
assert(honeypot.body.accepted === true, "honeypot response was not accepted-shaped");
assert(honeypot.body.receiptId === undefined, "honeypot unexpectedly persisted a lead");

const first = await post(validPayload);
assert(first.response.status === 201, `first submission returned ${first.response.status}`);
assert(first.body.accepted === true, "first submission was not accepted");
assert(first.body.duplicate === false, "first submission was marked duplicate");
assert(typeof first.body.receiptId === "string", "first submission has no receipt");

const second = await post(validPayload);
assert(second.response.status === 200, `duplicate submission returned ${second.response.status}`);
assert(second.body.accepted === true, "duplicate submission was not accepted");
assert(second.body.duplicate === true, "duplicate submission was not identified");
assert(second.body.receiptId === first.body.receiptId, "duplicate returned a different receipt");

console.log(
  JSON.stringify(
    {
      status: "passed",
      receiptId: first.body.receiptId,
      checks: [
        "invalid-input-rejected",
        "honeypot-not-persisted",
        "lead-created",
        "duplicate-idempotent",
      ],
    },
    null,
    2,
  ),
);
