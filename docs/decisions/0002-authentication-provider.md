# Decision 0002: Authentication Provider Selection

- **Status**: Accepted
- **Date**: 2026-07-31

## Context
The legacy application used Clerk for user authentication. We evaluated WorkOS AuthKit vs Clerk for the clean-start architecture.

## Comparison & Decision
We select **WorkOS AuthKit** for the new platform foundation:
- Native organization isolation and B2B role-based access control.
- Seamless MFA and SSO enterprise support for commercial/public-sector contracts.
- First-class Convex integration via JWT authorization headers.
- Clean Preview environment domain isolation without key collisions.
