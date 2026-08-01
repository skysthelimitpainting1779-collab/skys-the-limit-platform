# Lead intake vertical slice

## Outcome

A visitor submits a structured estimate request and receives one receipt. The server validates and normalizes the payload, silently discards honeypot submissions, and persists a single idempotent lead in an isolated Convex deployment when configured.

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

## Safety boundaries

- Direct calls to the public Convex mutation receive the same structural and length validation as the HTTP boundary.
- No email, SMS, payment, AI model, Vercel Workflow, Queue, or Blob call occurs.
- The Route Handler returns a recoverable 503 when Convex is not configured.
- Browser input never controls authoritative timestamps or lead status.
- Raw PII is not logged.
- Production promotion and domain changes remain owner-gated.
