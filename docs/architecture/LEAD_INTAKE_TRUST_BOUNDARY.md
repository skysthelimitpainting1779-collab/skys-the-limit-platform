# Lead-Intake Trust Boundary

Issue: [#39](https://github.com/skysthelimitpainting1779-collab/skys-the-limit-platform/issues/39)

Graphify traversal and direct inspection of the surfaced symbols establish this
runtime path:

```text
POST /api/estimate
  -> createEstimateRequestHandler
  -> createLeadIntakeProof
  -> leadActions.submit
  -> leads.resolveOrganizationIdByWorkOSId
  -> internal leads.create
```

The Next.js route in `src/app/api/estimate/route.ts` delegates request parsing,
schema validation, honeypot handling, and response semantics to
`src/lib/leads/submit.ts`. The route supplies the WorkOS organization identifier
from server environment state, not from the request body, and signs the exact
normalized persistence payload with the server-only lead-intake secret.

The public Convex action in `convex/leadActions.ts` accepts the anonymous
transport only after `src/lib/leads/intakeProof.ts` verifies the exact payload,
timestamp window, and HMAC proof. It then resolves the stable WorkOS
organization identifier to a local Convex organization ID and calls the
internal-only `leads.create` mutation.

`convex/leads.ts` owns persistence. Its internal mutation revalidates and
normalizes the input, requires an active organization, returns the existing
record for the organization-scoped idempotency key, applies organization and
contact rate limits through indexed queries, inserts the lead, and appends an
audit event. Authenticated lead reads and updates separately require an active
operations membership.

## Existing proof

- `src/__tests__/lead-intake.test.ts` proves request validation, honeypot
  suppression, normalization, duplicate response behavior, and recoverable
  persistence failures.
- `src/__tests__/lead-intake-proof.test.ts` and
  `src/__tests__/lead-intake-proof.property.test.ts` prove exact-payload proof
  acceptance plus tampering, expiry, malformed-proof, and age-boundary denial.
- `src/__tests__/convex-lead-validation.test.ts` proves the internal mutation
  rejects invalid input even if the route boundary is bypassed.
- `convex/anonymousApiSecurity.test.ts` proves anonymous callers cannot use the
  protected public lead query and mutation surface.

This note documents the existing boundary; it does not change runtime behavior
or authorize Production mutation.
