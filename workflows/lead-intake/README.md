# Lead Intake Workflow Contract

- **Workflow Name**: `workflows/lead-intake`
- **Trigger**: New Lead submitted via Estimate Form.
- **Idempotency Key**: `lead_id`
- **Retry Policy**: Maximum 3 retries with exponential backoff (initial delay 5s).
- **Steps**:
  1. Queue lead qualification in Convex database (`leads` collection).
  2. Owner Notification Adapter (Sandboxed log in Preview; Resend in Production).
  3. Schedule automated estimate follow-up trigger in 24 hours.

## Preview/Sandbox Execution Policy
In non-production environments (Preview/Local), steps 2 and 3 execute via Mock/Dry-Run adapters.
