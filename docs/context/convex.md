# Convex implementation contract

- Research date: 2026-08-01
- Official Context7 library: `/websites/convex_dev`
- Installed package: Convex `1.42.x`
- Decision: Convex remains the source of operational business truth.

## Applied constraints

- Every public Convex function declares argument and return validators.
- Estimate intake uses one transactional mutation.
- An idempotency index prevents accidental duplicate records.
- A composite email/created-time index provides a zero-cost bootstrap abuse limit.
- The server mutation assigns authoritative timestamps rather than trusting browser time.
- The Next.js Route Handler calls the mutation through `ConvexHttpClient` and `anyApi`, so a missing generated function reference does not block the bootstrap build.
