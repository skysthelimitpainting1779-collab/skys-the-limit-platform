# Lead intake vertical slice

## Outcome

A visitor submits a structured estimate request and receives one receipt. The server validates and normalizes the payload, silently discards honeypot submissions, and persists a single idempotent lead in Convex when configured.

## Data flow

```text
EstimateForm
  -> POST /api/estimate
  -> Zod validation and normalization
  -> Convex leads.create mutation
  -> independent mutation validation and normalization
  -> idempotency lookup
  -> per-email and per-phone bootstrap rate checks
  -> lead insert
  -> receipt response
```

## Automated end-to-end proof

`.github/workflows/lead-intake-e2e.yml` starts a free anonymous Convex backend and the production-built Next.js server inside GitHub Actions. It proves:

- invalid email is rejected;
- honeypot input is accepted-shaped but not persisted;
- the first valid request creates a lead and returns a receipt;
- the same idempotency key returns the same receipt without a second lead.

This test proves the complete code path without attaching Preview to Production or provisioning a billable cloud resource.

## Safety boundaries

- Direct calls to the public Convex mutation receive the same structural and length validation as the HTTP boundary.
- No email, SMS, payment, AI model, Vercel Workflow, Queue, or Blob call occurs.
- The Vercel Route Handler returns a recoverable 503 unless the Marketplace-managed branch Convex Preview is deployed, seeded, and reachable.
- Browser input never controls authoritative timestamps or lead status.
- Raw PII is not logged.
- Production promotion and domain changes remain owner-gated.
