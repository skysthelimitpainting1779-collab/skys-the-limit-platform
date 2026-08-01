# Lead intake vertical slice

## Outcome

A visitor submits a structured estimate request and receives one receipt. The server validates and normalizes the payload, silently discards honeypot submissions, and persists a single idempotent lead in an isolated Convex deployment when configured.

## Data flow

```text
EstimateForm
  -> POST /api/estimate
  -> Zod validation and normalization
  -> Convex leads.create mutation
  -> idempotency lookup
  -> per-email bootstrap rate check
  -> lead insert
  -> receipt response
```

## Safety boundaries

- No email, SMS, payment, AI model, Vercel Workflow, Queue, or Blob call occurs.
- The Route Handler returns a recoverable 503 when Convex is not configured.
- Browser input never controls authoritative timestamps or lead status.
- Raw PII is not logged.
- Production promotion and domain changes remain owner-gated.
